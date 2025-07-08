import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentBatch',
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  credits: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },

  academicYear: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
courseSchema.index({ batch: 1, semester: 1 });
courseSchema.index({ academicYear: 1 });
courseSchema.index({ isActive: 1 });

// Ensure unique course code per batch and academic year
courseSchema.index({ code: 1, batch: 1, academicYear: 1 }, { unique: true });

export default mongoose.model('Course', courseSchema); 