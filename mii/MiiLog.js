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

