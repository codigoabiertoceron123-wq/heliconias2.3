<?php
// login.php
session_start();
require_once 'db/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Obtener datos del formulario
    $nombre = trim($_POST['nombre']);
    $documento = trim($_POST['documento']);
    
    // Validar que no estén vacíos
    if (empty($nombre) || empty($documento)) {
        echo "<script>
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Por favor, completa todos los campos'
            });
        </script>";
        exit;
    }
    
    try {
        // Conectar a la base de datos
        $pdo = getDBConnection();
        
        // Preparar la consulta para buscar el usuario
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE nombre = :nombre AND documento = :documento");
        $stmt->bindParam(':nombre', $nombre);
        $stmt->bindParam(':documento', $documento);
        $stmt->execute();
        
        // Verificar si se encontró el usuario
        if ($stmt->rowCount() > 0) {
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Iniciar sesión
            $_SESSION['usuario_id'] = $usuario['id'];
            $_SESSION['usuario_nombre'] = $usuario['nombre'];
            $_SESSION['documento'] = $usuario['documento'];
            
            // Redirigir al dashboard
            echo "<script>
                Swal.fire({
                    icon: 'success',
                    title: '¡Bienvenido!',
                    text: 'Inicio de sesión exitoso',
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    window.location.href = 'dashboard.php';
                });
            </script>";
            
        } else {
            // Usuario no encontrado
            echo "<script>
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Usuario o documento incorrectos'
                });
            </script>";
        }
        
    } catch (PDOException $e) {
        // Error de base de datos
        echo "<script>
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo conectar a la base de datos: " . addslashes($e->getMessage()) . "'
            });
        </script>";
    }
}
?>