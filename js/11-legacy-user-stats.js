/* ============================================================
   MAKI'S BIO V23 — extracted from index.html
   Original inline script #11
   Mode: classic script
   ============================================================ */

 async function cargarEstadisticasUsuario(pnid) {
    try {
        // 1. Referencia a tu base de datos (asegúrate de tener firebase inicializado)
        const db = firebase.firestore();

        // 2. Contar los Posts del usuario
        const postsRef = db.collection('posts');
        const postsSnapshot = await postsRef.where('autor', '==', pnid).get();
        const totalPosts = postsSnapshot.size;

        // Actualizar el DOM con el número real de posts
        document.getElementById('info-yeahs').textContent = totalPosts; // (O el elemento de posts que tengas)
        
        // Si tienes un elemento específico para el contador de la pestaña de posts:
        const contadorPostsTab = document.getElementById('contador-posts-usuario');
        if (contadorPostsTab) {
            contadorPostsTab.textContent = totalPosts;
        }

        // 3. Contar los Yeahs (puedes sumar un campo 'yeahsCount' de sus posts o contar documentos en otra colección)
        let totalYeahs = 0;
        postsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.yeahs) {
                totalYeahs += data.yeahs.length; // O el número directo si guardas un contador
            }
        });

        // Actualizar elemento de Yeahs si creas uno específico para los likes recibidos
        // document.getElementById('info-yeahs-recibidos').textContent = totalYeahs;

    } catch (error) {
        console.error("Error al cargar las estadísticas del usuario:", error);
    }
}
