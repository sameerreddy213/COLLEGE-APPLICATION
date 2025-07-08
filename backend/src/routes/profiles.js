import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin, requireRole, requireOwnershipOrAdmin } from '../middleware/auth.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';

const router = express.Router();

// Get all profiles (admin, academic staff, hod, director can access)
router.get('/', authenticateToken, requireRole(['super_admin', 'academic_staff', 'hod', 'director']), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, department, search } = req.query;
    
    const query = {};
    
    if (role) query.role = role;
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { facultyId: { $regex: search, $options: 'i' } }
      ];
    }

    // For academic staff, only allow access to faculty profiles
    if (req.profile.role === 'academic_staff' && !role) {
      query.role = 'faculty';
    }

    const profiles = await Profile.find(query)
      .populate('userId', 'email isEmailVerified lastLogin')
      .populate('batch', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Profile.countDocuments(query);

    res.json({
      profiles,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ error: 'Failed to fetch profiles' });
  }
});

// Get current user's profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id })
      .populate('userId', 'email isEmailVerified lastLogin');

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ profile });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get profile by ID (admin or own profile)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id)
      .populate('userId', 'email isEmailVerified lastLogin');

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Check if user can access this profile
    if (req.profile.role !== 'super_admin' && profile.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ profile });

  } catch (error) {
    console.error('Get profile by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update current user's profile
router.put('/me', authenticateToken, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('phoneNumber').optional().trim(),
  body('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  body('department').optional().trim(),
  body('studentId').optional().trim(),
  body('facultyId').optional().trim(),
  body('hostelBlock').optional().trim(),
  body('roomNumber').optional().trim(),
  body('address').optional().isObject(),
  body('emergencyContact').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Update profile fields
    const updateFields = [
      'name', 'phoneNumber', 'bloodGroup', 'department', 'studentId', 
      'facultyId', 'hostelBlock', 'roomNumber', 'address', 'emergencyContact', 'batch', 'section'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    await profile.save();

    res.json({ 
      message: 'Profile updated successfully',
      profile 
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update profile by ID (admin only)
router.put('/:id', authenticateToken, requireAdmin, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('role').optional().isIn(['student', 'faculty', 'super_admin', 'academic_staff', 'hostel_warden', 'mess_supervisor', 'hod', 'director']),
  body('phoneNumber').optional().trim(),
  body('bloodGroup').optional().isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  body('department').optional().trim(),
  body('studentId').optional().trim(),
  body('facultyId').optional().trim(),
  body('hostelBlock').optional().trim(),
  body('roomNumber').optional().trim(),
  body('address').optional().isObject(),
  body('emergencyContact').optional().isObject(),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Update profile fields
    const updateFields = [
      'name', 'role', 'phoneNumber', 'bloodGroup', 'department', 'studentId', 
      'facultyId', 'hostelBlock', 'roomNumber', 'address', 'emergencyContact', 'isActive', 'batch', 'section'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        profile[field] = req.body[field];
      }
    });

    await profile.save();

    res.json({ 
      message: 'Profile updated successfully',
      profile 
    });

  } catch (error) {
    console.error('Update profile by ID error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Delete profile (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Delete associated user
    await User.findByIdAndDelete(profile.userId);
    
    // Delete profile
    await Profile.findByIdAndDelete(req.params.id);

    res.json({ message: 'Profile and user deleted successfully' });

  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ error: 'Failed to delete profile' });
  }
});

export default router; 