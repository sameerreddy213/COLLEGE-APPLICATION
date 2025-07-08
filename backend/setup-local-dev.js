#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Manipur Digital Campus Hub for local development...\n');

// Check if MongoDB is running
console.log('📊 Checking MongoDB connection...');
try {
  // Try to connect to MongoDB
  const mongoose = require('mongoose');
  mongoose.connect('mongodb://localhost:27017/manipur-digital-campus', {
    serverSelectionTimeoutMS: 5000
  });
  
  mongoose.connection.once('open', () => {
    console.log('✅ MongoDB is running and accessible');
    mongoose.connection.close();
  });
  
  mongoose.connection.on('error', () => {
    console.log('❌ MongoDB is not running. Please start MongoDB first.');
    console.log('   You can download MongoDB from: https://www.mongodb.com/try/download/community');
    console.log('   Or use Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest');
  });
} catch (error) {
  console.log('❌ MongoDB connection failed:', error.message);
}

// Redis is not needed for small group setup
console.log('\n🔴 Redis: Not needed for small group (4-5 users)');

// Create .env files if they don't exist
console.log('\n📝 Setting up environment files...');

const backendEnvPath = path.join(__dirname, 'backend', '.env');
const frontendEnvPath = path.join(__dirname, '..', 'frontend', '.env.local');

if (!fs.existsSync(backendEnvPath)) {
  const backendEnvContent = `# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/manipur-digital-campus

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-for-local-development-only-change-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Rate Limiting (Simple for 4-5 users)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Performance Settings (Simple for small group)
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2
`;
  
  fs.writeFileSync(backendEnvPath, backendEnvContent);
  console.log('✅ Created backend/.env file');
} else {
  console.log('✅ backend/.env file already exists');
}

if (!fs.existsSync(frontendEnvPath)) {
  const frontendEnvContent = `# Frontend Environment Variables
VITE_API_URL=http://localhost:5000/api

# Development Settings
VITE_APP_NAME=Manipur Digital Campus Hub
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=development

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
`;
  
  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  console.log('✅ Created .env.local file');
} else {
  console.log('✅ .env.local file already exists');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');

try {
  console.log('Installing frontend dependencies...');
  execSync('npm install', { cwd: path.join(__dirname, '..', 'frontend'), stdio: 'inherit' });
  
  console.log('Installing backend dependencies...');
  execSync('npm install', { cwd: path.join(__dirname, 'backend'), stdio: 'inherit' });
  
  console.log('✅ All dependencies installed successfully');
} catch (error) {
  console.log('❌ Error installing dependencies:', error.message);
}

console.log('\n🎉 Setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Start MongoDB (if not already running)');
console.log('2. Start the backend: cd backend && npm run dev');
console.log('3. Start the frontend: npm run dev');
console.log('4. Open http://localhost:8080 in your browser');
console.log('\n🔧 Development URLs:');
console.log('   Frontend: http://localhost:8080');
console.log('   Backend API: http://localhost:5000/api');
console.log('   Health Check: http://localhost:5000/api/health'); 