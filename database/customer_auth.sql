-- Chay file nay tren Railway PostgreSQL truoc khi dung chuc nang dang nhap khach hang.

CREATE TABLE IF NOT EXISTS customer_accounts (
    id         SERIAL PRIMARY KEY,
    full_name  VARCHAR(120) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    password   VARCHAR(100) NOT NULL,
    token      VARCHAR(100),
    token_exp  TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
