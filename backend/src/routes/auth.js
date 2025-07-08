import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Profile from '../models/Profile.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
  body('role').isIn(['student', 'faculty', 'super_admin', 'academic_staff', 'hostel_warden', 'mess_supervisor', 'hod', 'director'])
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { email, password, name, role, phoneNumber, department, batch, section } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      isEmailVerified: true // For now, auto-verify emails
    });

    await user.save();

    // Create profile
    const profile = new Profile({
      userId: user._id,
      name,
      email,
      role,
      phoneNumber,
      department,
      batch: role === 'student' ? batch || null : undefined,
      section: role === 'student' ? section || null : undefined
    });

    await profile.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password)
    const userResponse = {
      id: user._id,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      profile: {
        id: profile._id,
        name: profile.name,
        role: profile.role,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        department: profile.department,
        batch: profile.batch,
        section: profile.section
      }
    };

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(423).json({ 
        error: 'Account is locked due to too many failed attempts',
        lockUntil: user.lockUntil
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Get user profile
    const profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      return res.status(500).json({ error: 'User profile not found' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user data
    const userResponse = {
      id: user._id,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      profile: {
        id: profile._id,
        name: profile.name,
        role: profile.role,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        department: profile.department,
        batch: profile.batch,
        section: profile.section
      }
    };

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const userResponse = {
      id: user._id,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      profile: {
        id: profile._id,
        name: profile.name,
        role: profile.role,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        department: profile.department,
        batch: profile.batch,
        section: profile.section
      }
    };

    res.json({ user: userResponse });

  } catch (error) {
    console.error('Get user error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router; 