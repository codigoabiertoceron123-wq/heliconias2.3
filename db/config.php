<?php
// config.php
define('DB_HOST', 'bwxudqa3ebnte1etlfnb-mysql.services.clever-cloud.com');
define('DB_NAME', 'bwxudqa3ebnte1etlfnb');
define('DB_USER', 'uwpgy6zazhhtkyyt');
define('DB_PASS', 'ZtUiXsA6uUz8C2YGWLWe');
define('DB_PORT', '3306');

// Función para conexión PDO
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]);
        return $pdo;
    } catch (PDOException $e) {
        die("Error de conexión: " . $e->getMessage());
    }
}
?>