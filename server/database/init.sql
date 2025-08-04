-- Initialize database for Court Data Fetcher
-- This script runs when the PostgreSQL container starts

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE court_data'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'court_data')\gexec

-- Connect to the court_data database
\c court_data;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_query_logs_case_search ON query_logs(case_type, case_number, filing_year);
CREATE INDEX IF NOT EXISTS idx_query_logs_created_at ON query_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_logs_status ON query_logs(response_status);
CREATE INDEX IF NOT EXISTS idx_query_logs_ip ON query_logs(ip_address);

-- Create a view for recent searches
CREATE OR REPLACE VIEW recent_searches AS
SELECT 
    case_type,
    case_number,
    filing_year,
    response_status,
    created_at,
    processing_time,
    captcha_solved,
    captcha_attempts
FROM query_logs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Create a function to clean old logs
CREATE OR REPLACE FUNCTION clean_old_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM query_logs 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE court_data TO court_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO court_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO court_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO court_user;

-- Create a scheduled job to clean old logs (if pg_cron is available)
-- SELECT cron.schedule('clean-old-logs', '0 2 * * *', 'SELECT clean_old_logs(30);'); 