const { DataTypes } = require('sequelize');
const { sequelize } = require('../config');

const QueryLog = sequelize.define('QueryLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  caseType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Type of case (e.g., FAO, CWP, CRL, etc.)'
  },
  caseNumber: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Case number as entered by user'
  },
  filingYear: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Year when the case was filed'
  },
  rawHtml: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Raw HTML response from court website'
  },
  responseStatus: {
    type: DataTypes.ENUM('success', 'error', 'not_found', 'captcha_failed'),
    allowNull: false,
    defaultValue: 'error',
    comment: 'Status of the scraping attempt'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message if scraping failed'
  },
  processingTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Time taken to process the request in milliseconds'
  },
  userAgent: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'User agent string used for the request'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP address of the requester'
  },
  captchaSolved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether CAPTCHA was successfully solved'
  },
  captchaAttempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of CAPTCHA solving attempts'
  },
  extractedData: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Parsed case data (parties, dates, orders, etc.)'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'query_logs',
  timestamps: true,
  indexes: [
    {
      fields: ['caseType', 'caseNumber', 'filingYear']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['responseStatus']
    },
    {
      fields: ['ipAddress']
    }
  ]
});

module.exports = QueryLog; 