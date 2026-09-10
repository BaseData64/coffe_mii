/* ============================================================
   MAKI'S BIO V23 — extracted from index.html
   Original inline script #08
   Mode: classic script
   ============================================================ */

/* ============================================================
   MII CLICKER — NAVEGACIÓN ROBUSTA
   Evita el href="#" y limpia la ruta de User Page antes de abrir.
   ============================================================ */
window.abrirMiiClicker = function() {
    try {
        if (
            window.MakiPublicProfiles &&
            typeof window.MakiPublicProfiles.syncRouteAfterPortal === "function"
        ) {
            window.MakiPublicProfiles.syncRouteAfterPortal(6, true);
        }
    } catch (error) {
        console.warn("[Mii Clicker] No se pudo limpiar la ruta:", error);
    }

    if (typeof window.conmutarPortal === "function") {
        window.conmutarPortal(6, "global-menu-message");
    }
};
