# Manipur Digital Campus Hub

A comprehensive digital campus management system for IIIT Manipur, designed to streamline academic and administrative operations.

## Features

- **Student Management**: Complete student profile management, batch tracking, and academic records
- **Faculty Dashboard**: Department management, course assignments, and academic oversight
- **Attendance System**: Digital attendance tracking with real-time reporting
- **Complaint Management**: Hostel and facility complaint tracking and resolution
- **Mess Menu Management**: Daily menu planning and dietary preference management
- **Timetable Management**: Academic schedule creation and management
- **Holiday Calendar**: Academic holiday planning and notifications
- **Role-based Access**: Secure access control for different user types

## Technology Stack

- **Frontend**: React with TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Node.js with Express, MongoDB
- **Authentication**: JWT-based authentication
- **Real-time**: WebSocket support for live updates
- **Performance**: Redis caching, rate limiting, compression

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB
- Redis (optional, for caching)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd manipur-digital-campus-hub
```

2. Install dependencies for both frontend and backend:
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Set up environment variables:
```bash
# Copy environment example for backend
cp env.example .env
# Edit the .env file with your configuration
```

4. Start the development servers (in separate terminals):
```bash
# Start backend server
cd backend
npm run dev

# Start frontend server (in another terminal)
cd frontend
npm run dev
```

## Deployment

### Backend Deployment

The backend is optimized for high-traffic scenarios with:
- Connection pooling for MongoDB
- Redis caching
- Rate limiting and speed limiting
- Compression middleware
- Security headers with Helmet

### Frontend Deployment

The frontend can be deployed to any static hosting service:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

## Architecture

### Scalability Features

- **Database**: MongoDB with optimized connection pools
- **Caching**: Redis for session and data caching
- **Rate Limiting**: Configurable rate limits for API protection
- **Load Balancing**: Ready for horizontal scaling
- **Monitoring**: Health check endpoints and logging

### Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Security headers with Helmet
- Rate limiting protection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
