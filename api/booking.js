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
      num_adults, num_children, note
    } = req.body;

    // Tìm hoặc tạo khách hàng
    let customerResult = await pool.query(
      'SELECT id FROM customers WHERE phone = $1', [phone]
    );

    let customer_id;
    if (customerResult.rows.length > 0) {
      customer_id = customerResult.rows[0].id;
    } else {
      const newCustomer = await pool.query(
        'INSERT INTO customers (full_name, phone, email) VALUES ($1,$2,$3) RETURNING id',
        [full_name, phone, email]
      );
      customer_id = newCustomer.rows[0].id;
    }

    // Lấy giá tour
    const tourResult = await pool.query(
      'SELECT price_adult, price_child FROM tours WHERE id = $1',
      [tour_id]
    );
    const tour = tourResult.rows[0];
    const childPrice = tour.price_child || Math.round(tour.price_adult * 0.7);
    const total = (tour.price_adult * num_adults) + (childPrice * (num_children || 0));

    // Tạo booking
    const booking = await pool.query(
      `INSERT INTO bookings
       (tour_id, customer_id, departure_date, num_adults, num_children, total_price, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [tour_id, customer_id, departure_date, num_adults, num_children || 0, total, note]
    );

    res.status(200).json({
      booking_id: booking.rows[0].id,
      total_price: total
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi khi đặt tour' });
  }
};