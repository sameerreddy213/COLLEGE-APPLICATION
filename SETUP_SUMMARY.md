# Setup Summary - Manipur Digital Campus Hub

## Changes Made for Local Development

### 1. Environment Configuration Files

**Created `backend/env.local`:**
- MongoDB connection string for local development
- JWT secret for local development
- Rate limiting settings optimized for development
- Redis configuration (optional)

**Created `env.local`:**
- Frontend API URL pointing to local backend
- Development environment variables
- Feature flags for development

### 2. Setup and Utility Scripts

**Created `setup-local-dev.js`:**
- Automated setup script for local development
- Checks MongoDB and Redis connections
- Creates environment files if they don't exist
- Installs dependencies for both frontend and backend

**Created `test-setup.js`:**
- Tests MongoDB connection
- Tests backend health endpoint
- Tests frontend accessibility
- Provides clear feedback on setup status

**Created `start-dev.js`:**
- Starts both frontend and backend simultaneously
- Handles process management
- Graceful shutdown on Ctrl+C

### 3. Package.json Updates

**Frontend (`package.json`):**
- Added `setup` script: `node setup-local-dev.js`
- Added `test-setup` script: `node test-setup.js`
- Added `dev:all` script: `node start-dev.js`
- Added `start` script with proper host configuration

**Backend (`backend/package.json`):**
- Added `setup` script reference

### 4. Configuration Fixes

**Vite Configuration (`vite.config.ts`):**
- Fixed host configuration for better local development
- Added CORS support
- Added global definition for compatibility

**Backend Configuration (`backend/src/index.js`):**
- Fixed Redis error handling to prevent crashes
- Improved error messages for missing services

### 5. Documentation

**Created `LOCAL_DEVELOPMENT.md`:**
- Comprehensive local development guide
- Step-by-step setup instructions
- Troubleshooting section
- API documentation reference

## Quick Start Instructions

### Option 1: Automated Setup
```bash
# Run the setup script
npm run setup

# Start MongoDB (if not already running)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Start both frontend and backend
npm run dev:all
```

### Option 2: Manual Setup
```bash
# Install dependencies
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# Create environment files (if not created by setup script)
# Copy from frontend/.env.local and backend/.env

# Start backend
cd backend && npm run dev

# Start frontend (in new terminal)
cd frontend && npm run dev
```

### Option 3: Test Setup
```bash
# After setup, test if everything is working
npm run test-setup
```

## Access URLs

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

## Key Features for Local Development

1. **Hot Reload:** Both frontend and backend support hot reloading
2. **Error Handling:** Comprehensive error handling and logging
3. **CORS:** Configured for localhost development
4. **Rate Limiting:** Optimized for development (1000 requests per 15 minutes)
5. **Optional Redis:** Application works without Redis (caching disabled)
6. **Auto Port Detection:** Backend automatically finds available port if 5000 is busy

## Database Collections

The application uses MongoDB with these collections:
- `users` - User accounts and authentication
- `profiles` - User profile information
- `attendance` - Student attendance records
- `complaints` - User complaints and feedback
- `timetables` - Class timetables
- `messmenus` - Mess menu items
- `holidays` - Academic holidays
- `departments` - Department information
- `facultydepartments` - Faculty department mappings
- `studentbatches` - Student batch information
- `studentbatchsections` - Student batch sections

## User Roles

The system supports these roles:
- `super_admin` - Super Administrator
- `academic_staff` - Academic Section Staff
- `faculty` - Faculty Member
- `student` - Student
- `mess_supervisor` - Mess Supervisor
- `hostel_warden` - Hostel Warden
- `hod` - Head of Department
- `director` - Director

## Troubleshooting

### Common Issues:

1. **MongoDB Connection Failed:**
   - Ensure MongoDB is running on localhost:27017
   - Check if the service is started
   - Use Docker: `docker run -d -p 27017:27017 --name mongodb mongo:latest`

2. **Port Already in Use:**
   - Backend will automatically try the next available port
   - Check console output for actual port
   - Update frontend API URL if needed

3. **Frontend Build Errors:**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run lint`
   - Verify environment variables

4. **Backend Errors:**
   - Check if environment file exists in backend directory
   - Verify MongoDB connection string
   - Check console logs for specific error messages

## Next Steps

1. Start the application using one of the methods above
2. Register a new user through the frontend
3. Test the different features based on user roles
4. Check the API endpoints using the health check URL
5. Review the LOCAL_DEVELOPMENT.md for detailed information

## Support

If you encounter issues:
1. Run `npm run test-setup` to diagnose problems
2. Check console logs for error messages
3. Verify all prerequisites are installed
4. Ensure environment variables are set correctly
5. Check if all services are running 