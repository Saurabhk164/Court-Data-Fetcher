const express = require('express');
const { body, validationResult } = require('express-validator');
const caseController = require('../controllers/caseController');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware
const validateCaseSearch = [
  body('caseType')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Case type is required and must be between 1 and 50 characters')
    .matches(/^[A-Z]+$/)
    .withMessage('Case type must contain only uppercase letters'),
  
  body('caseNumber')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Case number is required and must be between 1 and 100 characters')
    .matches(/^[0-9]+$/)
    .withMessage('Case number must contain only numbers'),
  
  body('filingYear')
    .isInt({ min: 1950, max: new Date().getFullYear() })
    .withMessage(`Filing year must be between 1950 and ${new Date().getFullYear()}`)
];

// POST /api/case - Search for case information
router.post('/', validateCaseSearch, async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { caseType, caseNumber, filingYear } = req.body;
    
    logger.info('Case search request received', {
      caseType,
      caseNumber,
      filingYear,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Call the controller
    const result = await caseController.searchCase(req, res, next);
    
  } catch (error) {
    logger.error('Error in case search route:', error);
    next(error);
  }
});

// GET /api/case/history - Get search history (optional)
router.get('/history', async (req, res, next) => {
  try {
    const result = await caseController.getSearchHistory(req, res, next);
  } catch (error) {
    logger.error('Error in case history route:', error);
    next(error);
  }
});

// GET /api/case/:id - Get specific case result by ID
router.get('/:id', async (req, res, next) => {
  try {
    const result = await caseController.getCaseById(req, res, next);
  } catch (error) {
    logger.error('Error in get case by ID route:', error);
    next(error);
  }
});

module.exports = router; 