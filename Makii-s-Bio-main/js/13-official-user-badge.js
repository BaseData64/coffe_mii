/* ============================================================
   MAKI'S BIO V23 — extracted from index.html
   Original inline script #13
   Mode: classic script
   ============================================================ */

(function() {
    const observer = new MutationObserver(() => {
        // Buscamos cualquier elemento cuyo texto o contenido sea exactamente tu usuario
        const elementos = document.querySelectorAll('span, p, a, div, b, strong');
        
        elementos.forEach(el => {
            const texto = el.textContent ? el.textContent.trim() : '';
            
            // Verificamos si este elemento contiene tu PNID exacto
            if (texto === "YosMakii99_PN" && !el.dataset.insigniaPuesta) {
                console.log("¡Usuario encontrado en el DOM!", el);
                
                // Buscamos el contenedor de la tarjeta o post más cercano
                let contenedorPadre = el.closest('.post, .comment, article, .item, .box, div') || el.parentElement;
                if (!contenedorPadre) return;
                
                // Buscamos la imagen del Mii dentro de ese bloque
                let avatarImg = contenedorPadre.querySelector('img');
                
                if (avatarImg && avatarImg.parentNode) {
                    let wrapper = avatarImg.parentNode;
                    
                    wrapper.style.position = 'relative';
                    wrapper.style.overflow = 'visible';
                    
                    if (!wrapper.querySelector('.user-verified-mark')) {
                        const badge = document.createElement('img');
                        badge.src = 'img/identified-user-mark.png';
                        badge.className = 'user-verified-mark';
                        badge.style.cssText = 'position: absolute; top: -8px; left: -8px; width: 30px; height: 30px; pointer-events: none; z-index: 99999; display: block;';
                        wrapper.appendChild(badge);
                        
                        el.dataset.insigniaPuesta = "true";
                        console.log("¡Insignia inyectada con éxito!");
                    }
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();

// FUNCIÓN ÚNICA Y UNIFICADA PARA PUBLICAR POSTS (Con validación de usuario activa)
export async function registrarNuevoPost(textoPost, expresionActual) {
    let user = auth.currentUser;

    // Si Firebase aún no carga el usuario en memoria, intentamos asegurarlo o esperamos un momento
    if (!user) {
        console.warn("Esperando sesión de Firebase Auth...");
        await new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged((u) => {
                unsubscribe();
                user = u;
                resolve();
            });
        });
    }

    if (user) {
        try {
            const postsRef = ref(db, 'posts'); 
            const nuevoPostRef = push(postsRef); 
            
            // Forzamos tu usuario si coincide con tu sesión o el localStorage
            const autorActual = localStorage.getItem('makiiverse_pnid') || 'YosMakii99_PN';

            await set(nuevoPostRef, {
                uid: user.uid,
                autor: autorActual,
                contenido: textoPost,
                expresion: expresionActual || 'normal',
                fecha: new Date().toLocaleTimeString()
            });

            const userRef = ref(db, 'users/' + user.uid);
            await update(userRef, {
                postCount: increment(1)
            });
            
            console.log("Post enviado y contador de cuenta incrementado.");
            return true;
        } catch (error) {
            console.error("Error al actualizar el post y contador:", error);
            return false;
        }
    } else {
        console.error("No hay ningún usuario autenticado en Firebase Auth.");
        alert("Debes iniciar sesión para poder publicar.");
        return false;
    }
}
