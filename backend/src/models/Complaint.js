import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    enum: [
      'electrical',
      'plumbing',
      'cleaning',
      'maintenance',
      'security',
      'internet',
      'food',
      'other'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'completed'],
    default: 'open'
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  studentInfo: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true
    },
    hostelBlock: {
      type: String,
      required: true,
      trim: true
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true
    },
    phoneNumber: {
      type: String,
      trim: true
    }
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile'
  },
  assignedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile'
  },
  resolvedAt: {
    type: Date
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile'
  },
  completedAt: {
    type: Date
  },
  resolutionNotes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  completionNotes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  estimatedResolutionTime: {
    type: Date
  },
  actualResolutionTime: {
    type: Date
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  academicYear: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
complaintSchema.index({ status: 1 });
complaintSchema.index({ studentId: 1 });
complaintSchema.index({ assignedTo: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ 'studentInfo.hostelBlock': 1 });
complaintSchema.index({ academicYear: 1 });

// Pre-save middleware to set urgent flag based on priority
complaintSchema.pre('save', function(next) {
  if (this.priority === 'urgent' || this.priority === 'high') {
    this.isUrgent = true;
  }
  next();
});

// Method to update status
complaintSchema.methods.updateStatus = function(newStatus, updatedBy, notes = '') {
  this.status = newStatus;
  
  switch (newStatus) {
    case 'in_progress':
      this.assignedTo = updatedBy;
      this.assignedAt = new Date();
      break;
    case 'resolved':
      this.resolvedBy = updatedBy;
      this.resolvedAt = new Date();
      this.resolutionNotes = notes;
      break;
    case 'completed':
      this.completedBy = updatedBy;
      this.completedAt = new Date();
      this.completionNotes = notes;
      break;
  }
  
  return this.save();
};

// Method to get complaint timeline
complaintSchema.methods.getTimeline = function() {
  const timeline = [
    {
      action: 'Complaint Filed',
      timestamp: this.createdAt,
      user: this.studentInfo.name,
      details: 'Complaint submitted'
    }
  ];
  
  if (this.assignedAt) {
    timeline.push({
      action: 'Assigned',
      timestamp: this.assignedAt,
      user: 'Warden',
      details: 'Complaint assigned for resolution'
    });
  }
  
  if (this.resolvedAt) {
    timeline.push({
      action: 'Resolved',
      timestamp: this.resolvedAt,
      user: 'Warden',
      details: this.resolutionNotes || 'Issue resolved'
    });
  }
  
  if (this.completedAt) {
    timeline.push({
      action: 'Completed',
      timestamp: this.completedAt,
      user: this.studentInfo.name,
      details: this.completionNotes || 'Work completed and verified'
    });
  }
  
  return timeline.sort((a, b) => a.timestamp - b.timestamp);
};

// Method to calculate resolution time
complaintSchema.methods.getResolutionTime = function() {
  if (!this.resolvedAt) return null;
  
  const resolutionTime = this.resolvedAt - this.createdAt;
  const hours = Math.floor(resolutionTime / (1000 * 60 * 60));
  const minutes = Math.floor((resolutionTime % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes, totalMinutes: Math.floor(resolutionTime / (1000 * 60)) };
};

export default mongoose.model('Complaint', complaintSchema); 