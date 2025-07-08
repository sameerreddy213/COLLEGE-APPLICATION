import express from 'express';
import { body, validationResult } from 'express-validator';
import Course from '../models/Course.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all courses
router.get('/', authenticateToken, requireRole(['super_admin', 'academic_staff', 'hod', 'director']), async (req, res) => {
  try {
    const { batch, semester, academicYear, isActive = true } = req.query;
    
    const filter = { isActive: isActive === 'true' };
    
    if (batch) filter.batch = batch;
    if (semester) filter.semester = parseInt(semester);
    if (academicYear) filter.academicYear = academicYear;

    const courses = await Course.find(filter)
      .populate('batch', 'name')
      .populate('createdBy', 'name email')
      .sort({ batch: 1, semester: 1, name: 1 });

    console.log('Found courses:', courses.length);
    res.json({ data: courses });

  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get courses by batch
router.get('/batch/:batchId', authenticateToken, requireRole(['super_admin', 'academic_staff', 'hod', 'director']), async (req, res) => {
  try {
    const { batchId } = req.params;
    const { academicYear } = req.query;
    
    const filter = { 
      batch: batchId,
      isActive: true
    };
    
    if (academicYear) filter.academicYear = academicYear;

    const courses = await Course.find(filter)
      .populate('batch', 'name')
      .populate('createdBy', 'name email')
      .sort({ semester: 1, name: 1 });

    res.json({ data: courses });

  } catch (error) {
    console.error('Get courses by batch error:', error);
    res.status(500).json({ error: 'Failed to fetch courses for batch' });
  }
});

// Get one course
router.get('/:id', authenticateToken, requireRole(['super_admin', 'academic_staff', 'hod', 'director']), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('batch', 'name')
      .populate('createdBy', 'name email');

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ data: course });

  } catch (error) {
    console.error('Get course by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Create course
router.post('/', authenticateToken, requireRole(['super_admin', 'academic_staff']), [
  body('name').trim().notEmpty(),
  body('code').trim().notEmpty(),
  body('description').optional().trim(),
  body('batch').isMongoId(),
  body('semester').isInt({ min: 1, max: 8 }),
  body('credits').isInt({ min: 1, max: 10 }),
  body('academicYear').trim().notEmpty(),

], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const { name, code, description, batch, semester, credits, academicYear } = req.body;
    console.log('Creating course with data:', { name, code, description, batch, semester, credits, academicYear });

    // Check if course already exists
    const existingCourse = await Course.findOne({
      code,
      batch,
      academicYear,
      isActive: true
    });

    if (existingCourse) {
      return res.status(400).json({ 
        error: 'Course already exists',
        message: 'A course with this code already exists for this batch and academic year'
      });
    }

    const course = new Course({
      name,
      code,
      description,
      batch,
      semester,
      credits,
      academicYear,
      createdBy: req.user.id
    });

    await course.save();

    const populatedCourse = await Course.findById(course._id)
      .populate('batch', 'name')
      .populate('createdBy', 'name email');

    res.status(201).json({
      data: populatedCourse,
      message: 'Course created successfully'
    });

  } catch (error) {
    console.error('Create course error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Course code must be unique' });
    }
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Update course
router.put('/:id', authenticateToken, requireRole(['super_admin', 'academic_staff']), [
  body('name').optional().trim().notEmpty(),
  body('code').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('batch').optional().isMongoId(),
  body('semester').optional().isInt({ min: 1, max: 8 }),
  body('credits').optional().isInt({ min: 1, max: 10 }),
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
    console.log('Updating course with ID:', id);
    console.log('Update data:', updateData);

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check for duplicate code if code is being updated
    if (updateData.code && updateData.code !== course.code) {
      const existingCourse = await Course.findOne({
        code: updateData.code,
        batch: updateData.batch || course.batch,
        academicYear: updateData.academicYear || course.academicYear,
        _id: { $ne: id },
        isActive: true
      });

      if (existingCourse) {
        return res.status(400).json({ 
          error: 'Course code already exists',
          message: 'A course with this code already exists for this batch and academic year'
        });
      }
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        course[key] = updateData[key];
      }
    });

    await course.save();

    const populatedCourse = await Course.findById(course._id)
      .populate('batch', 'name')
      .populate('createdBy', 'name email');

    res.json({
      data: populatedCourse,
      message: 'Course updated successfully'
    });

  } catch (error) {
    console.error('Update course error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Course code must be unique' });
    }
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// Delete course
router.delete('/:id', authenticateToken, requireRole(['super_admin', 'academic_staff']), async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully' });

  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

export default router; 