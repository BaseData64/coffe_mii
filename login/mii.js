document.getElementById('miiverseLoginForm').addEventListener('submit', function(e) {
    e.preventDefault(); 

    const pnid = document.getElementById('pnid').value.trim();
    // Capturamos la contraseña por estética, pero JAMÁS la enviamos ni la guardamos
    const password = document.getElementById('password').value; 
    
    const btnSubmit = document.querySelector('.btn-submit');
    const errorDiv = document.getElementById('mensaje-error');

    // Resetear estado
    errorDiv.style.display = 'none';
    btnSubmit.textContent = "Verificando...";
    btnSubmit.disabled = true;

    // VALIDACIÓN SEGURA: Intentamos descargar el Mii en segundo plano
    const validadorMii = new Image();
    
    validadorMii.onload = function() {
        // ÉXITO: La API encontró el Mii, el PNID es correcto.
        // Guardamos el PNID y redirigimos. La contraseña se pierde en el vacío (seguridad total).
        localStorage.setItem('makiiverse_pnid', pnid);
        window.location.href = 'index.html'; 
    };

    validadorMii.onerror = function() {
        // ERROR: La API no encontró el Mii. El PNID está mal escrito o no existe.
        errorDiv.textContent = "Código de error: 102-2128. El Pretendo Network ID es incorrecto o no existe.";
        errorDiv.style.display = 'block';
        
        // Restaurar el botón
        btnSubmit.textContent = "Iniciar sesión";
        btnSubmit.disabled = false;
    };

    // Disparador de la validación
    validadorMii.src = `https://mii-unsecure.ariankordi.net/miis/image.png?nnid=${encodeURIComponent(pnid)}&type=face&width=270&api_id=1`;
});