import express from 'express';
import StudentBatch from '../models/StudentBatch.js';

const router = express.Router();

// Get all student batches
router.get('/', async (req, res) => {
  try {
    const batches = await StudentBatch.find().sort({ name: 1 });
    res.json({ batches });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student batches' });
  }
});

// Get one student batch
router.get('/:id', async (req, res) => {
  try {
    const batch = await StudentBatch.findById(req.params.id);
    if (!batch) return res.status(404).json({ error: 'Student batch not found' });
    res.json({ batch });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student batch' });
  }
});

// Create student batch
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const batch = new StudentBatch({ name });
    await batch.save();
    res.status(201).json({ batch });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Student batch name must be unique' });
    }
    res.status(500).json({ error: 'Failed to create student batch' });
  }
});

// Update student batch
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const batch = await StudentBatch.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true }
    );
    if (!batch) return res.status(404).json({ error: 'Student batch not found' });
    res.json({ batch });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Student batch name must be unique' });
    }
    res.status(500).json({ error: 'Failed to update student batch' });
  }
});

// Delete student batch
router.delete('/:id', async (req, res) => {
  try {
    const batch = await StudentBatch.findByIdAndDelete(req.params.id);
    if (!batch) return res.status(404).json({ error: 'Student batch not found' });
    res.json({ message: 'Student batch deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete student batch' });
  }
});

export default router; 