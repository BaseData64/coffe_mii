function actualizarVistaUserPage() {
    const pnidGuardado = localStorage.getItem('makiiverse_pnid');

    if (!pnidGuardado) {
        window.location.href = 'login.html';
        return;
    }

    const miiUrl = `https://mii-unsecure.ariankordi.net/miis/image.png?nnid=${encodeURIComponent(pnidGuardado)}&type=face&width=270&api_id=1`;

    const usernameEl = document.getElementById('profile-username');
    const subPnidEl = document.getElementById('profile-pnid-sub');
    
    if (usernameEl) usernameEl.textContent = pnidGuardado;
    if (subPnidEl) subPnidEl.textContent = pnidGuardado;

    const miiImgProfile = document.getElementById('profile-mii-img');
    if (miiImgProfile) {
        miiImgProfile.src = miiUrl;
        miiImgProfile.onerror = function() {
            this.src = 'img/games/Dummy_mii_user.png';
        };
    }

    // CORRECCIÓN: Filtramos los mensajes que coincidan con el PNID del usuario actual
    const mensajesGuardados = JSON.parse(localStorage.getItem('makiiverse_mensajes') || '[]');
    const postsDelUsuario = mensajesGuardados.filter(msg => msg.autor === pnidGuardado || msg.pnid === pnidGuardado);
    
    // Actualizamos el contador en la vista manteniendo tu HTML intacto
    const contadorUi = document.getElementById('contador-posts-usuario');
    if (contadorUi) {
        contadorUi.textContent = postsDelUsuario.length;
    }
}

function actualizarVistaUserPage() {
    const pnidGuardado = localStorage.getItem('makiiverse_pnid');

    if (!pnidGuardado) {
        window.location.href = 'login.html';
        return;
    }

    const miiUrl = `https://mii-unsecure.ariankordi.net/miis/image.png?nnid=${encodeURIComponent(pnidGuardado)}&type=face&width=270&api_id=1`;

    const usernameEl = document.getElementById('profile-username');
    const subPnidEl = document.getElementById('profile-pnid-sub');
    
    if (usernameEl) usernameEl.textContent = pnidGuardado;
    if (subPnidEl) subPnidEl.textContent = pnidGuardado;

    const miiImgProfile = document.getElementById('profile-mii-img');
    if (miiImgProfile) {
        miiImgProfile.src = miiUrl;
        miiImgProfile.onerror = function() {
            this.src = 'img/games/Dummy_mii_user.png';
        };
    }

    // 1. Filtrar los posts del usuario actual
    const mensajesGuardados = JSON.parse(localStorage.getItem('makiiverse_mensajes') || '[]');
    const postsDelUsuario = mensajesGuardados.filter(msg => msg.autor === pnidGuardado || msg.pnid === pnidGuardado);
    
    // 2. Actualizar el contador numérico
    const contadorUi = document.getElementById('contador-posts-usuario');
    if (contadorUi) {
        contadorUi.textContent = postsDelUsuario.length;
    }

    // 3. Renderizar el historial de posts con el diseño exacto de tarjeta Miiverse
    const contenedorHistorial = document.getElementById('muro-posts-usuario');
    if (!contenedorHistorial) return;
    
    contenedorHistorial.innerHTML = '';

    if (postsDelUsuario.length === 0) {
        contenedorHistorial.innerHTML = '<p style="color: #777; font-size: 14px; text-align: center;">You haven\'t posted anything yet.</p>';
        return;
    }

    postsDelUsuario.forEach(msg => {
        const urlMiiPost = `https://mii-unsecure.ariankordi.net/miis/image.png?nnid=${encodeURIComponent(msg.autor)}&type=face&width=270&expression=${encodeURIComponent(msg.expresion || 'normal')}&api_id=1`;
        
        let contenidoHTML = '';
        if (msg.tipo === 'texto') {
            contenidoHTML = `<p style="margin: 0; font-size: 18px; color: #333; word-break: break-word; line-height: 1.6; font-family: sans-serif;">${escapeHTML(msg.contenido)}</p>`;
        } else {
            contenidoHTML = `<img src="${msg.contenido}" style="max-width: 100%; border-radius: 6px; background: #fff; display: block;">`;
        }

        const contenedorPost = document.createElement('div');
        contenedorPost.style.cssText = "display: flex; align-items: flex-start; position: relative; margin-bottom: 20px; width: 100%; box-sizing: border-box;";

        contenedorPost.innerHTML = `
            <!-- Avatar Mii flotante a la izquierda -->
            <div style="width: 72px; height: 72px; background-image: url('${urlMiiPost}'); background-size: cover; background-position: center; background-color: #fff; border-radius: 12px; border: 1px solid #b8b8b8; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-right: 0px; flex-shrink: 0; margin-top: 14px; z-index: 2;"></div>
            
            <!-- Flecha de la burbuja que apunta al Mii -->
            <div style="width: 0; height: 0; border-top: 10px solid transparent; border-bottom: 10px solid transparent; border-right: 12px solid #ffffff; margin-top: 38px; margin-left: 0px; filter: drop-shadow(-1px 1px 1px rgba(0,0,0,0.08)); z-index: 3;"></div>
            
            <!-- Tarjeta de contenido principal estilo Miiverse -->
            <div style="flex-grow: 1; background: #ffffff; border: 1px solid #c8c8c8; border-radius: 12px; box-shadow: 0 3px 6px rgba(0,0,0,0.06); overflow: hidden; position: relative; margin-left: -1px;">
                
                <!-- Encabezado Gris Claro de la tarjeta -->
                <div style="background: linear-gradient(to bottom, #f2f2f2 0%, #e4e4e4 100%); border-bottom: 1px solid #d0d0d0; padding: 10px 18px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: bold; font-size: 15px; color: #444; font-family: sans-serif;">${escapeHTML(msg.autor)}</span>
                    <span style="font-size: 12px; color: #888; font-family: sans-serif;">${msg.fecha}</span>
                </div>

                <!-- Cuerpo del mensaje con icono de comunidad opcional y texto -->
                <div style="padding: 20px 22px; background: #ffffff; min-height: 60px; box-sizing: border-box;">
                    <div style="display: flex; gap: 15px; align-items: flex-start;">
                        <div style="width: 45px; height: 45px; background: linear-gradient(to bottom, #505050 0%, #303030 100%); border-radius: 6px; border: 1px solid #222; overflow: hidden; display: flex; justify-content: center; align-items: center; flex-shrink: 0;">
                            <img src="img/games/wii-u-logo-png_seeklogo-312570.png" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <div style="flex-grow: 1;">${contenidoHTML}</div>
                    </div>
                </div>

                <!-- Pie de tarjeta (Yeahs y Comentarios simulados como el prototipo) -->
                <div style="background: #fafafa; border-top: 1px solid #eaeaea; padding: 8px 18px; display: flex; gap: 20px; font-size: 13px; color: #666;">
                </div>
            </div>
        `;

        contenedorHistorial.appendChild(contenedorPost);
    });
}