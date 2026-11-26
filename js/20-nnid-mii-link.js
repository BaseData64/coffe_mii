/*
 * Maki's Bio — NNID Mii lookup and optional identity link.
 * This uses the public historical NNID Mii archive maintained by
 * mii-unsecure. It does NOT authenticate Nintendo accounts or prove ownership.
 */
import { getApps, getApp, initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, get, update, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBC1CU5NvbyYvgb6W2nbxAWXtdPV63qhnA",
    authDomain: "maki-s-bio.firebaseapp.com",
    databaseURL: "https://maki-s-bio-default-rtdb.firebaseio.com",
    projectId: "maki-s-bio",
    storageBucket: "maki-s-bio.firebasestorage.app",
    messagingSenderId: "267692056127",
    appId: "1:267692056127:web:472b5f1ca8c82db4a3228a"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const API = "https://mii-unsecure.ariankordi.net";

const input = document.getElementById("nnid-lookup-input");
const lookupButton = document.getElementById("nnid-lookup-button");
const linkButton = document.getElementById("nnid-link-button");
const preview = document.getElementById("nnid-mii-preview");
const nameElement = document.getElementById("nnid-mii-name");
const metaElement = document.getElementById("nnid-mii-meta");
const statusElement = document.getElementById("nnid-lookup-status");

let currentUser = null;
let selectedNNID = "";
let lookupToken = 0;

function setStatus(message, state) {
    if (!statusElement) return;
    statusElement.textContent = message;
    if (state) statusElement.dataset.state = state;
    else delete statusElement.dataset.state;
}

function normalizeNNID(value) {
    return String(value || "").trim();
}

function normalizedNNIDKey(value) {
    return normalizeNNID(value).toLowerCase().replace(/[-_.]/g, "");
}

function validateNNID(value) {
    // Match the public archive resolver's accepted NNID characters.
    // NNIDs may include letters, numbers, dots, dashes and underscores.
    return /^[A-Za-z0-9._-]{4,16}$/.test(value);
}

function imageURL(nnid) {
    return API + "/miis/image.png?nnid=" + encodeURIComponent(nnid) +
        "&type=face&width=270&api_id=0";
}

function restoreAccountPNIDMii() {
    const pnid = String(localStorage.getItem("makiiverse_pnid") || "").trim();
    const url = pnid
        ? API + "/miis/image.png?nnid=" + encodeURIComponent(pnid) + "&type=face&width=270&api_id=1"
        : "img/games/Dummy_mii_user.png";

    ["profile-mii-img", "user-sidebar-avatar"].forEach(function (id) {
        const image = document.getElementById(id);
        if (!image) return;
        image.onerror = function () {
            this.onerror = null;
            this.src = "img/games/Dummy_mii_user.png";
        };
        image.src = url;
    });
}

function applyLinkedNNID(nnid) {
    // Keep the linked NNID and the NNID sign-in alias, but do not let it
    // replace the user's PNID Mii anywhere in Maki's Bio.
    localStorage.setItem("makiiverse_nnid", nnid);
    restoreAccountPNIDMii();
}

function clearLinkedNNID() {
    localStorage.removeItem("makiiverse_nnid");
    restoreAccountPNIDMii();
}

async function findNNID(value, options) {
    const nnid = normalizeNNID(value);
    const token = ++lookupToken;
    selectedNNID = "";
    if (linkButton) linkButton.disabled = true;

    if (!validateNNID(nnid)) {
        setStatus("Usa de 4 a 16 caracteres: letras, números, punto, guion o guion bajo.", "error");
        return null;
    }

    if (!options || !options.silent) setStatus("Buscando el Mii en el archivo histórico NNID…");
    if (lookupButton) lookupButton.disabled = true;

    try {
        const response = await fetch(API + "/mii_data/" + encodeURIComponent(nnid) + "?api_id=0", {
            method: "GET",
            headers: { "Accept": "application/json" },
            cache: "no-store"
        });
        const data = await response.json().catch(() => null);

        if (token !== lookupToken) return null;
        if (!response.ok || !data || data.error || typeof data.data !== "string" || !data.data) {
            throw new Error((data && data.error) || (response.status === 404 ? "NNID_NOT_FOUND" : "LOOKUP_FAILED"));
        }

        selectedNNID = nnid;
        if (input) input.value = nnid;
        if (nameElement) nameElement.textContent = data.name || nnid;
        if (metaElement) {
            const lastModified = data.images && data.images.last_modified;
            metaElement.textContent = lastModified
                ? "Nintendo Network ID · Mii archive updated " + new Date(lastModified).toLocaleDateString()
                : "Nintendo Network ID · Wii U / 3DS Mii located";
        }
        if (preview) {
            preview.onerror = function () {
                this.onerror = null;
                this.src = "img/games/Dummy_mii_user.png";
                setStatus("El Mii existe en el archivo, pero el renderizador no respondió. Puedes volver a intentarlo.", "error");
            };
            preview.src = imageURL(nnid);
        }

        if (linkButton) linkButton.disabled = !currentUser;
        setStatus(
            "Mii encontrado. Este resultado viene de un archivo histórico; no verifica que seas titular del NNID.",
            "success"
        );
        return data;
    } catch (error) {
        if (token !== lookupToken) return null;
        if (nameElement) nameElement.textContent = "NNID not found";
        if (metaElement) metaElement.textContent = "No archived Wii U / 3DS Mii available";
        if (preview) preview.src = "img/games/Dummy_mii_user.png";
        const message = error && error.message === "NNID_NOT_FOUND"
            ? "No se encontró ese NNID en el archivo histórico. Revisa el nombre o intenta más tarde."
            : "No se pudo consultar el archivo NNID. Puede estar temporalmente fuera de servicio.";
        setStatus(message, "error");
        return null;
    } finally {
        if (token === lookupToken && lookupButton) lookupButton.disabled = false;
    }
}

async function saveNNIDLink() {
    if (!currentUser) {
        setStatus("Inicia sesión en Maki's Bio antes de vincular un NNID.", "error");
        return;
    }
    if (!selectedNNID || !validateNNID(selectedNNID)) {
        setStatus("Primero busca un NNID y confirma que se encuentre su Mii.", "error");
        return;
    }

    if (linkButton) linkButton.disabled = true;
    setStatus("Guardando el NNID en tu perfil de Maki's Bio…");

    try {
        const userRef = ref(db, "users/" + currentUser.uid);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val() || {};
        const publicId = userData.publicId ? String(userData.publicId) : "";
        const patch = {
            nnid: selectedNNID,
            nnidLower: selectedNNID.toLowerCase(),
            nnidNormalized: normalizedNNIDKey(selectedNNID),
            nnidVerified: false,
            nnidSource: "historical-archive-lookup",
            nnidLinkedAt: serverTimestamp()
        };
        const updates = {};
        Object.keys(patch).forEach(function (key) {
            updates["users/" + currentUser.uid + "/" + key] = patch[key];
            if (publicId) updates["public_users/" + publicId + "/" + key] = patch[key];
        });
        await update(ref(db), updates);
        applyLinkedNNID(selectedNNID);
        setStatus("NNID guardado en tu perfil. Aparece como identidad vinculada no verificada.", "success");
        if (metaElement) metaElement.textContent = "Linked to Maki's Bio · ownership not verified";
    } catch (error) {
        console.error("[Maki's Bio NNID] No se pudo guardar el NNID:", error);
        setStatus("No se pudo guardar. Revisa tu sesión y las reglas de Firebase.", "error");
        if (linkButton && selectedNNID) linkButton.disabled = false;
    }
}

if (lookupButton && input) {
    lookupButton.addEventListener("click", function () { findNNID(input.value); });
    input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            findNNID(input.value);
        }
    });
}
if (linkButton) linkButton.addEventListener("click", saveNNIDLink);

onAuthStateChanged(auth, async function (user) {
    currentUser = user || null;
    if (linkButton) linkButton.disabled = !currentUser || !selectedNNID;
    if (!currentUser) {
        clearLinkedNNID();
        if (!selectedNNID) setStatus("Busca un NNID; inicia sesión en Maki's Bio para guardarlo en tu perfil.");
        return;
    }

    try {
        const snapshot = await get(ref(db, "users/" + currentUser.uid + "/nnid"));
        const saved = snapshot.exists() ? String(snapshot.val() || "") : "";
        if (saved && validateNNID(saved)) {
            if (input) input.value = saved;
            applyLinkedNNID(saved);
            await findNNID(saved, { silent: true });
        } else {
            clearLinkedNNID();
        }
    } catch (error) {
        console.warn("[Maki's Bio NNID] No se pudo cargar el NNID guardado:", error);
    }
});
