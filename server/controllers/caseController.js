const QueryLog = require('../database/models/QueryLog');
const CourtScraper = require('../services/CourtScraper');
const logger = require('../utils/logger');

class CaseController {
  /**
   * Search for case information
   * POST /api/case
   */
  async searchCase(req, res, next) {
    const startTime = Date.now();
    const { caseType, caseNumber, filingYear } = req.body;
    
    try {
      logger.info('Starting case search', { caseType, caseNumber, filingYear });

      // Create query log entry
      const queryLog = await QueryLog.create({
        caseType,
        caseNumber,
        filingYear,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        responseStatus: 'error', // Will be updated on success
        processingTime: 0
      });

      // Initialize scraper
      const scraper = new CourtScraper();
      
      // Perform the scraping
      const result = await scraper.searchCase(caseType, caseNumber, filingYear);
      
      // Update query log with results
      await queryLog.update({
        rawHtml: result.rawHtml,
        responseStatus: result.status,
        errorMessage: result.error || null,
        processingTime: Date.now() - startTime,
        captchaSolved: result.captchaSolved || false,
        captchaAttempts: result.captchaAttempts || 0,
        extractedData: result.extractedData || null
      });

      // Return response based on status
      if (result.status === 'success') {
        return res.status(200).json({
          success: true,
          data: {
            caseInfo: result.caseInfo,
            orders: result.orders,
            queryId: queryLog.id
          }
        });
      } else if (result.status === 'not_found') {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Case not found. Please verify the case details.',
            details: result.error
          }
        });
      } else if (result.status === 'captcha_failed') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Unable to solve CAPTCHA. Please try again later.',
            details: result.error
          }
        });
      } else {
        return res.status(500).json({
          success: false,
          error: {
            message: 'Failed to fetch case information. Please try again.',
            details: result.error
          }
        });
      }

    } catch (error) {
      logger.error('Error in case search:', error);
      
      // Update query log with error
      if (queryLog) {
        await queryLog.update({
          responseStatus: 'error',
          errorMessage: error.message,
          processingTime: Date.now() - startTime
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error. Please try again later.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    }
  }

  /**
   * Get search history
   * GET /api/case/history
   */
  async getSearchHistory(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const history = await QueryLog.findAndCountAll({
        where: {
          ipAddress: req.ip
        },
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset),
        attributes: ['id', 'caseType', 'caseNumber', 'filingYear', 'responseStatus', 'createdAt']
      });

      res.status(200).json({
        success: true,
        data: {
          searches: history.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: history.count,
            pages: Math.ceil(history.count / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Error getting search history:', error);
      next(error);
    }
  }

  /**
   * Get specific case result by ID
   * GET /api/case/:id
   */
  async getCaseById(req, res, next) {
    try {
      const { id } = req.params;
      
      const queryLog = await QueryLog.findByPk(id);
      
      if (!queryLog) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Case result not found'
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          queryLog,
          extractedData: queryLog.extractedData
        }
      });
    } catch (error) {
      logger.error('Error getting case by ID:', error);
      next(error);
    }
  }
}

module.exports = new CaseController(); 