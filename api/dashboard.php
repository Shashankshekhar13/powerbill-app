<?php
// File: api/dashboard.php (Updated for real data)

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
    http_response_code(401);
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
    // 1. Fetch User Data (Same as before)
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

    // 2. Fetch Latest Bill Data (REAL DATABASE QUERY)
    $sqlBill = "SELECT * FROM bills WHERE user_id = ? ORDER BY bill_period_end DESC LIMIT 1";
    $stmtBill = $conn->prepare($sqlBill);
    $stmtBill->bind_param("i", $userId);
    $stmtBill->execute();
    $resultBill = $stmtBill->get_result();

    $latestBillData = null;
    if ($resultBill->num_rows === 1) {
        $billData = $resultBill->fetch_assoc();
        $billId = $billData['id'];

        // Fetch Slab Data for this specific bill
        $sqlSlabs = "SELECT slab_range, rate, units, amount FROM bill_slabs WHERE bill_id = ? ORDER BY id ASC";
        $stmtSlabs = $conn->prepare($sqlSlabs);
        $stmtSlabs->bind_param("i", $billId);
        $stmtSlabs->execute();
        $resultSlabs = $stmtSlabs->get_result();
        $slabCharges = [];
        while ($slab = $resultSlabs->fetch_assoc()) {
             $slabCharges[] = ['range' => $slab['slab_range'], 'rate' => floatval($slab['rate']), 'units' => intval($slab['units']), 'amount' => floatval($slab['amount'])];
        }
        $stmtSlabs->close();
        
        // Fetch Consumption History (REAL QUERY for last 3 bills)
        $sqlHistory = "SELECT bill_period_end, units_consumed FROM bills WHERE user_id = ? ORDER BY bill_period_end DESC LIMIT 3";
        $stmtHistory = $conn->prepare($sqlHistory);
        $stmtHistory->bind_param("i", $userId);
        $stmtHistory->execute();
        $resultHistory = $stmtHistory->get_result();
        $consumptionHistory = [];
        while ($historyRow = $resultHistory->fetch_assoc()) {
            $consumptionHistory[] = [
                'month' => date('M', strtotime($historyRow['bill_period_end'])),
                'units' => intval($historyRow['units_consumed'])
            ];
        }
        // Reverse to show oldest first in the chart
        $consumptionHistory = array_reverse($consumptionHistory);
        $stmtHistory->close();

        // Structure the bill data for the frontend
        $latestBillData = [
            'id' => $billId,
            'amount' => floatval($billData['net_amount']),
            'dueDate' => date('F j, Y', strtotime($billData['due_date'])),
            'period' => date('F j', strtotime($billData['bill_period_start'])) . ' - ' . date('F j, Y', strtotime($billData['bill_period_end'])),
            'status' => $billData['status'],
            'slabCharges' => $slabCharges,
            'billComponents' => [
                'energyCharges' => floatval($billData['energy_charges']), 'fixedCharges' => floatval($billData['fixed_charges']),
                'fuelSurcharge' => floatval($billData['fuel_surcharge']), 'taxGST' => floatval($billData['tax_amount']),
                'subsidy' => -abs(floatval($billData['subsidy_amount'])), 'netAmount' => floatval($billData['net_amount']),
            ],
            'consumptionHistory' => $consumptionHistory
        ];

    } else {
        // No bills found for user, provide a default structure
        $latestBillData = [
            'id' => null, 'amount' => 0, 'dueDate' => 'N/A', 'period' => 'No bills found', 'status' => 'none',
            'slabCharges' => [], 'billComponents' => ['energyCharges' => 0, 'fixedCharges' => 0, 'fuelSurcharge' => 0, 'taxGST' => 0, 'subsidy' => 0, 'netAmount' => 0],
            'consumptionHistory' => []
        ];
    }
    $stmtBill->close();
    
    $dashboardData['currentBill'] = $latestBillData;
    
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