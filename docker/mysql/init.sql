-- MySQL initialization script for web crawler database
-- This script is executed when the MySQL container starts for the first time

-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS web_crawler CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE web_crawler;

-- Grant privileges to the crawler user
GRANT ALL PRIVILEGES ON web_crawler.* TO 'crawler_user'@'%';
FLUSH PRIVILEGES;

-- Note: The actual table creation will be handled by the Go application migrations
-- This ensures consistency between development and production environments 