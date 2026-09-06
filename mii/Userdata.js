import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const auth = getAuth();
const db = getFirestore();

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const userData = docSnap.data();
            const avatarUrl = `https://mii-unsecure.ariankordi.net/mii/${userData.pnid}/normal_face.png`;
            
            // 1. Usar querySelectorAll para clases en lugar de getElementById
            document.querySelectorAll(".nombre-real-mii").forEach(el => {
                if (el.textContent !== userData.nombreMii) {
                    el.textContent = userData.nombreMii;
                }
            });

            document.querySelectorAll(".nombre-mii-post").forEach(el => {
                if (el.textContent !== userData.nombreMii) {
                    el.textContent = userData.nombreMii;
                }
            });

            // 2. Reemplazar imágenes dummy de forma segura
            document.querySelectorAll('img[src*="Dummy_mii_user.png"]').forEach(img => {
                if (!img.src.includes(userData.pnid)) {
                    img.src = avatarUrl;
                }
            });

            // 3. Configurar el botón del modal
            const botonCrearPost = document.getElementById("boton-abrir-modal");
            if (botonCrearPost) {
                botonCrearPost.onclick = () => {
                    if (typeof abrirModalCrearPost === 'function') {
                        abrirModalCrearPost(userData.pnid);
                    }
                };
            }
        }
    }
});