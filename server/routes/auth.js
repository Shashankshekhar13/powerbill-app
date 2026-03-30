const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Helper: Generate a slab-based bill for a user
async function generateBillForUser(userId, connection) {
    // Random units between 150–600 for realistic bills
    const units = Math.floor(Math.random() * 451) + 150;

    // Slab-based calculation (Indian domestic rates)
    const slabs = [
        { range: '0-100 Units', rate: 4.50, maxUnits: 100 },
        { range: '101-200 Units', rate: 6.50, maxUnits: 100 },
        { range: '201-500 Units', rate: 8.50, maxUnits: 300 },
        { range: 'Above 500 Units', rate: 9.50, maxUnits: Infinity },
    ];

    let remaining = units;
    let energyCharges = 0;
    const slabDetails = [];

    for (const slab of slabs) {
        if (remaining <= 0) break;
        const slabUnits = Math.min(remaining, slab.maxUnits);
        const slabAmount = slabUnits * slab.rate;
        energyCharges += slabAmount;
        slabDetails.push({
            range: slab.range,
            rate: slab.rate,
            units: slabUnits,
            amount: slabAmount
        });
        remaining -= slabUnits;
    }

    const fixedCharges = 100.00;
    const fuelSurcharge = parseFloat((energyCharges * 0.035).toFixed(2));
    const taxAmount = parseFloat((energyCharges * 0.05).toFixed(2));
    const subsidy = units <= 200 ? parseFloat((energyCharges * 0.20).toFixed(2)) : 0;
    const netAmount = parseFloat((energyCharges + fixedCharges + fuelSurcharge + taxAmount - subsidy).toFixed(2));

    // Bill period: last month to current date
    const now = new Date();
    const periodEnd = new Date(now);
    const periodStart = new Date(now);
    periodStart.setMonth(periodStart.getMonth() - 1);
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 15);

    const fmt = (d) => d.toISOString().slice(0, 10);

    // Insert bill
    const [billResult] = await connection.query(
        `INSERT INTO bills (user_id, bill_period_start, bill_period_end, due_date, units_consumed, 
         energy_charges, fixed_charges, fuel_surcharge, tax_amount, subsidy_amount, net_amount, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unpaid')`,
        [userId, fmt(periodStart), fmt(periodEnd), fmt(dueDate), units,
         energyCharges, fixedCharges, fuelSurcharge, taxAmount, subsidy, netAmount]
    );

    const billId = billResult.insertId;

    // Insert slab details
    for (const slab of slabDetails) {
        await connection.query(
            'INSERT INTO bill_slabs (bill_id, slab_range, rate, units, amount) VALUES (?, ?, ?, ?, ?)',
            [billId, slab.range, slab.rate, slab.units, slab.amount]
        );
    }

    return { billId, netAmount, units };
}

// POST /api/signup
router.post('/signup', async (req, res) => {
    const { name, email, password, phone, consumerId, meterNumber, supplyType, sanctionedLoad } = req.body;

    // Basic Validation
    if (!name || !email || !password || !phone || !consumerId) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format.' });
    }

    try {
        const emailLower = email.toLowerCase();

        // Check if email or consumer ID already exists
        const [existing] = await pool.query(
            'SELECT id FROM users WHERE email = ? OR consumer_id = ?',
            [emailLower, consumerId]
        );

        if (existing.length > 0) {
            return res.status(409).json({ message: 'Email or Consumer ID already registered.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user with all details
        const [userResult] = await pool.query(
            `INSERT INTO users (name, email, password, phone, consumer_id, meter_number, supply_type, sanctioned_load) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, emailLower, hashedPassword, phone, consumerId, 
             meterNumber || null, supplyType || 'Domestic - 1 Phase', sanctionedLoad || '3 kW']
        );

        const userId = userResult.insertId;

        // Auto-generate a bill for the new user
        await generateBillForUser(userId, pool);

        // Auto-login: create JWT token and set cookie
        const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.status(201).json({ message: 'Registration successful! Welcome to PowerBill.' });

    } catch (err) {
        console.error('Signup Error:', err.message);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// POST /api/signin
router.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password.' });
    }

    try {
        const emailLower = email.toLowerCase();

        const [users] = await pool.query(
            'SELECT id, password FROM users WHERE email = ?',
            [emailLower]
        );

        if (users.length !== 1) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = users[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Create JWT token
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

        // Set httpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.status(200).json({ message: 'Login successful.' });

    } catch (err) {
        console.error('Signin Error:', err.message);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// POST /api/logout
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    res.status(200).json({ message: 'Logout successful.' });
});

module.exports = router;
