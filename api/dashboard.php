<?php
// File: api/dashboard.php

ini_set('display_errors', 1);
error_reporting(E_ALL);

// === IMPORTANT: Start session BEFORE any output ===
if (session_status() == PHP_SESSION_NONE) {
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'domain' => '', 'secure' => false, 'httponly' => true, 'samesite' => 'Lax']);
    session_start();
}

require_once '../config/db.php';
require_once './cors.php';

header('Content-Type: application/json');

// --- Authentication Check ---
if (!isset($_SESSION['user_id']) || empty($_SESSION['user_id'])) {
    http_response_code(401); // Unauthorized
    echo json_encode(['message' => 'Not authorized. Please log in.']);
    exit;
}

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['message' => 'Only GET method is allowed.']);
    exit;
}

$userId = $_SESSION['user_id'];
$dashboardData = [];

try {
    // 1. Fetch User Data
    $sqlUser = "SELECT name, email, phone, consumer_id, meter_number, supply_type, sanctioned_load FROM users WHERE id = ?";
    $stmtUser = $conn->prepare($sqlUser);
    $stmtUser->bind_param("i", $userId);
    $stmtUser->execute();
    $resultUser = $stmtUser->get_result();
    if ($resultUser->num_rows !== 1) {
        http_response_code(404);
        echo json_encode(['message' => 'User not found for this session.']);
        exit;
    }
    $userData = $resultUser->fetch_assoc();
    $stmtUser->close();

    $dashboardData['consumerInfo'] = [
        'consumerId' => $userData['consumer_id'], 'name' => $userData['name'], 'email' => $userData['email'],
        'phone' => $userData['phone'], 'meterNumber' => $userData['meter_number'],
        'supplyType' => $userData['supply_type'], 'sanctionedLoad' => $userData['sanctioned_load'],
    ];

    // 2. Fetch Latest Bill Data (FOR NOW, WE'LL SIMULATE THIS)
    // In the next phase, we will replace this with a real DB query
    // This is placeholder data to build the UI.
    $dashboardData['currentBill'] = [
        'id' => 1, // Example Bill ID
        'amount' => 1234.56,
        'dueDate' => 'June 25, 2025',
        'period' => 'May 1, 2025 - May 31, 2025',
        'status' => 'unpaid',
        'slabCharges' => [
            ['range' => '0-100 Units', 'rate' => 5.50, 'units' => 100, 'amount' => 550.00],
            ['range' => '101-200 Units', 'rate' => 7.50, 'units' => 50, 'amount' => 375.00]
        ],
        'billComponents' => [
            'energyCharges' => 925.00, 'fixedCharges' => 100.00,
            'fuelSurcharge' => 50.00, 'taxGST' => 159.56,
            'subsidy' => -100.00, 'netAmount' => 1234.56,
        ],
        'consumptionHistory' => [
            ['month' => 'Mar', 'units' => 120],
            ['month' => 'Apr', 'units' => 135],
            ['month' => 'May', 'units' => 150],
        ]
    ];
    
    http_response_code(200);
    echo json_encode($dashboardData);

} catch (Exception $e) {
    http_response_code(500);
    error_log("Dashboard Error for UserID " . $userId . ": " . $e->getMessage());
    echo json_encode(['message' => 'Server error fetching dashboard data.']);
} finally {
    $conn->close();
}
?>