/*
 * Maki's Bio — Wii U Memo bridge (Grape-compatible)
 *
 * On a real Wii U Miiverse/OLV environment, use the native wiiuMemo API.
 * On browsers without that API, keep Maki's existing HTML canvas editor.
 * This file must load AFTER js/05-post-composer-canvas.js.
 */
(function (window, document) {
    'use strict';

    var nativeMemoData = null;
    var firstNativeOpen = true;
    var nativeMemoOpening = false;
    var nativeMemoPoll = null;

    var originalChangeMode = window.cambiarModoEntrada;
    var originalExportDrawing = window.exportarDibujoPost;
    var originalEditDrawing = window.editarDibujoPost;
    var originalCloseComposer = window.cerrarModalPostGeneral;

    function hasNativeMemoAPI() {
        var memo = window.wiiuMemo;
        var device = window.wiiuDevice;

        return !!(
            memo &&
            typeof memo.open === 'function' &&
            typeof memo.isFinish === 'function' &&
            typeof memo.getImage === 'function' &&
            device &&
            typeof device.isDrc === 'function'
        );
    }

    function hasGamePad() {
        try {
            return !!(
                window.wiiuDevice &&
                typeof window.wiiuDevice.isDrc === 'function' &&
                window.wiiuDevice.isDrc()
            );
        } catch (error) {
            return false;
        }
    }

    function clearNativePoll() {
        if (nativeMemoPoll !== null) {
            window.clearInterval(nativeMemoPoll);
            nativeMemoPoll = null;
        }
        nativeMemoOpening = false;
    }

    function returnToTextMode(message) {
        clearNativePoll();
        nativeMemoData = null;

        if (typeof originalChangeMode === 'function') {
            originalChangeMode('texto');
        }

        if (message) {
            window.alert(message);
        }
    }

    function openNativeMemo() {
        var textarea;
        var drawingSurface;
        var editor;
        var preview;
        var reset;

        if (!hasNativeMemoAPI()) {
            return false;
        }

        /* Grape requires the Wii U GamePad (DRC) for handwritten posts. */
        if (!hasGamePad()) {
            returnToTextMode('Para escribir a mano necesitas usar el GamePad de Wii U.');
            return true;
        }

        if (nativeMemoOpening) {
            return true;
        }

        textarea = document.getElementById('texto-nuevo-post');
        drawingSurface = document.getElementById('miiverse-drawing-surface');
        editor = document.getElementById('miiverse-post-editor');
        preview = document.getElementById('miiverse-drawing-ready');

        /* Do not show the HTML canvas imitation when the system Memo is available. */
        if (textarea) {
            textarea.style.display = 'none';
        }
        if (drawingSurface) {
            drawingSurface.classList.remove('active');
            drawingSurface.setAttribute('aria-hidden', 'true');
        }
        if (preview) {
            preview.classList.remove('active');
            preview.setAttribute('aria-hidden', 'true');
        }
        if (editor) {
            editor.classList.add('drawing-active');
        }

        modoActual = 'dibujo';
        if (typeof window.actualizarBotonesModoPost === 'function') {
            window.actualizarBotonesModoPost('dibujo');
        }

        reset = firstNativeOpen;
        nativeMemoOpening = true;

        try {
            /* Same API call and reset sequence used by Grape. */
            window.wiiuMemo.open(reset);
            firstNativeOpen = false;
        } catch (error) {
            returnToTextMode('No se pudo abrir Wii U Memo. Regresé al modo de texto.');
            return true;
        }

        /* Grape polls isFinish() every 40 ms, then reads the BMP preview. */
        nativeMemoPoll = window.setInterval(function () {
            var finished = false;
            var bmpData;

            try {
                finished = window.wiiuMemo.isFinish();
            } catch (error) {
                returnToTextMode('Wii U Memo se cerró con un error. Regresé al modo de texto.');
                return;
            }

            if (!finished) {
                return;
            }

            clearNativePoll();

            try {
                bmpData = window.wiiuMemo.getImage(false);
                if (typeof bmpData !== 'string') {
                    throw new Error('Wii U Memo did not return a BMP image.');
                }

                nativeMemoData = {
                    bmp: bmpData
                };

                dibujoAceptado = true;
                modoActual = 'dibujo';

                if (typeof window.actualizarBotonesModoPost === 'function') {
                    window.actualizarBotonesModoPost('dibujo');
                }
                if (typeof window.actualizarPreviewDibujoAceptado === 'function') {
                    window.actualizarPreviewDibujoAceptado();
                }
            } catch (error) {
                returnToTextMode('No se pudo recuperar el dibujo de Wii U Memo.');
            }
        }, 40);

        return true;
    }

    /*
     * Expose the native TGA at submit time, matching Grape's hidden
     * input[name="painting"] behavior. Maki's current post store is
     * localStorage, so the payload is retained as memoTga for later sync.
     */
    window.__makiWiiuMemoNative = {
        isActive: function () {
            return !!nativeMemoData;
        },
        getTga: function () {
            var tgaData;

            if (!nativeMemoData || !hasNativeMemoAPI()) {
                return null;
            }

            try {
                tgaData = window.wiiuMemo.getImage(true);
                return typeof tgaData === 'string' ? tgaData : null;
            } catch (error) {
                return null;
            }
        },
        reset: function () {
            clearNativePoll();
            nativeMemoData = null;
            firstNativeOpen = true;
        }
    };

    /* Native Memo is preferred; retain the existing canvas for ordinary browsers. */
    if (typeof originalChangeMode === 'function') {
        window.cambiarModoEntrada = function (mode) {
            if (mode === 'dibujo' && hasNativeMemoAPI()) {
                openNativeMemo();
                return;
            }
            return originalChangeMode.apply(this, arguments);
        };
    }

    /* Return the BMP preview exactly as Grape does. */
    if (typeof originalExportDrawing === 'function') {
        window.exportarDibujoPost = function () {
            if (nativeMemoData) {
                return 'data:image/bmp;base64,' + nativeMemoData.bmp;
            }
            return originalExportDrawing.apply(this, arguments);
        };
    }

    /* Reopening an accepted native drawing calls wiiuMemo.open(false). */
    if (typeof originalEditDrawing === 'function') {
        window.editarDibujoPost = function () {
            if (nativeMemoData && hasNativeMemoAPI()) {
                openNativeMemo();
                return;
            }
            return originalEditDrawing.apply(this, arguments);
        };
    }

    /* A new composer session starts with a clean Memo, as in Grape. */
    if (typeof originalCloseComposer === 'function') {
        window.cerrarModalPostGeneral = function () {
            var result = originalCloseComposer.apply(this, arguments);
            window.__makiWiiuMemoNative.reset();
            return result;
        };
    }

})(window, document);
