const express = require('express');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/dashboard — Protected
router.get('/dashboard', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const dashboardData = {};

    try {
        // 1. Fetch User Data
        const [users] = await pool.query(
            'SELECT name, email, phone, consumer_id, meter_number, supply_type, sanctioned_load FROM users WHERE id = ?',
            [userId]
        );

        if (users.length !== 1) {
            return res.status(404).json({ message: 'User not found for this session.' });
        }

        const userData = users[0];
        dashboardData.consumerInfo = {
            consumerId: userData.consumer_id,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            meterNumber: userData.meter_number,
            supplyType: userData.supply_type,
            sanctionedLoad: userData.sanctioned_load,
        };

        // 2. Fetch Latest Bill
        const [bills] = await pool.query(
            'SELECT * FROM bills WHERE user_id = ? ORDER BY bill_period_end DESC LIMIT 1',
            [userId]
        );

        let latestBillData = null;

        if (bills.length === 1) {
            const billData = bills[0];
            const billId = billData.id;

            // Fetch Slab Data for this bill
            const [slabs] = await pool.query(
                'SELECT slab_range, rate, units, amount FROM bill_slabs WHERE bill_id = ? ORDER BY id ASC',
                [billId]
            );

            const slabCharges = slabs.map(s => ({
                range: s.slab_range,
                rate: parseFloat(s.rate),
                units: parseInt(s.units),
                amount: parseFloat(s.amount)
            }));

            // Fetch Consumption History (last 3 bills)
            const [history] = await pool.query(
                'SELECT bill_period_end, units_consumed FROM bills WHERE user_id = ? ORDER BY bill_period_end DESC LIMIT 3',
                [userId]
            );

            const consumptionHistory = history.map(h => ({
                month: new Date(h.bill_period_end).toLocaleString('en-US', { month: 'short' }),
                units: parseInt(h.units_consumed)
            })).reverse(); // Oldest first

            // Format dates
            const formatDate = (dateStr) => {
                const d = new Date(dateStr);
                return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            };

            const formatShortDate = (dateStr) => {
                const d = new Date(dateStr);
                return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
            };

            latestBillData = {
                id: billId,
                amount: parseFloat(billData.net_amount),
                dueDate: formatDate(billData.due_date),
                period: `${formatShortDate(billData.bill_period_start)} - ${formatDate(billData.bill_period_end)}`,
                status: billData.status,
                slabCharges,
                billComponents: {
                    energyCharges: parseFloat(billData.energy_charges),
                    fixedCharges: parseFloat(billData.fixed_charges),
                    fuelSurcharge: parseFloat(billData.fuel_surcharge),
                    taxGST: parseFloat(billData.tax_amount),
                    subsidy: -Math.abs(parseFloat(billData.subsidy_amount)),
                    netAmount: parseFloat(billData.net_amount),
                },
                consumptionHistory
            };
        } else {
            latestBillData = {
                id: null,
                amount: 0,
                dueDate: 'N/A',
                period: 'No bills found',
                status: 'none',
                slabCharges: [],
                billComponents: { energyCharges: 0, fixedCharges: 0, fuelSurcharge: 0, taxGST: 0, subsidy: 0, netAmount: 0 },
                consumptionHistory: []
            };
        }

        dashboardData.currentBill = latestBillData;

        res.status(200).json(dashboardData);

    } catch (err) {
        console.error('Dashboard Error for UserID ' + userId + ':', err.message);
        res.status(500).json({ message: 'Server error fetching dashboard data.' });
    }
});

module.exports = router;
