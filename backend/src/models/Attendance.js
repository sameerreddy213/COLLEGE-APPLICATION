import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  timetableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timetable',
    required: true
  },
  classInfo: {
    subject: {
      type: String,
      required: true,
      trim: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true
    }
  },
  branch: {
    type: String,
    required: true,
    trim: true
  },
  section: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  studentAttendance: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      default: 'absent'
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Profile',
      required: true
    },
    markedAt: {
      type: Date,
      default: Date.now
    },
    remarks: {
      type: String,
      trim: true
    }
  }],
  totalStudents: {
    type: Number,
    required: true,
    min: 0
  },
  presentCount: {
    type: Number,
    default: 0,
    min: 0
  },
  absentCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lateCount: {
    type: Number,
    default: 0,
    min: 0
  },
  excusedCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isMarked: {
    type: Boolean,
    default: false
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  markedAt: {
    type: Date,
    default: Date.now
  },
  academicYear: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
attendanceSchema.index({ timetableId: 1 });
attendanceSchema.index({ 'classInfo.facultyId': 1 });
attendanceSchema.index({ branch: 1, section: 1, year: 1 });
attendanceSchema.index({ 'studentAttendance.studentId': 1 });
attendanceSchema.index({ academicYear: 1 });
attendanceSchema.index({ isMarked: 1 });

// Pre-save middleware to update counts
attendanceSchema.pre('save', function(next) {
  if (this.studentAttendance && this.studentAttendance.length > 0) {
    this.presentCount = this.studentAttendance.filter(s => s.status === 'present').length;
    this.absentCount = this.studentAttendance.filter(s => s.status === 'absent').length;
    this.lateCount = this.studentAttendance.filter(s => s.status === 'late').length;
    this.excusedCount = this.studentAttendance.filter(s => s.status === 'excused').length;
    this.totalStudents = this.studentAttendance.length;
  }
  next();
});

// Method to get attendance percentage for a student
attendanceSchema.methods.getStudentAttendancePercentage = function(studentId) {
  // This would typically be calculated across multiple attendance records
  // For now, return the percentage for this specific class
  const studentRecord = this.studentAttendance.find(s => 
    s.studentId.toString() === studentId.toString()
  );
  
  if (!studentRecord) return 0;
  
  switch (studentRecord.status) {
    case 'present':
    case 'late':
      return 100;
    case 'excused':
      return 50; // Half attendance for excused
    case 'absent':
    default:
      return 0;
  }
};

// Method to get attendance summary
attendanceSchema.methods.getAttendanceSummary = function() {
  return {
    total: this.totalStudents,
    present: this.presentCount,
    absent: this.absentCount,
    late: this.lateCount,
    excused: this.excusedCount,
    presentPercentage: this.totalStudents > 0 ? 
      ((this.presentCount + this.lateCount) / this.totalStudents * 100).toFixed(2) : 0
  };
};

export default mongoose.model('Attendance', attendanceSchema); 