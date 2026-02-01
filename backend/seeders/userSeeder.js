const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();
const User = require('../models/User');

// Sample users data
const users = [
  // Admin users
  {
    name: 'Admin User',
    email: 'admin@hostel.com',
    passwordHash: '', // Will be hashed below
    role: 'ADMIN',
    isVerified: true,
    verifiedAt: new Date(),
  },
  {
    name: 'Super Admin',
    email: 'superadmin@hostel.com',
    passwordHash: '', // Will be hashed below
    role: 'ADMIN',
    isVerified: true,
    verifiedAt: new Date(),
  },
  // Student users
  {
    name: 'John Doe',
    email: 'john.doe@student.com',
    passwordHash: '', // Will be hashed below
    role: 'STUDENT',
    isVerified: true,
    verifiedAt: new Date(),
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@student.com',
    passwordHash: '', // Will be hashed below
    role: 'STUDENT',
    isVerified: true,
    verifiedAt: new Date(),
  },
  {
    name: 'Mike Johnson',
    email: 'mike.johnson@student.com',
    passwordHash: '', // Will be hashed below
    role: 'STUDENT',
    isVerified: true,
    verifiedAt: new Date(),
  },
  {
    name: 'Sarah Williams',
    email: 'sarah.williams@student.com',
    passwordHash: '', // Will be hashed below
    role: 'STUDENT',
    isVerified: true,
    verifiedAt: new Date(),
  },
];

// Default password for all seeded users
const DEFAULT_PASSWORD = 'password123';

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    // Hash passwords for all users
    for (let user of users) {
      user.passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    }

    // Clear existing users (optional - comment out if you want to keep existing users)
    // await User.deleteMany({});
    // console.log('Cleared existing users');

    // Check if users already exist
    const existingEmails = await User.find({ 
      email: { $in: users.map(u => u.email) } 
    }).select('email');

    if (existingEmails.length > 0) {
      console.log('Some users already exist:');
      existingEmails.forEach(u => console.log(`  - ${u.email}`));
      console.log('Skipping existing users...');
    }

    // Insert users (skip duplicates)
    let created = 0;
    let skipped = 0;

    for (const userData of users) {
      const exists = await User.findOne({ email: userData.email });
      if (!exists) {
        await User.create(userData);
        created++;
        console.log(`✓ Created user: ${userData.name} (${userData.email}) - Role: ${userData.role}`);
      } else {
        skipped++;
        console.log(`⊘ Skipped existing user: ${userData.email}`);
      }
    }

    console.log('\n=== Seeding Summary ===');
    console.log(`Total users in seed data: ${users.length}`);
    console.log(`Created: ${created}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`\nDefault password for all users: ${DEFAULT_PASSWORD}`);
    console.log('\nAdmin credentials:');
    console.log('  Email: admin@hostel.com');
    console.log('  Password: password123');
    console.log('\nStudent credentials:');
    console.log('  Email: john.doe@student.com');
    console.log('  Password: password123');

    // Close connection
    await mongoose.connection.close();
    console.log('\n✓ Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run seeder
seedUsers();


