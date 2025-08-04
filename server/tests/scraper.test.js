const CourtScraper = require('../services/CourtScraper');
const CaptchaSolver = require('../services/CaptchaSolver');

// Mock Puppeteer
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      goto: jest.fn().mockResolvedValue(),
      waitForSelector: jest.fn().mockResolvedValue(),
      $: jest.fn().mockResolvedValue(null),
      click: jest.fn().mockResolvedValue(),
      waitForTimeout: jest.fn().mockResolvedValue(),
      content: jest.fn().mockResolvedValue('<html><body>Test content</body></html>'),
      setUserAgent: jest.fn().mockResolvedValue(),
      setExtraHTTPHeaders: jest.fn().mockResolvedValue(),
      screenshot: jest.fn().mockResolvedValue(Buffer.from('fake-image')),
      close: jest.fn().mockResolvedValue()
    }),
    close: jest.fn().mockResolvedValue()
  })
}));

// Mock Cheerio
jest.mock('cheerio', () => ({
  load: jest.fn().mockReturnValue({
    $: jest.fn().mockReturnValue({
      length: 0,
      text: jest.fn().mockReturnValue(''),
      attr: jest.fn().mockReturnValue(''),
      each: jest.fn().mockImplementation((callback) => {
        // Mock order extraction
        callback(0, { text: () => 'Test Order', attr: () => '/test.pdf' });
      }),
      closest: jest.fn().mockReturnValue({
        find: jest.fn().mockReturnValue({
          text: jest.fn().mockReturnValue('2023-12-15')
        })
      }),
      first: jest.fn().mockReturnValue({
        text: jest.fn().mockReturnValue('Test Case')
      })
    })
  })
}));

describe('CourtScraper', () => {
  let scraper;

  beforeEach(() => {
    scraper = new CourtScraper();
  });

  describe('searchCase', () => {
    it('should initialize browser successfully', async () => {
      const result = await scraper.searchCase('FAO', '12345', 2023);
      expect(result).toBeDefined();
    });

    it('should handle case not found scenario', async () => {
      // Mock cheerio to simulate no results
      const cheerio = require('cheerio');
      cheerio.load.mockReturnValue({
        $: jest.fn().mockReturnValue({
          length: 1, // Simulate presence of "no results" element
          text: jest.fn().mockReturnValue('No records found')
        })
      });

      const result = await scraper.searchCase('FAO', '99999', 2023);
      expect(result.status).toBe('error');
      expect(result.error).toContain('Case not found');
    });

    it('should extract case information correctly', async () => {
      const result = await scraper.searchCase('FAO', '12345', 2023);
      expect(result.status).toBe('success');
      expect(result.caseInfo).toBeDefined();
      expect(result.orders).toBeDefined();
    });
  });

  describe('extractCaseInfo', () => {
    it('should extract case details from HTML', () => {
      const mockCheerio = {
        $: jest.fn().mockReturnValue({
          text: jest.fn().mockReturnValue('Test Case'),
          first: jest.fn().mockReturnValue({
            text: jest.fn().mockReturnValue('Test Case')
          })
        })
      };

      const caseInfo = scraper.extractCaseInfo(mockCheerio);
      expect(caseInfo).toBeDefined();
      expect(typeof caseInfo.caseNumber).toBe('string');
      expect(typeof caseInfo.caseType).toBe('string');
    });
  });

  describe('extractOrders', () => {
    it('should extract orders from HTML', () => {
      const mockCheerio = {
        $: jest.fn().mockReturnValue({
          each: jest.fn().mockImplementation((callback) => {
            callback(0, {
              attr: jest.fn().mockReturnValue('/test.pdf'),
              text: jest.fn().mockReturnValue('Test Order'),
              closest: jest.fn().mockReturnValue({
                find: jest.fn().mockReturnValue({
                  text: jest.fn().mockReturnValue('2023-12-15')
                })
              })
            });
          })
        })
      };

      const orders = scraper.extractOrders(mockCheerio);
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThan(0);
    });
  });

  describe('determineOrderType', () => {
    it('should correctly identify judgment type', () => {
      const type = scraper.determineOrderType('Final Judgment');
      expect(type).toBe('judgment');
    });

    it('should correctly identify order type', () => {
      const type = scraper.determineOrderType('Interim Order');
      expect(type).toBe('interim_order');
    });

    it('should return document for unknown types', () => {
      const type = scraper.determineOrderType('Unknown Document');
      expect(type).toBe('document');
    });
  });
});

describe('CaptchaSolver', () => {
  let captchaSolver;

  beforeEach(() => {
    captchaSolver = new CaptchaSolver();
  });

  describe('solve', () => {
    it('should return null when no API key is provided', async () => {
      const result = await captchaSolver.solve(Buffer.from('fake-image'));
      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      // Mock axios to throw error
      const axios = require('axios');
      axios.post.mockRejectedValue(new Error('API Error'));

      const result = await captchaSolver.solve(Buffer.from('fake-image'));
      expect(result).toBeNull();
    });
  });

  describe('getBalance', () => {
    it('should return null when no API key is provided', async () => {
      const balance = await captchaSolver.getBalance();
      expect(balance).toBeNull();
    });
  });
}); 