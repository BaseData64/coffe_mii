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
    query,
    orderByChild,
    limitToLast,
    runTransaction,
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



/* ============================================================
   ESTADO
   ============================================================ */

let firebaseUser =
    null;


let playerPNID =
    "";


let playerReference =
    null;


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


onValue(

    ref(
        miiClickerDB,
        ".info/connected"
    ),

    function (
        snapshot
    ) {


        if (
            snapshot.val() === true
        ) {


            statusElement.textContent =
                "ONLINE";

        }


        else {


            statusElement.textContent =
                "OFFLINE";

        }

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


    var miiURL =

        "https://mii-unsecure.ariankordi.net/miis/image.png"

        +

        "?nnid="

        +

        encodeURIComponent(
            playerPNID
        )

        +

        "&type=all_body"

        +

        "&width=270"

        +

        "&api_id=1";



    miiImage.src =
        miiURL;



    miiImage.onerror =
        function () {


            miiImage.onerror =
                null;


            miiImage.src =
                "img/games/Dummy_mii_user.png";

        };

}



/* ============================================================
   CREAR / CARGAR JUGADOR ONLINE
   ============================================================ */

async function loadOnlinePlayer() {


    playerReference =
        ref(

            miiClickerDB,

            "mii_clicker/"
            +
            firebaseUser.uid

        );



    var snapshot =
        await get(
            playerReference
        );



    /* ========================================================
       NUEVO JUGADOR
       ======================================================== */

    if (
        !snapshot.exists()
    ) {


        localScore =
            0;



        await set(

            playerReference,

            {

                uid:
                    firebaseUser.uid,

                pnid:
                    playerPNID,

                clicks:
                    0,

                updatedAt:
                    serverTimestamp()

            }

        );

    }



    /* ========================================================
       JUGADOR EXISTENTE
       ======================================================== */

    else {


        var data =
            snapshot.val()
            ||
            {};


        localScore =
            Number(
                data.clicks || 0
            );



        /*
           Sin tocar los clicks,
           actualizamos solamente datos de cuenta.
        */

        await update(

            playerReference,

            {

                uid:
                    firebaseUser.uid,

                pnid:
                    playerPNID,

                updatedAt:
                    serverTimestamp()

            }

        );

    }



    updateScoreUI();



    clickButton.disabled =
        false;



    syncElement.textContent =
        "Score synced.";



    listenPlayerScore();

}



/* ============================================================
   ESCUCHAR SCORE PROPIO
   ============================================================ */

function listenPlayerScore() {


    if (
        playerUnsubscribe
    ) {


        playerUnsubscribe();

    }



    playerUnsubscribe =
        onValue(

            playerReference,

            function (
                snapshot
            ) {


                if (
                    !snapshot.exists()
                ) {


                    return;

                }



                var data =
                    snapshot.val()
                    ||
                    {};


                var remoteScore =
                    Number(
                        data.clicks || 0
                    );



                /*
                   Si no tenemos clicks esperando
                   sincronización, usamos el valor
                   exacto del servidor.
                */

                if (
                    pendingClicks === 0
                    &&
                    saving === false
                ) {


                    localScore =
                        remoteScore;


                    updateScoreUI();

                }

            },

            function (
                error
            ) {


                console.error(
                    "[Mii Clicker] Error leyendo score:",
                    error
                );

            }

        );

}



/* ============================================================
   ACTUALIZAR SCORE VISUAL
   ============================================================ */

function updateScoreUI() {


    scoreElement.textContent =
        formatNumber(
            localScore
        );

}



/* ============================================================
   CLICK
   ============================================================ */

function registerClick() {


    if (
        !firebaseUser
        ||
        !playerReference
        ||
        clickButton.disabled
    ) {


        return;

    }



    localScore =
        localScore + 1;


    pendingClicks =
        pendingClicks + 1;



    updateScoreUI();


    animateButton();


    animatePlusOne();


    scheduleSave();

}



/* ============================================================
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


    syncElement.textContent =
        "Saving online...";



    /*
       Si llegamos a 10 clicks pendientes,
       sincronizamos inmediatamente.
    */

    if (
        pendingClicks >=
        CLICK_BATCH
    ) {


        savePendingClicks();


        return;

    }



    /*
       Si ya existe un timer,
       esperamos ese.
    */

    if (
        saveTimer
    ) {


        return;

    }



    saveTimer =
        setTimeout(

            function () {


                saveTimer =
                    null;


                savePendingClicks();

            },

            SAVE_DELAY

        );

}



/* ============================================================
   GUARDAR CLICKS ONLINE

   runTransaction evita sobrescribir scores.
   ============================================================ */

async function savePendingClicks() {


    if (
        saving
        ||
        pendingClicks <= 0
        ||
        !firebaseUser
        ||
        !playerReference
    ) {


        return;

    }



    saving =
        true;



    var amount =
        Math.min(
            pendingClicks,
            CLICK_BATCH
        );



    pendingClicks -=
        amount;



    var clicksReference =
        ref(

            miiClickerDB,

            "mii_clicker/"
            +
            firebaseUser.uid
            +
            "/clicks"

        );



    try {


        await runTransaction(

            clicksReference,

            function (
                currentValue
            ) {


                var current =
                    Number(
                        currentValue || 0
                    );


                return current
                    +
                    amount;

            }

        );



        await update(

            playerReference,

            {

                uid:
                    firebaseUser.uid,

                pnid:
                    playerPNID,

                updatedAt:
                    serverTimestamp()

            }

        );



        syncElement.textContent =
            "Score synced.";

    }



    catch (
        error
    ) {


        console.error(
            "[Mii Clicker] Error guardando score:",
            error
        );



        /*
           Devolvemos los clicks al buffer
           si hubo error.
        */

        pendingClicks +=
            amount;



        syncElement.textContent =
            "Sync error — retrying...";



        setTimeout(

            function () {


                scheduleSave();

            },

            1500

        );

    }



    finally {


        saving =
            false;



        /*
           Si hizo más clicks durante el guardado,
           mandamos el siguiente grupo.
        */

        if (
            pendingClicks > 0
        ) {


            setTimeout(

                function () {


                    savePendingClicks();

                },

                80

            );

        }

    }

}



/* ============================================================
   ============================================================
                     RANKING GLOBAL ONLINE
   ============================================================
   ============================================================ */

function startOnlineRanking() {


    if (
        rankingUnsubscribe
    ) {


        rankingUnsubscribe();

    }



    /*
       Realtime Database ordena ascendente.

       limitToLast(3)
       obtiene los 3 valores de clicks más altos.
    */

    var leaderboardQuery =
        query(

            ref(
                miiClickerDB,
                "mii_clicker"
            ),

            orderByChild(
                "clicks"
            ),

            limitToLast(
                3
            )

        );



    rankingUnsubscribe =
        onValue(

            leaderboardQuery,

            function (
                snapshot
            ) {


                var players =
                    [];



                snapshot.forEach(

                    function (
                        childSnapshot
                    ) {


                        var data =
                            childSnapshot.val()
                            ||
                            {};


                        players.push({

                            uid:
                                childSnapshot.key,

                            pnid:
                                data.pnid
                                ||
                                "Unknown",

                            clicks:
                                Number(
                                    data.clicks || 0
                                )

                        });

                    }

                );



                /*
                   Ordenamos:
                   mayor score primero.
                */

                players.sort(

                    function (
                        a,
                        b
                    ) {


                        if (
                            b.clicks !==
                            a.clicks
                        ) {


                            return b.clicks
                                -
                                a.clicks;

                        }



                        /*
                           Desempate por PNID.
                        */

                        return String(
                            a.pnid
                        ).localeCompare(
                            String(
                                b.pnid
                            )
                        );

                    }

                );



                renderLeaderboard(
                    players
                );


                updatePlayerRank(
                    players
                );

            },



            function (
                error
            ) {


                console.error(
                    "[Mii Clicker] Error del ranking:",
                    error
                );


                rankElement.textContent =
                    "Unavailable";

            }

        );

}



/* ============================================================
   RENDER DEL TOP 3
   ============================================================ */

function renderLeaderboard(
    players
) {


    renderRank(
        1,
        players[0]
    );


    renderRank(
        2,
        players[1]
    );


    renderRank(
        3,
        players[2]
    );

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


        avatarElement.style.backgroundImage =
            "url('img/games/Dummy_mii_user.png')";


        rankPNID.textContent =
            "---";


        rankScore.textContent =
            "0 clicks";


        return;

    }



    /* ========================================================
       MII DEL TOP

       FACE porque el espacio es pequeño.

       NO SE GENERA NINGUNA INSIGNIA.
       ======================================================== */

    var miiURL =

        "https://mii-unsecure.ariankordi.net/miis/image.png"

        +

        "?nnid="

        +

        encodeURIComponent(
            player.pnid
        )

        +

        "&type=face"

        +

        "&width=270"

        +

        "&api_id=1";



    avatarElement.innerHTML =
        "";


    avatarElement.style.backgroundImage =
        "url('" + miiURL + "')";



    rankPNID.textContent =
        player.pnid;



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
    top3
) {


    if (
        !firebaseUser
    ) {


        return;

    }



    var position =
        -1;



    for (
        var i = 0;
        i < top3.length;
        i++
    ) {


        if (
            top3[i].uid ===
            firebaseUser.uid
        ) {


            position =
                i + 1;


            break;

        }

    }



    if (
        position === 1
    ) {


        rankElement.textContent =
            "1st";

    }


    else if (
        position === 2
    ) {


        rankElement.textContent =
            "2nd";

    }


    else if (
        position === 3
    ) {


        rankElement.textContent =
            "3rd";

    }


    else {


        rankElement.textContent =
            "Not in Top 3";

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

    async function (
        user
    ) {


        /* ====================================================
           NO HAY SESIÓN
           ==================================================== */

        if (
            !user
        ) {


            firebaseUser =
                null;


            clickButton.disabled =
                true;


            pnidElement.textContent =
                "No authenticated user";


            rankElement.textContent =
                "Sign in first";


            syncElement.textContent =
                "Firebase login required.";


            return;

        }



        /* ====================================================
           USUARIO AUTENTICADO
           ==================================================== */

        firebaseUser =
            user;



        playerPNID =
            getSessionPNID(
                user
            );



        if (
            !playerPNID
        ) {


            clickButton.disabled =
                true;


            pnidElement.textContent =
                "PNID unavailable";


            return;

        }



        /* ====================================================
           MOSTRAR PNID
           ==================================================== */

        pnidElement.textContent =
            playerPNID;



        /* ====================================================
           RENDER MII
           ==================================================== */

        loadPlayerMii();



        /* ====================================================
           CONEXIÓN ONLINE
           ==================================================== */

        try {


            syncElement.textContent =
                "Loading online score...";



            await loadOnlinePlayer();



            startOnlineRanking();



            console.log(
                "[Mii Clicker] ONLINE - Realtime Database connected."
            );

        }



        catch (
            error
        ) {


            console.error(
                "[Mii Clicker] Connection error:",
                error
            );



            clickButton.disabled =
                true;


            rankElement.textContent =
                "Unavailable";


            syncElement.textContent =
                "Could not connect to Realtime Database.";

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
