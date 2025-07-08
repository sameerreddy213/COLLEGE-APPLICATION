import express from 'express';
import Holiday from '../models/Holiday.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get upcoming holidays (accessible by all authenticated users)
router.get('/upcoming', authenticateToken, async (req, res) => {
  try {
    const { days = 30, userType = 'students' } = req.query;
    const holidays = await Holiday.getUpcomingHolidays(parseInt(days), userType);
    
    res.json({ data: holidays });
  } catch (error) {
    console.error('Error fetching upcoming holidays:', error);
    res.status(500).json({ 
      error: 'Failed to fetch upcoming holidays' 
    });
  }
});

// Get current month holidays
router.get('/current-month', authenticateToken, async (req, res) => {
  try {
    const { userType = 'students' } = req.query;
    const holidays = await Holiday.getCurrentMonthHolidays(userType);
    
    res.json({ data: holidays });
  } catch (error) {
    console.error('Error fetching current month holidays:', error);
    res.status(500).json({ 
      error: 'Failed to fetch current month holidays' 
    });
  }
});

// Check if a specific date is a holiday
router.get('/check/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const { userType = 'students' } = req.query;
    
    const holiday = await Holiday.isHoliday(date, userType);
    
    res.json({ 
      isHoliday: !!holiday,
      holiday: holiday ? holiday.getHolidaySummary() : null
    });
  } catch (error) {
    console.error('Error checking holiday:', error);
    res.status(500).json({ 
      error: 'Failed to check holiday status' 
    });
  }
});

// Get holidays for a date range
router.get('/range', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, userType = 'students' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Start date and end date are required' 
      });
    }
    
    const holidays = await Holiday.getHolidaysForRange(startDate, endDate, userType);
    
    res.json({ data: holidays });
  } catch (error) {
    console.error('Error fetching holidays for range:', error);
    res.status(500).json({ 
      error: 'Failed to fetch holidays for range' 
    });
  }
});

// Get working days between two dates
router.get('/working-days', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, userType = 'students' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Start date and end date are required' 
      });
    }
    
    const workingDays = await Holiday.getWorkingDays(startDate, endDate, userType);
    
    res.json({ 
      data: { workingDays },
      startDate,
      endDate,
      userType
    });
  } catch (error) {
    console.error('Error calculating working days:', error);
    res.status(500).json({ 
      error: 'Failed to calculate working days' 
    });
  }
});

// Create new holiday (Academic Staff only)
router.post('/', authenticateToken, authorizeRoles(['academic_staff', 'super_admin']), async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      endDate,
      type,
      category,
      affects,
      academicYear,
      semester,
      isRecurring,
      recurringPattern,
      tags,
      notifications
    } = req.body;

    const holiday = new Holiday({
      title,
      description,
      date,
      endDate,
      type,
      category,
      affects,
      academicYear,
      semester,
      isRecurring,
      recurringPattern,
      tags,
      notifications,
      createdBy: req.user.id
    });

    await holiday.save();

    res.status(201).json({ 
      data: holiday,
      message: 'Holiday created successfully' 
    });
  } catch (error) {
    console.error('Error creating holiday:', error);
    res.status(500).json({ 
      error: 'Failed to create holiday' 
    });
  }
});

// Update holiday (Academic Staff only)
router.put('/:id', authenticateToken, authorizeRoles(['academic_staff', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    updateData.updatedBy = req.user.id;

    const holiday = await Holiday.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!holiday) {
      return res.status(404).json({ 
        error: 'Holiday not found' 
      });
    }

    res.json({ 
      data: holiday,
      message: 'Holiday updated successfully' 
    });
  } catch (error) {
    console.error('Error updating holiday:', error);
    res.status(500).json({ 
      error: 'Failed to update holiday' 
    });
  }
});

// Delete holiday (Academic Staff only)
router.delete('/:id', authenticateToken, authorizeRoles(['academic_staff', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const holiday = await Holiday.findByIdAndDelete(id);

    if (!holiday) {
      return res.status(404).json({ 
        error: 'Holiday not found' 
      });
    }

    res.json({ 
      message: 'Holiday deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    res.status(500).json({ 
      error: 'Failed to delete holiday' 
    });
  }
});

// Get all holidays with pagination and filtering (Academic Staff only)
router.get('/', authenticateToken, authorizeRoles(['academic_staff', 'super_admin']), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      category, 
      academicYear, 
      isActive,
      startDate,
      endDate
    } = req.query;
    
    const filter = {};
    
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (academicYear) filter.academicYear = academicYear;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    if (startDate && endDate) {
      filter.$or = [
        {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        },
        {
          endDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        },
        {
          date: { $lte: new Date(startDate) },
          endDate: { $gte: new Date(endDate) }
        }
      ];
    }

    const holidays = await Holiday.find(filter)
      .sort({ date: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    const total = await Holiday.countDocuments(filter);

    res.json({
      data: holidays,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({ 
      error: 'Failed to fetch holidays' 
    });
  }
});

// Bulk create holidays (Academic Staff only)
router.post('/bulk', authenticateToken, authorizeRoles(['academic_staff', 'super_admin']), async (req, res) => {
  try {
    const { holidays } = req.body;

    if (!Array.isArray(holidays) || holidays.length === 0) {
      return res.status(400).json({ 
        error: 'Holidays array is required' 
      });
    }

    const createdHolidays = [];
    const errors = [];

    for (const holidayData of holidays) {
      try {
        const holiday = new Holiday({
          ...holidayData,
          createdBy: req.user.id
        });

        await holiday.save();
        createdHolidays.push(holiday);
      } catch (error) {
        errors.push({
          title: holidayData.title,
          date: holidayData.date,
          error: error.message
        });
      }
    }

    res.status(201).json({
      data: createdHolidays,
      errors,
      message: `Created ${createdHolidays.length} holidays successfully`
    });
  } catch (error) {
    console.error('Error bulk creating holidays:', error);
    res.status(500).json({ 
      error: 'Failed to bulk create holidays' 
    });
  }
});

// Get holiday statistics (Director/HOD only)
router.get('/stats', authenticateToken, authorizeRoles(['director', 'hod', 'super_admin']), async (req, res) => {
  try {
    const { academicYear, userType = 'students' } = req.query;
    
    const filter = {};
    if (academicYear) filter.academicYear = academicYear;
    filter.isActive = true;
    filter[`affects.${userType}`] = true;

    const totalHolidays = await Holiday.countDocuments(filter);
    const nationalHolidays = await Holiday.countDocuments({ ...filter, type: 'national_holiday' });
    const stateHolidays = await Holiday.countDocuments({ ...filter, type: 'state_holiday' });
    const academicHolidays = await Holiday.countDocuments({ ...filter, type: 'academic_holiday' });
    const festivals = await Holiday.countDocuments({ ...filter, type: 'festival' });

    const upcomingHolidays = await Holiday.getUpcomingHolidays(30, userType);

    res.json({
      data: {
        total: totalHolidays,
        byType: {
          national: nationalHolidays,
          state: stateHolidays,
          academic: academicHolidays,
          festivals: festivals
        },
        upcoming: upcomingHolidays.length
      }
    });
  } catch (error) {
    console.error('Error fetching holiday statistics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch holiday statistics' 
    });
  }
});

export default router; 