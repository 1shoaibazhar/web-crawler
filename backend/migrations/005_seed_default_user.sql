-- Insert default user for testing
-- Password: "password123" (hashed with bcrypt)
-- Note: This is for development only, change in production
INSERT INTO users (username, email, password_hash) VALUES (
    'admin',
    'admin@example.com',
    '$2a$10$Z9pAuJcOFkDkf6WNvE8ktuJPQKvL8GhRWNQEfQGVwCcjXBLXpZFAG'
);

-- Insert test user
INSERT INTO users (username, email, password_hash) VALUES (
    'testuser',
    'test@example.com',
    '$2a$10$Z9pAuJcOFkDkf6WNvE8ktuJPQKvL8GhRWNQEfQGVwCcjXBLXpZFAG'
); 