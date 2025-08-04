const axios = require('axios');
const FormData = require('form-data');
const logger = require('../utils/logger');

class CaptchaSolver {
  constructor() {
    this.apiKey = process.env.CAPTCHA_SOLVER_API_KEY;
    this.solverUrl = process.env.CAPTCHA_SOLVER_URL || 'http://2captcha.com/in.php';
    this.resultUrl = process.env.CAPTCHA_RESULT_URL || 'http://2captcha.com/res.php';
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Solve CAPTCHA using 2Captcha service
   */
  async solve(captchaImage) {
    if (!this.apiKey) {
      logger.warn('No CAPTCHA solver API key provided');
      return null;
    }

    try {
      // Submit CAPTCHA to 2Captcha
      const captchaId = await this.submitCaptcha(captchaImage);
      if (!captchaId) {
        return null;
      }

      // Wait for solution
      const solution = await this.waitForSolution(captchaId);
      return solution;

    } catch (error) {
      logger.error('Error solving CAPTCHA:', error);
      return null;
    }
  }

  /**
   * Submit CAPTCHA image to 2Captcha
   */
  async submitCaptcha(captchaImage) {
    try {
      const formData = new FormData();
      formData.append('key', this.apiKey);
      formData.append('method', 'post');
      formData.append('json', '1');
      formData.append('file', captchaImage, {
        filename: 'captcha.png',
        contentType: 'image/png'
      });

      const response = await axios.post(this.solverUrl, formData, {
        headers: {
          ...formData.getHeaders()
        },
        timeout: 30000
      });

      if (response.data.status === 1) {
        logger.info('CAPTCHA submitted successfully', { captchaId: response.data.request });
        return response.data.request;
      } else {
        logger.error('Failed to submit CAPTCHA:', response.data.error_text);
        return null;
      }

    } catch (error) {
      logger.error('Error submitting CAPTCHA:', error.message);
      return null;
    }
  }

  /**
   * Wait for CAPTCHA solution
   */
  async waitForSolution(captchaId) {
    let attempts = 0;
    const maxAttempts = 30; // Wait up to 5 minutes (30 * 10 seconds)

    while (attempts < maxAttempts) {
      try {
        const solution = await this.checkSolution(captchaId);
        
        if (solution) {
          logger.info('CAPTCHA solved successfully', { captchaId, solution });
          return solution;
        }

        // Wait before next check
        await this.sleep(10000); // 10 seconds
        attempts++;

      } catch (error) {
        logger.error('Error checking CAPTCHA solution:', error.message);
        attempts++;
      }
    }

    logger.error('CAPTCHA solution timeout', { captchaId });
    return null;
  }

  /**
   * Check if CAPTCHA solution is ready
   */
  async checkSolution(captchaId) {
    try {
      const response = await axios.get(this.resultUrl, {
        params: {
          key: this.apiKey,
          action: 'get',
          id: captchaId,
          json: '1'
        },
        timeout: 10000
      });

      if (response.data.status === 1) {
        return response.data.request;
      } else if (response.data.request === 'CAPCHA_NOT_READY') {
        return null; // Solution not ready yet
      } else {
        logger.error('CAPTCHA solution error:', response.data.error_text);
        return null;
      }

    } catch (error) {
      logger.error('Error checking CAPTCHA solution:', error.message);
      return null;
    }
  }

  /**
   * Sleep utility function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get account balance (for monitoring)
   */
  async getBalance() {
    try {
      const response = await axios.get(this.resultUrl, {
        params: {
          key: this.apiKey,
          action: 'getbalance',
          json: '1'
        },
        timeout: 10000
      });

      if (response.data.status === 1) {
        return parseFloat(response.data.request);
      } else {
        logger.error('Failed to get balance:', response.data.error_text);
        return null;
      }

    } catch (error) {
      logger.error('Error getting balance:', error.message);
      return null;
    }
  }

  /**
   * Report bad CAPTCHA solution
   */
  async reportBad(captchaId) {
    try {
      const response = await axios.get(this.resultUrl, {
        params: {
          key: this.apiKey,
          action: 'reportbad',
          id: captchaId,
          json: '1'
        },
        timeout: 10000
      });

      if (response.data.status === 1) {
        logger.info('Bad CAPTCHA solution reported', { captchaId });
        return true;
      } else {
        logger.error('Failed to report bad CAPTCHA:', response.data.error_text);
        return false;
      }

    } catch (error) {
      logger.error('Error reporting bad CAPTCHA:', error.message);
      return false;
    }
  }
}

module.exports = CaptchaSolver; 