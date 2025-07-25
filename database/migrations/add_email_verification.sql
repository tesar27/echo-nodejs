-- Add email verification fields to users table
ALTER TABLE users 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN email_verification_token VARCHAR(255),
ADD COLUMN email_verification_expires TIMESTAMP;

-- Index for faster token lookups
CREATE INDEX idx_users_verification_token ON users(email_verification_token);
