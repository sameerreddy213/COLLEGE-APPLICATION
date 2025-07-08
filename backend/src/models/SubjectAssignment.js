import mongoose from 'mongoose';

const subjectAssignmentSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    trim: true
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  department: {
    type: String,
    trim: true
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
subjectAssignmentSchema.index({ subject: 1, academicYear: 1 });
subjectAssignmentSchema.index({ facultyId: 1 });
subjectAssignmentSchema.index({ department: 1 });
subjectAssignmentSchema.index({ isActive: 1 });

// Ensure unique subject-faculty combination per academic year
subjectAssignmentSchema.index({ subject: 1, facultyId: 1, academicYear: 1 }, { unique: true });

export default mongoose.model('SubjectAssignment', subjectAssignmentSchema); 