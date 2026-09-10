/* ============================================================
   MAKI'S BIO V29 — NAVIGATION HISTORY FIX
   ============================================================ */

/*
 * Historial interno real.
 *
 * Antes solo se guardaba:
 *     { irA, idBoton }
 *
 * Ahora User Page también puede guardar:
 *     { irA: 5, idBoton, publicId }
 *
 * Así:
 * Chat -> Perfil A -> Perfil B -> Back
 * vuelve:
 * Perfil A -> Chat
 * exactamente en ese orden.
 */
var historialNavegacion = [
    {
        irA: 0,
        idBoton: "global-menu-community",
        publicId: ""
    }
];

var enSubportal = false;


/* ============================================================
   HELPERS
   ============================================================ */

function normalizarEntradaNavegacion(
    irA,
    idBoton,
    publicId
) {
    return {
        irA: Number(irA),
        idBoton:
            idBoton || null,
        publicId:
            Number(irA) === 5
                ? String(publicId || "")
                : ""
    };
}


function mismaEntradaNavegacion(
    a,
    b
) {
    if (!a || !b) {
        return false;
    }

    return (
        Number(a.irA) === Number(b.irA) &&
        String(a.publicId || "") ===
        String(b.publicId || "")
    );
}


/* ============================================================
   CAMBIAR VISTA
   ============================================================ */

function conmutarPortal(
    irA,
    idBoton,
    esRetroceso = false,
    publicId = ""
) {
    irA = Number(irA);

    var nuevaEntrada =
        normalizarEntradaNavegacion(
            irA,
            idBoton,
            publicId
        );


    /* ========================================================
       GUARDAR HISTORIAL
       ======================================================== */

    if (!esRetroceso) {
        var actual =
            historialNavegacion[
                historialNavegacion.length - 1
            ];

        if (
            !mismaEntradaNavegacion(
                actual,
                nuevaEntrada
            )
        ) {
            historialNavegacion.push(
                nuevaEntrada
            );
        }
    }


    /* ========================================================
       SELECCIÓN SIDEBAR
       ======================================================== */

    document
        .querySelectorAll(
            ".card"
        )
        .forEach(
            function(b) {
                b.classList.remove(
                    "selected"
                );
            }
        );

    if (idBoton) {
        var boton =
            document.getElementById(
                idBoton
            );

        if (boton) {
            boton.classList.add(
                "selected"
            );
        }
    }


    /* ========================================================
       OCULTAR VISTAS
       ======================================================== */

    var vistas = [
        "vista-perfil",
        "vista-juegos",
        "vista-proyectos",
        "vista-sobremi",
        "vista-networks",
        "vista-userpage",
        "vista-messages",
        "vista-quepasara"
    ];

    vistas.forEach(
        function(id) {
            var v =
                document.getElementById(
                    id
                );

            if (v) {
                v.style.display =
                    "none";
            }
        }
    );


    /* ========================================================
       MOSTRAR DESTINO
       ======================================================== */

    var mapaVistas = {
        0: "vista-perfil",
        1: "vista-juegos",
        2: "vista-proyectos",
        3: "vista-sobremi",
        4: "vista-networks",
        5: "vista-userpage",
        6: "vista-messages",
        7: "vista-quepasara"
    };

    var destino =
        document.getElementById(
            mapaVistas[irA] ||
            "vista-perfil"
        );

    if (destino) {
        destino.style.display =
            "block";
    }


    /* ========================================================
       URL DE PUBLIC PROFILE
       ======================================================== */

    if (
        irA !== 5 &&
        window.MakiPublicProfiles &&
        typeof window.MakiPublicProfiles
            .syncRouteAfterPortal ===
            "function"
    ) {
        /*
         * Cuando Back está retrocediendo, reemplazamos la ruta
         * en lugar de crear otra entrada del navegador.
         */
        window.MakiPublicProfiles
            .syncRouteAfterPortal(
                irA,
                Boolean(esRetroceso)
            );
    }


    actualizarBotonNavegacion();
}


/* ============================================================
   BACK / CLOSE VISUAL
   ============================================================ */

function actualizarBotonNavegacion() {
    enSubportal =
        historialNavegacion.length > 1;

    var btnNav =
        document.getElementById(
            "boton-navegacion-miiverse"
        );

    var navIcono =
        document.getElementById(
            "nav-icono-wiiu"
        );

    var navTexto =
        document.getElementById(
            "nav-texto-wiiu"
        );


    if (enSubportal) {
        if (btnNav) {
            btnNav.style.setProperty(
                "background-color",
                "#ffffff",
                "important"
            );

            btnNav.style.setProperty(
                "box-shadow",
                "0 10px 20px rgb(201, 201, 201)",
                "important"
            );
        }

        if (navIcono) {
            navIcono.style.fontFamily =
                "'MiiverseIcons'";

            navIcono.style.fontSize =
                "68px";

            navIcono.style.color =
                "#999999";

            navIcono.style.marginTop =
                "-20px";

            navIcono.style.marginLeft =
                "-2px";

            navIcono.innerText =
                "b";
        }

        if (navTexto) {
            navTexto.style.color =
                "#6b6969";

            navTexto.style.marginTop =
                "10px";

            navTexto.innerText =
                "Back";
        }
    }

    else {
        if (btnNav) {
            btnNav.style.setProperty(
                "background-color",
                "#3d3d3d",
                "important"
            );

            btnNav.style.setProperty(
                "box-shadow",
                "0 12px 25px rgba(163, 161, 161, 0.5)",
                "important"
            );
        }

        if (navIcono) {
            navIcono.style.fontFamily =
                "inherit";

            navIcono.style.fontSize =
                "24px";

            navIcono.style.color =
                "#777777";

            navIcono.style.marginTop =
                "0px";

            navIcono.style.marginLeft =
                "0px";

            navIcono.innerText =
                "";
        }

        if (navTexto) {
            navTexto.style.color =
                "#cccccc";

            navTexto.style.marginTop =
                "-20px";

            navTexto.innerText =
                "Close";
        }
    }
}


/* ============================================================
   BOTÓN BACK
   ============================================================ */

async function manejadorNavegacionFija() {

    if (
        historialNavegacion.length <= 1
    ) {
        window.close();
        return;
    }


    /*
     * Quitamos la página ACTUAL.
     */
    historialNavegacion.pop();


    /*
     * La que ahora queda arriba es EXACTAMENTE
     * la página visitada anteriormente.
     */
    var anterior =
        historialNavegacion[
            historialNavegacion.length - 1
        ];


    /*
     * Si era un perfil específico, hay que volver
     * a cargar ESE publicId y no solo "User Page".
     */
    if (
        Number(anterior.irA) === 5 &&
        anterior.publicId &&
        window.MakiPublicProfiles &&
        typeof window.MakiPublicProfiles
            .openFromNavigationHistory ===
            "function"
    ) {
        await window.MakiPublicProfiles
            .openFromNavigationHistory(
                anterior.publicId
            );

        actualizarBotonNavegacion();
        return;
    }


    /*
     * Cualquier otra comunidad/vista.
     */
    conmutarPortal(
        anterior.irA,
        anterior.idBoton,
        true,
        anterior.publicId || ""
    );
}


/* API explícita para otros módulos */
window.conmutarPortal =
    conmutarPortal;

window.manejadorNavegacionFija =
    manejadorNavegacionFija;

window.MakiNavigationHistory = {
    get:
        function() {
            return historialNavegacion.slice();
        },

    refreshButton:
        actualizarBotonNavegacion
};
