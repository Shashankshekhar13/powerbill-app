const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/signup
router.post('/signup', async (req, res) => {
    const { name, email, password, phone, consumerId } = req.body;

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

        // Insert user
        await pool.query(
            'INSERT INTO users (name, email, password, phone, consumer_id) VALUES (?, ?, ?, ?, ?)',
            [name, emailLower, hashedPassword, phone, consumerId]
        );

        res.status(201).json({ message: 'User registered successfully.' });

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
            secure: false, // Set true in production with HTTPS
            sameSite: 'lax',
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
        secure: false,
        sameSite: 'lax'
    });
    res.status(200).json({ message: 'Logout successful.' });
});

module.exports = router;
