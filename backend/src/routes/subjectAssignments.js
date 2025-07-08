import express from 'express';
import { body, validationResult } from 'express-validator';
import SubjectAssignment from '../models/SubjectAssignment.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all subject assignments
router.get('/', authenticateToken, requireRole(['super_admin', 'academic_staff', 'hod', 'director']), async (req, res) => {
  try {
    const { subject, facultyId, department, academicYear, isActive = true } = req.query;
    
    const filter = { isActive: isActive === 'true' };
    
    if (subject) filter.subject = { $regex: subject, $options: 'i' };
    if (facultyId) filter.facultyId = facultyId;
    if (department) filter.department = department;
    if (academicYear) filter.academicYear = academicYear;

    const assignments = await SubjectAssignment.find(filter)
      .populate('facultyId', 'name email department designation')
      .populate('createdBy', 'name email')
      .sort({ subject: 1, academicYear: -1 });

    res.json({ data: assignments });

  } catch (error) {
    console.error('Get subject assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch subject assignments' });
  }
});

// Get faculty by subject
router.get('/subject/:subject', authenticateToken, requireRole(['super_admin', 'academic_staff', 'hod', 'director']), async (req, res) => {
  try {
    const { subject } = req.params;
    const { academicYear } = req.query;
    
    const filter = { 
      subject: { $regex: subject, $options: 'i' },
      isActive: true
    };
    
    if (academicYear) filter.academicYear = academicYear;

    const assignment = await SubjectAssignment.findOne(filter)
      .populate('facultyId', 'name email department designation');

    if (!assignment) {
      return res.status(404).json({ error: 'No faculty assigned to this subject' });
    }

    res.json({ data: assignment });

  } catch (error) {
    console.error('Get faculty by subject error:', error);
    res.status(500).json({ error: 'Failed to fetch faculty for subject' });
  }
});

// Create subject assignment
router.post('/', authenticateToken, requireRole(['super_admin', 'academic_staff', 'hod']), [
  body('subject').trim().notEmpty(),
  body('facultyId').isMongoId(),
  body('department').optional().trim(),
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

    const { subject, facultyId, department, academicYear } = req.body;

    // Check if assignment already exists
    const existingAssignment = await SubjectAssignment.findOne({
      subject,
      facultyId,
      academicYear,
      isActive: true
    });

    if (existingAssignment) {
      return res.status(400).json({ 
        error: 'Assignment already exists',
        message: 'This faculty is already assigned to this subject for this academic year'
      });
    }

    const assignment = new SubjectAssignment({
      subject,
      facultyId,
      department,
      academicYear,
      createdBy: req.user.id
    });

    await assignment.save();

    const populatedAssignment = await SubjectAssignment.findById(assignment._id)
      .populate('facultyId', 'name email department designation')
      .populate('createdBy', 'name email');

    res.status(201).json({
      data: populatedAssignment,
      message: 'Subject assignment created successfully'
    });

  } catch (error) {
    console.error('Create subject assignment error:', error);
    res.status(500).json({ error: 'Failed to create subject assignment' });
  }
});

// Update subject assignment
router.put('/:id', authenticateToken, requireRole(['super_admin', 'academic_staff', 'hod']), [
  body('subject').optional().trim().notEmpty(),
  body('facultyId').optional().isMongoId(),
  body('department').optional().trim(),
  body('academicYear').optional().trim().notEmpty(),
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

    const { id } = req.params;
    const updateData = req.body;

    const assignment = await SubjectAssignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ error: 'Subject assignment not found' });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        assignment[key] = updateData[key];
      }
    });

    await assignment.save();

    const populatedAssignment = await SubjectAssignment.findById(assignment._id)
      .populate('facultyId', 'name email department designation')
      .populate('createdBy', 'name email');

    res.json({
      data: populatedAssignment,
      message: 'Subject assignment updated successfully'
    });

  } catch (error) {
    console.error('Update subject assignment error:', error);
    res.status(500).json({ error: 'Failed to update subject assignment' });
  }
});

// Delete subject assignment
router.delete('/:id', authenticateToken, requireRole(['super_admin', 'academic_staff', 'hod']), async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await SubjectAssignment.findByIdAndDelete(id);

    if (!assignment) {
      return res.status(404).json({ error: 'Subject assignment not found' });
    }

    res.json({ message: 'Subject assignment deleted successfully' });

  } catch (error) {
    console.error('Delete subject assignment error:', error);
    res.status(500).json({ error: 'Failed to delete subject assignment' });
  }
});

export default router; 