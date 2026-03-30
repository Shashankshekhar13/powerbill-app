const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payment/create-order — Create a Razorpay order
router.post('/create-order', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { billId } = req.body;

    if (!billId) {
        return res.status(400).json({ message: 'Bill ID is required.' });
    }

    try {
        // Verify the bill belongs to this user and is unpaid
        const [bills] = await pool.query(
            'SELECT id, net_amount, status FROM bills WHERE id = ? AND user_id = ?',
            [billId, userId]
        );

        if (bills.length === 0) {
            return res.status(404).json({ message: 'Bill not found.' });
        }

        const bill = bills[0];

        if (bill.status === 'paid') {
            return res.status(400).json({ message: 'This bill is already paid.' });
        }

        // Create Razorpay order (amount in paise)
        const amountInPaise = Math.round(parseFloat(bill.net_amount) * 100);

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `bill_${billId}_${Date.now()}`,
            notes: {
                billId: billId.toString(),
                userId: userId.toString(),
            }
        });

        res.status(200).json({
            orderId: order.id,
            amount: amountInPaise,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
        });

    } catch (err) {
        console.error('Create Order Error:', err.message);
        res.status(500).json({ message: 'Failed to create payment order.' });
    }
});

// POST /api/payment/verify — Verify Razorpay payment signature & update DB
router.post('/verify', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, billId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !billId) {
        return res.status(400).json({ message: 'Missing payment verification data.' });
    }

    try {
        // Verify signature using HMAC SHA256
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
        }

        // Verify the bill belongs to this user
        const [bills] = await pool.query(
            'SELECT id, net_amount, status FROM bills WHERE id = ? AND user_id = ?',
            [billId, userId]
        );

        if (bills.length === 0) {
            return res.status(404).json({ message: 'Bill not found.' });
        }

        if (bills[0].status === 'paid') {
            return res.status(400).json({ message: 'Bill is already paid.' });
        }

        // Update bill status to paid
        const paymentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await pool.query(
            'UPDATE bills SET status = ?, payment_date = ? WHERE id = ?',
            ['paid', paymentDate, billId]
        );

        res.status(200).json({
            message: 'Payment successful!',
            transactionId: razorpay_payment_id,
            amount: parseFloat(bills[0].net_amount),
            paymentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            paymentMethod: 'Razorpay'
        });

    } catch (err) {
        console.error('Payment Verify Error:', err.message);
        res.status(500).json({ message: 'Payment verification failed.' });
    }
});

// GET /api/payment/history — Get payment history for user
router.get('/history', authMiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
        const [payments] = await pool.query(
            `SELECT id, net_amount, status, payment_date, bill_period_start, bill_period_end 
             FROM bills WHERE user_id = ? ORDER BY bill_period_end DESC`,
            [userId]
        );

        const history = payments.map(p => ({
            billId: p.id,
            amount: parseFloat(p.net_amount),
            status: p.status,
            paymentDate: p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null,
            period: `${new Date(p.bill_period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(p.bill_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
        }));

        res.status(200).json({ history });

    } catch (err) {
        console.error('Payment History Error:', err.message);
        res.status(500).json({ message: 'Failed to fetch payment history.' });
    }
});

module.exports = router;
