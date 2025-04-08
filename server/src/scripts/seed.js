require('dotenv').config();
const sequelize = require('../config/database');
const seedListings = require('../data/seedListings');
const bcrypt = require('bcrypt');
const { User, Listing } = require('../model');

const seedDatabase = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    // Sync database WITHOUT force: true to preserve existing data
    await sequelize.sync();
    console.log('✅ Database synced successfully.');

    // Check if test user exists, if not create it
    let testUser = await User.findOne({ where: { email: 'test@example.com' } });
    if (!testUser) {
      const hashedPassword = await bcrypt.hash('testpassword', 10);
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword
      });
      console.log('✅ Test user created with ID:', testUser.id);
    } else {
      console.log('✅ Test user already exists with ID:', testUser.id);
    }

    // Seed listings with the user's ID, only if they don't exist
    await seedListings(testUser.id);
    console.log('✅ Sample listings check completed.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase(); 