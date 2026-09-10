/* ============================================================
   MAKI'S BIO V23 — extracted from index.html
   Original inline script #14
   Mode: ES MODULE
   ============================================================ */

import {
    initializeApp,
    getApp,
    getApps
}
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signOut
}
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    get,
    update,
    set,
    runTransaction
}
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";


const makiPublicFirebaseConfig = {
    apiKey: "AIzaSyBC1CU5NvbyYvgb6W2nbxAWXtdPV63qhnA",
    authDomain: "maki-s-bio.firebaseapp.com",
    databaseURL: "https://maki-s-bio-default-rtdb.firebaseio.com",
    projectId: "maki-s-bio",
    storageBucket: "maki-s-bio.firebasestorage.app",
    messagingSenderId: "267692056127",
    appId: "1:267692056127:web:472b5f1ca8c82db4a3228a"
};


const makiPublicApp =
    getApps().length > 0
        ? getApp()
        : initializeApp(makiPublicFirebaseConfig);


const makiPublicAuth =
    getAuth(makiPublicApp);


const makiPublicDB =
    getDatabase(makiPublicApp);


let makiCurrentUser = null;
let makiCurrentPublicId = null;
let makiViewingPublicId = null;
let makiRouterReady = false;


/* ============================================================
   ROUTER
   ============================================================ */

function getAppBasePath() {
    const pathname = window.location.pathname || "/";

    const publicMatch =
        pathname.match(/^(.*)\/user\/([0-9]{9})\/?$/);

    if (publicMatch) {
        return publicMatch[1] || "";
    }

    if (pathname.endsWith("/index.html")) {
        return pathname.slice(0, -"/index.html".length);
    }

    if (pathname.endsWith("/")) {
        return pathname.slice(0, -1);
    }

    const lastSlash = pathname.lastIndexOf("/");

    if (lastSlash >= 0) {
        return pathname.slice(0, lastSlash);
    }

    return "";
}


function isLocalDevHost() {
    const host = String(window.location.hostname || "").toLowerCase();

    return (
        host === "127.0.0.1" ||
        host === "localhost" ||
        host === "0.0.0.0"
    );
}


function getBaseUrlPath() {
    const base = getAppBasePath();
    return base ? base + "/" : "/";
}


function getLocalIndexPath() {
    const base = getAppBasePath();
    return (base || "") + "/index.html";
}


function getPublicProfilePath(publicId) {
    const base = getAppBasePath();

    /*
       Live Server / localhost no hace SPA rewrites.
       Por eso en local usamos hash-routing para que REFRESH funcione:

           /index.html#/user/741307210/

       En Firebase Hosting / producción mantenemos la URL bonita:

           /user/741307210/
    */
    if (isLocalDevHost()) {
        return (
            (base || "") +
            "/index.html#/user/" +
            publicId +
            "/"
        );
    }

    return (
        (base || "") +
        "/user/" +
        publicId +
        "/"
    );
}


function getPublicProfileAbsoluteUrl(publicId) {
    return (
        window.location.origin +
        getPublicProfilePath(publicId)
    );
}


function getPublicIdFromPath() {
    const hashMatch =
        String(window.location.hash || "")
        .match(/^#\/user\/([0-9]{9})\/?$/);

    if (hashMatch) {
        return hashMatch[1];
    }

    const pathMatch =
        String(window.location.pathname || "")
        .match(/\/user\/([0-9]{9})\/?$/);

    return pathMatch
        ? pathMatch[1]
        : null;
}


function routeToBase(replace = false) {
    const hasPublicPath =
        /\/user\/[0-9]{9}\/?$/.test(
            window.location.pathname
        );

    const hasPublicHash =
        /^#\/user\/[0-9]{9}\/?$/.test(
            window.location.hash || ""
        );

    if (!hasPublicPath && !hasPublicHash) {
        return;
    }

    const method =
        replace
            ? "replaceState"
            : "pushState";

    const destination =
        isLocalDevHost()
            ? getLocalIndexPath()
            : getBaseUrlPath();

    window.history[method](
        { makiView: "home" },
        "",
        destination
    );
}


/* ============================================================
   PUBLIC ID
   ============================================================ */

function randomPublicId() {
    let value;

    if (
        window.crypto &&
        typeof window.crypto.getRandomValues === "function"
    ) {
        const buffer = new Uint32Array(1);
        window.crypto.getRandomValues(buffer);

        value =
            100000000 +
            (buffer[0] % 900000000);
    } else {
        value =
            Math.floor(
                100000000 +
                Math.random() * 900000000
            );
    }

    return String(value);
}


async function ensurePublicProfile(user, pnidFallback) {
    if (!user) {
        return null;
    }

    const userRef = ref(
        makiPublicDB,
        "users/" + user.uid
    );

    let userData = {};

    try {
        const userSnapshot = await get(userRef);

        if (userSnapshot.exists()) {
            userData = userSnapshot.val() || {};
        }
    } catch (error) {
        console.error("No se pudo leer el perfil privado:", error);
        window.__makiPublicProfileError = error;
        return null;
    }

    const pnid = String(
        userData.pnid ||
        pnidFallback ||
        localStorage.getItem("makiiverse_pnid") ||
        (user.email ? user.email.split("@")[0] : "User")
    ).trim();

    /*
       Si ya existe un publicId, JAMÁS lo cambiamos.
       Solo reconstruimos public_users/{id} si faltara.
    */
    if (
        userData.publicId &&
        /^[0-9]{9}$/.test(String(userData.publicId))
    ) {
        const publicId = String(userData.publicId);
        const publicRef = ref(
            makiPublicDB,
            "public_users/" + publicId
        );

        try {
            const publicSnapshot = await get(publicRef);

            if (!publicSnapshot.exists()) {
                await set(publicRef, {
                    publicId: publicId,
                    pnid: pnid,
                    pnidLower: pnid.toLowerCase(),
                    displayName: pnid,
                    createdAt: userData.createdAt || Date.now()
                });
            }

            localStorage.setItem(
                "makiiverse_public_id",
                publicId
            );

            window.__makiPublicProfileError = null;
            return publicId;

        } catch (error) {
            console.error("No se pudo reconstruir el perfil público:", error);
            window.__makiPublicProfileError = error;
            return null;
        }
    }

    /*
       Cuenta sin publicId.
       1) buscamos un número libre
       2) guardamos ese número en users/{uid}
       3) ya como dueño, creamos public_users/{publicId}
    */
    for (let intento = 0; intento < 25; intento++) {
        const candidate = randomPublicId();
        const publicRef = ref(
            makiPublicDB,
            "public_users/" + candidate
        );

        try {
            const existing = await get(publicRef);

            if (existing.exists()) {
                continue;
            }

            /*
               Primero reclamamos el ID desde nuestro perfil privado.
               Las reglas V8 hacen publicId inmutable una vez creado.
            */
            await update(userRef, {
                uid: user.uid,
                pnid: pnid,
                pnidLower: pnid.toLowerCase(),
                publicId: candidate
            });

            /*
               Ahora public_users permite la escritura porque
               users/{auth.uid}/publicId ya coincide con candidate.
            */
            await set(publicRef, {
                publicId: candidate,
                pnid: pnid,
                pnidLower: pnid.toLowerCase(),
                displayName: pnid,
                createdAt: Date.now()
            });

            localStorage.setItem(
                "makiiverse_public_id",
                candidate
            );

            window.__makiPublicProfileError = null;
            return candidate;

        } catch (error) {
            console.error(
                "No se pudo reclamar Profile ID:",
                error
            );

            window.__makiPublicProfileError = error;

            /*
               Si la primera escritura ya alcanzó a guardar publicId
               pero falló la segunda, recuperamos ese ID y dejamos que
               el siguiente intento/recarga reconstruya public_users.
            */
            try {
                const reread = await get(userRef);

                if (
                    reread.exists() &&
                    reread.val().publicId &&
                    /^[0-9]{9}$/.test(String(reread.val().publicId))
                ) {
                    const savedId = String(reread.val().publicId);
                    const savedPublicRef = ref(
                        makiPublicDB,
                        "public_users/" + savedId
                    );

                    await set(savedPublicRef, {
                        publicId: savedId,
                        pnid: pnid,
                        pnidLower: pnid.toLowerCase(),
                        displayName: pnid,
                        createdAt: Date.now()
                    });

                    localStorage.setItem(
                        "makiiverse_public_id",
                        savedId
                    );

                    window.__makiPublicProfileError = null;
                    return savedId;
                }
            } catch (recoveryError) {
                console.warn(
                    "No se pudo recuperar el Profile ID:",
                    recoveryError
                );
            }

            if (
                error &&
                (
                    error.code === "PERMISSION_DENIED" ||
                    error.code === "permission_denied"
                )
            ) {
                break;
            }
        }
    }

    return null;
}

/* ============================================================
   PROFILE HELPERS
   ============================================================ */

function escapeHTML(value) {
    return String(value ?? "")
        .replace(
            /[&<>"']/g,
            function(char) {
                return {
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;"
                }[char];
            }
        );
}


async function getMiiName(pnid) {
    try {
        const response =
            await fetch(
                "https://mii-unsecure.ariankordi.net/mii_data/" +
                encodeURIComponent(pnid) +
                "?api_id=1"
            );

        if (!response.ok) {
            return pnid;
        }

        const data =
            await response.json();

        return (
            data?.name ||
            data?.miiName ||
            data?.mii?.name ||
            pnid
        );
    } catch (error) {
        return pnid;
    }
}


function setProfileLoading(publicId) {
    const username =
        document.getElementById(
            "profile-username"
        );

    const pnid =
        document.getElementById(
            "profile-pnid-sub"
        );

    const id =
        document.getElementById(
            "profile-public-id"
        );

    const url =
        document.getElementById(
            "profile-public-url"
        );

    const wall =
        document.getElementById(
            "muro-posts-usuario"
        );

    if (username) {
        username.textContent = "Loading...";
    }

    if (pnid) {
        pnid.textContent = "PNID";
    }

    if (id) {
        id.textContent = publicId || "---";
    }

    makiViewingProfilePostIds = [];

    const yeahCounter =
        document.getElementById(
            "info-yeahs"
        );

    if (yeahCounter) {
        yeahCounter.textContent = "0";
    }

    if (url && publicId) {
        url.textContent =
            getPublicProfilePath(publicId);
    }

    if (wall) {
        wall.innerHTML =
            '<div class="maki-public-empty">Loading profile...</div>';
    }
}


function setProfileOwnership(isOwn) {
    const settings =
        document.getElementById(
            "profile-settings-button"
        );

    const logout =
        document.getElementById(
            "profile-logout-button"
        );

    const title =
        document.getElementById(
            "profile-page-title"
        );

    if (settings) {
        settings.style.display =
            isOwn
                ? "flex"
                : "none";
    }

    if (logout) {
        logout.style.display =
            isOwn
                ? "inline-block"
                : "none";
    }

    if (title) {
        title.textContent =
            isOwn
                ? "Your Profile"
                : "User Page";
    }
}



let makiViewingProfilePostIds = [];


/*
 * Cuenta los Yeahs RECIBIDOS por el usuario cuyo perfil está abierto.
 *
 * Ejemplo:
 *   post A -> 4 Yeahs
 *   post B -> 2 Yeahs
 *   post C -> 7 Yeahs
 *
 *   perfil -> Yeahs: 13
 *
 * Soporta tanto los Yeahs V11 (true) como los V12+ (objeto con
 * pnid/publicId/miiName/givenAt).
 */
function countReceivedYeahsFromMap(yeahMap) {
    let total = 0;

    makiViewingProfilePostIds.forEach(
        function(postId) {
            const postYeahs =
                yeahMap &&
                yeahMap[postId]
                    ? yeahMap[postId]
                    : {};

            if (
                postYeahs &&
                typeof postYeahs === "object"
            ) {
                total += Object.values(
                    postYeahs
                ).filter(Boolean).length;
            }
        }
    );

    return total;
}


function paintProfileYeahCount(total) {
    const counter =
        document.getElementById(
            "info-yeahs"
        );

    if (!counter) {
        return;
    }

    const oldValue =
        Number(counter.textContent || 0);

    counter.textContent =
        String(total);

    if (oldValue !== total) {
        counter.style.transform =
            "scale(1.10)";

        counter.style.boxShadow =
            "0 0 9px rgba(0,174,255,.35)";

        setTimeout(
            function() {
                counter.style.transform =
                    "scale(1)";

                counter.style.boxShadow =
                    "none";
            },
            220
        );
    }
}


async function refreshProfileYeahCount() {
    const counter =
        document.getElementById(
            "info-yeahs"
        );

    if (!counter) {
        return;
    }

    if (
        !makiViewingProfilePostIds.length
    ) {
        paintProfileYeahCount(0);
        return;
    }

    try {
        const snapshot =
            await get(
                ref(
                    makiPublicDB,
                    "post_yeahs"
                )
            );

        const map =
            snapshot.exists()
                ? snapshot.val() || {}
                : {};

        paintProfileYeahCount(
            countReceivedYeahsFromMap(
                map
            )
        );

    } catch (error) {
        console.warn(
            "No se pudo calcular el contador real de Yeahs del perfil:",
            error
        );

        /*
         * No inventamos un número si Firebase falla.
         * Se conserva el último valor conocido.
         */
    }
}


/*
 * El módulo de General Chat escucha post_yeahs en tiempo real.
 * Le exponemos este pequeño puente para que el contador del perfil
 * cambie inmediatamente sin tener que refrescar la página.
 */
window.actualizarYeahsPerfilDesdeMapa =
    function(yeahMap) {
        paintProfileYeahCount(
            countReceivedYeahsFromMap(
                yeahMap || {}
            )
        );
    };


async function renderPublicPosts(pnid) {
    const wall =
        document.getElementById(
            "muro-posts-usuario"
        );

    const counter =
        document.getElementById(
            "contador-posts-usuario"
        );

    if (!wall) {
        return;
    }

    wall.innerHTML =
        '<div class="maki-public-empty">Loading posts...</div>';

    let results = [];

    try {
        const snapshot =
            await get(
                ref(
                    makiPublicDB,
                    "posts"
                )
            );

        if (snapshot.exists()) {
            snapshot.forEach(
                function(child) {
                    const post =
                        child.val() || {};

                    if (
                        String(post.autor || "")
                        .toLowerCase() ===
                        String(pnid || "")
                        .toLowerCase()
                    ) {
                        results.push({
                            id: child.key,
                            ...post
                        });
                    }
                }
            );
        }
    } catch (error) {
        console.warn(
            "No se pudieron cargar posts públicos:",
            error
        );
    }

    results.reverse();

    /*
     * Estos son exactamente los posts que pertenecen al perfil
     * actualmente abierto. El contador de Yeahs suma únicamente
     * las reacciones recibidas por estos posts.
     */
    makiViewingProfilePostIds =
        results.map(
            function(post) {
                return post.id;
            }
        );

    await refreshProfileYeahCount();

    if (counter) {
        counter.textContent =
            String(results.length);
    }

    if (results.length === 0) {
        wall.innerHTML =
            '<div class="maki-public-empty">This user has no public posts yet.</div>';

        return;
    }

    const miiBase =
        "https://mii-unsecure.ariankordi.net/miis/image.png" +
        "?nnid=" + encodeURIComponent(pnid) +
        "&type=face&width=270&api_id=1";

    wall.innerHTML =
        results.map(
            function(post) {
                const expression =
                    post.expresion ||
                    "normal";

                const miiUrl =
                    miiBase +
                    "&expression=" +
                    encodeURIComponent(expression);

                return `
                    <article class="maki-public-post">
                        <div class="maki-public-post-mii">
                            <img
                                src="${escapeHTML(miiUrl)}"
                                alt=""
                                onerror="this.src='img/games/Dummy_mii_user.png';"
                            >
                        </div>

                        <div class="maki-public-post-content">
                            <div class="maki-public-post-meta">
                                ${escapeHTML(post.fecha || "")}
                            </div>

                            ${
                                String(post.contenido || "").startsWith("data:image/")
                                    ? `
                                        <img
                                            class="maki-public-post-image"
                                            src="${escapeHTML(post.contenido)}"
                                            alt="Drawing"
                                        >
                                    `
                                    : `
                                        <p class="maki-public-post-text">${escapeHTML(post.contenido || "")}</p>
                                    `
                            }
                            <div class="maki-public-post-actions">
                                <button type="button" class="maki-profile-yeah" data-chat-yeah-post="${escapeHTML(post.id)}" onclick="toggleYeahReal('${escapeHTML(post.id)}')">
                                    <span class="maki-yeah-icon">E</span><span>Yeah!</span>
                                </button>
                                <span class="maki-profile-yeah-count" data-chat-yeah-count="${escapeHTML(post.id)}">0</span>
                            </div>
                        </div>
                    </article>
                `;
            }
        ).join("");
}


async function renderProfile(publicId, profileData) {
    const pnid =
        String(
            profileData.pnid ||
            "User"
        );

    const username =
        document.getElementById(
            "profile-username"
        );

    const pnidElement =
        document.getElementById(
            "profile-pnid-sub"
        );

    const publicIdElement =
        document.getElementById(
            "profile-public-id"
        );

    const urlElement =
        document.getElementById(
            "profile-public-url"
        );

    const bio =
        document.getElementById(
            "profile-bio"
        );

    const mii =
        document.getElementById(
            "profile-mii-img"
        );

    const displayName =
        await getMiiName(pnid);

    if (username) {
        username.textContent =
            displayName;
    }

    if (pnidElement) {
        pnidElement.textContent =
            pnid;
    }

    if (publicIdElement) {
        publicIdElement.textContent =
            publicId;
    }

    if (urlElement) {
        urlElement.textContent =
            getPublicProfilePath(
                publicId
            );
    }

    if (bio) {
        bio.textContent =
            profileData.bio ||
            "";
    }

    if (mii) {
        mii.src =
            "https://mii-unsecure.ariankordi.net/miis/image.png" +
            "?nnid=" +
            encodeURIComponent(pnid) +
            "&type=face&width=270&api_id=1";

        mii.onerror =
            function() {
                this.onerror = null;
                this.src =
                    "img/games/Dummy_mii_user.png";
            };
    }

    let isOwn = false;

    if (
        makiCurrentUser &&
        makiCurrentPublicId === publicId
    ) {
        isOwn = true;
    }

    setProfileOwnership(isOwn);

    await renderPublicPosts(pnid);
}


/* ============================================================
   OPEN PROFILE
   ============================================================ */

async function openPublicProfile(
    publicId,
    pushUrl = true
) {
    if (
        !publicId ||
        !/^[0-9]{9}$/.test(publicId)
    ) {
        return;
    }

    makiViewingPublicId =
        publicId;

    if (
        typeof window.conmutarPortal === "function"
    ) {
        window.conmutarPortal(
            5,
            "global-menu-mymenu"
        );
    }

    setProfileLoading(publicId);

    try {
        const snapshot =
            await get(
                ref(
                    makiPublicDB,
                    "public_users/" + publicId
                )
            );

        if (!snapshot.exists()) {
            const username =
                document.getElementById(
                    "profile-username"
                );

            const pnid =
                document.getElementById(
                    "profile-pnid-sub"
                );

            const wall =
                document.getElementById(
                    "muro-posts-usuario"
                );

            if (username) {
                username.textContent =
                    "User not found";
            }

            if (pnid) {
                pnid.textContent =
                    "This profile does not exist.";
            }

            if (wall) {
                wall.innerHTML =
                    '<div class="maki-public-empty">No account exists with this Profile ID.</div>';
            }

            setProfileOwnership(false);

            return;
        }

        if (pushUrl) {
            window.history.pushState(
                {
                    makiView: "user",
                    publicId: publicId
                },
                "",
                getPublicProfilePath(
                    publicId
                )
            );
        }

        await renderProfile(
            publicId,
            snapshot.val() || {}
        );

    } catch (error) {
        console.error(
            "Error abriendo perfil público:",
            error
        );
    }
}


/* ============================================================
   GLOBAL API
   ============================================================ */

window.abrirMiPerfilPublico =
    async function() {
        if (!makiCurrentUser) {
            window.location.href =
                "login.html";

            return;
        }

        const publicId =
            makiCurrentPublicId ||
            await ensurePublicProfile(
                makiCurrentUser,
                localStorage.getItem(
                    "makiiverse_pnid"
                )
            );

        if (!publicId) {
            const profileError = window.__makiPublicProfileError;
            const code = profileError && profileError.code
                ? String(profileError.code)
                : "UNKNOWN";

            alert(
                "No se pudo crear el Profile ID.\n\n" +
                "Código: " + code + "\n\n" +
                "Si dice PERMISSION_DENIED, publica database.rules.json V8 en Firebase Realtime Database > Rules."
            );

            return;
        }

        makiCurrentPublicId =
            publicId;

        await openPublicProfile(
            publicId,
            true
        );
    };


window.abrirPerfilPublico =
    async function(publicId) {
        await openPublicProfile(
            String(publicId || ""),
            true
        );
    };


window.copiarUrlPerfilPublico =
    async function(button) {
        const publicId =
            makiViewingPublicId ||
            makiCurrentPublicId;

        if (!publicId) {
            return;
        }

        const value =
            getPublicProfileAbsoluteUrl(
                publicId
            );

        try {
            if (
                navigator.clipboard &&
                navigator.clipboard.writeText
            ) {
                await navigator.clipboard.writeText(
                    value
                );
            } else {
                const textarea =
                    document.createElement(
                        "textarea"
                    );

                textarea.value =
                    value;

                textarea.style.position =
                    "fixed";

                textarea.style.opacity =
                    "0";

                document.body.appendChild(
                    textarea
                );

                textarea.select();

                document.execCommand(
                    "copy"
                );

                textarea.remove();
            }

            if (button) {
                const original =
                    button.textContent;

                button.textContent =
                    "COPIED!";

                setTimeout(
                    function() {
                        button.textContent =
                            original;
                    },
                    1100
                );
            }
        } catch (error) {
            window.prompt(
                "Copy profile URL:",
                value
            );
        }
    };


window.MakiPublicProfiles = {
    syncRouteAfterPortal:
        function(irA, replaceRoute) {
            if (
                Number(irA) !== 5
            ) {
                makiViewingPublicId =
                    null;

                routeToBase(
                    Boolean(replaceRoute)
                );
            }
        },

    open:
        openPublicProfile
};


/* ============================================================
   REAL LOGOUT
   ============================================================ */

window.cerrarSesion =
    async function() {
        try {
            await signOut(
                makiPublicAuth
            );
        } catch (error) {
            console.warn(
                "No se pudo cerrar Firebase Auth:",
                error
            );
        }

        localStorage.removeItem(
            "makiiverse_pnid"
        );

        localStorage.removeItem(
            "makiiverse_public_id"
        );

        window.location.href =
            "login.html";
    };


/* ============================================================
   AUTH + INITIAL ROUTE
   ============================================================ */

onAuthStateChanged(
    makiPublicAuth,
    async function(user) {
        makiCurrentUser =
            user || null;

        if (!user) {
            localStorage.removeItem(
                "makiiverse_public_id"
            );

            window.location.href =
                "login.html";

            return;
        }

        makiCurrentPublicId =
            await ensurePublicProfile(
                user,
                localStorage.getItem(
                    "makiiverse_pnid"
                )
            );

        const publicIdFromPath =
            getPublicIdFromPath();

        makiRouterReady =
            true;

        if (publicIdFromPath) {
            await openPublicProfile(
                publicIdFromPath,
                false
            );
        }
    }
);


window.addEventListener(
    "popstate",
    async function() {
        if (!makiRouterReady) {
            return;
        }

        const publicId =
            getPublicIdFromPath();

        if (publicId) {
            await openPublicProfile(
                publicId,
                false
            );

            return;
        }

        makiViewingPublicId =
            null;

        if (
            typeof window.conmutarPortal === "function"
        ) {
            window.conmutarPortal(
                0,
                "global-menu-community",
                true
            );
        }
    }
);
