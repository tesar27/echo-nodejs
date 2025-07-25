-- Create database (run this manually in PostgreSQL)
-- CREATE DATABASE echo_db;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Echoess table
CREATE TABLE echoes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Follows table (user relationships)
CREATE TABLE follows (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id)
);

-- Likes table
CREATE TABLE likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  echo_id INTEGER REFERENCES echoes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, echo_id)
);

-- Indexes for better performance
CREATE INDEX idx_echoes_user_id ON echoes(user_id);
CREATE INDEX idx_echoes_created_at ON echoes(created_at);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_echo_id ON likes(echo_id);
