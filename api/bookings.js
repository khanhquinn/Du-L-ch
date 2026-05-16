const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const {
      full_name, phone, email,
      tour_id, departure_date,
      num_adults, num_children, num_infant, note
    } = req.body;

    // ── Validate ──
    if (!full_name || !phone || !tour_id || !departure_date) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    const adults   = parseInt(num_adults)   || 1;
    const children = parseInt(num_children) || 0;   // 2-9 tuổi
    const infants  = parseInt(num_infant)   || 0;   // <2 tuổi (miễn phí)

    // ── Tìm hoặc tạo khách hàng ──
    let customer_id;
    const customerResult = await pool.query(
      'SELECT id FROM customers WHERE phone = $1', [phone]
    );

    if (customerResult.rows.length > 0) {
      customer_id = customerResult.rows[0].id;
    } else {
      const newCustomer = await pool.query(
        'INSERT INTO customers (full_name, phone, email) VALUES ($1,$2,$3) RETURNING id',
        [full_name, phone, email || null]
      );
      customer_id = newCustomer.rows[0].id;
    }

    // ── Lấy giá tour ──
    const tourResult = await pool.query(
      'SELECT price_adult, price_child FROM tours WHERE id = $1',
      [tour_id]
    );
    if (tourResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tour không tồn tại' });
    }
    const tour = tourResult.rows[0];

    // ── Tính giá ĐÚNG: ──
    // - Người lớn: 100% giá
    // - Trẻ em 2-9 tuổi: 80% giá (KHÔNG phải 70%)
    // - Em bé <2 tuổi: MIỄN PHÍ (0đ)
    const adultPrice = parseFloat(tour.price_adult) || 0;
    const childPrice = tour.price_child
      ? parseFloat(tour.price_child)
      : Math.round(adultPrice * 0.8);   // ← Đổi từ 0.7 → 0.8

    const adultTotal  = adultPrice * adults;
    const childTotal  = childPrice * children;
    const infantTotal = 0;                              // ← Em bé miễn phí

    const total = adultTotal + childTotal + infantTotal;

    // ── Ghi chú: thêm số em bé vào note (vì DB không có cột num_infant) ──
    let fullNote = note || '';
    if (infants > 0) {
      fullNote = (fullNote ? fullNote + ' | ' : '') + `Em bé (<2 tuổi): ${infants}`;
    }

    // ── Tạo booking ──
    const booking = await pool.query(
      `INSERT INTO bookings
       (tour_id, customer_id, departure_date, num_adults, num_children, total_price, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [tour_id, customer_id, departure_date, adults, children, total, fullNote || null]
    );

    console.log(`[/api/bookings] Created booking ${booking.rows[0].id}: ${adults} adults + ${children} children + ${infants} infants = ${total}đ`);

    res.status(200).json({
      booking_id:   booking.rows[0].id,
      total_price:  total,
      breakdown: {
        adults:   { count: adults,   price: adultPrice, subtotal: adultTotal },
        children: { count: children, price: childPrice, subtotal: childTotal },
        infants:  { count: infants,  price: 0,          subtotal: 0 }
      }
    });

  } catch (error) {
    console.error('[/api/bookings] ERROR:', error);
    res.status(500).json({ error: 'Lỗi khi đặt tour', detail: error.message });
  }
};
