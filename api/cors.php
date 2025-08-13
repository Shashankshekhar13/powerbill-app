<?php
// File: api/cors.php
// Note: session_start() will be handled in each endpoint that needs it.

$allowed_origin = 'http://localhost'; // The origin of your frontend

if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN'] === $allowed_origin) {
    header("Access-Control-Allow-Origin: " . $allowed_origin);
    header("Access-Control-Allow-Credentials: true");
}

header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Max-Age: 86400"); // Cache for 1 day

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(204); // No Content
    exit();
}
?>