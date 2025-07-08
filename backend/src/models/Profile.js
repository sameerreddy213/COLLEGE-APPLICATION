import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  role: {
    type: String,
    enum: [
      'super_admin',           // Super Admin
      'academic_staff',        // Academic Section Staff
      'faculty',              // Faculty
      'student',              // Student
      'mess_supervisor',      // Mess Supervisor
      'hostel_warden',        // Hostel Warden
      'hod',                  // Head of Department
      'director'              // Director
    ],
    required: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    default: null
  },
  
  // Student-specific fields
  studentRollNumber: {
    type: String,
    trim: true,
    sparse: true, // Allows multiple null values
    unique: true
  },
  hostelRoomNo: {
    type: String,
    trim: true
  },
  hostelBlockNumber: {
    type: String,
    trim: true
  },
  branch: {
    type: String,
    trim: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentBatch',
    default: null
  },
  section: {
    type: String,
    trim: true,
    default: null
  },
  year: {
    type: Number,
    min: 1,
    max: 4
  },
  
  // Faculty-specific fields
  designation: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  
  // Common fields
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  avatar: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
profileSchema.index({ role: 1 });
profileSchema.index({ department: 1 });
profileSchema.index({ branch: 1 });
profileSchema.index({ batch: 1 });
profileSchema.index({ year: 1 });

// Virtual for full name
profileSchema.virtual('fullName').get(function() {
  return this.name;
});

// Method to get public profile (without sensitive data)
profileSchema.methods.toPublicJSON = function() {
  const profile = this.toObject();
  delete profile.__v;
  delete profile.createdAt;
  delete profile.updatedAt;
  return profile;
};

export default mongoose.model('Profile', profileSchema); 