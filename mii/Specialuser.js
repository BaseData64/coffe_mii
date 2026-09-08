

(function () {

    "use strict";


    /* ========================================================
       CONFIGURACIÓN
       ======================================================== */


    /*
       PNID QUE RECIBE LA INSIGNIA.

       Lo guardamos en minúsculas únicamente
       PARA COMPARAR.

       NO cambia cómo aparece escrito tu PNID.
    */

    var CUENTAS_ESPECIALES = {

        "yosmakii99_pn": {

            role:
                "admin",

            verified:
                true,

            badge:
                "img/official-user.png"

        }

    };


    /*
       Ruta exacta que me dijiste que quieres utilizar.
    */

    var OFFICIAL_BADGE =
        "img/official-user.png";


    /*
       Clase de nuestra insignia.
    */

    var BADGE_CLASS =
        "maki-official-user-badge";


    /*
       Clase del contenedor.
    */

    var HOST_CLASS =
        "maki-official-avatar-host";



    /* ========================================================
       NORMALIZAR PNID PARA COMPARAR
       ======================================================== */

    function normalizarPNID(pnid) {


        if (
            pnid === null
            ||
            typeof pnid === "undefined"
        ) {

            return "";

        }


        return String(pnid)

            .replace(
                /^\s+|\s+$/g,
                ""
            )

            .toLowerCase();

    }



    /* ========================================================
       SABER SI EL PNID ES ESPECIAL
       ======================================================== */

    function obtenerCuentaEspecial(pnid) {


        var pnidNormalizado =
            normalizarPNID(
                pnid
            );


        if (
            CUENTAS_ESPECIALES[
                pnidNormalizado
            ]
        ) {


            return CUENTAS_ESPECIALES[
                pnidNormalizado
            ];

        }


        return null;

    }



    /* ========================================================
       EXTRAER nnid= DE UNA URL

       EJEMPLO:

       https://mii-unsecure.../image.png?
       nnid=YosMakii99_PN
       &type=face...

                  ↓

       YosMakii99_PN
       ======================================================== */

    function obtenerPNIDDeTextoURL(texto) {


        if (!texto) {

            return "";

        }


        texto =
            String(texto);


        /*
           Buscamos:

               ?nnid=xxxx
           o
               &nnid=xxxx

           y paramos antes de:
               &
               comillas
               )
               espacios
        */

        var resultado =
            texto.match(
                /[?&]nnid=([^&#"'()\s]+)/i
            );


        if (
            !resultado
            ||
            !resultado[1]
        ) {

            return "";

        }


        var pnid =
            resultado[1];


        /*
           encodeURIComponent() es utilizado
           en tu proyecto al construir la URL,
           así que aquí lo decodificamos.
        */

        try {

            pnid =
                decodeURIComponent(
                    pnid
                );

        }

        catch (error) {

            /*
               Si por alguna razón no se puede
               decodificar, conservamos el valor.
            */

        }


        return pnid;

    }



    /* ========================================================
       OBTENER PNID DEL MII

       Aquí está la parte importante.

       Entiende TANTO:

       <img src="...">

       COMO:

       <div style="background-image:url(...)">

       ======================================================== */

    function obtenerPNIDDelMii(elemento) {


        if (!elemento) {

            return "";

        }



        /* ----------------------------------------------------
           1. Si manualmente alguna vez ponemos data-pnid
           ---------------------------------------------------- */

        if (
            elemento.getAttribute
        ) {


            var dataPnid =
                elemento.getAttribute(
                    "data-pnid"
                );


            if (dataPnid) {

                return dataPnid;

            }

        }



        /* ----------------------------------------------------
           2. Si es <img>
           ---------------------------------------------------- */

        if (
            elemento.tagName
            &&
            elemento.tagName.toLowerCase() ===
            "img"
        ) {


            var src =
                elemento.currentSrc
                ||
                elemento.src
                ||
                elemento.getAttribute(
                    "src"
                )
                ||
                "";


            var pnidImg =
                obtenerPNIDDeTextoURL(
                    src
                );


            if (pnidImg) {

                return pnidImg;

            }

        }



        /* ----------------------------------------------------
           3. Si es DIV con background-image
           ---------------------------------------------------- */

        if (
            elemento.style
        ) {


            var background =
                elemento.style.backgroundImage
                ||
                "";


            var pnidBackground =
                obtenerPNIDDeTextoURL(
                    background
                );


            if (pnidBackground) {

                return pnidBackground;

            }

        }



        /* ----------------------------------------------------
           4. Buscar directamente en style=""
           ---------------------------------------------------- */

        if (
            elemento.getAttribute
        ) {


            var styleTexto =
                elemento.getAttribute(
                    "style"
                )
                ||
                "";


            var pnidStyle =
                obtenerPNIDDeTextoURL(
                    styleTexto
                );


            if (pnidStyle) {

                return pnidStyle;

            }

        }



        /* ----------------------------------------------------
           5. CASOS CONOCIDOS DE TU CUENTA ACTUAL

           Estos elementos representan al usuario
           actualmente logueado.

           Si todavía muestran Dummy mientras carga
           Ariankordi, usamos localStorage.
           ---------------------------------------------------- */

        var id =
            elemento.id
            ||
            "";


        if (

            id === "profile-mii-img"

            ||

            id === "user-sidebar-avatar"

            ||

            id === "avatar-mii-post"

        ) {


            var pnidSesion =
                localStorage.getItem(
                    "makiiverse_pnid"
                );


            if (pnidSesion) {

                return pnidSesion;

            }

        }


        return "";

    }



    /* ========================================================
       OBTENER CONTENEDOR DONDE IRÁ LA PALOMITA
       ======================================================== */

    function obtenerHostAvatar(elemento) {


        if (!elemento) {

            return null;

        }



        /*
           Caso DIV con background-image:

           el propio DIV es el avatar.
        */

        if (
            !elemento.tagName
            ||
            elemento.tagName.toLowerCase() !==
            "img"
        ) {


            return elemento;

        }



        /*
           Caso <img>.

           En tu perfil tienes:

               <div 70x70 overflow:hidden>
                   <img id="profile-mii-img">
               </div>

           Y en sidebar algo similar.

           Entonces la insignia debe insertarse
           EN EL CONTENEDOR del IMG,
           no dentro del <img> porque eso es imposible.
        */

        if (
            elemento.parentElement
        ) {


            return elemento.parentElement;

        }


        return null;

    }



    /* ========================================================
       BUSCAR NUESTRA INSIGNIA DIRECTAMENTE DENTRO DEL HOST
       ======================================================== */

    function buscarBadge(host) {


        if (!host) {

            return null;

        }


        var hijos =
            host.children;


        for (
            var i = 0;
            i < hijos.length;
            i++
        ) {


            if (
                hijos[i].classList
                &&
                hijos[i].classList.contains(
                    BADGE_CLASS
                )
            ) {


                return hijos[i];

            }

        }


        return null;

    }



    /* ========================================================
       QUITAR BADGE
       ======================================================== */

    function quitarBadge(host) {


        var badge =
            buscarBadge(
                host
            );


        if (
            badge
            &&
            badge.parentNode
        ) {


            badge.parentNode.removeChild(
                badge
            );

        }


        if (
            host
            &&
            host.removeAttribute
        ) {


            host.removeAttribute(
                "data-maki-official"
            );


            host.removeAttribute(
                "data-maki-role"
            );

        }

    }



    /* ========================================================
       APLICAR INSIGNIA A UN MII
       ======================================================== */

    function aplicarInsignia(elemento) {


        if (!elemento) {

            return;

        }



        var pnid =
            obtenerPNIDDelMii(
                elemento
            );


        if (!pnid) {

            return;

        }



        var cuenta =
            obtenerCuentaEspecial(
                pnid
            );



        var host =
            obtenerHostAvatar(
                elemento
            );


        if (!host) {

            return;

        }



        /*
           Si NO es cuenta especial,
           aseguramos que no tenga badge.
        */

        if (!cuenta) {


            quitarBadge(
                host
            );


            return;

        }



        /*
           Convertimos el contenedor
           en referencia relativa.
        */

        if (
            host.classList
        ) {


            host.classList.add(
                HOST_CLASS
            );

        }



        host.setAttribute(
            "data-maki-official",
            "true"
        );


        host.setAttribute(
            "data-maki-role",
            cuenta.role
            ||
            "verified"
        );



        /*
           ¿Ya tiene insignia?

           No creamos otra.
        */

        var badgeExistente =
            buscarBadge(
                host
            );


        if (badgeExistente) {


            badgeExistente.src =
                cuenta.badge
                ||
                OFFICIAL_BADGE;


            return;

        }



        /* ----------------------------------------------------
           CREAR INSIGNIA
           ---------------------------------------------------- */

        var badge =
            document.createElement(
                "img"
            );


        badge.src =
            cuenta.badge
            ||
            OFFICIAL_BADGE;


        badge.className =
            BADGE_CLASS;


        badge.alt =
            "";


        badge.setAttribute(
            "aria-hidden",
            "true"
        );


        badge.setAttribute(
            "draggable",
            "false"
        );


        badge.title =
            cuenta.role === "admin"

            ?

            "Administrador"

            :

            "Usuario verificado";



        /*
           Si la ruta falla, lo veremos claramente
           en consola para poder depurarlo.
        */

        badge.onerror =
            function () {


                console.error(

                    "[Maki Badge] No se pudo cargar:",

                    badge.src

                );

            };



        host.appendChild(
            badge
        );

    }



    /* ========================================================
       DETECTAR SI UN ELEMENTO PUEDE SER UN MII
       ======================================================== */

    function esCandidatoMii(elemento) {


        if (
            !elemento
            ||
            elemento.nodeType !== 1
        ) {

            return false;

        }



        /*
           IDs conocidos.
        */

        var id =
            elemento.id
            ||
            "";


        if (

            id === "profile-mii-img"

            ||

            id === "user-sidebar-avatar"

            ||

            id === "avatar-mii-post"

        ) {


            return true;

        }



        /*
           IMG que apunta al servidor Mii.
        */

        if (
            elemento.tagName
            &&
            elemento.tagName.toLowerCase() ===
            "img"
        ) {


            var src =
                elemento.getAttribute(
                    "src"
                )
                ||
                "";


            if (
                src.indexOf(
                    "mii-unsecure.ariankordi.net"
                ) !== -1

                &&

                src.indexOf(
                    "nnid="
                ) !== -1
            ) {


                return true;

            }

        }



        /*
           DIV/elemento con URL Mii en style.
        */

        var estilo =
            elemento.getAttribute
            ?

            (
                elemento.getAttribute(
                    "style"
                )
                ||
                ""
            )

            :

            "";


        if (
            estilo.indexOf(
                "mii-unsecure.ariankordi.net"
            ) !== -1

            &&

            estilo.indexOf(
                "nnid="
            ) !== -1
        ) {


            return true;

        }


        return false;

    }



    /* ========================================================
       LIMPIAR SISTEMA VIEJO
       ======================================================== */

    function limpiarBadgesViejos() {


        var viejos =
            document.querySelectorAll(
                ".user-verified-mark"
            );


        for (
            var i = 0;
            i < viejos.length;
            i++
        ) {


            if (
                viejos[i].parentNode
            ) {


                viejos[i].parentNode.removeChild(
                    viejos[i]
                );

            }

        }

    }



    /* ========================================================
       ESCANEAR TODA LA PÁGINA
       ======================================================== */

    function escanearPagina() {


        limpiarBadgesViejos();



        var candidatos = [];


        /*
           ----------------------------------------------------
           IDs conocidos del proyecto
           ----------------------------------------------------
        */

        var profile =
            document.getElementById(
                "profile-mii-img"
            );


        var sidebar =
            document.getElementById(
                "user-sidebar-avatar"
            );


        var modal =
            document.getElementById(
                "avatar-mii-post"
            );


        if (profile) {

            candidatos.push(
                profile
            );

        }


        if (sidebar) {

            candidatos.push(
                sidebar
            );

        }


        if (modal) {

            candidatos.push(
                modal
            );

        }



        /*
           ----------------------------------------------------
           TODOS LOS <img> DINÁMICOS CON URL DE MII
           ----------------------------------------------------
        */

        var imagenes =
            document.querySelectorAll(
                'img[src*="mii-unsecure.ariankordi.net"][src*="nnid="]'
            );


        var i;


        for (
            i = 0;
            i < imagenes.length;
            i++
        ) {


            candidatos.push(
                imagenes[i]
            );

        }



        /*
           ----------------------------------------------------
           TODOS LOS DIVS / ELEMENTOS CON background-image MII

           ESTO CAPTURA TUS POSTS.

           renderizarMensajes() crea justamente
           background-image:url(...nnid=AUTOR...)
           ----------------------------------------------------
        */

        var backgrounds =
            document.querySelectorAll(
                '[style*="mii-unsecure.ariankordi.net"][style*="nnid="]'
            );


        for (
            i = 0;
            i < backgrounds.length;
            i++
        ) {


            candidatos.push(
                backgrounds[i]
            );

        }



        /*
           ----------------------------------------------------
           APLICAR
           ----------------------------------------------------
        */

        var usados = [];


        for (
            i = 0;
            i < candidatos.length;
            i++
        ) {


            var candidato =
                candidatos[i];


            /*
               Evitar procesar exactamente
               el mismo nodo varias veces.
            */

            if (
                usados.indexOf(
                    candidato
                ) !== -1
            ) {


                continue;

            }


            usados.push(
                candidato
            );


            aplicarInsignia(
                candidato
            );

        }

    }



    /* ========================================================
       ESCANEO PROGRAMADO

       Evita ejecutar 50 veces seguidas si
       renderizarMensajes() crea varios nodos.
       ======================================================== */

    var escaneoPendiente =
        false;


    function programarEscaneo() {


        if (escaneoPendiente) {

            return;

        }


        escaneoPendiente =
            true;


        setTimeout(

            function () {


                escaneoPendiente =
                    false;


                escanearPagina();

            },

            0

        );

    }



    /* ========================================================
       OBSERVAR CAMBIOS EN LA WEB

       ESTE ES EL PUNTO QUE HACE QUE FUNCIONE "SIEMPRE".

       Detecta:

       - nuevo post
       - cambio src del perfil
       - cambio src del sidebar
       - background-image nuevo del modal
       - cambio de expresión del Mii
       ======================================================== */

    if (
        typeof MutationObserver !==
        "undefined"
    ) {


        var observer =
            new MutationObserver(

                function () {


                    programarEscaneo();

                }

            );


        observer.observe(

            document.documentElement,

            {

                childList:
                    true,

                subtree:
                    true,

                attributes:
                    true,

                attributeFilter: [

                    "src",

                    "style",

                    "data-pnid"

                ]

            }

        );

    }



    /* ========================================================
       PRIMER ESCANEO
       ======================================================== */

    if (
        document.readyState ===
        "loading"
    ) {


        document.addEventListener(

            "DOMContentLoaded",

            function () {


                /*
                   Primero uno inmediato.
                */

                programarEscaneo();


                /*
                   Y otro poquito después,
                   porque basedata.js carga los Miis
                   de forma asíncrona.
                */

                setTimeout(
                    programarEscaneo,
                    150
                );


                setTimeout(
                    programarEscaneo,
                    700
                );

            }

        );

    }


    else {


        programarEscaneo();


        setTimeout(
            programarEscaneo,
            150
        );


        setTimeout(
            programarEscaneo,
            700
        );

    }



    /* ========================================================
       TAMBIÉN AL TERMINAR DE CARGAR IMÁGENES
       ======================================================== */

    window.addEventListener(

        "load",

        function () {


            programarEscaneo();

        }

    );



    /* ========================================================
       FALLBACK

       MutationObserver debería bastar.

       Pero hacemos un escaneo cada 2 segundos
       por si alguna parte de tu proyecto viejo modifica
       cosas de forma rara y no dispara lo esperado.

       Es barato porque solo inspecciona URLs Mii.
       ======================================================== */

    setInterval(

        function () {


            escanearPagina();

        },

        2000

    );

    window.MakiOfficialBadge = {


        scan:
            escanearPagina,


        refresh:
            programarEscaneo,


        apply:
            aplicarInsignia,


        isOfficial:
            function (pnid) {


                return !!obtenerCuentaEspecial(
                    pnid
                );

            },


        getAccount:
            obtenerCuentaEspecial

    };


})();
