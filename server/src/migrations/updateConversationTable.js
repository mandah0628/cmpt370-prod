require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env')
});

const { Sequelize } = require('sequelize');

// Create a new Sequelize instance with SSL disabled for this migration
const sequelize = new Sequelize(
  process.env.PGDATABASE,
  process.env.PGUSER,
  process.env.PGPASSWORD,
  {
    host: process.env.PGHOST,
    port: process.env.PGPORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: false
    },
    logging: console.log
  }
);

async function migrateConversationTable() {
  try {
    console.log('Starting migration to allow NULL for listingId in conversations table');
    
    // Alter the table to allow null values for listingId
    await sequelize.query(`
      ALTER TABLE conversations 
      ALTER COLUMN "listingId" DROP NOT NULL;
    `);
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Run the migration function
migrateConversationTable(); 