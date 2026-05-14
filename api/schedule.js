const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const { tour_id } = req.query;
    if (!tour_id) return res.status(400).json({ error: 'Thiếu tour_id' });

    const today = new Date().toISOString().split('T')[0];

    // Lấy ngày có lịch của tour (chưa bị khoá, chưa qua)
    const schedules = await pool.query(`
      SELECT ts.id, ts.available_date, ts.max_people, ts.current_bookings, ts.note,
             (ts.max_people - ts.current_bookings) AS slots_left
      FROM tour_schedules ts
      WHERE ts.tour_id    = $1
        AND ts.is_blocked = false
        AND ts.available_date > $2
        AND ts.available_date NOT IN (
          SELECT blocked_date FROM blocked_dates
        )
      ORDER BY ts.available_date ASC
    `, [tour_id, today]);

    // Lấy ngày bị khoá toàn bộ (để disable trên calendar)
    const blocked = await pool.query(`
      SELECT blocked_date FROM blocked_dates
      WHERE blocked_date > $1
      ORDER BY blocked_date
    `, [today]);

    // Lấy ngày tour bị khoá riêng
    const tourBlocked = await pool.query(`
      SELECT available_date FROM tour_schedules
      WHERE tour_id = $1 AND is_blocked = true AND available_date > $2
    `, [tour_id, today]);

    res.status(200).json({
      available: schedules.rows,
      blocked_all: blocked.rows.map(r => r.blocked_date.split('T')[0]),
      blocked_tour: tourBlocked.rows.map(r => r.available_date.split('T')[0]),
      has_fixed_schedule: schedules.rows.length > 0
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
};
