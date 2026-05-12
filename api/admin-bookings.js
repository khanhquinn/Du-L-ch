const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Kiểm tra token
async function checkAuth(req) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return false;
  const r = await pool.query(
    'SELECT id FROM admins WHERE token = $1 AND token_exp > NOW()',
    [token]
  );
  return r.rows.length > 0;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!(await checkAuth(req)))
    return res.status(401).json({ error: 'Chưa đăng nhập' });

  try {
    // GET: Lấy danh sách booking
    if (req.method === 'GET') {
      const { status } = req.query;
      let query = `
        SELECT b.id, b.departure_date, b.num_adults, b.num_children,
               b.total_price, b.status, b.note, b.created_at, b.confirmed_at,
               c.full_name, c.phone, c.email,
               t.title AS tour_title, t.duration_days, t.duration_nights,
               t.category, d.name AS destination_name
        FROM bookings b
        JOIN customers c ON b.customer_id = c.id
        JOIN tours t ON b.tour_id = t.id
        JOIN destinations d ON t.destination_id = d.id
      `;
      const params = [];
      if (status && status !== 'all') {
        query += ` WHERE b.status = $1`;
        params.push(status);
      }
      query += ` ORDER BY b.created_at DESC`;

      const result = await pool.query(query, params);
      return res.status(200).json(result.rows);
    }

    // PUT: Cập nhật trạng thái booking
    if (req.method === 'PUT') {
      const { id, status, cancelled_reason } = req.body;
      if (!id || !status)
        return res.status(400).json({ error: 'Thiếu thông tin' });

      const confirmedAt = status === 'Đã xác nhận' ? new Date() : null;

      await pool.query(
        `UPDATE bookings 
         SET status = $1, confirmed_at = $2, cancelled_reason = $3
         WHERE id = $4`,
        [status, confirmedAt, cancelled_reason || null, id]
      );

      return res.status(200).json({ success: true });
    }

    res.status(405).end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
};
