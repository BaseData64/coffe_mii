/* ============================================================
   MAKI'S BIO V23 — extracted from index.html
   Original inline script #05
   Mode: classic script
   ============================================================ */

let expresionActual = 'normal';
let modoActual = 'texto'; 
let canvas, ctx;
let dibujando = false;
let herramientaDibujo = 'pencil';
let grosorDibujo = 9;
let historialDibujo = [];
const MAX_HISTORIAL_DIBUJO = 20;
let snapshotVentanaDibujo = null;
let dibujoAceptado = false;

document.addEventListener('DOMContentLoaded', () => {
    const botonesEmocion = document.querySelectorAll('#modal-crear-post .emocion-btn');
    botonesEmocion.forEach(btn => {
        btn.addEventListener('click', function(e) {
            botonesEmocion.forEach(b => b.classList.remove('activo'));
            const botonReal = e.target.closest('.emocion-btn');
            if (!botonReal) return;

            botonReal.classList.add('activo');
            expresionActual = botonReal.getAttribute('data-exp');
            
            const pnid = localStorage.getItem('makiiverse_pnid') || 'Makii';
            actualizarAvatarModal(pnid, expresionActual);
        });
    });

    canvas = document.getElementById('canvas-post');
    ctx = canvas.getContext('2d');

    // Grape's Wii U memo preview is 640x240. Keep that as the
    // internal drawing resolution even when responsive CSS scales it.
    canvas.width = 640;
    canvas.height = 240;
    aplicarHerramientaDibujo();

    canvas.addEventListener('mousedown', empezarTrazo);
    canvas.addEventListener('mousemove', dibujar);
    canvas.addEventListener('mouseup', detenerTrazo);
    canvas.addEventListener('mouseleave', detenerTrazo);

    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); empezarTrazo(e.touches[0]); });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); dibujar(e.touches[0]); });
    canvas.addEventListener('touchend', detenerTrazo);

    renderizarMensajes();
});

// Función para abrir el modal desde cualquier lugar externo que lo requiera
function abrirModalPostGeneral() {
    document.getElementById('modal-crear-post').style.display = 'flex';
    document.body.style.overflow = 'hidden'; 
    
    const pnid = localStorage.getItem('makiiverse_pnid') || 'Makii';
    actualizarAvatarModal(pnid, expresionActual);
    
    if (modoActual === 'texto') {
        document.getElementById('texto-nuevo-post').focus();
    } else {
        aplicarHerramientaDibujo();
    }
}

function cerrarModalPostGeneral() {
    document.getElementById('modal-crear-post').style.display = 'none';
    document.getElementById('texto-nuevo-post').value = ''; 
    if(ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        aplicarHerramientaDibujo();
    }
    historialDibujo = [];
    document.body.style.overflow = 'auto'; 

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
    const urlMii = `https://mii-unsecure.ariankordi.net/miis/image.png?nnid=${encodeURIComponent(pnid)}&type=face&width=270&expression=${encodeURIComponent(expresion)}&api_id=1`;
    avatarDiv.style.backgroundImage = `url('${urlMii}')`;
}

function actualizarBotonesModoPost(modo) {
    const btnTexto = document.getElementById('btn-modo-texto');
    const btnDibujo = document.getElementById('btn-modo-dibujo');

    if (!btnTexto || !btnDibujo) return;

    if (modo === 'dibujo') {
        btnDibujo.classList.add('activo');
        btnDibujo.style.background =
            'linear-gradient(to bottom, #6ac9eb 0%, #51b7dd 100%)';
        btnDibujo.style.color = 'white';

        btnTexto.classList.remove('activo');
        btnTexto.style.background =
            'linear-gradient(to bottom, #fdfdfd 0%, #e0e0e0 100%)';
        btnTexto.style.color = '#777';
    } else {
        btnTexto.classList.add('activo');
        btnTexto.style.background =
            'linear-gradient(to bottom, #6ac9eb 0%, #51b7dd 100%)';
        btnTexto.style.color = 'white';

        btnDibujo.classList.remove('activo');
        btnDibujo.style.background =
            'linear-gradient(to bottom, #fdfdfd 0%, #e0e0e0 100%)';
        btnDibujo.style.color = '#777';
    }
}

function canvasTieneDibujo() {
    if (!ctx || !canvas) return false;

    try {
        const pixels = ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        ).data;

        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] !== 0) {
                return true;
            }
        }
    } catch (error) {
        return dibujoAceptado;
    }

    return false;
}

function guardarSnapshotVentanaDibujo() {
    if (!ctx || !canvas) {
        snapshotVentanaDibujo = null;
        return;
    }

    try {
        snapshotVentanaDibujo = ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );
    } catch (error) {
        snapshotVentanaDibujo = null;
    }
}

function restaurarSnapshotVentanaDibujo() {
    if (!ctx || !canvas || !snapshotVentanaDibujo) return;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.putImageData(
        snapshotVentanaDibujo,
        0,
        0
    );

    aplicarHerramientaDibujo();
}

async function prepararCabeceraVentanaDibujo() {
    // V18: la pantalla de dibujo ya no muestra Mii, PNID ni nombre.
    return;
}

function abrirVentanaDibujo() {
    const drawingSurface =
        document.getElementById('miiverse-drawing-surface');

    if (!drawingSurface) return;

    guardarSnapshotVentanaDibujo();

    prepararCabeceraVentanaDibujo();

    drawingSurface.classList.add('active');
    drawingSurface.setAttribute('aria-hidden', 'false');

    aplicarHerramientaDibujo();
}

function actualizarPreviewDibujoAceptado() {
    const preview =
        document.getElementById('miiverse-drawing-ready');

    const img =
        document.getElementById('miiverse-drawing-preview-img');

    if (!preview || !img) return;

    if (!dibujoAceptado) {
        preview.classList.remove('active');
        preview.setAttribute('aria-hidden', 'true');
        img.removeAttribute('src');
        return;
    }

    img.src = exportarDibujoPost();
    preview.classList.add('active');
    preview.setAttribute('aria-hidden', 'false');
}

function cambiarModoEntrada(modo) {
    const textarea =
        document.getElementById('texto-nuevo-post');

    const drawingSurface =
        document.getElementById('miiverse-drawing-surface');

    const editor =
        document.getElementById('miiverse-post-editor');

    const preview =
        document.getElementById('miiverse-drawing-ready');

    if (modo === 'texto') {
        modoActual = 'texto';

        if (drawingSurface) {
            drawingSurface.classList.remove('active');
            drawingSurface.setAttribute('aria-hidden', 'true');
        }

        if (editor) {
            editor.classList.remove('drawing-active');
        }

        if (preview) {
            preview.classList.remove('active');
            preview.setAttribute('aria-hidden', 'true');
        }

        if (textarea) {
            textarea.style.display = 'block';
            textarea.focus();
        }

        actualizarBotonesModoPost('texto');
        return;
    }

    modoActual = 'dibujo';

    if (textarea) {
        textarea.style.display = 'none';
    }

    if (editor) {
        editor.classList.add('drawing-active');
    }

    actualizarBotonesModoPost('dibujo');

    /*
     * Important change in V15:
     * clicking Draw no longer puts the canvas inline.
     * It opens a dedicated Wii U-style drawing window.
     */
    abrirVentanaDibujo();
}

function aceptarVentanaDibujo() {
    const drawingSurface =
        document.getElementById(
            'miiverse-drawing-surface'
        );

    dibujoAceptado =
        canvasTieneDibujo();

    if (drawingSurface) {
        drawingSurface.classList.remove(
            'active'
        );

        drawingSurface.setAttribute(
            'aria-hidden',
            'true'
        );
    }

    snapshotVentanaDibujo =
        null;

    if (dibujoAceptado) {
        modoActual =
            'dibujo';

        actualizarBotonesModoPost(
            'dibujo'
        );

        actualizarPreviewDibujoAceptado();
    } else {
        /*
         * If the user leaves an empty memo, return naturally
         * to the text composer.
         */
        cambiarModoEntrada(
            'texto'
        );
    }
}

function cancelarVentanaDibujo() {
    const hadDrawingBefore =
        snapshotVentanaDibujo !== null &&
        dibujoAceptado;

    restaurarSnapshotVentanaDibujo();

    const drawingSurface =
        document.getElementById('miiverse-drawing-surface');

    if (drawingSurface) {
        drawingSurface.classList.remove('active');
        drawingSurface.setAttribute('aria-hidden', 'true');
    }

    snapshotVentanaDibujo = null;

    if (hadDrawingBefore) {
        modoActual = 'dibujo';
        actualizarBotonesModoPost('dibujo');
        actualizarPreviewDibujoAceptado();
    } else {
        dibujoAceptado = false;
        actualizarPreviewDibujoAceptado();
        cambiarModoEntrada('texto');
    }
}

function editarDibujoPost() {
    modoActual = 'dibujo';
    actualizarBotonesModoPost('dibujo');
    abrirVentanaDibujo();
}

window.abrirVentanaDibujo = abrirVentanaDibujo;
window.aceptarVentanaDibujo = aceptarVentanaDibujo;
window.cancelarVentanaDibujo = cancelarVentanaDibujo;
window.editarDibujoPost = editarDibujoPost;

function obtenerPosicionCanvas(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function guardarEstadoCanvasDibujo() {
    if (!ctx || !canvas) return;

    try {
        historialDibujo.push(
            ctx.getImageData(0, 0, canvas.width, canvas.height)
        );

        if (historialDibujo.length > MAX_HISTORIAL_DIBUJO) {
            historialDibujo.shift();
        }
    } catch (error) {
        console.warn('No se pudo guardar el historial del canvas:', error);
    }
}

function aplicarHerramientaDibujo() {
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = grosorDibujo;

    if (herramientaDibujo === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#252525';
    }
}

function seleccionarHerramientaDibujo(tipo, grosor, boton) {
    herramientaDibujo =
        tipo === 'eraser'
            ? 'eraser'
            : 'pencil';

    grosorDibujo =
        Math.max(
            1,
            Number(grosor) || grosorDibujo || 5
        );

    aplicarHerramientaDibujo();
}

function seleccionarTipoDibujo(tipo, boton) {
    herramientaDibujo =
        tipo === 'eraser'
            ? 'eraser'
            : 'pencil';

    document
        .querySelectorAll(
            '#wiiu-memo-toolbox .wiiu-tool-cell'
        )
        .forEach(
            function(toolButton) {
                toolButton.classList.remove(
                    'selected'
                );
            }
        );

    if (boton) {
        boton.classList.add(
            'selected'
        );
    }

    aplicarHerramientaDibujo();
}

function seleccionarGrosorDibujo(grosor, boton) {
    grosorDibujo =
        Math.max(
            1,
            Number(grosor) || 5
        );

    document
        .querySelectorAll(
            '#wiiu-memo-toolbox .wiiu-size-cell'
        )
        .forEach(
            function(sizeButton) {
                sizeButton.classList.remove(
                    'selected'
                );
            }
        );

    if (boton) {
        boton.classList.add(
            'selected'
        );
    }

    aplicarHerramientaDibujo();
}

window.seleccionarTipoDibujo =
    seleccionarTipoDibujo;

window.seleccionarGrosorDibujo =
    seleccionarGrosorDibujo;

function empezarTrazo(e) {
    if (!canvas || !ctx) return;

    guardarEstadoCanvasDibujo();
    aplicarHerramientaDibujo();
    dibujando = true;

    const pos = obtenerPosicionCanvas(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    // A quick tap also leaves a dot.
    ctx.lineTo(pos.x + 0.01, pos.y + 0.01);
    ctx.stroke();
    dibujoAceptado = true;
}

function dibujar(e) {
    if (!dibujando) return;

    const pos = obtenerPosicionCanvas(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
}

function detenerTrazo() {
    if (!dibujando) return;
    dibujando = false;
    ctx.closePath();
}

function deshacerCanvasDibujo() {
    if (!ctx || !canvas || !historialDibujo.length) return;

    const estado = historialDibujo.pop();

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.putImageData(
        estado,
        0,
        0
    );

    aplicarHerramientaDibujo();
    dibujoAceptado = canvasTieneDibujo();
}

function limpiarCanvasDibujo() {
    if (!ctx || !canvas) return;

    guardarEstadoCanvasDibujo();

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    aplicarHerramientaDibujo();
    dibujoAceptado = false;
}

function exportarDibujoPost() {
    if (!canvas) return '';

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;

    const exportCtx = exportCanvas.getContext('2d');
    exportCtx.fillStyle = '#ffffff';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(canvas, 0, 0);

    return exportCanvas.toDataURL('image/png');
}

window.seleccionarHerramientaDibujo = seleccionarHerramientaDibujo;
window.deshacerCanvasDibujo = deshacerCanvasDibujo;
window.limpiarCanvasDibujo = limpiarCanvasDibujo;
window.exportarDibujoPost = exportarDibujoPost;


/* ============================================================
   IMAGEN ADJUNTA EN POSTS
   ============================================================ */

let imagenAdjuntaPost = null;
let nombreImagenAdjuntaPost = '';

function abrirSelectorImagenPost() {
    const input = document.getElementById('input-imagen-post');
    if (input) {
        input.click();
    }
}

function manejarImagenSeleccionadaPost(event) {
    const input = event && event.target
        ? event.target
        : document.getElementById('input-imagen-post');

    if (!input || !input.files || !input.files.length) {
        return;
    }

    const archivo = input.files[0];

    if (!/^image\/(jpeg|png|webp)$/i.test(archivo.type)) {
        alert('Selecciona una imagen JPG, PNG o WebP.');
        input.value = '';
        return;
    }

    /*
       Evitamos intentar meter archivos gigantes al navegador.
       Después la imagen se redimensiona para que el post no
       reviente localStorage.
    */
    if (archivo.size > 12 * 1024 * 1024) {
        alert('La imagen es demasiado grande. El máximo es 12 MB.');
        input.value = '';
        return;
    }

    optimizarImagenAdjuntaPost(archivo)
        .then(function(dataUrl) {
            imagenAdjuntaPost = dataUrl;
            nombreImagenAdjuntaPost = archivo.name || 'image';
            actualizarPreviewImagenPost();
        })
        .catch(function(error) {
            console.error('No se pudo procesar la imagen:', error);
            alert('No se pudo cargar esa imagen.');
            input.value = '';
        });
}

function optimizarImagenAdjuntaPost(archivo) {
    return new Promise(function(resolve, reject) {
        const lector = new FileReader();

        lector.onerror = function() {
            reject(new Error('FileReader error'));
        };

        lector.onload = function() {
            const imagen = new Image();

            imagen.onerror = function() {
                reject(new Error('Invalid image'));
            };

            imagen.onload = function() {
                const MAX_ANCHO = 960;
                const MAX_ALTO = 960;

                let ancho = imagen.naturalWidth || imagen.width;
                let alto = imagen.naturalHeight || imagen.height;

                if (!ancho || !alto) {
                    reject(new Error('Invalid dimensions'));
                    return;
                }

                const escala = Math.min(
                    1,
                    MAX_ANCHO / ancho,
                    MAX_ALTO / alto
                );

                const anchoFinal = Math.max(1, Math.round(ancho * escala));
                const altoFinal = Math.max(1, Math.round(alto * escala));

                const lienzo = document.createElement('canvas');
                lienzo.width = anchoFinal;
                lienzo.height = altoFinal;

                const contexto = lienzo.getContext('2d');

                /*
                   Fondo blanco para que PNG con transparencia no
                   termine con fondo negro al convertir a JPEG.
                */
                contexto.fillStyle = '#ffffff';
                contexto.fillRect(0, 0, anchoFinal, altoFinal);
                contexto.drawImage(imagen, 0, 0, anchoFinal, altoFinal);

                /*
                   JPEG comprimido: suficiente para el prototipo actual
                   que guarda General Chat en localStorage.
                */
                const dataUrl = lienzo.toDataURL('image/jpeg', 0.78);

                resolve(dataUrl);
            };

            imagen.src = lector.result;
        };

        lector.readAsDataURL(archivo);
    });
}

function actualizarPreviewImagenPost() {
    const boton = document.getElementById('select-image-post');
    const preview = document.getElementById('preview-imagen-post');

    if (!boton || !preview) {
        return;
    }

    if (imagenAdjuntaPost) {
        preview.src = imagenAdjuntaPost;
        preview.alt = nombreImagenAdjuntaPost || 'Selected image';
        boton.classList.add('tiene-imagen');
    } else {
        preview.removeAttribute('src');
        preview.alt = 'Selected image';
        boton.classList.remove('tiene-imagen');
    }
}

function quitarImagenAdjuntaPost() {
    imagenAdjuntaPost = null;
    nombreImagenAdjuntaPost = '';

    const input = document.getElementById('input-imagen-post');

    if (input) {
        input.value = '';
    }

    actualizarPreviewImagenPost();
}

function publicarPostGeneral() {
    let contenidoPost = {};

    if (modoActual === 'texto') {
        const texto = document.getElementById('texto-nuevo-post').value;

        /*
           Ahora una imagen también cuenta como contenido:
           - texto solo
           - imagen sola
           - texto + imagen
        */
        if (texto.trim() === '' && !imagenAdjuntaPost) {
            alert("¡Escribe algo o adjunta una imagen!");
            return;
        }

        contenidoPost = {
            tipo: 'texto',
            valor: texto
        };
    } else {
        const imagenDataUrl = exportarDibujoPost();

        contenidoPost = {
            tipo: 'dibujo',
            valor: imagenDataUrl
        };
    }

    const pnid = localStorage.getItem('makiiverse_pnid') || 'Makii';

    const nuevoMensaje = {
        id: Date.now(),
        autor: pnid,
        tipo: contenidoPost.tipo,
        contenido: contenidoPost.valor,

        /*
           La imagen seleccionada es independiente del texto/dibujo.
           Así también se puede adjuntar una imagen a un dibujo.
        */
        imagenAdjunta: imagenAdjuntaPost || null,

        expresion: expresionActual,
        spoiler: !!(
            document.getElementById('check-spoiler')
            && document.getElementById('check-spoiler').checked
        ),
        fecha: new Date().toLocaleTimeString()
    };

    let mensajesGuardados = JSON.parse(
        localStorage.getItem('makiiverse_mensajes') || '[]'
    );

    mensajesGuardados.unshift(nuevoMensaje);

    try {
        localStorage.setItem(
            'makiiverse_mensajes',
            JSON.stringify(mensajesGuardados)
        );
    } catch (error) {
        console.error('No se pudo guardar el post:', error);

        alert(
            'No hay suficiente espacio local para guardar esta imagen. ' +
            'Prueba con una imagen más pequeña.'
        );

        return;
    }

    cerrarModalPostGeneral();
    renderizarMensajes();
}

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
            contenidoHTML = `<img src="${msg.contenido}" style="max-width: 100%; border-radius: 6px; background: #fff; display: block;">`;
        } else {
            contenidoHTML = `<p style="margin: 0; font-size: 21px; color: #333; word-break: break-word; font-family: sans-serif; line-height: 1.7;">${escapeHTML(msg.contenido || '')}</p>`;
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

                <!-- Pie de tarjeta -->
                <div style="background: #fafafa; border-top: 1px solid #eaeaea; padding: 12px 20px; display: flex; gap: 28px; font-size: 15px; color: #666;">
                    <span>👍 Yeah! (0)</span>
                    <span>💬 0</span>
                </div>
            </div>
        `;

        muro.appendChild(contenedorPost);
    });
}

function eliminarMensaje(id) {
    if (!confirm("¿Deseas eliminar este mensaje?")) return;

    let mensajesGuardados = JSON.parse(localStorage.getItem('makiiverse_mensajes') || '[]');
    mensajesGuardados = mensajesGuardados.filter(msg => msg.id !== id);
    
    localStorage.setItem('makiiverse_mensajes', JSON.stringify(mensajesGuardados));
    renderizarMensajes();
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
