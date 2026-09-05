<?php
session_start();
header('Content-Type: application/json');

// Ajusta esto a cómo guardas la sesión en tu clon de Miiverse
$usuarioActual = isset($_SESSION['user']) ? $_SESSION['user'] : ''; 

// Devuelve un JSON diciendo si eres tú o no
echo json_encode(['esDuenio' => ($usuarioActual === 'YosMakii99_PN')]);
?>