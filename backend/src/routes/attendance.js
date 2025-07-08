import express from 'express';
import { body, validationResult } from 'express-validator';
import Attendance from '../models/Attendance.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Cache attendance data in Redis
const getAttendanceFromCache = async (cacheKey) => {
  try {
    if (!global.redisClient) return null;
    const data = await global.redisClient.get(cacheKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis cache error:', error);
    return null;
  }
};

const setAttendanceInCache = async (cacheKey, data, ttl = 300) => {
  try {
    if (!global.redisClient) return;
    await global.redisClient.setEx(cacheKey, ttl, JSON.stringify(data));
  } catch (error) {
    console.error('Redis cache set error:', error);
  }
};

// Get attendance records with filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      date, 
      branch, 
      section, 
      year, 
      semester,
      subject,
      facultyId,
      academicYear,
      isMarked
    } = req.query;
    
    const filter = {};
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }
    if (branch) filter.branch = branch;
    if (section) filter.section = section;
    if (year) filter.year = parseInt(year);
    if (semester) filter.semester = parseInt(semester);
    if (subject) filter['classInfo.subject'] = subject;
    if (facultyId) filter['classInfo.facultyId'] = facultyId;
    if (academicYear) filter.academicYear = academicYear;
    if (isMarked !== undefined) filter.isMarked = isMarked === 'true';
    
    // Students can only see their own attendance
    if (req.user.profile.role === 'student') {
      filter['studentAttendance.studentId'] = req.user.profile._id;
    }

    // Create cache key based on filters and user
    const cacheKey = `attendance:${JSON.stringify(filter)}:${page}:${limit}:${req.user.profile.role}:${req.user.profile._id}`;
    
    // Try to get from cache first
    let cachedData = await getAttendanceFromCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const attendance = await Attendance.find(filter)
      .populate('classInfo.facultyId', 'name email designation department')
      .populate('studentAttendance.studentId', 'name email studentRollNumber branch batch year')
      .populate('studentAttendance.markedBy', 'name email')
      .populate('markedBy', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ date: -1 });

    const total = await Attendance.countDocuments(filter);

    const response = {
      data: attendance,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    };

    // Cache the response for 5 minutes
    await setAttendanceInCache(cacheKey, response, 300);

    res.json(response);

  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Get attendance statistics (HOD/Director only)
router.get('/stats/overview', authenticateToken, authorizeRoles(['hod', 'director', 'super_admin']), async (req, res) => {
  try {
    const { academicYear, branch, year, semester } = req.query;
    
    const filter = { isMarked: true };
    if (academicYear) filter.academicYear = academicYear;
    if (branch) filter.branch = branch;
    if (year) filter.year = parseInt(year);
    if (semester) filter.semester = parseInt(semester);

    // Create cache key for stats
    const cacheKey = `attendance_stats:${JSON.stringify(filter)}`;
    
    // Try to get from cache first
    let cachedData = await getAttendanceFromCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const totalClasses = await Attendance.countDocuments(filter);
    const totalStudents = await Attendance.aggregate([
      { $match: filter },
      { $unwind: '$studentAttendance' },
      { $group: { _id: '$studentAttendance.studentId' } },
      { $count: 'total' }
    ]);

    const attendanceStats = await Attendance.aggregate([
      { $match: filter },
      { $unwind: '$studentAttendance' },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$studentAttendance.status', 'present'] }, 1, 0] }
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ['$studentAttendance.status', 'absent'] }, 1, 0] }
          },
          lateCount: {
            $sum: { $cond: [{ $eq: ['$studentAttendance.status', 'late'] }, 1, 0] }
          },
          excusedCount: {
            $sum: { $cond: [{ $eq: ['$studentAttendance.status', 'excused'] }, 1, 0] }
          }
        }
      }
    ]);

    const subjectStats = await Attendance.aggregate([
      { $match: filter },
      { $unwind: '$studentAttendance' },
      {
        $group: {
          _id: '$classInfo.subject',
          totalRecords: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$studentAttendance.status', 'present'] }, 1, 0] }
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ['$studentAttendance.status', 'absent'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          subject: '$_id',
          totalRecords: 1,
          presentCount: 1,
          absentCount: 1,
          presentPercentage: {
            $multiply: [
              { $divide: ['$presentCount', '$totalRecords'] },
              100
            ]
          }
        }
      },
      { $sort: { presentPercentage: -1 } }
    ]);

    const stats = attendanceStats[0] || {
      totalRecords: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      excusedCount: 0
    };

    const overallPercentage = stats.totalRecords > 0 ? 
      ((stats.presentCount + stats.lateCount) / stats.totalRecords * 100).toFixed(2) : 0;

    const response = {
      data: {
        totalClasses,
        totalStudents: totalStudents[0]?.total || 0,
        totalRecords: stats.totalRecords,
        presentCount: stats.presentCount,
        absentCount: stats.absentCount,
        lateCount: stats.lateCount,
        excusedCount: stats.excusedCount,
        overallPercentage,
        subjectStats
      }
    };

    // Cache the response for 10 minutes (stats don't change frequently)
    await setAttendanceInCache(cacheKey, response, 600);

    res.json(response);

  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance statistics' });
  }
});

// Get students with low attendance (HOD/Director only)
router.get('/stats/low-attendance', authenticateToken, authorizeRoles(['hod', 'director', 'super_admin']), async (req, res) => {
  try {
    const { academicYear, branch, year, semester, threshold = 75 } = req.query;
    
    const filter = { isMarked: true };
    if (academicYear) filter.academicYear = academicYear;
    if (branch) filter.branch = branch;
    if (year) filter.year = parseInt(year);
    if (semester) filter.semester = parseInt(semester);

    const lowAttendanceStudents = await Attendance.aggregate([
      { $match: filter },
      { $unwind: '$studentAttendance' },
      {
        $group: {
          _id: '$studentAttendance.studentId',
          totalClasses: { $sum: 1 },
          presentCount: {
            $sum: { $cond: [{ $eq: ['$studentAttendance.status', 'present'] }, 1, 0] }
          },
          lateCount: {
            $sum: { $cond: [{ $eq: ['$studentAttendance.status', 'late'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          studentId: '$_id',
          totalClasses: 1,
          presentCount: 1,
          lateCount: 1,
          attendancePercentage: {
            $multiply: [
              { $divide: [{ $add: ['$presentCount', '$lateCount'] }, '$totalClasses'] },
              100
            ]
          }
        }
      },
      {
        $match: {
          attendancePercentage: { $lt: parseFloat(threshold) }
        }
      },
      { $sort: { attendancePercentage: 1 } },
      {
        $lookup: {
          from: 'profiles',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $project: {
          studentId: 1,
          studentName: '$student.name',
          studentRollNumber: '$student.studentRollNumber',
          branch: '$student.branch',
          batch: '$student.batch',
          year: '$student.year',
          totalClasses: 1,
          presentCount: 1,
          lateCount: 1,
          attendancePercentage: { $round: ['$attendancePercentage', 2] }
        }
      }
    ]);

    res.json({
      data: lowAttendanceStudents,
      threshold: parseFloat(threshold)
    });

  } catch (error) {
    console.error('Get low attendance students error:', error);
    res.status(500).json({ error: 'Failed to fetch low attendance students' });
  }
});

// Get attendance by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('classInfo.facultyId', 'name email designation department')
      .populate('studentAttendance.studentId', 'name email studentRollNumber branch batch year')
      .populate('studentAttendance.markedBy', 'name email')
      .populate('markedBy', 'name email');

    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json({ data: attendance });

  } catch (error) {
    console.error('Get attendance by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance record' });
  }
});

// Get student's attendance summary
router.get('/student/:studentId/summary', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicYear, semester } = req.query;

    // Students can only see their own attendance
    if (req.user.profile.role === 'student' && req.user.profile._id.toString() !== studentId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filter = {
      'studentAttendance.studentId': studentId
    };
    
    if (academicYear) filter.academicYear = academicYear;
    if (semester) filter.semester = parseInt(semester);

    const attendanceRecords = await Attendance.find(filter)
      .populate('classInfo.facultyId', 'name email designation department')
      .sort({ date: -1 });

    // Calculate summary statistics
    const summary = {};
    const subjectStats = {};

    attendanceRecords.forEach(record => {
      const studentRecord = record.studentAttendance.find(s => 
        s.studentId.toString() === studentId
      );
      
      if (studentRecord) {
        const subject = record.classInfo.subject;
        
        if (!subjectStats[subject]) {
          subjectStats[subject] = {
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0
          };
        }
        
        subjectStats[subject].total++;
        
        switch (studentRecord.status) {
          case 'present':
            subjectStats[subject].present++;
            break;
          case 'absent':
            subjectStats[subject].absent++;
            break;
          case 'late':
            subjectStats[subject].late++;
            break;
          case 'excused':
            subjectStats[subject].excused++;
            break;
        }
      }
    });

    // Calculate percentages
    Object.keys(subjectStats).forEach(subject => {
      const stats = subjectStats[subject];
      stats.presentPercentage = stats.total > 0 ? 
        ((stats.present + stats.late) / stats.total * 100).toFixed(2) : 0;
      stats.absentPercentage = stats.total > 0 ? 
        (stats.absent / stats.total * 100).toFixed(2) : 0;
    });

    // Overall summary
    const totalClasses = Object.values(subjectStats).reduce((sum, stats) => sum + stats.total, 0);
    const totalPresent = Object.values(subjectStats).reduce((sum, stats) => sum + stats.present + stats.late, 0);
    const overallPercentage = totalClasses > 0 ? (totalPresent / totalClasses * 100).toFixed(2) : 0;

    res.json({
      data: {
        studentId,
        overallPercentage,
        totalClasses,
        totalPresent,
        subjectStats,
        recentRecords: attendanceRecords.slice(0, 10) // Last 10 records
      }
    });

  } catch (error) {
    console.error('Get student attendance summary error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
});

// Mark attendance for a class (Faculty only)
router.post('/mark', authenticateToken, authorizeRoles(['faculty']), [
  body('date').isISO8601(),
  body('classInfo.subject').trim().notEmpty(),
  body('classInfo.startTime').trim().notEmpty(),
  body('classInfo.endTime').trim().notEmpty(),
  body('classInfo.location').trim().notEmpty(),
  body('timetableInfo.branch').trim().notEmpty(),
  body('timetableInfo.section').trim().notEmpty(),
  body('timetableInfo.year').isInt({ min: 1, max: 4 }),
  body('timetableInfo.semester').isInt({ min: 1, max: 8 }),
  body('academicYear').trim().notEmpty(),
  body('studentAttendance').isArray({ min: 1 }),
  body('studentAttendance.*.studentId').isMongoId(),
  body('studentAttendance.*.status').isIn(['present', 'absent', 'late', 'excused'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array() 
      });
    }

    const {
      date,
      classInfo,
      timetableInfo,
      academicYear,
      studentAttendance
    } = req.body;

    // Check if attendance already exists for this class and date
    const existingAttendance = await Attendance.findOne({
      date: new Date(date),
      'classInfo.subject': classInfo.subject,
      'classInfo.startTime': classInfo.startTime,
      branch: timetableInfo.branch,
      section: timetableInfo.section,
      year: timetableInfo.year,
      semester: timetableInfo.semester
    });

    if (existingAttendance) {
      return res.status(400).json({ 
        error: 'Attendance already marked',
        message: 'Attendance has already been marked for this class on the specified date'
      });
    }

    // Add markedBy to each student attendance record
    const attendanceRecords = studentAttendance.map(record => ({
      ...record,
      markedBy: req.user.profile._id,
      markedAt: new Date()
    }));

    const attendance = new Attendance({
      date: new Date(date),
      classInfo: {
        ...classInfo,
        facultyId: req.user.profile._id
      },
      branch: timetableInfo.branch,
      section: timetableInfo.section,
      year: timetableInfo.year,
      semester: timetableInfo.semester,
      studentAttendance: attendanceRecords,
      totalStudents: studentAttendance.length,
      isMarked: true,
      markedBy: req.user.profile._id,
      academicYear
    });

    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('classInfo.facultyId', 'name email designation department')
      .populate('studentAttendance.studentId', 'name email studentRollNumber')
      .populate('studentAttendance.markedBy', 'name email')
      .populate('markedBy', 'name email');

    res.status(201).json({
      data: populatedAttendance,
      message: 'Attendance marked successfully'
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Update attendance (Faculty only)
router.put('/:id', authenticateToken, authorizeRoles(['faculty']), async (req, res) => {
  try {
    const { id } = req.params;
    const { studentAttendance } = req.body;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    // Verify faculty owns this class
    if (attendance.classInfo.facultyId.toString() !== req.user.profile._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update student attendance records
    if (studentAttendance) {
      attendance.studentAttendance = studentAttendance.map(record => ({
        ...record,
        markedBy: req.user.profile._id,
        markedAt: new Date()
      }));
    }

    await attendance.save();

    const updatedAttendance = await Attendance.findById(id)
      .populate('classInfo.facultyId', 'name email designation department')
      .populate('studentAttendance.studentId', 'name email studentRollNumber')
      .populate('studentAttendance.markedBy', 'name email')
      .populate('markedBy', 'name email');

    res.json({
      data: updatedAttendance,
      message: 'Attendance updated successfully'
    });

  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ error: 'Failed to update attendance' });
  }
});

export default router; 