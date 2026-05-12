const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkAuth(req) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return false;
  const r = await pool.query(
    'SELECT id FROM admins WHERE token = $1 AND token_exp > NOW()', [token]
  );
  return r.rows.length > 0;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!(await checkAuth(req)))
    return res.status(401).json({ error: 'Chưa đăng nhập' });

  try {
    // Tổng quan
    const overview = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status != 'Đã huỷ') AS total_bookings,
        COUNT(*) FILTER (WHERE status = 'Chờ xác nhận') AS pending,
        COUNT(*) FILTER (WHERE status = 'Đã xác nhận') AS confirmed,
        COUNT(*) FILTER (WHERE status = 'Đã huỷ') AS cancelled,
        COALESCE(SUM(total_price) FILTER (WHERE status = 'Đã xác nhận'), 0) AS total_revenue,
        COALESCE(SUM(num_adults + num_children) FILTER (WHERE status != 'Đã huỷ'), 0) AS total_guests
      FROM bookings
    `);

    // Doanh thu theo tháng (6 tháng gần nhất)
    const monthly = await pool.query(`
      SELECT
        TO_CHAR(created_at, 'MM/YYYY') AS month,
        COUNT(*) AS bookings,
        COALESCE(SUM(total_price), 0) AS revenue
      FROM bookings
      WHERE status != 'Đã huỷ'
        AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'MM/YYYY'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `);

    // Tour được đặt nhiều nhất
    const topTours = await pool.query(`
      SELECT t.title, t.category,
             COUNT(b.id) AS total_bookings,
             COALESCE(SUM(b.total_price), 0) AS revenue
      FROM bookings b
      JOIN tours t ON b.tour_id = t.id
      WHERE b.status != 'Đã huỷ'
      GROUP BY t.id, t.title, t.category
      ORDER BY total_bookings DESC
      LIMIT 5
    `);

    // Booking mới nhất (5 cái)
    const recent = await pool.query(`
      SELECT b.id, b.departure_date, b.total_price, b.status, b.created_at,
             c.full_name, c.phone, t.title AS tour_title
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      JOIN tours t ON b.tour_id = t.id
      ORDER BY b.created_at DESC
      LIMIT 5
    `);

    res.status(200).json({
      overview: overview.rows[0],
      monthly: monthly.rows,
      topTours: topTours.rows,
      recent: recent.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
};
