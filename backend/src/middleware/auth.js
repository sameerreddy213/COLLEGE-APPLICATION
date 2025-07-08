import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Profile from '../models/Profile.js';

// Simple user data functions (no Redis caching needed for small group)
const getUserData = async (userId) => {
  try {
    const user = await User.findById(userId);
    const profile = await Profile.findOne({ userId: user._id });
    
    if (user && profile) {
      return { user, profile };
    }
    
    return null;
  } catch (error) {
    console.error('Database query error:', error);
    return null;
  }
};

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user data directly from database (no caching needed for small group)
    const userData = await getUserData(decoded.userId);
    
    if (!userData) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { user, profile } = userData;

    // Attach user and profile to request
    req.user = {
      id: user._id,
      email: user.email,
      profile: profile
    };
    req.profile = profile;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Middleware to check if user has specific role
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.profile) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.profile.role;
    
    if (Array.isArray(roles)) {
      if (!roles.includes(userRole)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: roles,
          current: userRole
        });
      }
    } else {
      if (userRole !== roles) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: roles,
          current: userRole
        });
      }
    }

    next();
  };
};

// Alias for requireRole for consistency
export const authorizeRoles = requireRole;

// Middleware to check if user is admin
export const requireAdmin = requireRole('super_admin');

// Middleware to check if user is faculty or admin
export const requireFacultyOrAdmin = requireRole(['faculty', 'super_admin']);

// Middleware to check if user is student
export const requireStudent = requireRole('student');

// Middleware to check if user is hostel warden
export const requireHostelWarden = requireRole('hostel_warden');

// Middleware to check if user is mess supervisor
export const requireMessSupervisor = requireRole('mess_supervisor');

// Middleware to check if user can access their own data or is admin
export const requireOwnershipOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.profile) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.profile.role;
    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    const currentUserId = req.user._id.toString();

    // Admin can access everything
    if (userRole === 'super_admin') {
      return next();
    }

    // Users can only access their own data
    if (resourceUserId === currentUserId) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Access denied',
      message: 'You can only access your own data'
    });
  };
}; 