// server/src/scripts/cleanupDummyListings.js

require('dotenv').config(); // Ensure environment variables are loaded

const { Listing } = require('../model');
const { Op } = require('sequelize');

async function cleanupDummyListings() {
    try {
      console.log("Database connection details:", {
        database: process.env.PGDATABASE,
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        port: process.env.PGPORT,
        // If your Azure DB requires SSL, set DB_USE_SSL=true in .env
        useSSL: process.env.DB_USE_SSL ? process.env.DB_USE_SSL === 'true' : false,
      });
  
      const deletedCount = await Listing.destroy({
        where: {
          title: { [Op.iLike]: '%Ladder - Professional Grade%' },
        },
      });
      console.log(`Deleted ${deletedCount} dummy listings from the database.`);
      process.exit(0);
    } catch (error) {
      console.error('Error deleting dummy listings:', error);
      process.exit(1);
    }
  }

cleanupDummyListings();