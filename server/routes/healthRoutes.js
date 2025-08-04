const express = require('express');
const { sequelize } = require('../database/config');
const logger = require('../utils/logger');

const router = express.Router();

// GET /health - Basic health check
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// GET /health/detailed - Detailed health check with database
router.get('/detailed', async (req, res) => {
  try {
    // Test database connection
    await sequelize.authenticate();
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      details: error.message
    });
  }
});

// GET /health/ready - Readiness probe
router.get('/ready', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready' });
  }
});

// GET /health/live - Liveness probe
router.get('/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

module.exports = router; 