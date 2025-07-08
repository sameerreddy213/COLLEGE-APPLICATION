# IIIT Manipur Digital Campus Backend

> **Note:** This backend is now located in the `backend/` directory. The frontend React app is in the `frontend/` directory. Each must be installed and run separately.

A Node.js/Express backend API for the IIIT Manipur Digital Campus System, built with MongoDB and JWT authentication.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete user and profile management system
- **Attendance Tracking**: Student attendance management with conflict detection
- **Complaint System**: Multi-category complaint management with status tracking
- **Timetable Management**: Class schedule management with conflict prevention
- **Security**: Rate limiting, input validation, and security headers
- **Role-based Access**: Different permissions for students, faculty, admin, hostel warden, and mess supervisor

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Navigate to the frontend directory**:
   ```bash
   cd ../frontend
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Set up environment variables**:
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/manipur-digital-campus
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:5173
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Start the frontend development server** (in a new terminal):
   ```bash
   cd ../frontend
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

### Profiles
- `GET /api/profiles` - Get all profiles (admin only)
- `GET /api/profiles/me` - Get current user's profile
- `GET /api/profiles/:id` - Get profile by ID
- `PUT /api/profiles/me` - Update current user's profile
- `PUT /api/profiles/:id` - Update profile by ID (admin only)
- `DELETE /api/profiles/:id` - Delete profile (admin only)

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance (faculty/admin)
- `POST /api/attendance/bulk` - Bulk mark attendance (faculty/admin)
- `PUT /api/attendance/:id` - Update attendance (faculty/admin)
- `DELETE /api/attendance/:id` - Delete attendance (faculty/admin)
- `GET /api/attendance/stats` - Get attendance statistics

### Complaints
- `GET /api/complaints` - Get complaints
- `GET /api/complaints/:id` - Get complaint by ID
- `POST /api/complaints` - Create new complaint
- `PUT /api/complaints/:id` - Update complaint
- `POST /api/complaints/:id/comments` - Add comment to complaint
- `DELETE /api/complaints/:id` - Delete complaint
- `GET /api/complaints/stats/overview` - Get complaint statistics (admin)

### Timetable
- `GET /api/timetable` - Get timetable entries
- `GET /api/timetable/:id` - Get timetable by ID
- `POST /api/timetable` - Create timetable entry (faculty/admin)
- `PUT /api/timetable/:id` - Update timetable entry (faculty/admin)
- `DELETE /api/timetable/:id` - Delete timetable entry (faculty/admin)
- `GET /api/timetable/department/:department/semester/:semester` - Get department timetable
- `GET /api/timetable/teacher/:teacherId` - Get teacher's timetable

## User Roles

1. **Student**: Can view their own attendance, submit complaints, view timetable
2. **Faculty**: Can mark attendance, manage timetable, view student data
3. **Admin**: Full access to all features and user management
4. **Hostel Warden**: Can manage hostel-related complaints and student data
5. **Mess Supervisor**: Can manage mess-related complaints and student data

## Database Models

### User
- Authentication fields (email, password)
- Email verification status
- Login attempts and account locking
- Password reset functionality

### Profile
- User details (name, role, contact info)
- Academic information (department, student/faculty ID)
- Hostel information (block, room)
- Emergency contacts

### Attendance
- Student attendance records
- Subject and teacher information
- Date and time tracking
- Status (present, absent, late, excused)

### Complaint
- Multi-category complaints
- Priority levels and status tracking
- Comments and resolution tracking
- File attachments support

### Timetable
- Class schedule management
- Room and teacher assignment
- Conflict detection and prevention
- Department and semester organization

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Rate Limiting**: Prevents abuse and DDoS attacks
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configurable cross-origin resource sharing
- **Security Headers**: Helmet.js for security headers
- **Account Locking**: Automatic account locking after failed attempts

## Development

### Running in Development Mode
```bash
npm run dev
```

### Running in Production Mode
```