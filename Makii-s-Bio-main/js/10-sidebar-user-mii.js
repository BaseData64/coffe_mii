/* ============================================================
   MAKI'S BIO V23 — extracted from index.html
   Original inline script #10
   Mode: classic script
   ============================================================ */

 window.addEventListener('DOMContentLoaded', () => {
    const pnidGuardado = localStorage.getItem('makiiverse_pnid');

    if (pnidGuardado) {
        // Solo buscamos y reemplazamos la imagen del Mii
        const avatarSidebar = document.getElementById('user-sidebar-avatar');
        
        if (avatarSidebar) {
            avatarSidebar.src = `https://mii-unsecure.ariankordi.net/miis/image.png?nnid=${encodeURIComponent(pnidGuardado)}&type=face&width=270&api_id=1`;
            
            // Si por alguna razón la API falla, regresamos a la silueta
            avatarSidebar.onerror = function() {
                this.src = 'img/games/Dummy_mii_user.png';
            };
        }
    }
});
