const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// POST /api/auth/register - Register new student account
router.post('/register', AuthController.register);

// POST /api/auth/login - Log in with email and password
router.post('/login', AuthController.login);

// POST /api/auth/reset-password - Reset password by email
router.post('/reset-password', AuthController.resetPassword);

// GET /api/auth/me - Get currently authenticated student profile
router.get('/me', authenticateToken, AuthController.getCurrentUser);

module.exports = router;
