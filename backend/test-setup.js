#!/usr/bin/env node

const http = require('http');
const https = require('https');

console.log('🧪 Testing Manipur Digital Campus Hub Setup...\n');

// Test backend health
const testBackendHealth = () => {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.status === 'OK') {
            console.log('✅ Backend is running and healthy');
            resolve(true);
          } else {
            console.log('❌ Backend health check failed');
            resolve(false);
          }
        } catch (error) {
          console.log('❌ Backend response parsing failed');
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Backend is not running or not accessible');
      console.log('   Make sure to start the backend with: cd backend && npm run dev');
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('❌ Backend connection timeout');
      resolve(false);
    });

    req.end();
  });
};

// Test frontend
const testFrontend = () => {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: '/',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Frontend is running');
        resolve(true);
      } else {
        console.log('❌ Frontend returned status:', res.statusCode);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log('❌ Frontend is not running or not accessible');
      console.log('   Make sure to start the frontend with: npm run dev');
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('❌ Frontend connection timeout');
      resolve(false);
    });

    req.end();
  });
};

// Test MongoDB connection
const testMongoDB = async () => {
  try {
    const mongoose = require('mongoose');
    await mongoose.connect('mongodb://localhost:27017/manipur-digital-campus', {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ MongoDB is accessible');
    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.log('❌ MongoDB is not accessible');
    console.log('   Make sure MongoDB is running on localhost:27017');
    return false;
  }
};

// Run all tests
const runTests = async () => {
  console.log('📊 Testing MongoDB connection...');
  const mongoOk = await testMongoDB();
  
  console.log('\n🔧 Testing Backend...');
  const backendOk = await testBackendHealth();
  
  console.log('\n🌐 Testing Frontend...');
  const frontendOk = await testFrontend();
  
  console.log('\n📋 Test Results:');
  console.log(`   MongoDB: ${mongoOk ? '✅' : '❌'}`);
  console.log(`   Backend: ${backendOk ? '✅' : '❌'}`);
  console.log(`   Frontend: ${frontendOk ? '✅' : '❌'}`);
  
  if (mongoOk && backendOk && frontendOk) {
    console.log('\n🎉 All tests passed! Your setup is working correctly.');
    console.log('\n🌍 You can now access:');
    console.log('   Frontend: http://localhost:8080');
    console.log('   Backend API: http://localhost:5000/api');
    console.log('\n👥 Configured for small group (4-5 users) - No Redis needed');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the setup:');
    if (!mongoOk) {
      console.log('   - Start MongoDB: docker run -d -p 27017:27017 --name mongodb mongo:latest');
    }
    if (!backendOk) {
      console.log('   - Start Backend: cd backend && npm run dev');
    }
    if (!frontendOk) {
      console.log('   - Start Frontend: npm run dev');
    }
  }
};

runTests(); 