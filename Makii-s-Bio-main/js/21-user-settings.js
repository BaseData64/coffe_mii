/* ============================================================
   MAKI'S BIO — USER SETTINGS
   CF_Miiverse-style profile/account settings adapted to cyan UI.
   Profile comment is saved to the user's private record and mirrored
   to the public profile. Other preferences remain private until the
   corresponding public/profile features are implemented.
   ============================================================ */

import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const settingsFirebaseConfig = {
    apiKey: "AIzaSyBC1CU5NvbyYvgb6W2nbxAWXtdPV63qhnA",
    authDomain: "maki-s-bio.firebaseapp.com",
    databaseURL: "https://maki-s-bio-default-rtdb.firebaseio.com",
    projectId: "maki-s-bio",
    storageBucket: "maki-s-bio.firebasestorage.app",
    messagingSenderId: "267692056127",
    appId: "1:267692056127:web:472b5f1ca8c82db4a3228a"
};

const settingsApp = getApps().length ? getApp() : initializeApp(settingsFirebaseConfig);
const settingsAuth = getAuth(settingsApp);
const settingsDB = getDatabase(settingsApp);

let settingsUser = null;
let settingsPublicId = null;
let settingsLoaded = false;
let settingsValues = {
    game_experience: "Beginner",
    country: "Not Set",
    gender: "Not Set",
    relationship_visibility: "Everyone"
};

const settingDefinitions = {
    game_experience: {
        title: "Profile Settings",
        question: "How would you describe your experience with games?",
        options: ["Beginner", "Intermediate", "Expert"]
    },
    country: {
        title: "Profile Settings",
        question: "What is your region?",
        options: ["Not Set", "North America", "Europe", "Japan"]
    },
    gender: {
        title: "Profile Settings",
        question: "What is your gender?",
        options: ["Not Set", "Male", "Female", "Not applicable"]
    },
    relationship_visibility: {
        title: "Profile Settings",
        question: "Who should be able to see your friend list, followers, and followed users?",
        options: ["Everyone", "Wii U Friends Only", "Private"]
    }
};

function settingsElement(id) {
    return document.getElementById(id);
}

function setSettingsFeedback(message, isError) {
    const node = settingsElement("maki-settings-feedback");
    if (!node) return;
    node.textContent = message || "";
    node.classList.toggle("error", !!isError);
    node.classList.toggle("success", !!message && !isError);
}

function normalizeSettings(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    return {
        game_experience: settingDefinitions.game_experience.options.includes(source.game_experience)
            ? source.game_experience : "Beginner",
        country: settingDefinitions.country.options.includes(source.country)
            ? source.country : "Not Set",
        gender: settingDefinitions.gender.options.includes(source.gender)
            ? source.gender : "Not Set",
        relationship_visibility: settingDefinitions.relationship_visibility.options.includes(source.relationship_visibility)
            ? source.relationship_visibility : "Everyone"
    };
}

async function loadUserSettings() {
    const user = settingsAuth.currentUser || settingsUser;
    if (!user) {
        setSettingsFeedback("You need to sign in to edit your settings.", true);
        return;
    }

    setSettingsFeedback("Loading settings…", false);
    try {
        const snapshot = await get(ref(settingsDB, "users/" + user.uid));
        const account = snapshot.exists() ? (snapshot.val() || {}) : {};
        settingsPublicId = String(account.publicId || localStorage.getItem("makiiverse_public_id") || "");
        settingsValues = normalizeSettings(account.profileSettings);
        updateWutLinkedState(account.linkedAccounts && account.linkedAccounts.wut);

        const comment = settingsElement("maki-profile-comment");
        if (comment) comment.value = String(account.bio || "");

        Object.keys(settingsValues).forEach(function(key) {
            const valueNode = document.querySelector('[data-setting-value="' + key + '"]');
            if (valueNode) valueNode.textContent = settingsValues[key];
        });

        settingsLoaded = true;
        setSettingsFeedback("", false);
    } catch (error) {
        console.error("Could not load user settings:", error);
        setSettingsFeedback("Could not load your settings. Please try again.", true);
    }
}

function openSettingsPage() {
    if (!settingsAuth.currentUser) {
        setSettingsFeedback("Sign in before opening User Settings.", true);
        return;
    }

    const mainView = settingsElement("maki-settings-main-view");
    const wutScreen = settingsElement("maki-wut-link-screen");
    if (mainView) mainView.hidden = false;
    if (wutScreen) wutScreen.hidden = true;

    if (typeof window.conmutarPortal === "function") {
        window.conmutarPortal(10, null);
    }

    showSettingsTab("profile");
    loadUserSettings();
}

function showSettingsTab(tabName) {
    const profilePanel = settingsElement("maki-settings-profile");
    const accountPanel = settingsElement("maki-settings-account");
    const title = settingsElement("maki-settings-page-title");
    if (!profilePanel || !accountPanel || !title) return;

    const isProfile = tabName !== "account";
    profilePanel.hidden = !isProfile;
    accountPanel.hidden = isProfile;
    title.textContent = isProfile ? "Profile Settings" : "Account Settings";

    document.querySelectorAll(".maki-settings-tab").forEach(function(button) {
        button.classList.toggle("selected", button.getAttribute("data-settings-tab") === (isProfile ? "profile" : "account"));
    });
    setSettingsFeedback("", false);
}

function openSettingsModal(key) {
    const definition = settingDefinitions[key];
    const modal = settingsElement("maki-settings-modal");
    const title = settingsElement("maki-settings-modal-title");
    const question = settingsElement("maki-settings-modal-question");
    const options = settingsElement("maki-settings-modal-options");
    if (!definition || !modal || !options) return;

    title.textContent = definition.title;
    question.textContent = definition.question;
    options.innerHTML = "";

    definition.options.forEach(function(option) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "maki-settings-option" + (settingsValues[key] === option ? " selected" : "");
        button.textContent = option;
        button.setAttribute("data-setting-option", key);
        button.setAttribute("data-setting-choice", option);
        options.appendChild(button);
    });

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    const selected = options.querySelector(".selected") || options.querySelector("button");
    if (selected) selected.focus();
}

function closeSettingsModal() {
    const modal = settingsElement("maki-settings-modal");
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
}

async function saveProfileSetting(key, value) {
    if (!settingsUser || !settingsUser.uid || !settingDefinitions[key]) return;

    const next = Object.assign({}, settingsValues, { [key]: value });
    const updateData = {};
    updateData["users/" + settingsUser.uid + "/profileSettings"] = next;

    try {
        await update(ref(settingsDB), updateData);
        settingsValues = next;
        const valueNode = document.querySelector('[data-setting-value="' + key + '"]');
        if (valueNode) valueNode.textContent = value;
        closeSettingsModal();
        setSettingsFeedback("Setting saved.", false);
    } catch (error) {
        console.error("Could not save profile setting:", error);
        setSettingsFeedback("Could not save this setting. Please try again.", true);
    }
}

async function saveProfileComment() {
    if (!settingsUser || !settingsUser.uid) {
        setSettingsFeedback("You need to sign in to save your profile comment.", true);
        return;
    }

    const input = settingsElement("maki-profile-comment");
    const button = settingsElement("maki-profile-comment-save");
    const bio = String(input ? input.value : "").slice(0, 1200);
    const updateData = {};
    updateData["users/" + settingsUser.uid + "/bio"] = bio;
    if (settingsPublicId && /^[0-9]{9}$/.test(settingsPublicId)) {
        updateData["public_users/" + settingsPublicId + "/bio"] = bio;
    }

    if (button) button.disabled = true;
    setSettingsFeedback("Saving profile comment…", false);

    try {
        await update(ref(settingsDB), updateData);
        const publicBio = settingsElement("profile-bio");
        if (publicBio) publicBio.textContent = bio;
        setSettingsFeedback("Profile comment saved.", false);
    } catch (error) {
        console.error("Could not save profile comment:", error);
        setSettingsFeedback("Could not save your profile comment. Please try again.", true);
    } finally {
        if (button) button.disabled = false;
    }
}


function updateWutLinkedState(linkedAccount) {
    const button = settingsElement("maki-wut-link-open");
    const note = document.querySelector(".maki-setting-wut .maki-settings-note");
    if (!button) return;
    if (linkedAccount && linkedAccount.verified === true) {
        button.disabled = true;
        button.innerHTML = '<span>Linked</span><span class="maki-wut-miiverse-icon" aria-hidden="true">a</span>';
        if (note) note.textContent = "Your WUT-Miiverse account is linked to this profile.";
    } else {
        button.disabled = false;
        button.innerHTML = '<span>LINK with WUT-Miiverse</span><span class="maki-wut-miiverse-icon" aria-hidden="true">a</span>';
    }
}

function openWutLinkScreen() {
    const mainView = settingsElement("maki-settings-main-view");
    const screen = settingsElement("maki-wut-link-screen");
    const feedback = settingsElement("maki-wut-link-feedback");
    const password = settingsElement("maki-wut-password");
    if (!mainView || !screen) return;

    if (feedback) feedback.textContent = "";
    if (password) password.value = "";
    mainView.hidden = true;
    screen.hidden = false;
    window.scrollTo(0, 0);
    if (password) password.focus();
}

function closeWutLinkScreen() {
    const mainView = settingsElement("maki-settings-main-view");
    const screen = settingsElement("maki-wut-link-screen");
    const password = settingsElement("maki-wut-password");
    const feedback = settingsElement("maki-wut-link-feedback");
    if (password) password.value = "";
    if (feedback) feedback.textContent = "";
    if (screen) screen.hidden = true;
    if (mainView) mainView.hidden = false;
    showSettingsTab("account");
    window.scrollTo(0, 0);
}

async function submitWutLink(event) {
    event.preventDefault();
    const passwordInput = settingsElement("maki-wut-password");
    const feedback = settingsElement("maki-wut-link-feedback");
    const submit = settingsElement("maki-wut-link-submit");
    const endpoint = String(window.MAKI_WUT_LINK_ENDPOINT || "").trim();
    const user = settingsAuth.currentUser || settingsUser;

    if (!user || !user.email) {
        if (feedback) feedback.textContent = "Your Maki's Bio account needs a verified email address to link WUT.";
        return;
    }
    if (!endpoint) {
        if (feedback) feedback.textContent = "WUT account verification is not connected yet. The WUT authentication endpoint must be configured before linking can be completed.";
        return;
    }
    if (window.location.protocol !== "https:" || !/^https:\/\//i.test(endpoint)) {
        if (feedback) feedback.textContent = "Secure HTTPS is required to verify a WUT account.";
        return;
    }

    const password = passwordInput ? passwordInput.value : "";
    if (!password) return;
    if (submit) submit.disabled = true;
    if (feedback) feedback.textContent = "Verifying your WUT account…";

    try {
        const idToken = await user.getIdToken();
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + idToken },
            credentials: "omit",
            body: JSON.stringify({ email: user.email, password: password })
        });
        const result = await response.json().catch(function() { return {}; });
        if (!response.ok || result.verified !== true || !result.wutUserId || result.linked !== true) {
            throw new Error(result.message || "WUT could not verify these account credentials.");
        }

        // The trusted WUT endpoint must write the verified link with its server-side
        // Firebase Admin credentials. The browser never writes a verified flag itself.
        const linkedRecord = { verified: true, wutUserId: String(result.wutUserId) };
        updateWutLinkedState(linkedRecord);
        if (feedback) feedback.textContent = "WUT account linked successfully.";
        if (passwordInput) passwordInput.value = "";
        window.setTimeout(closeWutLinkScreen, 1100);
    } catch (error) {
        console.error("WUT account linking failed:", error);
        if (feedback) feedback.textContent = error.message || "Could not link your WUT account.";
    } finally {
        if (submit) submit.disabled = false;
        if (passwordInput) passwordInput.value = "";
    }
}

function initializeSettingsUI() {
    document.querySelectorAll(".maki-settings-tab").forEach(function(button) {
        button.addEventListener("click", function() {
            showSettingsTab(button.getAttribute("data-settings-tab"));
        });
    });

    document.querySelectorAll("[data-open-setting]").forEach(function(button) {
        button.addEventListener("click", function() {
            openSettingsModal(button.getAttribute("data-open-setting"));
        });
    });

    const saveButton = settingsElement("maki-profile-comment-save");
    if (saveButton) saveButton.addEventListener("click", saveProfileComment);

    const wutOpen = settingsElement("maki-wut-link-open");
    if (wutOpen) wutOpen.addEventListener("click", openWutLinkScreen);
    const wutForm = settingsElement("maki-wut-link-form");
    if (wutForm) wutForm.addEventListener("submit", submitWutLink);
    const wutBack = settingsElement("maki-wut-link-back");
    if (wutBack) wutBack.addEventListener("click", closeWutLinkScreen);
    const wutCancel = settingsElement("maki-wut-link-cancel");
    if (wutCancel) wutCancel.addEventListener("click", closeWutLinkScreen);

    const options = settingsElement("maki-settings-modal-options");
    if (options) {
        options.addEventListener("click", function(event) {
            const button = event.target.closest("[data-setting-option]");
            if (!button) return;
            saveProfileSetting(button.getAttribute("data-setting-option"), button.getAttribute("data-setting-choice"));
        });
    }

    document.querySelectorAll("[data-close-settings-modal]").forEach(function(node) {
        node.addEventListener("click", closeSettingsModal);
    });

    document.addEventListener("keydown", function(event) {
        const modal = settingsElement("maki-settings-modal");
        if (event.key === "Escape" && modal && !modal.hidden) closeSettingsModal();
        const wutScreen = settingsElement("maki-wut-link-screen");
        if (event.key === "Escape" && wutScreen && !wutScreen.hidden) closeWutLinkScreen();
    });
}

onAuthStateChanged(settingsAuth, function(user) {
    settingsUser = user || null;
    if (!user) {
        settingsLoaded = false;
        return;
    }
    if (!settingsLoaded) loadUserSettings();
});

document.addEventListener("DOMContentLoaded", initializeSettingsUI);
window.openMakiUserSettings = openSettingsPage;
