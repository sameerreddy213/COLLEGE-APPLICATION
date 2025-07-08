import studentBatchesRouter from './studentBatches.js';
import express from 'express';

const router = express.Router();

router.use('/batches', studentBatchesRouter);

export default router; 