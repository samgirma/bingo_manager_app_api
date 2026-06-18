-- Bingo Manager – schema (auto-executed by Docker on first PostgreSQL launch)
-- Data seeding is handled by `scripts/seed.js` (npm run seed).

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  username        VARCHAR(50)  NOT NULL UNIQUE,
  password        VARCHAR(255) NOT NULL,
  full_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(100) NOT NULL UNIQUE,
  role            VARCHAR(10)  NOT NULL DEFAULT 'OPERATOR',
  profile_pic_url VARCHAR(500) DEFAULT NULL,
  is_banned       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bingo_centers (
  id            SERIAL PRIMARY KEY,
  full_name     VARCHAR(100) NOT NULL,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,
  balance       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  mac_address   VARCHAR(17)  NOT NULL UNIQUE,
  created_by    VARCHAR(50)  NOT NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recharge_history (
  id                    SERIAL PRIMARY KEY,
  actual_amount         DECIMAL(15,2) NOT NULL,
  generated_amount      DECIMAL(15,2) NOT NULL,
  bingo_center_username VARCHAR(50)   NOT NULL,
  debited_by            VARCHAR(50)   NOT NULL,
  timestamp             TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER      NOT NULL,
  token      VARCHAR(500) NOT NULL,
  is_valid   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP    NOT NULL
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(100) NOT NULL,
  otp        VARCHAR(10)  NOT NULL,
  expires_at TIMESTAMP    NOT NULL,
  used       BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
