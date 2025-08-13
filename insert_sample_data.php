<?php
// File: insert_sample_data.php
// To run: open CMD/Terminal, navigate to project root, and run: php insert_sample_data.php

ini_set('display_errors', 1);
error_reporting(E_ALL);
echo "--- Starting Sample Data Insertion Script ---\n";

require_once 'config/db.php';

// --- Sample Data ---
$usersData = [
    [ // User 1: Sandhya
        'name' => 'Sandhya Sinha', 'email' => 'sandhya.sinha@gmail.com', 'password' => 'password123',
        'phone' => '9876543210', 'consumer_id' => 'MH78901234', 'meter_number' => 'METR456789',
        'supply_type' => 'Domestic - 1 Phase', 'sanctioned_load' => '4 kW',
        'bills' => [
            [ // Paid bill
                'bill_period_start' => '2025-01-15', 'bill_period_end' => '2025-02-14', 'due_date' => '2025-02-28',
                'units_consumed' => 210, 'energy_charges' => 1165.00, 'fixed_charges' => 90.00, 'fuel_surcharge' => 55.80,
                'tax_amount' => 100.50, 'subsidy_amount' => 250.00, 'net_amount' => 1161.30,
                'status' => 'paid', 'payment_date' => '2025-02-20 10:30:00',
                'slabs' => [
                    ['range' => '0-100 Units', 'rate' => 4.50, 'units' => 100, 'amount' => 450.00],
                    ['range' => '101-200 Units', 'rate' => 6.50, 'units' => 100, 'amount' => 650.00],
                    ['range' => '201-500 Units', 'rate' => 6.50, 'units' => 10, 'amount' => 65.00]
                ]
            ],
            [ // Unpaid bill
                'bill_period_start' => '2025-02-15', 'bill_period_end' => '2025-03-15', 'due_date' => '2025-03-25',
                'units_consumed' => 750, 'energy_charges' => 6025.00, 'fixed_charges' => 100.00, 'fuel_surcharge' => 225.75,
                'tax_amount' => 380.00, 'subsidy_amount' => 3480.00, 'net_amount' => 3250.75,
                'status' => 'unpaid', 'payment_date' => null,
                'slabs' => [
                    ['range' => '0-100 Units', 'rate' => 4.50, 'units' => 100, 'amount' => 450.00],
                    ['range' => '101-200 Units', 'rate' => 6.50, 'units' => 100, 'amount' => 650.00],
                    ['range' => '201-500 Units', 'rate' => 8.50, 'units' => 300, 'amount' => 2550.00],
                    ['range' => 'Above 500 Units', 'rate' => 9.50, 'units' => 250, 'amount' => 2375.00]
                ]
            ]
        ]
    ],
    [ // User 2: Shashank
        'name' => 'Shashank Shekhar', 'email' => 'shashank.shekhar@gmail.com', 'password' => 'pass4567',
        'phone' => '9123456780', 'consumer_id' => 'DL11223344', 'meter_number' => 'METR112233',
        'supply_type' => 'Domestic - 3 Phase', 'sanctioned_load' => '8 kW',
        'bills' => [
            [
                'bill_period_start' => '2025-02-05', 'bill_period_end' => '2025-03-04', 'due_date' => '2025-03-20',
                'units_consumed' => 480, 'energy_charges' => 3660.00, 'fixed_charges' => 150.00, 'fuel_surcharge' => 195.50,
                'tax_amount' => 290.25, 'subsidy_amount' => 600.00, 'net_amount' => 3695.75,
                'status' => 'unpaid', 'payment_date' => null,
                'slabs' => [
                    ['range' => '0-150 Units', 'rate' => 5.50, 'units' => 150, 'amount' => 825.00],
                    ['range' => '151-300 Units', 'rate' => 7.50, 'units' => 150, 'amount' => 1125.00],
                    ['range' => '301-600 Units', 'rate' => 9.50, 'units' => 180, 'amount' => 1710.00]
                ]
            ]
        ]
    ],
    [ // User 3: Harshit - No bills yet
        'name' => 'Harshit Sharma', 'email' => 'Harshit.sharma@gmail.com', 'password' => 'pass1234',
        'phone' => '7778889990', 'consumer_id' => 'UP987654', 'meter_number' => 'METR998877',
        'supply_type' => 'Domestic - 1 Phase', 'sanctioned_load' => '3 kW',
        'bills' => [] // Empty bills array
    ]
];

try {
    $conn->begin_transaction();
    echo "Transaction started.\n";

    $sqlUser = "INSERT INTO users (name, email, password, phone, consumer_id, meter_number, supply_type, sanctioned_load) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $stmtUser = $conn->prepare($sqlUser);

    $sqlBill = "INSERT INTO bills (user_id, bill_period_start, bill_period_end, due_date, units_consumed, energy_charges, fixed_charges, fuel_surcharge, tax_amount, subsidy_amount, net_amount, status, payment_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmtBill = $conn->prepare($sqlBill);

    $sqlSlab = "INSERT INTO bill_slabs (bill_id, slab_range, rate, units, amount) VALUES (?, ?, ?, ?, ?)";
    $stmtSlab = $conn->prepare($sqlSlab);

    foreach ($usersData as $userData) {
        $hashedPassword = password_hash($userData['password'], PASSWORD_DEFAULT);
        $stmtUser->bind_param("ssssssss",
            $userData['name'], $userData['email'], $hashedPassword, $userData['phone'],
            $userData['consumer_id'], $userData['meter_number'], $userData['supply_type'], $userData['sanctioned_load']
        );
        $stmtUser->execute();
        $userId = $conn->insert_id;
        echo "Inserted user: " . $userData['email'] . "\n";

        foreach ($userData['bills'] as $billData) {
            $stmtBill->bind_param("isssiddiddsss",
                $userId, $billData['bill_period_start'], $billData['bill_period_end'], $billData['due_date'],
                $billData['units_consumed'], $billData['energy_charges'], $billData['fixed_charges'],
                $billData['fuel_surcharge'], $billData['tax_amount'], $billData['subsidy_amount'],
                $billData['net_amount'], $billData['status'], $billData['payment_date']
            );
            $stmtBill->execute();
            $billId = $conn->insert_id;

            foreach ($billData['slabs'] as $slabData) {
                $stmtSlab->bind_param("isdid",
                    $billId, $slabData['range'], $slabData['rate'], $slabData['units'], $slabData['amount']
                );
                $stmtSlab->execute();
            }
        }
    }

    $stmtUser->close();
    $stmtBill->close();
    $stmtSlab->close();
    $conn->commit();
    echo "Transaction committed. Sample data inserted successfully!\n";

} catch (Exception $e) {
    $conn->rollback();
    echo "An error occurred: " . $e->getMessage() . "\n";
} finally {
    $conn->close();
    echo "--- Script Finished ---\n";
}
?>