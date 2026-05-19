-- Dong bo bang tours theo dung 10 tour dang hien thi tren index.html.
-- Chay tren Railway PostgreSQL sau khi deploy code.

UPDATE tours
SET
  is_active = CASE WHEN id IN (1, 3, 4, 5, 6, 8, 9, 11, 12, 14) THEN true ELSE false END;

UPDATE tours
SET
  title = v.title,
  category = v.category,
  duration_days = v.duration_days,
  duration_nights = v.duration_nights,
  max_people = v.max_people,
  price_adult = v.price_adult,
  price_child = ROUND(v.price_adult * 0.8),
  is_active = true
FROM (
  VALUES
    (1,  'Cố Đô Huế Trọn Gói - Di Sản UNESCO',                 'Lịch sử',     3, 2, 20, 2200000),
    (3,  'Khám Phá Ẩm Thực Huế',                               'Ẩm thực',     1, 1, 12, 850000),
    (4,  'Hành Trình Lăng Tẩm Triều Nguyễn',                   'Lịch sử',     2, 1, 18, 1800000),
    (5,  'Lăng Cô - Đèo Hải Vân - Rừng Ngập Mặn Rú Chá',       'Thiên nhiên', 2, 1, 20, 1650000),
    (6,  'Hành Hương Chùa Huế - Tâm Linh Cố Đô',               'Tâm linh',    1, 0, 25, 650000),
    (8,  'Đầm Phá Tam Giang - Thiên Đường Hải Sản',            'Thiên nhiên', 2, 1, 12, 1900000),
    (9,  'Vườn Quốc Gia Bạch Mã - Trekking Rừng Nguyên Sinh',  'Thiên nhiên', 2, 1, 10, 2100000),
    (11, 'Huế 1 Ngày - Tour Ghép Tiết Kiệm',                   'Kết hợp',     1, 0, 30, 490000),
    (12, 'Đạp Xe Xuyên Làng Huế - Mekong Style',               'Khám phá',    1, 0, 12, 380000),
    (14, 'Huế - Đà Nẵng - Hội An 4N3Đ Miền Trung',             'Kết hợp',     4, 3, 20, 3800000)
) AS v(id, title, category, duration_days, duration_nights, max_people, price_adult)
WHERE tours.id = v.id;

-- Kiem tra nhanh sau khi chay:
-- SELECT id, title, price_adult, max_people, is_active
-- FROM tours
-- ORDER BY id;
