-- Account amministratore di partenza per lo sviluppo locale
-- Email: admin@admin.com  Password: admin
-- Da eseguire dopo schema.sql. Cambiare la password o eliminare l'account prima di mettere il sito online.
USE studentplat;

-- INSERT IGNORE: se l'account esiste gia' non viene toccato (password cambiata compresa)
INSERT IGNORE INTO users (email, name, password_hash, role)
VALUES (
	'admin@admin.com',
	'Admin',
	'scrypt$HHY-mlkd1bfNg6yoS0AU8A$wS8aEn7BcIsBz8VlB9L8wVwSIgjI8h_rfUEr12j_411nLA_KcUb9a3jXbqfQ8h7Qs46tfD5NicDxuoiibifLhA',
	'admin'
);
