import express from 'express';
import { body, validationResult } from 'express-validator';
import Complaint from '../models/Complaint.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get complaints with filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      category, 
      priority, 
      studentId,
      hostelBlock,
      academicYear,
      isUrgent
    } = req.query;
    
    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (hostelBlock) filter['studentInfo.hostelBlock'] = hostelBlock;
    if (academicYear) filter.academicYear = academicYear;
    if (isUrgent !== undefined) filter.isUrgent = isUrgent === 'true';
    
    // Students can only see their own complaints
    if (req.user.profile.role === 'student') {
      filter.studentId = req.user.profile._id;
    } else if (studentId) {
      filter.studentId = studentId;
    }
    
    // Hostel wardens can only see complaints from their blocks
    if (req.user.profile.role === 'hostel_warden') {
      filter['studentInfo.hostelBlock'] = req.user.profile.hostelBlockNumber;
    }

    const complaints = await Complaint.find(filter)
      .populate('studentId', 'name email studentRollNumber')
      .populate('assignedTo', 'name email role')
      .populate('resolvedBy', 'name email role')
      .populate('completedBy', 'name email role')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Complaint.countDocuments(filter);

    res.json({
      data: complaints,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// Get complaint by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('studentId', 'name email studentRollNumber')
      .populate('assignedTo', 'name email role')
      .populate('resolvedBy', 'name email role')
      .populate('completedBy', 'name email role');

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Check access permissions
    if (req.user.profile.role === 'student' && 
        complaint.studentId._id.toString() !== req.user.profile._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (req.user.profile.role === 'hostel_warden' && 
        complaint.studentInfo.hostelBlock !== req.user.profile.hostelBlockNumber) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ data: complaint });

  } catch (error) {
    console.error('Get complaint by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
});

// Create new complaint (Students only)
router.post('/', authenticateToken, authorizeRoles(['student']), [
  body('title').trim().isLength({ min: 5, max: 200 }),
  body('description').trim().isLength({ min: 10, max: 1000 }),
  body('category').isIn(['electrical', 'plumbing', 'cleaning', 'maintenance', 'security', 'internet', 'food', 'other']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('academicYear').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { title, description, category, priority, academicYear } = req.body;

    // Get student information
    const studentInfo = {
      name: req.user.profile.name,
      rollNumber: req.user.profile.studentRollNumber,
      hostelBlock: req.user.profile.hostelBlockNumber,
      roomNumber: req.user.profile.hostelRoomNo,
      phoneNumber: req.user.profile.phoneNumber
    };

    const complaint = new Complaint({
      title,
      description,
      category,
      priority: priority || 'medium',
      studentId: req.user.profile._id,
      studentInfo,
      academicYear
    });

    await complaint.save();

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('studentId', 'name email studentRollNumber')
      .populate('assignedTo', 'name email role');

    res.status(201).json({
      data: populatedComplaint,
      message: 'Complaint submitted successfully'
    });

  } catch (error) {
    console.error('Create complaint error:', error);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
});

// Update complaint status (Hostel Warden only)
router.put('/:id/status', authenticateToken, authorizeRoles(['hostel_warden']), [
  body('status').isIn(['open', 'in_progress', 'resolved', 'completed']),
  body('notes').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Verify warden has access to this complaint
    if (complaint.studentInfo.hostelBlock !== req.user.profile.hostelBlockNumber) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update status with appropriate notes
    await complaint.updateStatus(status, req.user.profile._id, notes);

    const updatedComplaint = await Complaint.findById(id)
      .populate('studentId', 'name email studentRollNumber')
      .populate('assignedTo', 'name email role')
      .populate('resolvedBy', 'name email role')
      .populate('completedBy', 'name email role');

    res.json({
      data: updatedComplaint,
      message: `Complaint status updated to ${status}`
    });

  } catch (error) {
    console.error('Update complaint status error:', error);
    res.status(500).json({ error: 'Failed to update complaint status' });
  }
});

// Complete complaint (Students only)
router.put('/:id/complete', authenticateToken, authorizeRoles(['student']), [
  body('completionNotes').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { id } = req.params;
    const { completionNotes } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Verify student owns this complaint
    if (complaint.studentId.toString() !== req.user.profile._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Can only complete if status is 'resolved'
    if (complaint.status !== 'resolved') {
      return res.status(400).json({ 
        error: 'Invalid status',
        message: 'Complaint must be resolved before it can be completed'
      });
    }

    await complaint.updateStatus('completed', req.user.profile._id, completionNotes);

    const updatedComplaint = await Complaint.findById(id)
      .populate('studentId', 'name email studentRollNumber')
      .populate('assignedTo', 'name email role')
      .populate('resolvedBy', 'name email role')
      .populate('completedBy', 'name email role');

    res.json({
      data: updatedComplaint,
      message: 'Complaint marked as completed'
    });

  } catch (error) {
    console.error('Complete complaint error:', error);
    res.status(500).json({ error: 'Failed to complete complaint' });
  }
});

// Get complaint timeline
router.get('/:id/timeline', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Check access permissions
    if (req.user.profile.role === 'student' && 
        complaint.studentId.toString() !== req.user.profile._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (req.user.profile.role === 'hostel_warden' && 
        complaint.studentInfo.hostelBlock !== req.user.profile.hostelBlockNumber) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const timeline = complaint.getTimeline();

    res.json({ data: timeline });

  } catch (error) {
    console.error('Get complaint timeline error:', error);
    res.status(500).json({ error: 'Failed to fetch complaint timeline' });
  }
});

// Get complaint statistics (Director/HOD only)
router.get('/stats/overview', authenticateToken, authorizeRoles(['director', 'hod', 'super_admin']), async (req, res) => {
  try {
    const { academicYear, hostelBlock } = req.query;
    
    const filter = {};
    if (academicYear) filter.academicYear = academicYear;
    if (hostelBlock) filter['studentInfo.hostelBlock'] = hostelBlock;

    const totalComplaints = await Complaint.countDocuments(filter);
    const openComplaints = await Complaint.countDocuments({ ...filter, status: 'open' });
    const inProgressComplaints = await Complaint.countDocuments({ ...filter, status: 'in_progress' });
    const resolvedComplaints = await Complaint.countDocuments({ ...filter, status: 'resolved' });
    const completedComplaints = await Complaint.countDocuments({ ...filter, status: 'completed' });

    const categoryStats = await Complaint.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const priorityStats = await Complaint.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const hostelBlockStats = await Complaint.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$studentInfo.hostelBlock',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      data: {
        total: totalComplaints,
        byStatus: {
          open: openComplaints,
          inProgress: inProgressComplaints,
          resolved: resolvedComplaints,
          completed: completedComplaints
        },
        byCategory: categoryStats,
        byPriority: priorityStats,
        byHostelBlock: hostelBlockStats
      }
    });

  } catch (error) {
    console.error('Get complaint statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch complaint statistics' });
  }
});

// Get urgent complaints (Hostel Warden only)
router.get('/urgent/list', authenticateToken, authorizeRoles(['hostel_warden']), async (req, res) => {
  try {
    const { hostelBlock } = req.query;
    
    const filter = {
      isUrgent: true,
      status: { $in: ['open', 'in_progress'] }
    };
    
    if (hostelBlock) {
      filter['studentInfo.hostelBlock'] = hostelBlock;
    } else {
      filter['studentInfo.hostelBlock'] = req.user.profile.hostelBlockNumber;
    }

    const urgentComplaints = await Complaint.find(filter)
      .populate('studentId', 'name email studentRollNumber')
      .populate('assignedTo', 'name email role')
      .sort({ priority: -1, createdAt: 1 });

    res.json({ data: urgentComplaints });

  } catch (error) {
    console.error('Get urgent complaints error:', error);
    res.status(500).json({ error: 'Failed to fetch urgent complaints' });
  }
});

// Get complaints by hostel block (Hostel Warden only)
router.get('/block/:blockNumber', authenticateToken, authorizeRoles(['hostel_warden']), async (req, res) => {
  try {
    const { blockNumber } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    
    const filter = {
      'studentInfo.hostelBlock': blockNumber
    };
    
    if (status) filter.status = status;

    const complaints = await Complaint.find(filter)
      .populate('studentId', 'name email studentRollNumber')
      .populate('assignedTo', 'name email role')
      .populate('resolvedBy', 'name email role')
      .populate('completedBy', 'name email role')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Complaint.countDocuments(filter);

    res.json({
      data: complaints,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get complaints by block error:', error);
    res.status(500).json({ error: 'Failed to fetch complaints by block' });
  }
});

export default router; 