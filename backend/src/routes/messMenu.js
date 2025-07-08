import express from 'express';
import MessMenu from '../models/MessMenu.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get today's menu (accessible by all authenticated users)
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const menu = await MessMenu.getTodayMenu();
    
    if (!menu) {
      return res.status(404).json({ 
        error: 'No menu found for today' 
      });
    }
    
    res.json({ 
      data: menu,
      currentMeal: menu.getCurrentMeal()
    });
  } catch (error) {
    console.error('Error fetching today\'s menu:', error);
    res.status(500).json({ 
      error: 'Failed to fetch today\'s menu' 
    });
  }
});

// Get menu for a specific date
router.get('/date/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;
    const menu = await MessMenu.getMenuForDate(date);
    
    if (!menu) {
      return res.status(404).json({ 
        error: 'No menu found for the specified date' 
      });
    }
    
    res.json({ data: menu });
  } catch (error) {
    console.error('Error fetching menu for date:', error);
    res.status(500).json({ 
      error: 'Failed to fetch menu for the specified date' 
    });
  }
});

// Get weekly menu
router.get('/week/:startDate', authenticateToken, async (req, res) => {
  try {
    const { startDate } = req.params;
    const menus = await MessMenu.getWeeklyMenu(startDate);
    
    res.json({ data: menus });
  } catch (error) {
    console.error('Error fetching weekly menu:', error);
    res.status(500).json({ 
      error: 'Failed to fetch weekly menu' 
    });
  }
});

// Create new menu (Mess Supervisor only)
router.post('/', authenticateToken, authorizeRoles(['mess_supervisor']), async (req, res) => {
  try {
    const {
      date,
      breakfast,
      lunch,
      dinner,
      snacks,
      notes,
      isSpecialDay,
      specialDayName,
      academicYear
    } = req.body;

    // Validate required fields
    if (!date) {
      return res.status(400).json({ 
        error: 'Date is required' 
      });
    }

    // Normalize the date to start of day for comparison
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    // Check if menu already exists for the date
    const existingMenu = await MessMenu.findOne({
      date: {
        $gte: normalizedDate,
        $lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingMenu) {
      return res.status(400).json({ 
        error: 'Menu already exists for this date',
        existingMenuId: existingMenu._id
      });
    }

    const menu = new MessMenu({
      date: normalizedDate,
      breakfast,
      lunch,
      dinner,
      snacks,
      notes,
      isSpecialDay,
      specialDayName,
      academicYear,
      createdBy: req.user.id
    });

    await menu.save();

    res.status(201).json({ 
      data: menu,
      message: 'Menu created successfully' 
    });
  } catch (error) {
    console.error('Error creating menu:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Menu already exists for this date (duplicate key error)',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create menu',
      details: error.message
    });
  }
});

// Update menu (Mess Supervisor only)
router.put('/:id', authenticateToken, authorizeRoles(['mess_supervisor']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    updateData.updatedBy = req.user.id;

    const menu = await MessMenu.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!menu) {
      return res.status(404).json({ 
        error: 'Menu not found' 
      });
    }

    res.json({ 
      data: menu,
      message: 'Menu updated successfully' 
    });
  } catch (error) {
    console.error('Error updating menu:', error);
    res.status(500).json({ 
      error: 'Failed to update menu' 
    });
  }
});

// Delete menu (Mess Supervisor only)
router.delete('/:id', authenticateToken, authorizeRoles(['mess_supervisor']), async (req, res) => {
  try {
    const { id } = req.params;
    const menu = await MessMenu.findByIdAndDelete(id);

    if (!menu) {
      return res.status(404).json({ 
        error: 'Menu not found' 
      });
    }

    res.json({ 
      message: 'Menu deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting menu:', error);
    res.status(500).json({ 
      error: 'Failed to delete menu' 
    });
  }
});

// Get all menus with pagination (Mess Supervisor only)
router.get('/', authenticateToken, authorizeRoles(['mess_supervisor']), async (req, res) => {
  try {
    const { page = 1, limit = 10, date, isActive } = req.query;
    
    const filter = {};
    if (date) {
      filter.date = new Date(date);
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const menus = await MessMenu.find(filter)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    const total = await MessMenu.countDocuments(filter);

    res.json({
      data: menus,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching menus:', error);
    res.status(500).json({ 
      error: 'Failed to fetch menus' 
    });
  }
});

// Bulk create menus (Mess Supervisor only)
router.post('/bulk', authenticateToken, authorizeRoles(['mess_supervisor']), async (req, res) => {
  try {
    const { menus } = req.body;

    if (!Array.isArray(menus) || menus.length === 0) {
      return res.status(400).json({ 
        error: 'Menus array is required' 
      });
    }

    const createdMenus = [];
    const errors = [];

    for (const menuData of menus) {
      try {
        // Validate required fields
        if (!menuData.date) {
          errors.push({
            date: menuData.date,
            error: 'Date is required'
          });
          continue;
        }

        // Normalize the date to start of day for comparison
        const normalizedDate = new Date(menuData.date);
        normalizedDate.setHours(0, 0, 0, 0);

        // Check if menu already exists for the date
        const existingMenu = await MessMenu.findOne({
          date: {
            $gte: normalizedDate,
            $lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000)
          }
        });

        if (existingMenu) {
          errors.push({
            date: menuData.date,
            error: 'Menu already exists for this date'
          });
          continue;
        }

        const menu = new MessMenu({
          ...menuData,
          date: normalizedDate,
          createdBy: req.user.id
        });

        await menu.save();
        createdMenus.push(menu);
      } catch (error) {
        console.error(`Error creating menu for date ${menuData.date}:`, error);
        
        // Handle specific MongoDB errors
        if (error.code === 11000) {
          errors.push({
            date: menuData.date,
            error: 'Menu already exists for this date (duplicate key error)'
          });
        } else {
          errors.push({
            date: menuData.date,
            error: error.message
          });
        }
      }
    }

    res.status(201).json({
      data: createdMenus,
      errors,
      message: `Created ${createdMenus.length} menus successfully`
    });
  } catch (error) {
    console.error('Error bulk creating menus:', error);
    res.status(500).json({ 
      error: 'Failed to bulk create menus' 
    });
  }
});

// Clear all menus (for development/testing - Mess Supervisor only)
router.delete('/clear/all', authenticateToken, authorizeRoles(['mess_supervisor']), async (req, res) => {
  try {
    const result = await MessMenu.deleteMany({});
    res.json({ 
      message: `Cleared ${result.deletedCount} menus successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing menus:', error);
    res.status(500).json({ 
      error: 'Failed to clear menus' 
    });
  }
});

export default router; 