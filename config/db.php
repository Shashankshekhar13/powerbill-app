<?php
// File: config/db.php

// Load Environment Variables from .env file
require_once __DIR__ . '/../vendor/autoload.php';

try {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
    $dotenv->load();
} catch (\Throwable $th) {
    // Handle error if .env file is missing or unreadable
    // In a real app, you'd log this error. For now, we can die.
    die("Could not find .env file. Please create one based on .env.example.");
}

// Define constants using the loaded environment variables
define('DB_HOST', $_ENV['DB_HOST'] ?? 'localhost');
define('DB_USER', $_ENV['DB_USER'] ?? 'root');
define('DB_PASS', $_ENV['DB_PASS'] ?? '');
define('DB_NAME', $_ENV['DB_NAME'] ?? 'powerbill_db');

// Establish Connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Check Connection
if ($conn->connect_error) {
    // In a real API, you'd return a JSON error, but for setup, dying is okay.
    http_response_code(500);
    // Don't echo the full error in production as it can leak info.
    error_log("Database Connection Error: " . $conn->connect_error);
    die(json_encode(['message' => 'Database connection failed.']));
}

// Set character set to UTF-8
$conn->set_charset("utf8mb4");

?>