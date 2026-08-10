-- Migration V15: Update Admin credentials to single account admin@cafeflow.com / cafeflow@admin

DELETE FROM admins;

INSERT INTO admins (email, password_hash, name, role) 
VALUES ('admin@cafeflow.com', '$2a$10$.nc2B99FxZoo2ke8ZytTme7rXIhE1aPPogCvYTy2A/25hVW5na26O', 'CafeFlow Admin', 'SUPER_ADMIN');
