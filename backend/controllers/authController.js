const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

// Helper to generate JWT token
function generateToken(user) {
  const secret = process.env.JWT_SECRET || 'campusconnect_super_secret_jwt_key_2026_dev';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    { id: user.id, email: user.email },
    secret,
    { expiresIn }
  );
}

const AuthController = {
  /**
   * Register a new student user
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { name, email, password, confirmPassword, college, role } = req.body;

      // 1. Validate required fields
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Name is required.' });
      }

      if (!email || typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({ error: 'Email address is required.' });
      }

      // 2. Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }

      // 3. Validate password
      if (!password || typeof password !== 'string') {
        return res.status(400).json({ error: 'Password is required.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      // 4. Confirm password match
      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' });
      }

      // 5. Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email address already exists.' });
      }

      // 6. Hash password with bcrypt
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 7. Create user in database
      const newUser = await UserModel.create({
        name,
        email,
        passwordHash,
        college: college || 'Campus Student',
        role: role || 'Student Builder'
      });

      // 8. Generate JWT
      const token = generateToken(newUser);

      res.status(201).json({
        message: 'Account created successfully.',
        user: newUser,
        token
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Log in an existing user
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // 1. Validate input presence
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      // 2. Find user by email
      const userRecord = await UserModel.findByEmail(email);
      if (!userRecord || !userRecord.password_hash) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // 3. Compare password with bcrypt
      const isMatch = await bcrypt.compare(password, userRecord.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // 4. Fetch full student profile (without password hash)
      const user = await UserModel.findById(userRecord.id);

      // 5. Generate JWT token
      const token = generateToken(user);

      res.json({
        message: 'Logged in successfully.',
        user,
        token
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get current authenticated user
   * GET /api/auth/me
   */
  async getCurrentUser(req, res, next) {
    try {
      // req.user is attached by authenticateToken middleware
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }
      res.json({ user: req.user });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Reset user password
   * POST /api/auth/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { email, newPassword, confirmNewPassword } = req.body;

      if (!email || typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({ error: 'Email address is required.' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }

      if (!newPassword || typeof newPassword !== 'string') {
        return res.status(400).json({ error: 'New password is required.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
      }

      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ error: 'Passwords do not match.' });
      }

      // Check if user exists
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({ error: 'No account found with this email address.' });
      }

      // Hash new password and update
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await UserModel.updatePasswordByEmail(email, passwordHash);

      res.json({
        message: 'Password reset successfully. You can now log in with your new password.'
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = AuthController;
