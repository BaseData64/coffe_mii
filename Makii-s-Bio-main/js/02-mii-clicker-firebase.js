/* ============================================================
   MAKI'S BIO V23 — extracted from index.html
   Original inline script #02
   Mode: ES MODULE
   ============================================================ */

import {
    initializeApp,
    getApp,
    getApps
}
from
"https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";


import {
    getAuth,
    onAuthStateChanged
}
from
"https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    get,
    set,
    update,
    onValue,
    increment,
    serverTimestamp
}
from
"https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";



const firebaseConfigMiiClicker = {

    apiKey:
        "AIzaSyBC1CU5NvbyYvgb6W2nbxAWXtdPV63qhnA",

    authDomain:
        "maki-s-bio.firebaseapp.com",

    databaseURL:
        "https://maki-s-bio-default-rtdb.firebaseio.com",

    projectId:
        "maki-s-bio",

    storageBucket:
        "maki-s-bio.firebasestorage.app",

    messagingSenderId:
        "267692056127",

    appId:
        "1:267692056127:web:472b5f1ca8c82db4a3228a"

};


const miiClickerApp =

    getApps().length > 0

        ?

        getApp()

        :

        initializeApp(
            firebaseConfigMiiClicker
        );



const miiClickerAuth =
    getAuth(
        miiClickerApp
    );


const miiClickerDB =
    getDatabase(
        miiClickerApp
    );

const clickButton =
    document.getElementById(
        "mii-clicker-click-button"
    );


const miiImage =
    document.getElementById(
        "mii-clicker-mii"
    );


const scoreElement =
    document.getElementById(
        "mii-clicker-score"
    );


const pnidElement =
    document.getElementById(
        "mii-clicker-pnid"
    );


const plusOne =
    document.getElementById(
        "mii-clicker-plus-one"
    );


const rankElement =
    document.getElementById(
        "mii-clicker-rank-text"
    );


const syncElement =
    document.getElementById(
        "mii-clicker-sync-text"
    );


const statusElement =
    document.getElementById(
        "mii-clicker-status"
    );


const weekLabelElement =
    document.getElementById(
        "mii-clicker-week-label"
    );

const rankingCountElement =
    document.getElementById(
        "mii-clicker-ranking-count"
    );

const leaderboardListElement =
    document.getElementById(
        "mii-clicker-leaderboard-list"
    );

const openRankingButton =
    document.getElementById("mii-clicker-open-ranking");

const weeklyPageWeekElement =
    document.getElementById("mii-clicker-week-range-label");



/* ============================================================
   ESTADO
   ============================================================ */

let firebaseUser =
    null;


let playerPNID =
    "";


let playerReference =
    null;


let weeklyReference =
    null;


let currentWeekStart =
    getWeekStartUTC(new Date());


let currentWeekKey =
    formatDateKey(currentWeekStart);


let localScore =
    0;


let pendingClicks =
    0;


let saving =
    false;


let saveTimer =
    null;


let pressTimer =
    null;


let plusTimer =
    null;


let rankingUnsubscribe =
    null;


let playerUnsubscribe =
    null;

let databaseReady =
    false;

let databaseConnected =
    false;

let onlineInitPromise =
    null;

let reconnectTimer =
    null;

let persistentSyncError =
    "";



/* ============================================================
   CONFIGURACIÓN DEL CLICKER
   ============================================================ */

const CLICK_BATCH =
    10;


const SAVE_DELAY =
    650;



/* ============================================================
   NORMALIZAR PNID
   ============================================================ */

function normalizePNID(
    value
) {

    return String(
        value || ""
    )

    .replace(
        /^\s+|\s+$/g,
        ""
    )

    .toLowerCase();

}


/* ============================================================
   MII RENDERER — PNID RESOLUTION + SHARED IMAGE BUILDER
   Each leaderboard row keeps its score and Mii render linked
   to the same Firebase player record. api_id=1 selects PNID.
   ============================================================ */

function getValidPlayerPNID(value) {
    var pnid = String(value || "").replace(/^\s+|\s+$/g, "");

    if (!pnid) {
        return "";
    }

    /* Accept only the project's own legacy login alias, never an arbitrary email. */
    var emailSuffix = "@makiiverse.com";
    if (pnid.indexOf("@") !== -1) {
        if (pnid.toLowerCase().slice(-emailSuffix.length) === emailSuffix) {
            pnid = pnid.slice(0, -emailSuffix.length);
        }
        else {
            return "";
        }
    }

    if (/^(unknown|null|undefined|none|---)$/i.test(pnid)) {
        return "";
    }

    return pnid;
}


function resolveRankingPNID(weeklyPlayer, lifetimePlayer, uid) {
    weeklyPlayer = weeklyPlayer || {};
    lifetimePlayer = lifetimePlayer || {};

    /* Always prefer the authenticated session PNID for the current player. */
    if (firebaseUser && uid === firebaseUser.uid) {
        var sessionPNID = getValidPlayerPNID(playerPNID);
        if (sessionPNID) {
            return sessionPNID;
        }
    }

    return getValidPlayerPNID(weeklyPlayer.pnid)
        || getValidPlayerPNID(lifetimePlayer.pnid)
        || getValidPlayerPNID(weeklyPlayer.PNID)
        || getValidPlayerPNID(lifetimePlayer.PNID)
        || getValidPlayerPNID(weeklyPlayer.email)
        || getValidPlayerPNID(lifetimePlayer.email);
}


function buildPlayerMiiRenderURL(pnid, width, viewType, expression) {
    var validPNID = getValidPlayerPNID(pnid);
    if (!validPNID) {
        return "";
    }

    var renderWidth = Number(width) || 270;
    var renderType = viewType || "face";

    var renderURL = "https://mii-unsecure.ariankordi.net/miis/image.png"
        + "?nnid=" + encodeURIComponent(validPNID)
        + "&type=" + encodeURIComponent(renderType)
        + "&width=" + encodeURIComponent(renderWidth)
        + "&api_id=1";

    /* Only the dedicated top-three display requests a happy expression. */
    if (expression) {
        renderURL += "&expression=" + encodeURIComponent(expression);
    }

    return renderURL;
}


function attachPlayerMiiRender(container, player, width, viewType, expression) {
    if (!container) {
        return null;
    }

    container.innerHTML = "";
    container.style.backgroundImage = "url('img/games/Dummy_mii_user.png')";

    var pnid = player && getValidPlayerPNID(player.pnid);
    var renderURL = buildPlayerMiiRenderURL(pnid, width, viewType, expression);

    if (!renderURL) {
        container.setAttribute("data-mii-render", "unavailable");
        return null;
    }

    var image = document.createElement("img");
    image.className = "mii-clicker-render-image";
    image.alt = pnid ? "Mii de " + pnid : "Mii player";
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.setAttribute("data-player-uid", player && player.uid ? player.uid : "");

    image.onload = function () {
        container.style.backgroundImage = "none";
        container.setAttribute("data-mii-render", "loaded");
    };

    image.onerror = function () {
        image.onerror = null;
        container.style.backgroundImage = "url('img/games/Dummy_mii_user.png')";
        container.setAttribute("data-mii-render", "fallback");
        if (image.parentNode === container) {
            container.removeChild(image);
        }
    };

    container.appendChild(image);
    image.src = renderURL;
    return image;
}



/* ============================================================
   FORMATO DE NÚMEROS
   ============================================================ */

function formatNumber(
    value
) {

    var number =
        Number(
            value || 0
        );


    try {

        return number.toLocaleString();

    }

    catch (error) {

        return String(
            number
        );

    }

}


/* ============================================================
   SEMANA GLOBAL — LUNES 00:00 A DOMINGO 23:59 UTC
   Una clave idéntica para todos los participantes.
   ============================================================ */

function getWeekStartUTC(date) {

    var current = new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
    ));

    var mondayOffset = (current.getUTCDay() + 6) % 7;
    current.setUTCDate(current.getUTCDate() - mondayOffset);

    return current;
}


function formatDateKey(date) {

    var year = date.getUTCFullYear();
    var month = String(date.getUTCMonth() + 1).padStart(2, "0");
    var day = String(date.getUTCDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
}


function formatWeekLabel() {

    var end = new Date(currentWeekStart.getTime());
    end.setUTCDate(end.getUTCDate() + 6);

    try {
        var formatter = new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            timeZone: "UTC"
        });

        return formatter.format(currentWeekStart)
            + " – "
            + formatter.format(end)
            + ", "
            + end.getUTCFullYear()
            + " · UTC";
    }
    catch (error) {
        return formatDateKey(currentWeekStart)
            + " – "
            + formatDateKey(end)
            + " · UTC";
    }
}


if (weekLabelElement) {
    weekLabelElement.textContent = formatWeekLabel();
}

if (weeklyPageWeekElement) {
    weeklyPageWeekElement.textContent = formatWeekLabel();
}

if (openRankingButton) {
    openRankingButton.addEventListener("click", function () {
        if (typeof window.abrirWeeklyMiiClickers === "function") {
            window.abrirWeeklyMiiClickers();
        }
    });
}


onValue(
    ref(miiClickerDB, ".info/connected"),
    function (snapshot) {
        databaseConnected = snapshot.val() === true;

        if (statusElement) {
            statusElement.textContent = databaseConnected
                ? (databaseReady ? "ONLINE" : "ONLINE · CHECKING ACCESS")
                : "OFFLINE";
        }

        if (databaseConnected) {
            if (firebaseUser && playerPNID && !databaseReady) {
                connectOnlinePlayer();
            }
            return;
        }

        databaseReady = false;
        if (firebaseUser) {
            if (rankElement) rankElement.textContent = "Offline";
            if (syncElement) {
                syncElement.textContent = "Offline play enabled — Firebase Realtime Database reports no connection. Local clicks are saved on this device.";
            }
        }
    },
    function (error) {
        databaseConnected = false;
        databaseReady = false;
        console.error("[Mii Clicker] Connection monitor error:", error);
        if (statusElement) statusElement.textContent = "ERROR";
        if (rankElement) rankElement.textContent = "Unavailable";
        if (syncElement) syncElement.textContent = explainDatabaseError(error);
    }
);


/* ============================================================
   OBTENER PNID DE LA SESIÓN
   ============================================================ */

function getSessionPNID(
    user
) {


    var storedPNID =
        localStorage.getItem(
            "makiiverse_pnid"
        );


    var email =
        user && user.email
            ?
            String(
                user.email
            )
            :
            "";


    var firebasePNID =
        "";


    var atPosition =
        email.indexOf("@");



    if (
        atPosition !== -1
    ) {


        firebasePNID =
            email.substring(
                0,
                atPosition
            );

    }



    /*
       Si localStorage coincide con Firebase,
       conservamos la capitalización original.

       Ejemplo:
           Firebase:
               yosmakii99_pn

           Vista:
               YosMakii99_PN
    */

    if (
        storedPNID
        &&
        normalizePNID(
            storedPNID
        )
        ===
        normalizePNID(
            firebasePNID
        )
    ) {


        return storedPNID;

    }



    return firebasePNID
        ||
        storedPNID
        ||
        "";

}



/* ============================================================
   CARGAR MII PRINCIPAL

   CUERPO COMPLETO.
   SIN INSIGNIAS.
   ============================================================ */

function loadPlayerMii() {


    var miiURL = buildPlayerMiiRenderURL(
        playerPNID,
        270,
        "all_body"
    );

    miiImage.onerror = function () {
        miiImage.onerror = null;
        miiImage.src = "img/games/Dummy_mii_user.png";
    };

    miiImage.src = miiURL || "img/games/Dummy_mii_user.png";

}



/* ============================================================
   COLA LOCAL DE CLICS — evita perder pulsaciones si Firebase tarda
   o si todavía faltan publicar las reglas de Realtime Database.
   ============================================================ */
function pendingStorageKey(uid) {
    return "mii_clicker_pending_" + uid + "_" + currentWeekKey;
}

function scoreCacheKey(uid) {
    return "mii_clicker_score_cache_" + uid + "_" + currentWeekKey;
}

function readPendingClicks(uid) {
    try {
        var value = Number(localStorage.getItem(pendingStorageKey(uid)) || 0);
        return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
    }
    catch (error) {
        console.warn("[Mii Clicker] No se pudo leer la cola local:", error);
        return 0;
    }
}

function persistPendingClicks() {
    if (!firebaseUser) return;

    try {
        var key = pendingStorageKey(firebaseUser.uid);
        if (pendingClicks > 0) {
            localStorage.setItem(key, String(Math.floor(pendingClicks)));
        }
        else {
            localStorage.removeItem(key);
        }
    }
    catch (error) {
        console.warn("[Mii Clicker] No se pudo guardar la cola local:", error);
    }
}

function persistLocalScore() {
    if (!firebaseUser) return;

    try {
        localStorage.setItem(scoreCacheKey(firebaseUser.uid), String(Math.max(0, Math.floor(localScore))));
    }
    catch (error) {
        console.warn("[Mii Clicker] No se pudo guardar el marcador local:", error);
    }
}

function restoreLocalScore(uid) {
    try {
        var value = Number(localStorage.getItem(scoreCacheKey(uid)) || 0);
        return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
    }
    catch (error) {
        return 0;
    }
}

function explainDatabaseError(error, operation) {
    var rawCode = String(error && error.code || "").trim();
    var rawMessage = String(error && error.message || "").trim();
    var details = (rawCode + " " + rawMessage).toLowerCase();
    var stage = operation ? " during " + operation : "";

    if (/permission_denied|permission-denied|permission denied/.test(details)) {
        return "ONLINE, BUT FIREBASE DENIED ACCESS" + stage + " (PERMISSION_DENIED). The database socket is connected, but the deployed Realtime Database Rules do not allow this operation. Publish the project's database.rules.json in Firebase Console → Realtime Database → Rules, then reload Mii Clicker.";
    }

    if (/unauthorized|unauthenticated|auth required|not authenticated/.test(details)) {
        return "FIREBASE AUTHENTICATION FAILED" + stage + ". The Mii Clicker module does not see an authorized session. Sign out and sign back in with the same Maki's Bio account.";
    }

    if (/network|unavailable|offline|failed to fetch|timeout|disconnected|websocket|transport/.test(details)) {
        return "FIREBASE NETWORK ERROR" + stage + (rawCode ? " (" + rawCode + ")" : "") + (rawMessage ? " — " + rawMessage : ".") + " The app may show ONLINE briefly because .info/connected only confirms the database socket, not that each read/write is authorized.";
    }

    return "FIREBASE ERROR" + stage + (rawCode ? " [" + rawCode + "]" : "") + (rawMessage ? ": " + rawMessage : ". Check the browser console for details.");
}

function withDatabaseOperation(error, operation) {
    var wrapped = new Error(String(error && error.message || error || "Unknown Firebase error"));
    wrapped.code = error && error.code ? error.code : "UNKNOWN";
    wrapped.operation = operation;
    wrapped.originalError = error;
    return wrapped;
}

function queueOnlineReconnect() {
    if (reconnectTimer || !firebaseUser || !playerPNID || !databaseConnected) return;

    reconnectTimer = setTimeout(function () {
        reconnectTimer = null;
        if (!databaseReady && databaseConnected) connectOnlinePlayer();
    }, 12000);
}

async function connectOnlinePlayer() {
    if (!firebaseUser || !playerPNID || databaseReady || onlineInitPromise) {
        return onlineInitPromise;
    }

    if (!databaseConnected) {
        if (rankElement) rankElement.textContent = "Connecting...";
        if (syncElement && !persistentSyncError) {
            syncElement.textContent = "Waiting for Firebase Realtime Database. Local play remains available.";
        }
        return null;
    }

    onlineInitPromise = (async function () {
        try {
            /*
             * Start the public leaderboard listeners before writing the current
             * player's score. This keeps standings visible even if the deployed
             * rules allow public reads but reject the current player's write.
             */
            startOnlineRanking();

            if (syncElement) syncElement.textContent = "Connected to Firebase. Checking player permissions...";
            await loadOnlinePlayer();
            databaseReady = true;
            persistentSyncError = "";

            if (pendingClicks > 0) {
                if (syncElement) syncElement.textContent = "Syncing " + pendingClicks + " saved clicks...";
                scheduleSave();
            }
            else if (syncElement) {
                syncElement.textContent = "Weekly score synced.";
            }

            console.log("[Mii Clicker] ONLINE - Realtime Database connected and player record authorized.");
        }
        catch (error) {
            databaseReady = false;
            var operation = error && error.operation ? error.operation : "initializing the player record";
            persistentSyncError = explainDatabaseError(error, operation);
            console.error("[Mii Clicker] Connection/init error during " + operation + ":", error && error.originalError ? error.originalError : error);

            if (clickButton) clickButton.disabled = false;
            if (statusElement) statusElement.textContent = /permission_denied|permission-denied/i.test(String(error && (error.code + " " + error.message)))
                ? "ONLINE · RULES ERROR"
                : "ONLINE · INIT ERROR";
            if (rankElement) {
                rankElement.textContent = /permission_denied|permission-denied/i.test(String(error && (error.code + " " + error.message)))
                    ? "Rules need update"
                    : "Connection error";
            }
            if (syncElement) syncElement.textContent = persistentSyncError;

            var errorDetails = String(error && (error.code || error.message) || "").toLowerCase();
            if (!/permission_denied|permission-denied|permission denied|unauthorized|unauthenticated/.test(errorDetails)) {
                queueOnlineReconnect();
            }
        }
        finally {
            onlineInitPromise = null;
        }
    })();

    return onlineInitPromise;
}


/* ============================================================
   CREAR / CARGAR JUGADOR ONLINE
   ============================================================ */

async function loadOnlinePlayer() {
    playerReference = ref(miiClickerDB, "mii_clicker/" + firebaseUser.uid);
    weeklyReference = ref(
        miiClickerDB,
        "mii_clicker_weekly/" + currentWeekKey + "/" + firebaseUser.uid
    );

    var lifetimeSnapshot;
    try {
        lifetimeSnapshot = await get(playerReference);
    }
    catch (error) {
        throw withDatabaseOperation(error, "reading mii_clicker/" + firebaseUser.uid);
    }

    try {
        if (!lifetimeSnapshot.exists()) {
            await set(playerReference, {
                uid: firebaseUser.uid,
                pnid: playerPNID,
                clicks: 0,
                updatedAt: serverTimestamp()
            });
        }
        else {
            await update(playerReference, {
                uid: firebaseUser.uid,
                pnid: playerPNID,
                updatedAt: serverTimestamp()
            });
        }
    }
    catch (error) {
        throw withDatabaseOperation(error, "writing mii_clicker/" + firebaseUser.uid);
    }

    var weeklySnapshot;
    try {
        weeklySnapshot = await get(weeklyReference);
    }
    catch (error) {
        throw withDatabaseOperation(error, "reading mii_clicker_weekly/" + currentWeekKey + "/" + firebaseUser.uid);
    }

    var weeklyData = weeklySnapshot.exists() ? (weeklySnapshot.val() || {}) : {};
    var remoteWeeklyScore = Number(weeklyData.clicks || 0);

    if (!Number.isFinite(remoteWeeklyScore) || remoteWeeklyScore < 0) {
        remoteWeeklyScore = 0;
    }
    remoteWeeklyScore = Math.floor(remoteWeeklyScore);

    try {
        await update(weeklyReference, {
            uid: firebaseUser.uid,
            pnid: playerPNID,
            clicks: remoteWeeklyScore,
            weekStart: currentWeekKey,
            updatedAt: serverTimestamp()
        });
    }
    catch (error) {
        throw withDatabaseOperation(error, "creating/updating mii_clicker_weekly/" + currentWeekKey + "/" + firebaseUser.uid);
    }

    pendingClicks = readPendingClicks(firebaseUser.uid);
    localScore = remoteWeeklyScore + pendingClicks;
    updateScoreUI();
    persistLocalScore();

    databaseReady = true;
    if (clickButton) clickButton.disabled = false;
    listenPlayerScore();
}



/* ============================================================
   ESCUCHAR SCORE SEMANAL PROPIO/* ============================================================
   ESCUCHAR SCORE SEMANAL PROPIO
   ============================================================ */

function listenPlayerScore() {

    if (playerUnsubscribe) {
        playerUnsubscribe();
    }

    playerUnsubscribe = onValue(
        weeklyReference,
        function (snapshot) {
            if (!snapshot.exists()) {
                return;
            }

            var data = snapshot.val() || {};
            var remoteScore = Number(data.clicks || 0);

            if (pendingClicks === 0 && saving === false) {
                localScore = remoteScore;
                updateScoreUI();
                persistLocalScore();
            }
        },
        function (error) {
            console.error("[Mii Clicker] Error leyendo score semanal:", error);
        }
    );
}



/* ============================================================
   ACTUALIZAR SCORE VISUAL
   ============================================================ */

function updateScoreUI() {
    if (scoreElement) {
        scoreElement.textContent = formatNumber(localScore);
    }

    persistLocalScore();
}



/* ============================================================
   CLICK
   ============================================================ */

function registerClick() {
    /* La cuenta autenticada es obligatoria, la conexión de datos no.
       Mientras Firebase vuelve, la puntuación queda guardada localmente. */
    if (!firebaseUser || !playerPNID || clickButton.disabled) {
        return;
    }

    localScore += 1;
    pendingClicks += 1;

    updateScoreUI();
    persistPendingClicks();
    animateButton();
    animatePlusOne();
    scheduleSave();
}


/* ============================================================
   ANIMAR BOTÓN/* ============================================================
   ANIMAR BOTÓN
   ============================================================ */

function animateButton() {


    clickButton.classList.add(
        "mii-clicker-pressed"
    );



    if (
        pressTimer
    ) {


        clearTimeout(
            pressTimer
        );

    }



    pressTimer =
        setTimeout(

            function () {


                clickButton.classList.remove(
                    "mii-clicker-pressed"
                );

            },

            80

        );

}



/* ============================================================
   ANIMAR +1
   ============================================================ */

function animatePlusOne() {


    plusOne.classList.remove(
        "show"
    );


    /*
       Forzar repaint.
    */

    void plusOne.offsetWidth;


    plusOne.classList.add(
        "show"
    );



    if (
        plusTimer
    ) {


        clearTimeout(
            plusTimer
        );

    }



    plusTimer =
        setTimeout(

            function () {


                plusOne.classList.remove(
                    "show"
                );

            },

            150

        );

}



/* ============================================================
   PROGRAMAR GUARDADO ONLINE
   ============================================================ */

function scheduleSave() {
    persistPendingClicks();

    if (!databaseReady || !playerReference || !weeklyReference) {
        if (syncElement) {
            syncElement.textContent = persistentSyncError || "Offline play — clicks saved on this device until Firebase reconnects.";
        }
        return;
    }

    if (syncElement) syncElement.textContent = "Saving online...";

    if (pendingClicks >= CLICK_BATCH) {
        savePendingClicks();
        return;
    }

    if (saveTimer) return;

    saveTimer = setTimeout(function () {
        saveTimer = null;
        savePendingClicks();
    }, SAVE_DELAY);
}


/* ============================================================
   GUARDAR CLICKS ONLINE/* ============================================================
   GUARDAR CLICKS ONLINE

   Actualización multipath atómica: histórico + semana.
   ============================================================ */

async function savePendingClicks() {
    if (
        saving || pendingClicks <= 0 || !firebaseUser ||
        !playerReference || !weeklyReference || !databaseReady
    ) {
        persistPendingClicks();
        return;
    }

    saving = true;
    var amount = Math.min(pendingClicks, CLICK_BATCH);
    pendingClicks -= amount;
    persistPendingClicks();

    try {
        var updates = {};
        updates["mii_clicker/" + firebaseUser.uid + "/clicks"] = increment(amount);
        updates["mii_clicker/" + firebaseUser.uid + "/uid"] = firebaseUser.uid;
        updates["mii_clicker/" + firebaseUser.uid + "/pnid"] = playerPNID;
        updates["mii_clicker/" + firebaseUser.uid + "/updatedAt"] = serverTimestamp();

        updates["mii_clicker_weekly/" + currentWeekKey + "/" + firebaseUser.uid + "/clicks"] = increment(amount);
        updates["mii_clicker_weekly/" + currentWeekKey + "/" + firebaseUser.uid + "/uid"] = firebaseUser.uid;
        updates["mii_clicker_weekly/" + currentWeekKey + "/" + firebaseUser.uid + "/pnid"] = playerPNID;
        updates["mii_clicker_weekly/" + currentWeekKey + "/" + firebaseUser.uid + "/weekStart"] = currentWeekKey;
        updates["mii_clicker_weekly/" + currentWeekKey + "/" + firebaseUser.uid + "/updatedAt"] = serverTimestamp();

        await update(ref(miiClickerDB), updates);

        persistLocalScore();
        persistentSyncError = "";
        if (syncElement) syncElement.textContent = "Weekly score synced.";
    }
    catch (error) {
        console.error("[Mii Clicker] Error guardando puntuación:", error);
        pendingClicks += amount;
        persistPendingClicks();
        databaseReady = false;
        persistentSyncError = explainDatabaseError(
            withDatabaseOperation(error, "saving both lifetime and weekly click totals")
        );
        if (syncElement) syncElement.textContent = persistentSyncError;
        queueOnlineReconnect();
    }
    finally {
        saving = false;

        if (pendingClicks > 0 && databaseReady) {
            setTimeout(function () {
                savePendingClicks();
            }, 100);
        }
    }
}


/* ============================================================
   ============================================================
                     RANKING SEMANAL COMPLETO/* ============================================================
   ============================================================
                     RANKING SEMANAL COMPLETO
   ============================================================
   ============================================================ */

function startOnlineRanking() {

    if (rankingUnsubscribe) {
        rankingUnsubscribe();
    }

    /*
       La lista base incluye a todas las personas que han usado alguna vez
       Mii Clicker. Su puntuación semanal será 0 mientras aún no hayan jugado.
       El nodo semanal contiene los puntos de la semana activa.
    */
    var lifetimePlayersSnapshot = null;
    var weeklyPlayersSnapshot = null;

    function renderMergedRanking() {
        if (!lifetimePlayersSnapshot || !weeklyPlayersSnapshot) {
            return;
        }

        var weeklyData = weeklyPlayersSnapshot.val() || {};
        var seen = {};
        var players = [];

        lifetimePlayersSnapshot.forEach(function (childSnapshot) {
            var lifetimeData = childSnapshot.val() || {};
            var uid = childSnapshot.key;
            var weeklyPlayer = weeklyData[uid] || {};
            var resolvedPNID = resolveRankingPNID(weeklyPlayer, lifetimeData, uid);
            var player = {
                uid: uid,
                pnid: resolvedPNID || "Unknown",
                clicks: Number(weeklyPlayer.clicks || 0)
            };
            seen[uid] = true;
            players.push(player);
        });

        /* Conserva también cualquier registro semanal sin ficha histórica. */
        Object.keys(weeklyData).forEach(function (uid) {
            if (seen[uid]) {
                return;
            }

            var weeklyPlayer = weeklyData[uid] || {};
            var resolvedPNID = resolveRankingPNID(weeklyPlayer, {}, uid);
            var player = {
                uid: uid,
                pnid: resolvedPNID || "Unknown",
                clicks: Number(weeklyPlayer.clicks || 0)
            };
            players.push(player);
        });

        players.sort(function (a, b) {
            if (b.clicks !== a.clicks) {
                return b.clicks - a.clicks;
            }

            return String(a.pnid).localeCompare(String(b.pnid));
        });

        renderLeaderboard(players);
        updatePlayerRank(players);
    }

    function showRankingError(error, operation) {
        persistentSyncError = explainDatabaseError(error, operation);
        console.error("[Mii Clicker] Leaderboard read failed during " + operation + ":", error);

        if (rankElement && !databaseReady) {
            rankElement.textContent = "Leaderboard unavailable";
        }
        if (statusElement) statusElement.textContent = /permission_denied|permission-denied/i.test(String(error && (error.code + " " + error.message)))
            ? "ONLINE · READ RULES ERROR"
            : "ONLINE · READ ERROR";
        if (syncElement) {
            syncElement.textContent = persistentSyncError;
        }

        if (leaderboardListElement) {
            leaderboardListElement.setAttribute("aria-busy", "false");
            leaderboardListElement.innerHTML =
                '<div class="mii-clicker-leaderboard-empty">' +
                "Weekly ranking could not load: " +
                operation.replace(/</g, "&lt;").replace(/>/g, "&gt;") +
                ". Check the Firebase rules and browser console." +
                '</div>';
        }
    }

    var stopLifetimeListener = onValue(
        ref(miiClickerDB, "mii_clicker"),
        function (snapshot) {
            lifetimePlayersSnapshot = snapshot;
            renderMergedRanking();
        },
        function (error) { showRankingError(error, "reading mii_clicker (lifetime player list)"); }
    );

    var stopWeeklyListener = onValue(
        ref(miiClickerDB, "mii_clicker_weekly/" + currentWeekKey),
        function (snapshot) {
            weeklyPlayersSnapshot = snapshot;
            renderMergedRanking();
        },
        function (error) { showRankingError(error, "reading mii_clicker_weekly/" + currentWeekKey); }
    );

    rankingUnsubscribe = function () {
        stopLifetimeListener();
        stopWeeklyListener();
    };
}



/* ============================================================
   RENDER DEL PODIO + PUESTOS 4 HASTA EL ÚLTIMO
   ============================================================ */

function renderLeaderboard(players) {

    renderRank(1, players[0]);
    renderRank(2, players[1]);
    renderRank(3, players[2]);

    /* The dedicated page gets a larger, happy-expression render for the top three. */
    renderWeeklyPodium(players);

    /* The full ranking still lists every participant, including the podium. */
    renderRemainingPlayers(players);

    if (rankingCountElement) {
        rankingCountElement.textContent = players.length
            + (players.length === 1 ? " player this week" : " players this week");
    }
}


function renderWeeklyPodium(players) {
    var places = [1, 2, 3];

    places.forEach(function (position) {
        var card = document.getElementById("weekly-ranking-podium-" + position);
        if (!card) {
            return;
        }

        var player = players[position - 1] || null;
        var avatar = card.querySelector(".weekly-ranking-podium-avatar");
        var name = card.querySelector(".weekly-ranking-podium-name");
        var score = card.querySelector(".weekly-ranking-podium-score");

        card.removeAttribute("data-player-uid");

        if (!player) {
            if (avatar) {
                avatar.innerHTML = "";
                avatar.style.backgroundImage = "url('img/games/Dummy_mii_user.png')";
                avatar.removeAttribute("data-mii-render");
            }
            if (name) name.textContent = "Waiting for player";
            if (score) score.textContent = "No score yet";
            card.classList.add("is-empty");
            return;
        }

        card.classList.remove("is-empty");
        card.setAttribute("data-player-uid", player.uid || "");

        if (avatar) {
            /* High-resolution portrait + native FFL happy expression. */
            var podiumImage = attachPlayerMiiRender(avatar, player, 600, "face", "happy");
            if (podiumImage) {
                podiumImage.loading = "eager";
            }
            avatar.setAttribute("aria-label", "Happy Mii for " + (getValidPlayerPNID(player.pnid) || "weekly podium player"));
        }

        if (name) {
            name.textContent = getValidPlayerPNID(player.pnid) || "Unknown PNID";
        }
        if (score) {
            score.textContent = formatNumber(player.clicks) + " clicks";
        }
    });
}


function renderRemainingPlayers(players) {

    if (!leaderboardListElement) {
        return;
    }

    leaderboardListElement.innerHTML = "";
    leaderboardListElement.setAttribute("aria-busy", "false");

    if (!players.length) {
        var empty = document.createElement("div");
        empty.className = "mii-clicker-leaderboard-empty";
        empty.textContent = "No weekly participants yet. Be the first to enter the ranking!";
        leaderboardListElement.appendChild(empty);
        return;
    }

    players.forEach(function (player, index) {
        var position = index + 1;
        var row = document.createElement("div");
        row.className = "mii-clicker-rank-row";
        if (position === 1) row.className += " mii-clicker-rank-row-first";
        else if (position === 2) row.className += " mii-clicker-rank-row-second";
        else if (position === 3) row.className += " mii-clicker-rank-row-third";
        row.setAttribute("data-player-uid", player.uid || "");

        var place = document.createElement("div");
        place.className = "mii-clicker-rank-row-place";
        place.textContent = "#" + position;

        var avatar = document.createElement("div");
        avatar.className = "mii-clicker-rank-row-avatar";
        attachPlayerMiiRender(avatar, player, 120, "face");

        var identity = document.createElement("div");
        identity.className = "mii-clicker-rank-row-identity";

        var name = document.createElement("strong");
        name.className = "mii-clicker-rank-row-pnid";
        name.textContent = getValidPlayerPNID(player.pnid) || "Unknown PNID";

        var caption = document.createElement("span");
        caption.className = "mii-clicker-rank-row-caption";
        caption.textContent = "This week's score";

        identity.appendChild(name);
        identity.appendChild(caption);

        var score = document.createElement("div");
        score.className = "mii-clicker-rank-row-score";
        score.textContent = formatNumber(player.clicks) + " clicks";

        row.appendChild(place);
        row.appendChild(avatar);
        row.appendChild(identity);
        row.appendChild(score);

        leaderboardListElement.appendChild(row);
    });
}



/* ============================================================
   RENDER DE UNA POSICIÓN
   ============================================================ */

function renderRank(
    position,
    player
) {


    var card =
        document.getElementById(

            "mii-clicker-place-"
            +
            position

        );


    if (
        !card
    ) {


        return;

    }



    var avatarElement =
        card.querySelector(
            ".mii-clicker-place-avatar"
        );


    var rankPNID =
        card.querySelector(
            ".mii-clicker-place-pnid"
        );


    var rankScore =
        card.querySelector(
            ".mii-clicker-place-score"
        );



    /* ========================================================
       POSICIÓN VACÍA
       ======================================================== */

    if (
        !player
    ) {


        avatarElement.innerHTML = "";
        avatarElement.style.backgroundImage =
            "url('img/games/Dummy_mii_user.png')";
        avatarElement.removeAttribute("data-mii-render");
        card.removeAttribute("data-player-uid");

        rankPNID.textContent =
            "---";


        rankScore.textContent =
            "0 clicks";


        return;

    }



    /* ========================================================
       MII DEL TOP

       The Mii image and weekly score come from the same player UID.
       No badge data is generated by the renderer.
       ======================================================== */

    card.setAttribute("data-player-uid", player.uid || "");
    attachPlayerMiiRender(avatarElement, player, 270, "face");

    rankPNID.textContent =
        getValidPlayerPNID(player.pnid) || "Unknown PNID";



    rankScore.textContent =

        formatNumber(
            player.clicks
        )

        +

        " clicks";

}



/* ============================================================
   TU POSICIÓN
   ============================================================ */

function updatePlayerRank(
    players
) {


    if (
        !firebaseUser
    ) {


        return;

    }



    var position = -1;

    for (var i = 0; i < players.length; i++) {
        if (players[i].uid === firebaseUser.uid) {
            position = i + 1;
            break;
        }
    }

    if (position !== -1) {
        rankElement.textContent = "#" + position + " of " + players.length;
    }
    else {
        rankElement.textContent = "Not ranked yet";
    }

}



/* ============================================================
   EVENTO DEL BOTÓN
   ============================================================ */

clickButton.addEventListener(

    "click",

    registerClick

);



/* ============================================================
   FIREBASE AUTH
   ============================================================ */

onAuthStateChanged(
    miiClickerAuth,
    async function (user) {
        if (!user) {
            firebaseUser = null;
            playerPNID = "";
            databaseReady = false;
            pendingClicks = 0;

            if (clickButton) clickButton.disabled = true;
            if (pnidElement) pnidElement.textContent = "No authenticated user";
            if (rankElement) rankElement.textContent = "Sign in first";
            localScore = 0;
            updateScoreUI();
            if (syncElement) syncElement.textContent = "Firebase login required.";
            return;
        }

        firebaseUser = user;
        playerPNID = getSessionPNID(user);

        if (!playerPNID) {
            databaseReady = false;
            if (clickButton) clickButton.disabled = true;
            if (pnidElement) pnidElement.textContent = "PNID unavailable";
            if (syncElement) syncElement.textContent = "Your account PNID could not be resolved.";
            return;
        }

        if (pnidElement) pnidElement.textContent = playerPNID;
        loadPlayerMii();

        pendingClicks = readPendingClicks(user.uid);
        localScore = Math.max(restoreLocalScore(user.uid), pendingClicks);
        updateScoreUI();

        /* Habilita el juego al confirmar la sesión. Firebase puede terminar
           de conectar después; las pulsaciones quedan en una cola local. */
        if (clickButton) clickButton.disabled = false;
        if (databaseConnected) {
            if (syncElement) syncElement.textContent = "Ready — connecting to weekly leaderboard...";
            await connectOnlinePlayer();
        }
        else {
            if (rankElement) rankElement.textContent = "Connecting...";
            if (syncElement) {
                syncElement.textContent = "Waiting for Firebase Realtime Database to report an online connection. Local clicks are saved on this device.";
            }
        }
    }
);



/* ============================================================
   INTENTAR GUARDAR SI SE OCULTA LA PÁGINA
   ============================================================ */

document.addEventListener(

    "visibilitychange",

    function () {


        if (
            document.hidden
            &&
            pendingClicks > 0
        ) {


            savePendingClicks();

        }

    }

);



/* ============================================================
   CAMBIAR MENÚ:

       messages
          ↓
       Mii Clicker

   conmutarPortal(6, ...)
   SIGUE IGUAL.
   ============================================================ */

var sidebarLabel =
    document.querySelector(
        "#global-menu-message .label"
    );


if (
    sidebarLabel
) {


    sidebarLabel.textContent =
        "Mii Clicker";

}
