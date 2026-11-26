/* ============================================================
   MAKI'S BIO V23 — extracted from index.html
   Original inline script #06
   Mode: classic script
   ============================================================ */

function renderizarMensajes() {
    const muro = document.getElementById('muro-mensajes');
    if (!muro) return;

    let mensajesGuardados = JSON.parse(localStorage.getItem('makiiverse_mensajes') || '[]');
    muro.innerHTML = '';

    if (mensajesGuardados.length === 0) {
        muro.innerHTML = '<p style="text-align: center; color: #777; font-family: sans-serif; font-size: 16px;">Aún no hay publicaciones en este muro.</p>';
        return;
    }

    const usuarioActual = localStorage.getItem('makiiverse_pnid') || 'Makii';

    mensajesGuardados.forEach(msg => {
        const urlMii = `https://mii-unsecure.ariankordi.net/miis/image.png?nnid=${encodeURIComponent(msg.autor)}&type=face&width=270&expression=${encodeURIComponent(msg.expresion)}&api_id=1`;
        
        // Manejo de Yeahs guardados en localStorage por mensaje
        const yeahsData = JSON.parse(localStorage.getItem(`makiiverse_yeahs_${msg.id}`) || '{"count": 0, "dado": false}');
        
        const contenedorPost = document.createElement('div');
        contenedorPost.className = 'miiverse-card';
        contenedorPost.style.cssText = "display: flex; align-items: flex-start; position: relative; margin-bottom: 20px;";

        let botonEliminarHTML = '';
        if (msg.autor === usuarioActual) {
            botonEliminarHTML = `<button onclick="eliminarMensaje(${msg.id})" class="btn-eliminar-miiverse" style="position: absolute; top: 12px; right: 16px; background: #fff; border: 1px solid #ccc; border-radius: 4px; padding: 6px 14px; font-size: 14px; color: #666; cursor: pointer; opacity: 0; transition: opacity 0.15s; z-index: 10;">Delete</button>`;
        }

        let contenidoHTML = '';

        const contenidoEsImagen =
            typeof msg.contenido === 'string' &&
            msg.contenido.startsWith('data:image/');

        if (msg.tipo === 'dibujo' || contenidoEsImagen) {
            contenidoHTML = `<img src="${msg.contenido}" style="max-width: 100%; height: auto; border-radius: 6px; background: #fff; display: block;">`;
        } else if (msg.contenido && msg.contenido.trim() !== '') {
            contenidoHTML = `<p style="margin: 0; font-size: 21px; color: #333; word-break: break-word; font-family: sans-serif; line-height: 1.7;">${escapeHTML(msg.contenido)}</p>`;
        }

        /*
           Compatible con posts viejos:
           si no existe imagenAdjunta simplemente no se agrega nada.
        */
        if (msg.imagenAdjunta) {
            contenidoHTML += `
                <img
                    src="${msg.imagenAdjunta}"
                    alt="Attached image"
                    style="
                        display:block;
                        width:auto;
                        max-width:100%;
                        max-height:720px;
                        height:auto;
                        object-fit:contain;
                        margin-top:${contenidoHTML ? '18px' : '0'};
                        border:1px solid #d3d3d3;
                        border-radius:8px;
                        background:#f7f7f7;
                        box-shadow:0 2px 5px rgba(0,0,0,.08);
                    "
                >
            `;
        }

        contenedorPost.innerHTML = `
            <!-- Avatar Mii flotante a la izquierda -->
            <div style="width: 96px; height: 96px; background-image: url('${urlMii}'); background-size: cover; background-position: center; background-color: #fff; border-radius: 8px; border: 1px solid #b8b8b8; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-right: 20px; flex-shrink: 0; margin-top: 4px;"></div>
            
            <!-- Tarjeta de contenido -->
            <div style="flex-grow: 1; background: #ffffff; border: 1px solid #c8c8c8; border-radius: 8px; box-shadow: 0 3px 6px rgba(0,0,0,0.06); overflow: hidden; position: relative;">
                ${botonEliminarHTML}
                
                <!-- Encabezado de la tarjeta -->
                <div style="background: linear-gradient(to bottom, #f2f2f2 0%, #e4e4e4 100%); border-bottom: 1px solid #d0d0d0; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: bold; font-size: 18px; color: #444; font-family: sans-serif;">${escapeHTML(msg.autor)}</span>
                    <span style="font-size: 14px; color: #888; font-family: sans-serif;">${msg.fecha}</span>
                </div>

                <!-- Cuerpo del mensaje -->
                <div style="padding: 34px 26px; background: #ffffff; min-height: 120px; box-sizing: border-box;">
                    <div style="display: flex; gap: 20px; align-items: flex-start;">
                        <!-- Icono de Comunidad -->
                        <div style="width: 66px; height: 66px; background: linear-gradient(to bottom, #505050 0%, #303030 100%); border-radius: 8px; border: 1px solid #222; overflow: hidden; display: flex; justify-content: center; align-items: center; flex-shrink: 0; box-shadow: inset 0 1px 2px rgba(255,255,255,0.2);">
                            <img src="img/games/wii-u-logo-png_seeklogo-312570.png" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <div style="flex-grow: 1;">${contenidoHTML}</div>
                    </div>
                </div>

               
        `;

        muro.appendChild(contenedorPost);
    });
}

// Función global para manejar los Yeahs interactivos en cada post
function toggleYeah(idMensaje) {
    let yeahsData = JSON.parse(localStorage.getItem(`makiiverse_yeahs_${idMensaje}`) || '{"count": 0, "dado": false}');
    
    if (yeahsData.dado) {
        yeahsData.dado = false;
        yeahsData.count = Math.max(0, yeahsData.count - 1);
    } else {
        yeahsData.dado = true;
        yeahsData.count += 1;
    }
    
    localStorage.setItem(`makiiverse_yeahs_${idMensaje}`, JSON.stringify(yeahsData));
    renderizarMensajes();
}
