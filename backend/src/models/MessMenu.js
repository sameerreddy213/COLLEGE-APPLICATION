import mongoose from 'mongoose';

const messMenuSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  breakfast: {
    veg: {
      items: [{
        name: {
          type: String,
          required: true,
          trim: true
        },
        description: {
          type: String,
          trim: true
        }
      }],
      special: {
        type: String,
        trim: true
      }
    },
    nonVeg: {
      items: [{
        name: {
          type: String,
          required: true,
          trim: true
        },
        description: {
          type: String,
          trim: true
        }
      }],
      special: {
        type: String,
        trim: true
      }
    },
    timing: {
      start: {
        type: String,
        default: '07:00',
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      end: {
        type: String,
        default: '09:00',
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      }
    }
  },
  lunch: {
    veg: {
      items: [{
        name: {
          type: String,
          required: true,
          trim: true
        },
        description: {
          type: String,
          trim: true
        }
      }],
      special: {
        type: String,
        trim: true
      }
    },
    nonVeg: {
      items: [{
        name: {
          type: String,
          required: true,
          trim: true
        },
        description: {
          type: String,
          trim: true
        }
      }],
      special: {
        type: String,
        trim: true
      }
    },
    timing: {
      start: {
        type: String,
        default: '12:00',
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      end: {
        type: String,
        default: '14:00',
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      }
    }
  },
  dinner: {
    veg: {
      items: [{
        name: {
          type: String,
          required: true,
          trim: true
        },
        description: {
          type: String,
          trim: true
        }
      }],
      special: {
        type: String,
        trim: true
      }
    },
    nonVeg: {
      items: [{
        name: {
          type: String,
          required: true,
          trim: true
        },
        description: {
          type: String,
          trim: true
        }
      }],
      special: {
        type: String,
        trim: true
      }
    },
    timing: {
      start: {
        type: String,
        default: '19:00',
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      },
      end: {
        type: String,
        default: '21:00',
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
      }
    }
  },
  snacks: {
    items: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      timing: {
        start: {
          type: String,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        },
        end: {
          type: String,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        }
      }
    }]
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isSpecialDay: {
    type: Boolean,
    default: false
  },
  specialDayName: {
    type: String,
    trim: true
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
  isActive: {
    type: Boolean,
    default: true
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
messMenuSchema.index({ isActive: 1 });
messMenuSchema.index({ createdBy: 1 });
messMenuSchema.index({ academicYear: 1 });

// Method to get today's menu
messMenuSchema.statics.getTodayMenu = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.findOne({
    date: today,
    isActive: true
  });
};

// Method to get menu for a specific date
messMenuSchema.statics.getMenuForDate = function(date) {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  return this.findOne({
    date: targetDate,
    isActive: true
  });
};

// Method to get weekly menu
messMenuSchema.statics.getWeeklyMenu = function(startDate) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  
  return this.find({
    date: {
      $gte: start,
      $lt: end
    },
    isActive: true
  }).sort({ date: 1 });
};

// Method to get current meal based on time
messMenuSchema.methods.getCurrentMeal = function() {
  const now = new Date();
  const currentTime = now.getHours() * 100 + now.getMinutes();
  
  const breakfastStart = parseInt(this.breakfast.timing.start.replace(':', ''));
  const breakfastEnd = parseInt(this.breakfast.timing.end.replace(':', ''));
  const lunchStart = parseInt(this.lunch.timing.start.replace(':', ''));
  const lunchEnd = parseInt(this.lunch.timing.end.replace(':', ''));
  const dinnerStart = parseInt(this.dinner.timing.start.replace(':', ''));
  const dinnerEnd = parseInt(this.dinner.timing.end.replace(':', ''));
  
  if (currentTime >= breakfastStart && currentTime <= breakfastEnd) {
    return 'breakfast';
  } else if (currentTime >= lunchStart && currentTime <= lunchEnd) {
    return 'lunch';
  } else if (currentTime >= dinnerStart && currentTime <= dinnerEnd) {
    return 'dinner';
  }
  
  return null;
};

// Method to get menu summary
messMenuSchema.methods.getMenuSummary = function() {
  return {
    date: this.date,
    breakfast: {
      veg: this.breakfast.veg.items.length,
      nonVeg: this.breakfast.nonVeg.items.length
    },
    lunch: {
      veg: this.lunch.veg.items.length,
      nonVeg: this.lunch.nonVeg.items.length
    },
    dinner: {
      veg: this.dinner.veg.items.length,
      nonVeg: this.dinner.nonVeg.items.length
    },
    snacks: this.snacks.items.length,
    isSpecialDay: this.isSpecialDay,
    specialDayName: this.specialDayName
  };
};

export default mongoose.model('MessMenu', messMenuSchema); 