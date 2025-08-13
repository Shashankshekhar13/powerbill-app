<?php
// File: api/signup.php

ini_set('display_errors', 1); // For debugging
error_reporting(E_ALL);

require_once '../config/db.php';
require_once './cors.php';

header('Content-Type: application/json');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Only POST method is allowed.']);
    exit;
}

// Get input data from JSON request body
$input = json_decode(file_get_contents('php://input'), true);

// Basic Validation
if (empty($input['name']) || empty($input['email']) || empty($input['password']) || empty($input['phone']) || empty($input['consumerId'])) {
    http_response_code(400);
    echo json_encode(['message' => 'Please provide all required fields.']);
    exit;
}

$name = $input['name'];
$email = strtolower($input['email']);
$password = $input['password'];
$phone = $input['phone'];
$consumerId = $input['consumerId'];

// More specific validation (can add regex later if needed)
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid email format.']);
    exit;
}

try {
    // Check if email or consumer ID already exists
    $sqlCheck = "SELECT id FROM users WHERE email = ? OR consumer_id = ?";
    $stmtCheck = $conn->prepare($sqlCheck);
    $stmtCheck->bind_param("ss", $email, $consumerId);
    $stmtCheck->execute();
    $stmtCheck->store_result();
    if ($stmtCheck->num_rows > 0) {
        http_response_code(409); // Conflict
        echo json_encode(['message' => 'Email or Consumer ID already registered.']);
        $stmtCheck->close();
        $conn->close();
        exit;
    }
    $stmtCheck->close();

    // Hash Password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert User
    $sqlInsert = "INSERT INTO users (name, email, password, phone, consumer_id) VALUES (?, ?, ?, ?, ?)";
    $stmtInsert = $conn->prepare($sqlInsert);
    $stmtInsert->bind_param("sssss", $name, $email, $hashedPassword, $phone, $consumerId);

    if ($stmtInsert->execute()) {
        http_response_code(201); // Created
        echo json_encode(['message' => 'User registered successfully.']);
    } else {
         throw new Exception("Failed to register user: " . $stmtInsert->error);
    }
    $stmtInsert->close();

} catch (Exception $e) {
    http_response_code(500);
    error_log("Signup Error: " . $e->getMessage());
    echo json_encode(['message' => 'Server error during registration.']);
} finally {
    $conn->close();
}
?>