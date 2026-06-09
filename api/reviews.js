const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET /api/reviews?tour_id=5  → lấy danh sách đánh giá
  if (req.method === 'GET') {
    const { tour_id } = req.query;
    if (!tour_id) return res.status(400).json({ error: 'Thiếu tour_id' });

    const result = await pool.query(`
      SELECT r.id, r.rating, r.content, r.created_at,
             ca.full_name AS author
      FROM   reviews r
      JOIN   customer_accounts ca ON ca.id = r.customer_account_id
      WHERE  r.tour_id = $1 AND r.is_visible = TRUE
      ORDER  BY r.created_at DESC
    `, [tour_id]);

    // Tính điểm trung bình
    const avg = result.rows.length
      ? (result.rows.reduce((s, r) => s + r.rating, 0) / result.rows.length).toFixed(1)
      : null;

    return res.json({ reviews: result.rows, average: avg, total: result.rows.length });
  }

  // ── POST /api/reviews  → gửi đánh giá mới (cần đăng nhập)
  if (req.method === 'POST') {
    // Xác thực token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Chưa đăng nhập' });

    const { rows: accs } = await pool.query(
      `SELECT id FROM customer_accounts 
       WHERE token = $1 AND token_exp > NOW()`, [token]
    );
    if (!accs.length) return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });

    const accountId = accs[0].id;
    const { tour_id, rating, content, booking_id } = req.body;

    if (!tour_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Dữ liệu không hợp lệ' });
    }

    // Kiểm tra: KH đã từng đặt tour này chưa?
    if (booking_id) {
      const { rows: bks } = await pool.query(
        `SELECT b.id FROM bookings b
         JOIN   customers c ON c.id = b.customer_id
         JOIN   customer_accounts ca ON ca.email = c.email
         WHERE  b.id = $1 AND ca.id = $2 AND b.tour_id = $3
         AND    b.status = 'confirmed'`, [booking_id, accountId, tour_id]
      );
      if (!bks.length) return res.status(403).json({ error: 'Bạn chưa tham gia tour này' });
    }

    try {
      const ins = await pool.query(`
        INSERT INTO reviews (tour_id, customer_account_id, booking_id, rating, content)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [tour_id, accountId, booking_id || null, rating, content?.trim() || null]);

      return res.json({ success: true, review_id: ins.rows[0].id });
    } catch (e) {
      if (e.code === '23505') { // unique violation
        return res.status(409).json({ error: 'Bạn đã đánh giá tour này rồi' });
      }
      throw e;
    }
  }
};