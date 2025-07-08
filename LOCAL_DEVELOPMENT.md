# Local Development Guide

This guide will help you set up and run the Manipur Digital Campus Hub project locally.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local installation or Docker)
- Redis (optional, for caching)

## Quick Setup

1. **Run the setup script:**
   ```bash
   npm run setup
   ```

2. **Start MongoDB:**
   - **Option 1:** Install MongoDB locally
   - **Option 2:** Use Docker
     ```bash
     docker run -d -p 27017:27017 --name mongodb mongo:latest
     ```

3. **Start Redis (optional):**
   ```bash
   docker run -d -p 6379:6379 --name redis redis:alpine
   ```

## Manual Setup

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Environment Configuration

The setup script creates the necessary environment files. If you need to create them manually:

**Backend (.env file in backend directory):**
```env
MONGODB_URI=mongodb://localhost:27017/manipur-digital-campus
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-for-local-development-only-change-in-production
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
```

**Frontend (.env.local file in root directory):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Manipur Digital Campus Hub
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development
```

### 3. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Access URLs

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

## Default Users

You can register new users through the application. The system supports these roles:

- `super_admin` - Super Administrator
- `academic_staff` - Academic Section Staff
- `faculty` - Faculty Member
- `student` - Student
- `mess_supervisor` - Mess Supervisor
- `hostel_warden` - Hostel Warden
- `hod` - Head of Department
- `director` - Director

## Development Features

- **Hot Reload:** Both frontend and backend support hot reloading
- **CORS:** Configured for localhost development
- **Error Handling:** Comprehensive error handling and logging
- **Rate Limiting:** Configured for development (1000 requests per 15 minutes)
- **Caching:** Redis caching (optional)

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running on port 27017
- Check if the database name is correct in the connection string
- Verify MongoDB service is started

### Port Already in Use
- The backend will automatically try the next available port
- Check the console output for the actual port being used
- Update the frontend API URL if the backend port changes

### Redis Connection Issues
- Redis is optional for development
- The application will work without Redis (caching disabled)
- Check Redis logs if you want to use caching

### Frontend Build Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run lint`
- Ensure all environment variables are set correctly

## Database

The application uses MongoDB with the following collections:
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

## API Documentation

The backend provides RESTful APIs for all features. Key endpoints:

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/profiles` - Get user profiles
- `POST /api/attendance` - Mark attendance
- `GET /api/complaints` - Get complaints
- `POST /api/complaints` - Create complaint

## Contributing

1. Follow the existing code style
2. Add proper error handling
3. Test your changes locally
4. Update documentation if needed

## Support

If you encounter any issues:
1. Check the console logs for error messages
2. Verify all prerequisites are installed
3. Ensure environment variables are set correctly
4. Check if all services are running 