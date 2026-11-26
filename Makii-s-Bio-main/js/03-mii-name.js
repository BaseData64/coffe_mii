/* ============================================================
   MAKI'S BIO V23 — extracted from index.html
   Original inline script #03
   Mode: classic script
   ============================================================ */

/* ============================================================
   NOMBRE EXACTO DEL MII
   ============================================================ */

function mostrarNombreMiiExacto(nombre) {

    var elemento =
        document.getElementById(
            'nombre-mii-post'
        );


    if (!elemento) {
        return;
    }


    if (
        nombre === null
        ||
        typeof nombre === 'undefined'
    ) {

        elemento.textContent =
            'dummy';

        return;
    }


    /*
       NO trim()
       NO normalize()
       NO replace()
    */

    elemento.textContent =
        String(nombre);


    ajustarNombreMii();

}



/* ============================================================
   AJUSTAR NOMBRE
   ============================================================ */

function ajustarNombreMii() {

    var elemento =
        document.getElementById(
            'nombre-mii-post'
        );


    if (!elemento) {
        return;
    }


    var size = 23;


    elemento.style.fontSize =
        size + 'px';


    while (
        elemento.scrollWidth >
        elemento.clientWidth
        &&
        size > 14
    ) {

        size--;

        elemento.style.fontSize =
            size + 'px';

    }

}



/* ============================================================
   OBSERVER PARA DUMMY
   ============================================================ */

(function prepararObserverNombreMii() {

    var elemento =
        document.getElementById(
            'nombre-mii-post'
        );


    if (!elemento) {
        return;
    }


    if (
        typeof MutationObserver !==
        'undefined'
    ) {

        var observer =
            new MutationObserver(

                function() {

                    ajustarNombreMii();

                }

            );


        observer.observe(

            elemento,

            {
                childList: true,
                characterData: true,
                subtree: true
            }

        );

    }

})();



/* ============================================================
   ABRIR GENERAL CHAT
   ============================================================ */

function abrirModalPostGeneral() {

    var modal =
        document.getElementById(
            'modal-crear-post'
        );


    if (!modal) {
        return;
    }


    modal.style.display =
        'flex';


    document.body.style.overflow =
        'hidden';


    var pnid =
        localStorage.getItem(
            'makiiverse_pnid'
        )
        ||
        'Makii';


    var nnid =
        document.getElementById(
            'nnid-mii-post'
        );


    if (nnid) {

        nnid.textContent =
            pnid;

    }


    /* DUMMY EN TURNO 🗿 */

    mostrarNombreMiiExacto(
        'dummy'
    );


    /* AVATAR */

    if (
        typeof actualizarAvatarModal ===
        'function'
    ) {

        actualizarAvatarModal(

            pnid,

            typeof expresionActual !==
            'undefined'

                ?

                expresionActual

                :

                'normal'

        );

    }


    /* NOMBRE REAL */

    if (
        typeof window.cargarNombreRealMii ===
        'function'
    ) {

        window.cargarNombreRealMii(
            pnid
        );

    }


    sincronizarSelectorEmocion();


    /*
       FOCUS ORIGINAL
    */

    if (
        typeof modoActual ===
        'undefined'
        ||
        modoActual ===
        'texto'
    ) {

        var textarea =
            document.getElementById(
                'texto-nuevo-post'
            );


        if (textarea) {

            setTimeout(

                function() {

                    textarea.focus();

                },

                25

            );

        }

    }


    else {

        var canvas =
            document.getElementById(
                'canvas-post'
            );


        if (canvas) {

            var rect =
                canvas.getBoundingClientRect();


            if (
                canvas.width !==
                Math.round(rect.width)
                ||
                canvas.height !==
                Math.round(rect.height)
            ) {

                canvas.width =
                    Math.round(
                        rect.width
                    );


                canvas.height =
                    Math.round(
                        rect.height
                    );

            }

        }

    }

}



/* ============================================================
   ABRIR CON PNID
   ============================================================ */

function abrirModalCrearPost(pnidUsuario) {

    if (!pnidUsuario) {

        alert(
            'No hay sesión activa.'
        );

        window.location.href =
            'login.html';

        return;
    }


    var modal =
        document.getElementById(
            'modal-crear-post'
        );


    if (!modal) {
        return;
    }


    modal.style.display =
        'flex';


    document.body.style.overflow =
        'hidden';


    var nnid =
        document.getElementById(
            'nnid-mii-post'
        );


    if (nnid) {

        nnid.textContent =
            pnidUsuario;

    }


    mostrarNombreMiiExacto(
        'dummy'
    );


    if (
        typeof actualizarAvatarModal ===
        'function'
    ) {

        actualizarAvatarModal(

            pnidUsuario,

            typeof expresionActual !==
            'undefined'

                ?

                expresionActual

                :

                'normal'

        );

    }


    if (
        typeof window.cargarNombreRealMii ===
        'function'
    ) {

        window.cargarNombreRealMii(
            pnidUsuario
        );

    }


    sincronizarSelectorEmocion();

}



/* ============================================================
   ABRIR / CERRAR REACCIONES
   ============================================================ */

function toggleBurbujaEmociones() {

    var burbuja =
        document.getElementById(
            'burbuja-emociones'
        );


    if (!burbuja) {
        return;
    }


    if (
        burbuja.style.display ===
        'block'
    ) {

        burbuja.style.display =
            'none';

        return;
    }


    sincronizarSelectorEmocion();


    burbuja.style.display =
        'block';

}



/* ============================================================
   SINCRONIZAR REACCIÓN
   ============================================================ */

function sincronizarSelectorEmocion() {

    var expresion =

        typeof expresionActual !==
        'undefined'

        ?

        expresionActual

        :

        'normal';


    var botones =
        document.querySelectorAll(
            '#burbuja-emociones .emocion-btn'
        );


    for (
        var i = 0;
        i < botones.length;
        i++
    ) {

        botones[i].classList.remove(
            'emocion-seleccionada'
        );


        if (
            botones[i].getAttribute(
                'data-exp'
            )
            ===
            expresion
        ) {

            botones[i].classList.add(
                'emocion-seleccionada'
            );

        }

    }

}



/* ============================================================
   SELECCIONAR REACCIÓN

   AHORA SOLO CAMBIAMOS EL COLOR DEL GLIFO.
   ============================================================ */

function seleccionarEmocion(elemento) {

    if (!elemento) {
        return;
    }


    var expresion =
        elemento.getAttribute(
            'data-exp'
        );


    /* GUARDAR EXPRESIÓN */

    if (
        typeof expresionActual !==
        'undefined'
    ) {

        expresionActual =
            expresion;

    }


    else {

        window.expresionActual =
            expresion;

    }


    /* APAGAR TODAS */

    var botones =
        document.querySelectorAll(
            '#burbuja-emociones .emocion-btn'
        );


    for (
        var i = 0;
        i < botones.length;
        i++
    ) {

        botones[i].classList.remove(
            'emocion-seleccionada'
        );

    }


    /* PRENDER LA SELECCIONADA */

    elemento.classList.add(
        'emocion-seleccionada'
    );


    /* ACTUALIZAR MII */

    var pnid =
        localStorage.getItem(
            'makiiverse_pnid'
        );


    if (
        pnid
        &&
        typeof actualizarAvatarModal ===
        'function'
    ) {

        actualizarAvatarModal(
            pnid,
            expresion
        );

    }


    /*
       Dejamos 300 ms para alcanzar
       a ver la iluminación.
    */

    setTimeout(

        function() {

            var burbuja =
                document.getElementById(
                    'burbuja-emociones'
                );


            if (burbuja) {

                burbuja.style.display =
                    'none';

            }

        },

        300

    );

}



/* ============================================================
   CLICK FUERA
   ============================================================ */

document.addEventListener(

    'click',

    function(evento) {

        var burbuja =
            document.getElementById(
                'burbuja-emociones'
            );


        var boton =
            document.getElementById(
                'boton-emociones-post'
            );


        if (
            !burbuja
            ||
            !boton
        ) {
            return;
        }


        if (
            burbuja.style.display ===
            'block'

            &&

            !burbuja.contains(
                evento.target
            )

            &&

            !boton.contains(
                evento.target
            )
        ) {

            burbuja.style.display =
                'none';

        }

    }

);
