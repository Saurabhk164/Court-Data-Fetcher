const { sequelize } = require('./config');
const QueryLog = require('./models/QueryLog');
const logger = require('../utils/logger');

async function seed() {
  try {
    logger.info('Starting database seeding...');
    
    // Add any initial seed data here if needed
    // For now, we'll just log that seeding is complete
    
    logger.info('Database seeding completed successfully.');
    
    // Close the connection
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed();
}

module.exports = { seed }; 