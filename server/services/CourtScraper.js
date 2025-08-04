const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const logger = require('../utils/logger');
const CaptchaSolver = require('./CaptchaSolver');

class CourtScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.captchaSolver = new CaptchaSolver();
    this.baseUrl = process.env.COURT_BASE_URL || 'https://delhihighcourt.nic.in';
    this.searchUrl = process.env.COURT_SEARCH_URL || 'https://delhihighcourt.nic.in';
  }

  /**
   * Initialize browser instance
   */
  async initializeBrowser() {
    try {
      this.browser = await puppeteer.launch({
        headless: process.env.PUPPETEER_HEADLESS === 'true',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ],
        defaultViewport: {
          width: parseInt(process.env.PUPPETEER_VIEWPORT_WIDTH) || 1920,
          height: parseInt(process.env.PUPPETEER_VIEWPORT_HEIGHT) || 1080
        }
      });

      this.page = await this.browser.newPage();
      
      // Set user agent
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Set extra headers
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      });

      logger.info('Browser initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  /**
   * Main method to search for case information
   */
  async searchCase(caseType, caseNumber, filingYear) {
    let rawHtml = '';
    let captchaAttempts = 0;
    const maxCaptchaAttempts = 3;

    try {
      await this.initializeBrowser();
      
      // Navigate to the main page
      await this.page.goto(this.baseUrl, {
        waitUntil: 'networkidle2',
        timeout: parseInt(process.env.PUPPETEER_TIMEOUT) || 30000
      });

      logger.info('Navigated to Delhi High Court website');

      // Try multiple search approaches
      const results = await this.tryMultipleSearchApproaches(caseType, caseNumber, filingYear);
      
      // Get the page content for logging
      rawHtml = await this.page.content();
      
      return {
        status: 'success',
        rawHtml,
        caseInfo: results.caseInfo,
        orders: results.orders,
        extractedData: results,
        captchaSolved: captchaAttempts > 0,
        captchaAttempts
      };

    } catch (error) {
      logger.error('Error in case search:', error);
      
      return {
        status: error.message.includes('CAPTCHA') ? 'captcha_failed' : 'error',
        rawHtml,
        error: error.message,
        captchaAttempts
      };
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  /**
   * Try multiple search approaches based on Delhi High Court website structure
   */
  async tryMultipleSearchApproaches(caseType, caseNumber, filingYear) {
    let results = {
      caseInfo: {},
      orders: []
    };

    try {
      // Approach 1: Order Information System - Party Name Search
      logger.info('Trying Order Information System - Party Name Search');
      const partySearchResults = await this.searchByPartyName(caseNumber, filingYear);
      if (partySearchResults.caseInfo.caseNumber) {
        results = partySearchResults;
        return results;
      }

      // Approach 2: Order Information System - Case Number Search
      logger.info('Trying Order Information System - Case Number Search');
      const caseNumberResults = await this.searchByCaseNumber(caseType, caseNumber, filingYear);
      if (caseNumberResults.caseInfo.caseNumber) {
        results = caseNumberResults;
        return results;
      }

      // Approach 3: Latest Judgments Search
      logger.info('Trying Latest Judgments Search');
      const judgmentResults = await this.searchLatestJudgments(caseType, caseNumber, filingYear);
      if (judgmentResults.orders.length > 0) {
        results = judgmentResults;
        return results;
      }

      // If no results found, throw error
      throw new Error('Case not found using any search method');

    } catch (error) {
      logger.error('All search approaches failed:', error);
      throw error;
    }
  }

  /**
   * Search by Party Name in Order Information System
   */
  async searchByPartyName(caseNumber, filingYear) {
    try {
      // Look for Order Information System link using evaluate
      const orderInfoLink = await this.page.evaluateHandle(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links.find(link => 
          link.href.includes('order') || 
          link.href.includes('information') ||
          link.textContent.toLowerCase().includes('order information')
        );
      });
      
      if (orderInfoLink && !orderInfoLink._remoteObject.value) {
        await orderInfoLink.click();
        await this.page.waitForTimeout(2000);
      }

      // Look for Party Name search option
      const partyNameLink = await this.page.evaluateHandle(() => {
        const links = Array.from(document.querySelectorAll('a'));
        const inputs = Array.from(document.querySelectorAll('input'));
        return links.find(link => 
          link.href.includes('party') ||
          link.textContent.toLowerCase().includes('party name')
        ) || inputs.find(input => input.name && input.name.includes('party'));
      });
      
      if (partyNameLink && !partyNameLink._remoteObject.value) {
        await partyNameLink.click();
        await this.page.waitForTimeout(2000);
      }

      // Fill party name (using case number as party name for search)
      const partyNameInput = await this.page.$('input[name*="party"], input[name*="name"], #party_name, .party-name');
      if (partyNameInput) {
        await partyNameInput.type(caseNumber);
      }

      // Fill year if provided
      if (filingYear) {
        const yearInput = await this.page.$('input[name*="year"], #year, .year-input');
        if (yearInput) {
          await yearInput.type(filingYear.toString());
        }
      }

      // Handle CAPTCHA if present
      await this.handleCaptchaIfPresent();

      // Submit search
      const submitButton = await this.page.$('input[type="submit"], button[type="submit"], .submit-btn');
      if (submitButton) {
        await submitButton.click();
        await this.page.waitForTimeout(3000);
      }

      // Parse results
      const html = await this.page.content();
      return this.parseOrderInformationResults(html);

    } catch (error) {
      logger.error('Error in party name search:', error);
      return { caseInfo: {}, orders: [] };
    }
  }

  /**
   * Search by Case Number in Order Information System
   */
  async searchByCaseNumber(caseType, caseNumber, filingYear) {
    try {
      // Look for Case Number search option using evaluate
      const caseNumberLink = await this.page.evaluateHandle(() => {
        const links = Array.from(document.querySelectorAll('a'));
        const inputs = Array.from(document.querySelectorAll('input'));
        return links.find(link => 
          link.href.includes('case') ||
          link.textContent.toLowerCase().includes('case number')
        ) || inputs.find(input => input.name && input.name.includes('case'));
      });
      
      if (caseNumberLink && !caseNumberLink._remoteObject.value) {
        await caseNumberLink.click();
        await this.page.waitForTimeout(2000);
      }

      // Fill case type
      const caseTypeSelect = await this.page.$('select[name*="case_type"], #case_type, .case-type');
      if (caseTypeSelect) {
        await caseTypeSelect.select(caseType);
      }

      // Fill case number
      const caseNumberInput = await this.page.$('input[name*="case_number"], #case_number, .case-number');
      if (caseNumberInput) {
        await caseNumberInput.type(caseNumber);
      }

      // Fill year
      if (filingYear) {
        const yearInput = await this.page.$('input[name*="year"], #year, .year-input');
        if (yearInput) {
          await yearInput.type(filingYear.toString());
        }
      }

      // Handle CAPTCHA if present
      await this.handleCaptchaIfPresent();

      // Submit search
      const submitButton = await this.page.$('input[type="submit"], button[type="submit"], .submit-btn');
      if (submitButton) {
        await submitButton.click();
        await this.page.waitForTimeout(3000);
      }

      // Parse results
      const html = await this.page.content();
      return this.parseOrderInformationResults(html);

    } catch (error) {
      logger.error('Error in case number search:', error);
      return { caseInfo: {}, orders: [] };
    }
  }

  /**
   * Search Latest Judgments section
   */
  async searchLatestJudgments(caseType, caseNumber, filingYear) {
    try {
      // Look for Judgments section using evaluate
      const judgmentsLink = await this.page.evaluateHandle(() => {
        const links = Array.from(document.querySelectorAll('a'));
        return links.find(link => 
          link.href.includes('judgment') ||
          link.textContent.toLowerCase().includes('judgments') ||
          link.textContent.toLowerCase().includes('latest judgments')
        );
      });
      
      if (judgmentsLink && !judgmentsLink._remoteObject.value) {
        await judgmentsLink.click();
        await this.page.waitForTimeout(2000);
      }

      // Get the judgments page content
      const html = await this.page.content();
      return this.parseJudgmentsResults(html, caseType, caseNumber, filingYear);

    } catch (error) {
      logger.error('Error in judgments search:', error);
      return { caseInfo: {}, orders: [] };
    }
  }

  /**
   * Handle CAPTCHA if present
   */
  async handleCaptchaIfPresent() {
    try {
      const captchaElement = await this.page.$('img[src*="captcha"], .captcha, #captcha');
      
      if (captchaElement) {
        logger.info('CAPTCHA detected, attempting to solve');
        
        // Get CAPTCHA image
        const captchaImage = await this.page.screenshot({
          clip: await this.page.$eval('img[src*="captcha"], .captcha, #captcha', el => {
            const rect = el.getBoundingClientRect();
            return {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            };
          })
        });

        // Solve CAPTCHA using external service
        const captchaText = await this.captchaSolver.solve(captchaImage);
        
        if (captchaText) {
          // Fill CAPTCHA input
          const captchaInput = await this.page.$('input[name*="captcha"], #captcha, .captcha-input');
          if (captchaInput) {
            await captchaInput.type(captchaText);
          }
          logger.info('CAPTCHA solved successfully');
        }
      }
    } catch (error) {
      logger.error('Error handling CAPTCHA:', error);
    }
  }

  /**
   * Parse Order Information System results
   */
  parseOrderInformationResults(html) {
    try {
      const $ = cheerio.load(html);
      
      // Check if case was found
      const noResults = $('text:contains("No records found"), .no-results, .error-message').length > 0;
      if (noResults) {
        throw new Error('Case not found in Order Information System');
      }

      // Extract case information from table
      const caseInfo = {
        caseNumber: '',
        caseType: '',
        petitioner: '',
        respondent: '',
        filingDate: '',
        nextHearingDate: '',
        status: ''
      };

      // Look for case details in table format
      $('table tr').each((index, row) => {
        const $row = $(row);
        const cells = $row.find('td');
        
        if (cells.length >= 3) {
          const caseNumberText = cells.eq(0).text().trim();
          const petitionerText = cells.eq(1).text().trim();
          const listingDateText = cells.eq(2).text().trim();
          
          if (caseNumberText && caseNumberText !== 'Case Number') {
            caseInfo.caseNumber = caseNumberText;
            caseInfo.petitioner = petitionerText;
            caseInfo.nextHearingDate = listingDateText;
          }
        }
      });

      return {
        caseInfo,
        orders: []
      };

    } catch (error) {
      logger.error('Error parsing order information results:', error);
      throw error;
    }
  }

  /**
   * Parse Judgments results
   */
  parseJudgmentsResults(html, caseType, caseNumber, filingYear) {
    try {
      const $ = cheerio.load(html);
      
      const orders = [];

      // Look for judgment table
      $('table tr').each((index, row) => {
        const $row = $(row);
        const cells = $row.find('td');
        
        if (cells.length >= 4) {
          const caseNumberText = cells.eq(0).text().trim();
          const judgmentDateText = cells.eq(1).text().trim();
          const petitionerText = cells.eq(2).text().trim();
          const respondentText = cells.eq(3).text().trim();
          
          // Check if this case matches our search criteria
          if (caseNumberText.includes(caseNumber) || 
              petitionerText.toLowerCase().includes(caseNumber.toLowerCase()) ||
              respondentText.toLowerCase().includes(caseNumber.toLowerCase())) {
            
            // Look for download link in the same row
            const downloadLink = $row.find('a[href*=".pdf"], a:contains("Download")').attr('href');
            
            if (downloadLink) {
              orders.push({
                title: `Judgment for ${caseNumberText}`,
                url: downloadLink.startsWith('http') ? downloadLink : `${this.baseUrl}${downloadLink}`,
                date: judgmentDateText,
                type: 'judgment',
                caseNumber: caseNumberText,
                petitioner: petitionerText,
                respondent: respondentText
              });
            }
          }
        }
      });

      return {
        caseInfo: {
          caseNumber: caseNumber,
          caseType: caseType,
          petitioner: '',
          respondent: '',
          filingDate: '',
          nextHearingDate: '',
          status: 'Found in judgments'
        },
        orders
      };

    } catch (error) {
      logger.error('Error parsing judgments results:', error);
      return { caseInfo: {}, orders: [] };
    }
  }

  /**
   * Extract orders/judgments from HTML (legacy method)
   */
  extractOrders($) {
    const orders = [];

    try {
      // Look for order/judgment links
      $('a[href*=".pdf"], a[href*="order"], a[href*="judgment"]').each((index, element) => {
        const $element = $(element);
        const href = $element.attr('href');
        const text = $element.text().trim();
        const date = $element.closest('tr').find('td').last().text().trim();

        if (href && text) {
          orders.push({
            title: text,
            url: href.startsWith('http') ? href : `${this.baseUrl}${href}`,
            date: date || '',
            type: this.determineOrderType(text)
          });
        }
      });

      // Sort by date (newest first)
      orders.sort((a, b) => new Date(b.date) - new Date(a.date));

      return orders.slice(0, 10); // Return latest 10 orders
    } catch (error) {
      logger.error('Error extracting orders:', error);
      return orders;
    }
  }

  /**
   * Determine order type based on title
   */
  determineOrderType(title) {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('judgment')) return 'judgment';
    if (lowerTitle.includes('order')) return 'order';
    if (lowerTitle.includes('interim')) return 'interim_order';
    if (lowerTitle.includes('final')) return 'final_order';
    
    return 'document';
  }
}

module.exports = CourtScraper; 