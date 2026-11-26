/* ============================================================
   MAKI'S BIO V23 — extracted from index.html
   Original inline script #16
   Mode: classic script
   ============================================================ */

document.addEventListener(
    'keydown',
    function(event) {
        const surface =
            document.getElementById(
                'miiverse-drawing-surface'
            );

        if (
            !surface ||
            !surface.classList.contains(
                'active'
            )
        ) {
            return;
        }

        if (
            event.key === 'Escape' ||
            event.key === 'b' ||
            event.key === 'B'
        ) {
            event.preventDefault();
            event.stopImmediatePropagation();

            if (
                typeof window.aceptarVentanaDibujo ===
                'function'
            ) {
                window.aceptarVentanaDibujo();
            }

            return;
        }

        if (
            (event.ctrlKey || event.metaKey) &&
            String(event.key).toLowerCase() === 'z'
        ) {
            event.preventDefault();

            if (
                typeof window.deshacerCanvasDibujo ===
                'function'
            ) {
                window.deshacerCanvasDibujo();
            }

            return;
        }

        if (
            (event.ctrlKey || event.metaKey) &&
            (
                event.key === 'Delete' ||
                event.key === 'Backspace'
            )
        ) {
            event.preventDefault();

            if (
                typeof window.limpiarCanvasDibujo ===
                'function'
            ) {
                window.limpiarCanvasDibujo();
            }
        }
    },
    true
);
