require('dotenv').config();
const { sequelize } = require('./config');
const QueryLog = require('./models/QueryLog');
const logger = require('../utils/logger');

async function migrate() {
  try {
    logger.info('Starting database migration...');
    
    // Sync all models with the database
    await sequelize.sync({ force: false, alter: true });
    
    logger.info('Database migration completed successfully.');
    
    // Close the connection
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate }; 