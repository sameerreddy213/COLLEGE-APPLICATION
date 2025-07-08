import express from 'express';
import Department from '../models/Department.js';

const router = express.Router();

// This route handles Student Departments only. Faculty departments use /faculty-departments.

// Get all departments
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json({ departments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// Get one department
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ error: 'Department not found' });
    res.json({ department });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

// Create department
router.post('/', async (req, res) => {
  try {
    const { name, code, description, hod, isActive } = req.body;
    const department = new Department({ name, code, description, hod, isActive });
    await department.save();
    res.status(201).json({ department });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Department name or code must be unique' });
    }
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// Update department
router.put('/:id', async (req, res) => {
  try {
    const { name, code, description, hod, isActive } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, code, description, hod, isActive },
      { new: true, runValidators: true }
    );
    if (!department) return res.status(404).json({ error: 'Department not found' });
    res.json({ department });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Department name or code must be unique' });
    }
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// Delete department
router.delete('/:id', async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) return res.status(404).json({ error: 'Department not found' });
    res.json({ message: 'Department deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

export default router; 