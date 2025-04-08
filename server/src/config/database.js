require('dotenv').config({
    path: require('path').resolve(__dirname, '../.env')
  });
  const { Sequelize } = require('sequelize');
  
  console.log('Database connection details:', {
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    port: process.env.PGPORT
  });
  
  const sequelize = new Sequelize(
    process.env.PGDATABASE,
    process.env.PGUSER,
    process.env.PGPASSWORD,
    {
      host: process.env.PGHOST,
      port: process.env.PGPORT || 5432,
      dialect: 'postgres',
    }
  );
  
  module.exports = sequelize;
  