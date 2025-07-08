import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Profile from './src/models/Profile.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Delete admin and super admin accounts
const deleteAdminAccounts = async () => {
  try {
    console.log('🔍 Searching for admin and super admin accounts...');
    
    // Find all profiles with admin or super_admin roles
    const adminProfiles = await Profile.find({
      role: { $in: ['admin', 'super_admin'] }
    }).populate('userId');
    
    if (adminProfiles.length === 0) {
      console.log('✅ No admin or super admin accounts found.');
      return;
    }
    
    console.log(`📋 Found ${adminProfiles.length} admin/super admin account(s):`);
    
    // Display accounts that will be deleted
    adminProfiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.name} (${profile.email}) - Role: ${profile.role}`);
    });
    
    // Get user IDs to delete
    const userIds = adminProfiles.map(profile => profile.userId._id);
    const profileIds = adminProfiles.map(profile => profile._id);
    
    // Delete users first (due to foreign key constraints)
    console.log('\n🗑️  Deleting user accounts...');
    const userDeleteResult = await User.deleteMany({ _id: { $in: userIds } });
    console.log(`✅ Deleted ${userDeleteResult.deletedCount} user account(s)`);
    
    // Delete profiles
    console.log('🗑️  Deleting profile records...');
    const profileDeleteResult = await Profile.deleteMany({ _id: { $in: profileIds } });
    console.log(`✅ Deleted ${profileDeleteResult.deletedCount} profile record(s)`);
    
    console.log('\n🎉 All admin and super admin accounts have been successfully deleted!');
    
  } catch (error) {
    console.error('❌ Error deleting admin accounts:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await deleteAdminAccounts();
  
  // Close connection
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script execution failed:', error);
  process.exit(1);
}); 