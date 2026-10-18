-- Schema database Studentplat (MariaDB/MySQL)
CREATE DATABASE IF NOT EXISTS studentplat
	CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE studentplat;

CREATE TABLE IF NOT EXISTS users (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	email VARCHAR(255) NOT NULL UNIQUE,
	name VARCHAR(100) NOT NULL,
	password_hash VARCHAR(255) NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Sessioni: nel cookie va il token in chiaro, qui solo il suo hash SHA-256
CREATE TABLE IF NOT EXISTS sessions (
	id CHAR(64) PRIMARY KEY,
	user_id INT UNSIGNED NOT NULL,
	expires_at DATETIME NOT NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	INDEX idx_sessions_user (user_id)
) ENGINE=InnoDB;
