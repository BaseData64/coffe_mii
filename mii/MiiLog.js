import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Configuración de tu proyecto de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBC1CU5NvbyYvgb6W2nbxAWXtdPV63qhnA",
    authDomain: "maki-s-bio.firebaseapp.com",
    databaseURL: "https://maki-s-bio-default-rtdb.firebaseio.com",
    projectId: "maki-s-bio",
    storageBucket: "maki-s-bio.firebasestorage.app",
    messagingSenderId: "267692056127",
    appId: "1:267692056127:web:472b5f1ca8c82db4a3228a",
    measurementId: "G-VQNKS44LPK"
};

// Inicialización única de Firebase y Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 1. FUNCIÓN DE INICIO DE SESIÓN EXPUESTA A WINDOW
window.iniciarSesionFirebase = async function(pnid, password) {
    try {
        const emailFicticio = `${pnid.toLowerCase().replace(/[^a-z0-9]/g, '')}@makiiverse.com`;
        const userCredential = await signInWithEmailAndPassword(auth, emailFicticio, password);
        
        return {
            exito: true,
            user: userCredential.user
        };
    } catch (error) {
        console.error("Error de Firebase:", error.code);
        return {
            exito: false,
            codigo: error.code
        };
    }
};

// 2. FUNCIONES DE PERFIL Y SESIÓN
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

window.cerrarSesion = function() {
    localStorage.removeItem('makiiverse_pnid');
    window.location.href = 'login.html';
};

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