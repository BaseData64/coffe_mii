/* ============================================================
   MAKI'S BIO V23 — extracted from index.html
   Original inline script #17
   Mode: classic script
   ============================================================ */

(function () {
    const button = document.getElementById('wiiu-memo-loading');

    if (!button) return;

    button.addEventListener('click', function () {
        button.classList.add('clear-flash');

        setTimeout(function () {
            button.classList.remove('clear-flash');
        }, 120);
    });
})();
