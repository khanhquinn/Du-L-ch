-- CHẠY FILE NÀY TRÊN RAILWAY DATABASE

-- Bảng admin
CREATE TABLE admins (
    id         SERIAL PRIMARY KEY,
    username   VARCHAR(50)  NOT NULL UNIQUE,
    password   VARCHAR(100) NOT NULL,
    token      VARCHAR(100),
    token_exp  TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tài khoản admin mặc định: admin / hue2026
INSERT INTO admins (username, password) VALUES ('admin', 'hue2026');

-- Bảng lịch tour theo tháng
CREATE TABLE tour_schedules (
    id               SERIAL PRIMARY KEY,
    tour_id          INT REFERENCES tours(id) ON DELETE CASCADE,
    available_date   DATE    NOT NULL,
    max_people       INT     DEFAULT 20,
    current_bookings INT     DEFAULT 0,
    is_blocked       BOOLEAN DEFAULT false,
    note             VARCHAR(255),
    created_at       TIMESTAMP DEFAULT NOW(),
    UNIQUE(tour_id, available_date)
);

-- Bảng ngày bị khoá toàn bộ (không nhận khách)
CREATE TABLE blocked_dates (
    id           SERIAL PRIMARY KEY,
    blocked_date DATE NOT NULL UNIQUE,
    reason       VARCHAR(255),
    created_at   TIMESTAMP DEFAULT NOW()
);

-- Cập nhật bảng bookings: thêm cột confirmed_at
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_reason TEXT;

PRINT 'Admin tables created!';
