import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  date: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  type: {
    type: String,
    enum: [
      'national_holiday',
      'state_holiday',
      'academic_holiday',
      'festival',
      'exam_holiday',
      'maintenance_holiday',
      'other'
    ],
    required: true
  },
  category: {
    type: String,
    enum: [
      'mandatory_holiday',
      'optional_holiday',
      'working_saturday',
      'half_day'
    ],
    default: 'mandatory_holiday'
  },
  affects: {
    students: {
      type: Boolean,
      default: true
    },
    faculty: {
      type: Boolean,
      default: true
    },
    staff: {
      type: Boolean,
      default: true
    },
    mess: {
      type: Boolean,
      default: false
    },
    hostel: {
      type: Boolean,
      default: false
    }
  },
  academicYear: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: Number,
    min: 1,
    max: 8
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['yearly', 'monthly', 'weekly'],
    default: 'yearly'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile'
  },
  tags: [{
    type: String,
    trim: true
  }],
  notifications: {
    sendToStudents: {
      type: Boolean,
      default: true
    },
    sendToFaculty: {
      type: Boolean,
      default: true
    },
    sendToStaff: {
      type: Boolean,
      default: true
    },
    reminderDays: {
      type: Number,
      default: 7,
      min: 0,
      max: 30
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
holidaySchema.index({ date: 1 });
holidaySchema.index({ endDate: 1 });
holidaySchema.index({ type: 1 });
holidaySchema.index({ category: 1 });
holidaySchema.index({ academicYear: 1 });
holidaySchema.index({ isActive: 1 });
holidaySchema.index({ createdBy: 1 });

// Method to check if a date is a holiday
holidaySchema.statics.isHoliday = function(date, userType = 'students') {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  return this.findOne({
    date: targetDate,
    isActive: true,
    [`affects.${userType}`]: true
  });
};

// Method to get holidays for a date range
holidaySchema.statics.getHolidaysForRange = function(startDate, endDate, userType = 'students') {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  return this.find({
    $or: [
      {
        date: {
          $gte: start,
          $lte: end
        }
      },
      {
        endDate: {
          $gte: start,
          $lte: end
        }
      },
      {
        date: { $lte: start },
        endDate: { $gte: end }
      }
    ],
    isActive: true,
    [`affects.${userType}`]: true
  }).sort({ date: 1 });
};

// Method to get upcoming holidays
holidaySchema.statics.getUpcomingHolidays = function(days = 30, userType = 'students') {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  
  const end = new Date();
  end.setDate(end.getDate() + days);
  
  return this.getHolidaysForRange(start, end, userType);
};

// Method to get holidays for current month
holidaySchema.statics.getCurrentMonthHolidays = function(userType = 'students') {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return this.getHolidaysForRange(start, end, userType);
};

// Method to check if date range has holidays
holidaySchema.statics.hasHolidaysInRange = function(startDate, endDate, userType = 'students') {
  return this.getHolidaysForRange(startDate, endDate, userType)
    .then(holidays => holidays.length > 0);
};

// Method to get holiday summary
holidaySchema.methods.getHolidaySummary = function() {
  const isMultiDay = this.endDate && this.endDate > this.date;
  const duration = isMultiDay ? 
    Math.ceil((this.endDate - this.date) / (1000 * 60 * 60 * 24)) + 1 : 1;
  
  return {
    title: this.title,
    date: this.date,
    endDate: this.endDate,
    duration,
    type: this.type,
    category: this.category,
    affects: this.affects,
    isMultiDay
  };
};

// Method to get working days between two dates (excluding holidays)
holidaySchema.statics.getWorkingDays = function(startDate, endDate, userType = 'students') {
  return this.getHolidaysForRange(startDate, endDate, userType)
    .then(holidays => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      let workingDays = 0;
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
        
        if (!isWeekend) {
          const isHoliday = holidays.some(holiday => {
            const holidayDate = new Date(holiday.date);
            holidayDate.setHours(0, 0, 0, 0);
            const currentDate = new Date(d);
            currentDate.setHours(0, 0, 0, 0);
            
            if (holiday.endDate) {
              const holidayEndDate = new Date(holiday.endDate);
              holidayEndDate.setHours(0, 0, 0, 0);
              return currentDate >= holidayDate && currentDate <= holidayEndDate;
            }
            
            return currentDate.getTime() === holidayDate.getTime();
          });
          
          if (!isHoliday) {
            workingDays++;
          }
        }
      }
      
      return workingDays;
    });
};

export default mongoose.model('Holiday', holidaySchema); 