/* ============================================================
   MAKI'S BIO V23 — extracted from index.html
   Original inline script #12
   Mode: classic script
   ============================================================ */

 let expresionActual = 'normal';

function abrirModalPostGeneral() {
    document.getElementById('modal-crear-post').style.display = 'block';
    
    // Cargar la imagen del Mii con la expresión actual basada en el PNID guardado
    const pnid = localStorage.getItem('makiiverse_pnid') || 'Makii';
    actualizarAvatarModal(pnid, expresionActual);
}

function cerrarModalPostGeneral() {
    document.getElementById('modal-crear-post').style.display = 'none';

    /*
       Limpiar la imagen seleccionada al cancelar o después de publicar.
    */
    if (typeof quitarImagenAdjuntaPost === 'function') {
        quitarImagenAdjuntaPost();
    }

    const spoiler = document.getElementById('check-spoiler');
    if (spoiler) {
        spoiler.checked = false;
    }

    const drawingSurface = document.getElementById('miiverse-drawing-surface');
    if (drawingSurface) {
        drawingSurface.classList.remove('active');
        drawingSurface.setAttribute('aria-hidden', 'true');
    }

    const drawingPreview = document.getElementById('miiverse-drawing-ready');
    if (drawingPreview) {
        drawingPreview.classList.remove('active');
        drawingPreview.setAttribute('aria-hidden', 'true');
    }

    const drawingPreviewImage = document.getElementById('miiverse-drawing-preview-img');
    if (drawingPreviewImage) {
        drawingPreviewImage.removeAttribute('src');
    }

    dibujoAceptado = false;
    snapshotVentanaDibujo = null;
    modoActual = 'texto';
    actualizarBotonesModoPost('texto');

}

function actualizarAvatarModal(pnid, expresion) {
    const avatarDiv = document.getElementById('avatar-mii-post');
    // Usamos el renderizador oficial con el parámetro de expresión que seleccionó el usuario
    const urlMii = `https://mii-unsecure.ariankordi.net/miis/image.png?nnid=${encodeURIComponent(pnid)}&type=face&width=270&expression=${expresion}&api_id=1`;
    avatarDiv.style.backgroundImage = `url('${urlMii}')`;
}

// Configurar clics en los botones de emociones de feeling-icons.png
document.addEventListener('DOMContentLoaded', () => {
    const botones = document.querySelectorAll('.emocion-btn');
    botones.forEach(btn => {
        btn.addEventListener('click', function() {
            botones.forEach(b => b.style.backgroundColor = 'transparent');
            this.style.backgroundColor = '#79c100';
            
            expresionActual = this.getAttribute('data-exp');
            const pnid = localStorage.getItem('makiiverse_pnid') || 'Makii';
            actualizarAvatarModal(pnid, expresionActual);
        });
    });
});

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
    }

    window.addEventListener('DOMContentLoaded', () => {
        actualizarVistaUserPage();
    });

    function cerrarSesion() {
        localStorage.removeItem('makiiverse_pnid');
        window.location.href = 'login.html';
    }

 
