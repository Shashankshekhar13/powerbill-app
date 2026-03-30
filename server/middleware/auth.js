const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'powerbill_super_secret_key_2026';

function authMiddleware(req, res, next) {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ message: 'Not authorized. Please log in.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = { id: decoded.userId };
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Not authorized. Please log in.' });
    }
}

module.exports = { authMiddleware, JWT_SECRET };
