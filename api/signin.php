<?php
// File: api/signin.php

ini_set('display_errors', 1); // For debugging
error_reporting(E_ALL);

// === IMPORTANT: Start session BEFORE any output ===
if (session_status() == PHP_SESSION_NONE) {
    // Setting secure cookie parameters for session
    session_set_cookie_params([
        'lifetime' => 0, // Until browser closes
        'path' => '/',
        'domain' => '', // Your domain
        'secure' => false, // Set to true if using HTTPS
        'httponly' => true, // Prevent JS access to cookie
        'samesite' => 'Lax' // CSRF protection
    ]);
    session_start();
}

require_once '../config/db.php';
require_once './cors.php';

header('Content-Type: application/json');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Only POST method is allowed.']);
    exit;
}

// Get input data
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (empty($input['email']) || empty($input['password'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Please provide email and password.']);
    exit;
}

$email = strtolower($input['email']);
$password = $input['password'];

try {
    // Prepare statement to fetch user by email
    $sql = "SELECT id, password FROM users WHERE email = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) throw new Exception("Statement preparation failed: " . $conn->error);

    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    // Check if user exists
    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();

        // Verify password
        if (password_verify($password, $user['password'])) {
            // Password Correct - LOGIN SUCCESS

            // Regenerate session ID for security to prevent session fixation
            session_regenerate_id(true);

            // Store user ID in session
            $_SESSION['user_id'] = $user['id'];
            
            http_response_code(200);
            echo json_encode(['message' => 'Login successful.']);

        } else {
            // Invalid password
            http_response_code(401); // Unauthorized
            echo json_encode(['message' => 'Invalid email or password.']);
        }
    } else {
        // User not found
        http_response_code(401); // Unauthorized
        echo json_encode(['message' => 'Invalid email or password.']);
    }
    $stmt->close();

} catch (Exception $e) {
    http_response_code(500);
    error_log("Signin Error for " . $email . ": " . $e->getMessage());
    echo json_encode(['message' => 'Server error during login.']);
} finally {
    $conn->close();
}
?>