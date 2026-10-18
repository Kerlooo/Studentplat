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

-- Libretto personale: un esame del catalogo aggiunto dall'utente, con l'eventuale appello previsto
CREATE TABLE IF NOT EXISTS user_exams (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	user_id INT UNSIGNED NOT NULL,
	exam_id INT UNSIGNED NOT NULL,
	planned_date DATE NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_user_exams_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
	CONSTRAINT fk_user_exams_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE RESTRICT,
	UNIQUE KEY uq_user_exams (user_id, exam_id)
) ENGINE=InnoDB;

-- Storico dei tentativi di un esame del libretto.
-- grade: 1-30, 31 = 30 e lode, NULL = ritirato/assente. Sotto 18 = non superato.
-- rejected: voto sufficiente ma rifiutato dallo studente.
-- Esame superato = esiste un tentativo con grade >= 18 e rejected = 0 (al massimo uno per esame, controllato lato server).
CREATE TABLE IF NOT EXISTS exam_attempts (
	id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
	user_exam_id INT UNSIGNED NOT NULL,
	attempt_date DATE NOT NULL,
	grade TINYINT UNSIGNED NULL,
	rejected BOOLEAN NOT NULL DEFAULT FALSE,
	notes VARCHAR(255) NULL,
	created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT chk_attempts_grade CHECK (grade IS NULL OR grade BETWEEN 1 AND 31),
	CONSTRAINT fk_attempts_user_exam FOREIGN KEY (user_exam_id) REFERENCES user_exams(id) ON DELETE CASCADE,
	INDEX idx_attempts_user_exam (user_exam_id, attempt_date)
) ENGINE=InnoDB;
