# MongoDB Migration Setup Guide

This guide will help you migrate from Supabase to MongoDB for the IIIT Manipur Digital Campus System.

## Prerequisites

1. **Node.js** (v16 or higher)
2. **MongoDB** (local installation or MongoDB Atlas account)
3. **npm** or **yarn**

## Step 1: Set up MongoDB

### Option A: Local MongoDB Installation

1. **Download and install MongoDB Community Server**:
   - Visit: https://www.mongodb.com/try/download/community
   - Download the appropriate version for your OS
   - Follow the installation instructions

2. **Start MongoDB service**:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

3. **Verify installation**:
   ```bash
   mongosh
   ```

### Option B: MongoDB Atlas (Cloud)

1. **Create MongoDB Atlas account**:
   - Visit: https://www.mongodb.com/atlas
   - Sign up for a free account

2. **Create a new cluster**:
   - Choose the free tier (M0)
   - Select your preferred cloud provider and region
   - Click "Create Cluster"

3. **Set up database access**:
   - Go to "Database Access"
   - Create a new database user with read/write permissions
   - Remember the username and password

4. **Set up network access**:
   - Go to "Network Access"
   - Add your IP address or use "0.0.0.0/0" for all IPs (development only)

5. **Get connection string**:
   - Go to "Clusters" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string

## Step 2: Set up the Backend

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Navigate to the frontend directory**:
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp env.example .env
   ```

4. **Configure environment variables**:
   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/manipur-digital-campus
   # For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/manipur-digital-campus
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:5173
   ```

5. **Start the backend server**:
   ```bash
   npm run dev
   ```

6. **Start the frontend server** (in a new terminal):
   ```bash
   cd ../frontend
   npm run dev
   ```

## Step 3: Update Frontend Configuration

1. **Add API URL to frontend environment**:
   Create or update `.env` in the root directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

2. **Update the auth provider**:
   Replace the Supabase auth hook with the MongoDB version:
   ```typescript
   // In src/main.tsx, change:
   import { AuthProvider } from './hooks/useAuthMongo';
   ```

3. **Update components to use new API**:
   Replace Supabase imports with the new API client:
   ```typescript
   // Replace:
   import { supabase } from '@/integrations/supabase/client';
   
   // With:
   import apiClient from '@/lib/api';
   ```

## Step 4: Test the Migration

1. **Start the frontend**:
   ```bash
   npm run dev
   ```

2. **Test registration**:
   - Go to the registration page
   - Create a new user account
   - Verify the user is created in MongoDB

3. **Test login**:
   - Login with the created account
   - Verify JWT token is stored
   - Check that the dashboard loads correctly

4. **Test API endpoints**:
   ```bash
   # Health check
   curl http://localhost:5000/api/health
   
   # Register user
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@iiitm.ac.in",
       "password": "password123",
       "name": "Admin User",
       "role": "admin"
     }'
   
   # Login
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@iiitm.ac.in",
       "password": "password123"
     }'
   ```

## Step 5: Data Migration (Optional)

If you have existing data in Supabase that you want to migrate:

1. **Export Supabase data**:
   ```sql
   -- Export users
   SELECT * FROM auth.users;
   
   -- Export profiles
   SELECT * FROM public.profiles;
   ```

2. **Transform data format**:
   - Convert Supabase UUIDs to MongoDB ObjectIds
   - Adjust field names if needed
   - Handle any data type differences

3. **Import to MongoDB**:
   ```bash
   # Using mongoimport
   mongoimport --db manipur-digital-campus --collection users --file users.json
   mongoimport --db manipur-digital-campus --collection profiles --file profiles.json
   ```

## Step 6: Production Deployment

1. **Set up production MongoDB**:
   - Use MongoDB Atlas for production
   - Configure proper security settings
   - Set up automated backups

2. **Environment variables for production**:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/manipur-digital-campus
   JWT_SECRET=your-very-secure-jwt-secret-key
   JWT_EXPIRES_IN=7d
   PORT=5000
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

3. **Deploy backend**:
   - Deploy to your preferred hosting platform (Heroku, Vercel, AWS, etc.)
   - Set environment variables in your hosting platform
   - Configure domain and SSL

4. **Update frontend**:
   - Update `VITE_API_URL` to point to your production backend
   - Deploy frontend to your hosting platform

## Troubleshooting

### Common Issues

1. **MongoDB connection failed**:
   - Check if MongoDB is running
   - Verify connection string
   - Check network access (for Atlas)

2. **CORS errors**:
   - Verify `CORS_ORIGIN` in backend `.env`
   - Check frontend API URL configuration

3. **JWT errors**:
   - Ensure `JWT_SECRET` is set
   - Check token expiration settings

4. **Port conflicts**:
   - Change `PORT` in backend `.env` if 5000 is in use
   - Update frontend API URL accordingly

### Useful Commands

```bash
# Check MongoDB status
sudo systemctl status mongod

# View MongoDB logs
sudo journalctl -u mongod

# Connect to MongoDB shell
mongosh

# List databases
show dbs

# Use database
use manipur-digital-campus

# List collections
show collections

# View documents
db.users.find()
db.profiles.find()
```

## Next Steps

1. **Remove Supabase dependencies**:
   ```bash
   npm uninstall @supabase/supabase-js
   ```

2. **Clean up Supabase files**:
   - Remove `src/integrations/supabase/` directory
   - Remove `supabase/` directory
   - Remove Supabase-related SQL files

3. **Update documentation**:
   - Update README files
   - Update deployment guides
   - Update API documentation

4. **Add monitoring and logging**:
   - Set up application monitoring
   - Configure error tracking
   - Set up database monitoring

## Support

If you encounter any issues during the migration:

1. Check the MongoDB documentation
2. Review the backend logs
3. Test API endpoints individually
4. Verify environment variables
5. Check network connectivity

The migration should provide you with a more flexible and scalable backend solution for your campus management system. 