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