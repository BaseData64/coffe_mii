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

// Suponiendo que obtienes los datos de tu usuario de Firebase:
if (userData.official_user === true || userData.official_user === 1) {
    const profileHeader = document.getElementById("user-profile-name"); // El contenedor donde está tu nombre de usuario
    
    if (profileHeader) {
        // Creamos la insignia y la organización de golpe al lado de tu nombre
        const badgeHTML = `
            <span class="official-badge-container" style="display: inline-flex; align-items: center; margin-left: 6px;">
                <img src="img/identified-user-mark.png" alt="Official" style="width: 16px; height: 16px; vertical-align: middle;">
                ${userData.organization ? `<span style="font-size: 0.85em; margin-left: 4px; opacity: 0.8;">${userData.organization}</span>` : ''}
            </span>
        `;
        profileHeader.insertAdjacentHTML('beforeend', badgeHTML);
    }
}
});