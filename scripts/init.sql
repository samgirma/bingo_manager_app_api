-- Bingo Manager – schema (auto-executed by Docker on first MySQL launch)
-- Data seeding is handled by `scripts/seed.js` (npm run seed).

CREATE DATABASE IF NOT EXISTS bingo_manager;
USE bingo_manager;

-- Users: ADMIN and OPERATOR roles
CREATE TABLE IF NOT EXISTS users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  username        VARCHAR(50)  NOT NULL UNIQUE,
  password        VARCHAR(255) NOT NULL,
  full_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(100) NOT NULL UNIQUE,
  role            ENUM('ADMIN','OPERATOR') NOT NULL DEFAULT 'OPERATOR',
  profile_pic_url VARCHAR(500) DEFAULT NULL,
  is_banned       TINYINT(1) NOT NULL DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Bingo physical terminals
CREATE TABLE IF NOT EXISTS bingo_centers (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,
  balance       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  mac_address   VARCHAR(17)  NOT NULL UNIQUE,
  created_by    VARCHAR(50)  NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Recharge / top-up ledger
CREATE TABLE IF NOT EXISTS recharge_history (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  actual_amount         DECIMAL(15,2) NOT NULL,
  generated_amount      DECIMAL(15,2) NOT NULL,
  bingo_center_username VARCHAR(50)   NOT NULL,
  debited_by            VARCHAR(50)   NOT NULL,
  timestamp             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Active JWT sessions (for token invalidation / ban enforcement)
CREATE TABLE IF NOT EXISTS sessions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NOT NULL,
  token      VARCHAR(500) NOT NULL,
  is_valid   TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP    NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Password reset OTP tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(100) NOT NULL,
  otp        VARCHAR(10)  NOT NULL,
  expires_at TIMESTAMP    NOT NULL,
  used       TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
