// scripts/seed.js — Insert sample data (port of insert_sample_data.php)
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedDatabase() {
    console.log('--- Starting Sample Data Insertion Script ---\n');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'powerbill_db',
        charset: 'utf8mb4'
    });

    // Same sample data as PHP insert_sample_data.php
    const usersData = [
        {
            name: 'Sandhya Sinha', email: 'sandhya.sinha@gmail.com', password: 'password123',
            phone: '9876543210', consumer_id: 'MH78901234', meter_number: 'METR456789',
            supply_type: 'Domestic - 1 Phase', sanctioned_load: '4 kW',
            bills: [
                {
                    bill_period_start: '2025-01-15', bill_period_end: '2025-02-14', due_date: '2025-02-28',
                    units_consumed: 210, energy_charges: 1165.00, fixed_charges: 90.00, fuel_surcharge: 55.80,
                    tax_amount: 100.50, subsidy_amount: 250.00, net_amount: 1161.30,
                    status: 'paid', payment_date: '2025-02-20 10:30:00',
                    slabs: [
                        { range: '0-100 Units', rate: 4.50, units: 100, amount: 450.00 },
                        { range: '101-200 Units', rate: 6.50, units: 100, amount: 650.00 },
                        { range: '201-500 Units', rate: 6.50, units: 10, amount: 65.00 },
                    ]
                },
                {
                    bill_period_start: '2025-02-15', bill_period_end: '2025-03-15', due_date: '2025-03-25',
                    units_consumed: 750, energy_charges: 6025.00, fixed_charges: 100.00, fuel_surcharge: 225.75,
                    tax_amount: 380.00, subsidy_amount: 3480.00, net_amount: 3250.75,
                    status: 'unpaid', payment_date: null,
                    slabs: [
                        { range: '0-100 Units', rate: 4.50, units: 100, amount: 450.00 },
                        { range: '101-200 Units', rate: 6.50, units: 100, amount: 650.00 },
                        { range: '201-500 Units', rate: 8.50, units: 300, amount: 2550.00 },
                        { range: 'Above 500 Units', rate: 9.50, units: 250, amount: 2375.00 },
                    ]
                }
            ]
        },
        {
            name: 'Shashank Shekhar', email: 'shashank.shekhar@gmail.com', password: 'pass4567',
            phone: '9123456780', consumer_id: 'DL11223344', meter_number: 'METR112233',
            supply_type: 'Domestic - 3 Phase', sanctioned_load: '8 kW',
            bills: [
                {
                    bill_period_start: '2025-02-05', bill_period_end: '2025-03-04', due_date: '2025-03-20',
                    units_consumed: 480, energy_charges: 3660.00, fixed_charges: 150.00, fuel_surcharge: 195.50,
                    tax_amount: 290.25, subsidy_amount: 600.00, net_amount: 3695.75,
                    status: 'unpaid', payment_date: null,
                    slabs: [
                        { range: '0-150 Units', rate: 5.50, units: 150, amount: 825.00 },
                        { range: '151-300 Units', rate: 7.50, units: 150, amount: 1125.00 },
                        { range: '301-600 Units', rate: 9.50, units: 180, amount: 1710.00 },
                    ]
                }
            ]
        },
        {
            name: 'Harshit Sharma', email: 'harshit.sharma@gmail.com', password: 'pass1234',
            phone: '7778889990', consumer_id: 'UP987654', meter_number: 'METR998877',
            supply_type: 'Domestic - 1 Phase', sanctioned_load: '3 kW',
            bills: []
        }
    ];

    try {
        await connection.beginTransaction();
        console.log('Transaction started.');

        for (const userData of usersData) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const [userResult] = await connection.query(
                'INSERT INTO users (name, email, password, phone, consumer_id, meter_number, supply_type, sanctioned_load) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [userData.name, userData.email, hashedPassword, userData.phone, userData.consumer_id, userData.meter_number, userData.supply_type, userData.sanctioned_load]
            );
            const userId = userResult.insertId;
            console.log(`Inserted user: ${userData.email}`);

            for (const bill of userData.bills) {
                const [billResult] = await connection.query(
                    'INSERT INTO bills (user_id, bill_period_start, bill_period_end, due_date, units_consumed, energy_charges, fixed_charges, fuel_surcharge, tax_amount, subsidy_amount, net_amount, status, payment_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [userId, bill.bill_period_start, bill.bill_period_end, bill.due_date, bill.units_consumed, bill.energy_charges, bill.fixed_charges, bill.fuel_surcharge, bill.tax_amount, bill.subsidy_amount, bill.net_amount, bill.status, bill.payment_date]
                );
                const billId = billResult.insertId;

                for (const slab of bill.slabs) {
                    await connection.query(
                        'INSERT INTO bill_slabs (bill_id, slab_range, rate, units, amount) VALUES (?, ?, ?, ?, ?)',
                        [billId, slab.range, slab.rate, slab.units, slab.amount]
                    );
                }
            }
        }

        await connection.commit();
        console.log('\n✅ Sample data inserted successfully!');
        console.log('\nSample logins:');
        console.log('  sandhya.sinha@gmail.com / password123');
        console.log('  shashank.shekhar@gmail.com / pass4567');
        console.log('  harshit.sharma@gmail.com / pass1234');

    } catch (err) {
        await connection.rollback();
        console.error('❌ Error:', err.message);
    } finally {
        await connection.end();
        console.log('\n--- Script Finished ---');
    }
}

seedDatabase();
