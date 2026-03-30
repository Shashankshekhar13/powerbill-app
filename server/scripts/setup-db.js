// scripts/setup-db.js — Creates database and tables
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    console.log('--- PowerBill Database Setup ---\n');

    // Connect without database first to create it
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
    });

    const DB_NAME = process.env.DB_NAME || 'powerbill_db';

    try {
        // Create database
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✓ Database "${DB_NAME}" created/verified.`);

        await connection.query(`USE \`${DB_NAME}\``);

        // Create users table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(15) DEFAULT NULL,
                consumer_id VARCHAR(50) DEFAULT NULL UNIQUE,
                meter_number VARCHAR(50) DEFAULT NULL,
                supply_type VARCHAR(50) DEFAULT NULL,
                sanctioned_load VARCHAR(20) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Table "users" created/verified.');

        // Create bills table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS bills (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                bill_period_start DATE NOT NULL,
                bill_period_end DATE NOT NULL,
                due_date DATE NOT NULL,
                units_consumed INT NOT NULL,
                energy_charges DECIMAL(10,2) DEFAULT 0.00,
                fixed_charges DECIMAL(10,2) DEFAULT 0.00,
                fuel_surcharge DECIMAL(10,2) DEFAULT 0.00,
                tax_amount DECIMAL(10,2) DEFAULT 0.00,
                subsidy_amount DECIMAL(10,2) DEFAULT 0.00,
                net_amount DECIMAL(10,2) DEFAULT 0.00,
                status ENUM('paid','unpaid') DEFAULT 'unpaid',
                payment_date DATETIME DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Table "bills" created/verified.');

        // Create bill_slabs table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS bill_slabs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                bill_id INT NOT NULL,
                slab_range VARCHAR(50) NOT NULL,
                rate DECIMAL(10,2) NOT NULL,
                units INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✓ Table "bill_slabs" created/verified.');

        console.log('\n✅ Database setup complete!');

    } catch (err) {
        console.error('❌ Setup Error:', err.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

setupDatabase();
