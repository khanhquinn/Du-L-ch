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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!(await checkAuth(req)))
    return res.status(401).json({ error: 'Chưa đăng nhập' });

  try {
    // GET: Lấy lịch theo tháng
    if (req.method === 'GET') {
      const { month, year } = req.query;
      const m = month || new Date().getMonth() + 1;
      const y = year  || new Date().getFullYear();

      const schedules = await pool.query(`
        SELECT ts.*, t.title AS tour_title, t.category
        FROM tour_schedules ts
        JOIN tours t ON ts.tour_id = t.id
        WHERE EXTRACT(MONTH FROM ts.available_date) = $1
          AND EXTRACT(YEAR  FROM ts.available_date) = $2
        ORDER BY ts.available_date, t.id
      `, [m, y]);

      const blocked = await pool.query(`
        SELECT * FROM blocked_dates
        WHERE EXTRACT(MONTH FROM blocked_date) = $1
          AND EXTRACT(YEAR  FROM blocked_date) = $2
      `, [m, y]);

      return res.status(200).json({
        schedules: schedules.rows,
        blocked: blocked.rows
      });
    }

    // POST: Thêm lịch tour hoặc khoá ngày
    if (req.method === 'POST') {
      const { type, tour_id, available_date, max_people, note, reason } = req.body;

      if (type === 'block') {
        // Khoá toàn bộ ngày
        await pool.query(
          `INSERT INTO blocked_dates (blocked_date, reason)
           VALUES ($1, $2)
           ON CONFLICT (blocked_date) DO UPDATE SET reason = $2`,
          [available_date, reason || null]
        );
      } else if (type === 'block-tour') {
        // Khoá 1 tour cụ thể trong ngày (thêm vào tour_schedules với is_blocked = true)
        await pool.query(
          `INSERT INTO tour_schedules (tour_id, available_date, max_people, note, is_blocked)
           VALUES ($1, $2, $3, $4, true)
           ON CONFLICT (tour_id, available_date) DO UPDATE
           SET is_blocked = true, note = $4`,
          [tour_id, available_date, max_people || 20, note || null]
        );
      } else {
        // Thêm lịch tour bình thường
        await pool.query(
          `INSERT INTO tour_schedules (tour_id, available_date, max_people, note)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (tour_id, available_date) DO UPDATE
           SET max_people = $3, note = $4, is_blocked = false`,
          [tour_id, available_date, max_people || 20, note || null]
        );
      }

      return res.status(200).json({ success: true });
    }

    // PUT: Khoá/mở lịch tour
    if (req.method === 'PUT') {
      const { id, is_blocked, note } = req.body;
      await pool.query(
        'UPDATE tour_schedules SET is_blocked = $1, note = $2 WHERE id = $3',
        [is_blocked, note || null, id]
      );
      return res.status(200).json({ success: true });
    }

    // DELETE: Xoá lịch hoặc bỏ khoá ngày
    if (req.method === 'DELETE') {
      const { type, id } = req.body;
      if (type === 'block') {
        await pool.query('DELETE FROM blocked_dates WHERE id = $1', [id]);
      } else {
        await pool.query('DELETE FROM tour_schedules WHERE id = $1', [id]);
      }
      return res.status(200).json({ success: true });
    }

    res.status(405).end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
};
