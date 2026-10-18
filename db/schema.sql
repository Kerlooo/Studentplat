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

-- Profilo dello studente (1:1 con users, campi opzionali)
ALTER TABLE users
	ADD COLUMN IF NOT EXISTS nickname VARCHAR(50) NULL AFTER name,
	ADD COLUMN IF NOT EXISTS degree_course VARCHAR(150) NULL,
	ADD COLUMN IF NOT EXISTS university VARCHAR(150) NULL,
	ADD COLUMN IF NOT EXISTS total_cfu SMALLINT UNSIGNED NULL;

-- Catalogo condiviso degli esami: creato da un utente, riutilizzabile da tutti come template
CREATE TABLE IF NOT EXISTS exams (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(150) NOT NULL,
	cfu TINYINT UNSIGNED NOT NULL,
	created_by INT UNSIGNED NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT chk_exams_cfu CHECK (cfu BETWEEN 1 AND 30),
	CONSTRAINT fk_exams_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
	UNIQUE KEY uq_exams_name_cfu (name, cfu)
) ENGINE=InnoDB;

-- Libretto personale: esami dell'utente; grade NULL = da sostenere, 1-30, 31 = 30 e lode
CREATE TABLE IF NOT EXISTS user_exams (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	user_id INT UNSIGNED NOT NULL,
	exam_id INT UNSIGNED NOT NULL,
	exam_date DATE NULL,
	grade TINYINT UNSIGNED NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT chk_user_exams_grade CHECK (grade IS NULL OR grade BETWEEN 1 AND 31),
	CONSTRAINT fk_user_exams_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	CONSTRAINT fk_user_exams_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE RESTRICT,
	UNIQUE KEY uq_user_exams (user_id, exam_id)
) ENGINE=InnoDB;
