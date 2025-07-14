-- Update admin user password hash with correct bcrypt hash for 'password123'
UPDATE users SET password_hash = '$2a$10$fX2XdtFKPKcSfbpcHv/o8OiRqQYFTK0eI61mugAWiogTpWoIYH7UW' WHERE username = 'admin'; 