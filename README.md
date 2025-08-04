# Court Data Fetcher

A real-time web application for searching and fetching Indian court case information, specifically designed for the Delhi High Court. This application scrapes the court's public website to retrieve case metadata and latest orders/judgments.

## Court Selection: Delhi High Court

## Features

- **Real-time Case Search**: Search cases by type, number, and filing year
- **CAPTCHA Handling**: Automated CAPTCHA solving using 2Captcha service
- **Data Extraction**: Parse parties' names, filing dates, next hearing dates
- **Order/Judgment Downloads**: Direct links to PDF documents
- **Error Handling**: Comprehensive error handling for various scenarios
- **Search History**: Track and view previous searches
- **Modern UI**: Responsive React frontend with Tailwind CSS

## Technology Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** for data storage
- **Sequelize** ORM
- **Puppeteer** for web scraping
- **Cheerio** for HTML parsing
- **2Captcha** for CAPTCHA solving

### Frontend
- **React** with hooks
- **React Query** for data fetching
- **React Hook Form** for form handling
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Infrastructure
- **Docker** and Docker Compose
- **Nginx** for reverse proxy
- **Redis** for caching
- **Winston** for logging

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+ (for local development)
- 2Captcha API key (for CAPTCHA solving)

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd court-data-fetcher
```

### 2. Environment Setup
```bash
# Copy environment file
cp env.example .env

# Edit environment variables
nano .env
```

### 3. Docker Setup
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

## Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```env
# Application Configuration
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=court_data
DB_USER=court_user
DB_PASSWORD=court_password
DB_DIALECT=postgres

# CAPTCHA Configuration (Required)
CAPTCHA_SOLVER_API_KEY=your_2captcha_api_key
CAPTCHA_SOLVER_URL=http://2captcha.com/in.php
CAPTCHA_RESULT_URL=http://2captcha.com/res.php

# Court Website Configuration
COURT_BASE_URL=https://delhihighcourt.nic.in
COURT_SEARCH_URL=https://delhihighcourt.nic.in/case-status
```

### CAPTCHA Strategy
## API Endpoints

### POST /api/case
Search for case information

**Request Body:**
```json
{
  "caseType": "FAO",
  "caseNumber": "12345",
  "filingYear": 2023
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "caseInfo": {
      "caseNumber": "FAO 12345/2023",
      "caseType": "FAO",
      "petitioner": "John Doe",
      "respondent": "State of Delhi",
      "filingDate": "2023-01-15",
      "nextHearingDate": "2024-02-20",
      "status": "Pending"
    },
    "orders": [
      {
        "title": "Interim Order",
        "url": "https://delhihighcourt.nic.in/orders/123.pdf",
        "date": "2023-12-15",
        "type": "interim_order"
      }
    ]
  }
}
```

### GET /health
Health check endpoint

### GET /api/case/history
Get search history (optional)

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### Manual Testing
1. Start the application
2. Navigate to http://localhost:3000
3. Fill in case details:
   - Case Type: FAO
   - Case Number: 12345
   - Filing Year: 2023
4. Click "Search Case"
5. Verify results display correctly


## 📁 Project Structure

```
court-data-fetcher/
├── server/
│   ├── controllers/          # Request handlers
│   ├── database/            # Database models and config
│   ├── middleware/          # Express middleware
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   └── utils/               # Utility functions
├── client/
│   ├── public/              # Static files
│   └── src/
│       ├── components/      # React components
│       └── index.js         # App entry point
├── nginx/                   # Nginx configuration
├── logs/                    # Application logs
├── downloads/               # Downloaded files
├── docker-compose.yml       # Docker services
├── Dockerfile              # Backend container
└── README.md               # This file
```

## 🔧 Development

### Local Development Setup
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install

# Start backend (with hot reload)
npm run dev

# Start frontend (in another terminal)
cd client && npm start
```

### Database Migrations
```bash
npm run db:migrate
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## Error Handling

The application handles various error scenarios:

1. **Case Not Found**: Returns 404 with user-friendly message
2. **CAPTCHA Failed**: Returns 400 with retry suggestion
3. **Network Errors**: Returns 500 with retry option
4. **Invalid Input**: Returns 400 with validation details
5. **Rate Limiting**: Returns 429 with cooldown period

## Monitoring

### Health Checks
- `/health` - Basic health check
- `/health/detailed` - Detailed system status
- `/health/ready` - Readiness probe
- `/health/live` - Liveness probe

### Logging
- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- Structured JSON logging with Winston


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
