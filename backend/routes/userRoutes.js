const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');

// GET /api/users/me - Get default/active student profile
router.get('/me', UserController.getCurrentUser);

// GET /api/users/:id - Get student profile by ID
router.get('/:id', UserController.getUserById);

module.exports = router;
