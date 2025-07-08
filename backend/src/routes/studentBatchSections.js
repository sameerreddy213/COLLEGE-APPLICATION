import express from 'express';
import StudentBatchSection from '../models/StudentBatchSection.js';

const router = express.Router();

// Get all sections for a batch
router.get('/batch/:batchId', async (req, res) => {
  try {
    const sections = await StudentBatchSection.find({ batch: req.params.batchId }).sort({ name: 1 });
    res.json({ sections });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

// Get one section
router.get('/:id', async (req, res) => {
  try {
    const section = await StudentBatchSection.findById(req.params.id);
    if (!section) return res.status(404).json({ error: 'Section not found' });
    res.json({ section });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch section' });
  }
});

// Create section
router.post('/', async (req, res) => {
  try {
    const { name, batch } = req.body;
    const section = new StudentBatchSection({ name, batch });
    await section.save();
    res.status(201).json({ section });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create section' });
  }
});

// Update section
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const section = await StudentBatchSection.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true }
    );
    if (!section) return res.status(404).json({ error: 'Section not found' });
    res.json({ section });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update section' });
  }
});

// Delete section
router.delete('/:id', async (req, res) => {
  try {
    const section = await StudentBatchSection.findByIdAndDelete(req.params.id);
    if (!section) return res.status(404).json({ error: 'Section not found' });
    res.json({ message: 'Section deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete section' });
  }
});

export default router; 