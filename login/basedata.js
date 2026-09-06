import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"; 

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 1. FUNCIÓN DE INICIO DE SESIÓN
window.iniciarSesionFirebase = async function(pnid, password) {
    try {
        const pnidClean = pnid.trim().toLowerCase();
        const emailFicticio = `${pnidClean}@makiiverse.com`;
        
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

// 2. OBTENER EL NOMBRE REAL DEL MII DESDE LA API DE ARIANKORDI
window.cargarNombreRealMii = async function(pnidUsuario) {
    let nombreMostrable = pnidUsuario; // Respaldo inicial

    try {
        const response = await fetch(`https://mii-unsecure.ariankordi.net/mii_data/${encodeURIComponent(pnidUsuario)}?api_id=1`);
        
        if (response.ok) {
            const data = await response.json(); // Lectura correcta del JSON
            if (data) {
                if (data.name) {
                    nombreMostrable = data.name;
                } else if (data.miiName) {
                    nombreMostrable = data.miiName;
                } else if (data.mii && data.mii.name) {
                    nombreMostrable = data.mii.name;
                }
            }
        }
        
        // Si la API no dio nombre, consultamos Firestore
        if (nombreMostrable === pnidUsuario) {
            const docRef = doc(db, "usuarios", pnidUsuario);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                nombreMostrable = userData.miiName || userData.name || pnidUsuario;
            }
        }
    } catch (error) {
        console.error("Error al consultar la API del Mii:", error);
    }

    // Asignación individual para evitar duplicados visuales raros
    const elNombreReal = document.getElementById('nombre-real-mii');
    if (elNombreReal) elNombreReal.innerText = nombreMostrable;

    const elNombrePost = document.getElementById('nombre-mii-post');
    if (elNombrePost) elNombrePost.innerText = nombreMostrable;

    const elProfileUser = document.getElementById('profile-username');
    if (elProfileUser) elProfileUser.innerText = nombreMostrable;
};

// 3. ACTUALIZAR VISTA DE PERFIL Y SESIÓN
function actualizarVistaUserPage() {
    const pnidGuardado = localStorage.getItem('makiiverse_pnid');

    if (!pnidGuardado) {
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
        return;
    }

    const miiUrl = `https://mii-unsecure.ariankordi.net/miis/image.png?nnid=${encodeURIComponent(pnidGuardado)}&type=face&width=270&api_id=1`;

    const subPnidEl = document.getElementById('profile-pnid-sub');
    if (subPnidEl) subPnidEl.textContent = pnidGuardado;

    const miiImgProfile = document.getElementById('profile-mii-img');
    if (miiImgProfile) {
        miiImgProfile.src = miiUrl;
        miiImgProfile.onerror = function() {
            this.src = 'img/games/Dummy_mii_user.png';
        };
    }

    // Carga el nombre real del Mii
    window.cargarNombreRealMii(pnidGuardado);
}

window.addEventListener('DOMContentLoaded', () => {
    actualizarVistaUserPage();
});

window.cerrarSesion = function() {
    localStorage.removeItem('makiiverse_pnid');
    window.location.href = 'login.html';
};