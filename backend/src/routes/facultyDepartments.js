import express from 'express';
import FacultyDepartment from '../models/FacultyDepartment.js';

const router = express.Router();

// Get all faculty departments
router.get('/', async (req, res) => {
  try {
    const departments = await FacultyDepartment.find();
    res.json({ departments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch faculty departments' });
  }
});

// Get a faculty department by ID
router.get('/:id', async (req, res) => {
  try {
    const department = await FacultyDepartment.findById(req.params.id);
    if (!department) return res.status(404).json({ error: 'Not found' });
    res.json({ department });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch faculty department' });
  }
});

// Create a new faculty department
router.post('/', async (req, res) => {
  try {
    const { name, code, description, hod, isActive } = req.body;
    const department = new FacultyDepartment({ name, code, description, hod, isActive });
    await department.save();
    res.status(201).json({ department });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to create faculty department' });
  }
});

// Update a faculty department
router.put('/:id', async (req, res) => {
  try {
    const { name, code, description, hod, isActive } = req.body;
    const department = await FacultyDepartment.findByIdAndUpdate(
      req.params.id,
      { name, code, description, hod, isActive },
      { new: true, runValidators: true }
    );
    if (!department) return res.status(404).json({ error: 'Not found' });
    res.json({ department });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to update faculty department' });
  }
});

// Delete a faculty department
router.delete('/:id', async (req, res) => {
  try {
    const department = await FacultyDepartment.findByIdAndDelete(req.params.id);
    if (!department) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Faculty department deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete faculty department' });
  }
});

// Assign HOD to a faculty for a department
router.put('/:id/hod', async (req, res) => {
  try {
    const { hod } = req.body; // hod is the faculty user ID
    if (!hod) return res.status(400).json({ error: 'HOD user ID is required' });
    const department = await FacultyDepartment.findByIdAndUpdate(
      req.params.id,
      { hod },
      { new: true, runValidators: true }
    );
    if (!department) return res.status(404).json({ error: 'Department not found' });
    // Update the faculty's profile role to 'hod' if not already set
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(hod);
    if (user && user.profile && user.profile.role !== 'hod') {
      user.profile.role = 'hod';
      await user.save();
    }
    res.json({ department });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to assign HOD' });
  }
});

export default router; 