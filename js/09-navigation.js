/* ============================================================
   MAKI'S BIO V23 — extracted from index.html
   Original inline script #09
   Mode: classic script
   ============================================================ */

    // Creamos una "memoria" que guarde por dónde ha navegado el usuario.
    // Asumimos que siempre empezamos en el perfil (0)
    var historialNavegacion = [{ irA: 0, idBoton: 'global-menu-community' }];
    var enSubportal = false;

    // Agregamos un tercer parámetro opcional "esRetroceso"
    function conmutarPortal(irA, idBoton, esRetroceso = false) {
        
        // Si el usuario está navegando normal (no está usando el botón Back), guardamos el paso
        if (!esRetroceso) {
            var actual = historialNavegacion[historialNavegacion.length - 1];
            // Evitamos guardar duplicados si el usuario le da doble clic al mismo botón
            if (!actual || actual.irA !== irA) {
                historialNavegacion.push({ irA: irA, idBoton: idBoton });
            }
        }

        // 1. Limpiamos la clase 'selected' de todos los botones primero
        document.querySelectorAll('.card').forEach(function(b) {
            b.classList.remove('selected');
        });

        // 2. Si venimos de un clic, marcamos el botón recibido
        if (idBoton) {
            var boton = document.getElementById(idBoton);
            if (boton) boton.classList.add('selected');
        }

        // 3. Ocultar todas las vistas (Se incluye 'vista-quepasara')
        var vistas = [
            'vista-perfil', 
            'vista-juegos', 
            'vista-proyectos', 
            'vista-sobremi', 
            'vista-networks', 
            'vista-userpage', 
            'vista-messages', 
            'vista-quepasara'
        ];
        
        vistas.forEach(function(id) {
            var v = document.getElementById(id);
            if (v) v.style.display = 'none';
        });

        // 4. Mostrar la vista solicitada (Se agrega el índice 7)
        var mapaVistas = { 
            0: 'vista-perfil', 
            1: 'vista-juegos', 
            2: 'vista-proyectos', 
            3: 'vista-sobremi', 
            4: 'vista-networks', 
            5: 'vista-userpage', 
            6: 'vista-messages', 
            7: 'vista-quepasara' 
        };
        
        var destino = document.getElementById(mapaVistas[irA] || 'vista-perfil');
        if (destino) destino.style.display = 'block';

        // Si salimos de User Page, regresamos la URL a la ruta base.
        if (
            irA !== 5 &&
            window.MakiPublicProfiles &&
            typeof window.MakiPublicProfiles.syncRouteAfterPortal === 'function'
        ) {
            window.MakiPublicProfiles.syncRouteAfterPortal(irA);
        }

        // 5. Lógica del botón Back/Close
        // Ahora el modo subportal depende de si hay más de 1 página en el historial
        enSubportal = (historialNavegacion.length > 1);
        
        var btnNav = document.getElementById('boton-navegacion-miiverse');
        var navIcono = document.getElementById('nav-icono-wiiu');
        var navTexto = document.getElementById('nav-texto-wiiu');

        if (enSubportal) {
            // Diseño MODO SUBPORTAL (Back)
            if(btnNav) {
                btnNav.style.setProperty('background-color', '#ffffff', 'important');
                btnNav.style.setProperty('box-shadow', '0 10px 20px rgb(201, 201, 201)', 'important');
            }
            if(navIcono) {
                navIcono.style.fontFamily = "'MiiverseIcons'";
                navIcono.style.fontSize = "68px"; 
                navIcono.style.color = "#999999"; 
                navIcono.style.marginTop = "-20px";
                navIcono.style.marginLeft = "-2px";
                navIcono.innerText = "b"; 
            }
            if(navTexto) {
                navTexto.style.color = "#6b6969";
                navTexto.style.marginTop = "10px";
                navTexto.innerText = "Back";
            }
        } else {
            // Diseño MODO PERFIL (Close)
            if(btnNav) {
                btnNav.style.setProperty('background-color', '#3d3d3d', 'important');
                btnNav.style.setProperty('box-shadow', '0 12px 25px rgba(163, 161, 161, 0.5)', 'important');
            }
            if(navIcono) {
                navIcono.style.fontFamily = "inherit";
                navIcono.style.fontSize = "24px";
                navIcono.style.color = "#777777";
                navIcono.style.marginTop = "0px";
                navIcono.style.marginLeft = "0px";
                navIcono.img = "img/closeX.png"; // Mantengo tu lógica original aquí
                navIcono.innerText = "";
            }
            if(navTexto) {
                navTexto.style.color = "#cccccc";
                navTexto.style.marginTop = "-20px";
                navTexto.innerText = "Close";
            }
        }
    }

    function manejadorNavegacionFija() {
        if (historialNavegacion.length > 1) {
            // 1. Borramos la vista en la que estamos parados actualmente
            historialNavegacion.pop();
            
            // 2. Nos asomamos a ver cuál era la vista anterior en la memoria
            var vistaAnterior = historialNavegacion[historialNavegacion.length - 1];
            
            // 3. Viajamos a esa vista. Le pasamos "true" al final para avisarle a la función que esto es un retroceso
            conmutarPortal(vistaAnterior.irA, vistaAnterior.idBoton, true);
        } else {
            // Si ya no hay historial (estamos en la página 1), cierra la ventana
            window.close();
        }
    }
