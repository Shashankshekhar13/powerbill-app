<?php
// File: api/logout.php

// Start session to access and destroy it
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

require_once './cors.php'; // Include CORS headers

header('Content-Type: application/json');

// Unset all session variables
$_SESSION = array();

// Destroy the session cookie if it exists
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Finally, destroy the session data on the server
session_destroy();

http_response_code(200);
echo json_encode(['message' => 'Logout successful.']);
?>