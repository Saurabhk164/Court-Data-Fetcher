const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Use SQLite for local development if PostgreSQL settings are not provided
const useSQLite = process.env.NODE_ENV === 'development' && !process.env.DB_HOST;

const sequelize = new Sequelize(
  useSQLite ? './court_data.db' : (process.env.DB_NAME || 'court_data'),
  useSQLite ? null : (process.env.DB_USER || 'court_user'),
  useSQLite ? null : (process.env.DB_PASSWORD || 'court_password'),
  {
    host: useSQLite ? null : (process.env.DB_HOST || 'localhost'),
    port: useSQLite ? null : (process.env.DB_PORT || 5432),
    dialect: useSQLite ? 'sqlite' : (process.env.DB_DIALECT || 'postgres'),
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: useSQLite ? null : {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: useSQLite ? null : {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    storage: useSQLite ? './court_data.db' : null
  }
);

// Test the connection
sequelize
  .authenticate()
  .then(() => {
    logger.info('Database connection has been established successfully.');
  })
  .catch(err => {
    logger.error('Unable to connect to the database:', err);
  });

module.exports = { sequelize }; 