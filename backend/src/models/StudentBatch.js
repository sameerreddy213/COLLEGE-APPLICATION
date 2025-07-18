import mongoose from 'mongoose';

const studentBatchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('StudentBatch', studentBatchSchema); 