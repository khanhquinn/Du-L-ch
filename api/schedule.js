const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Helper: convert PostgreSQL DATE/TIMESTAMP to "YYYY-MM-DD" string
// pg library returns DATE columns as JavaScript Date objects, not strings
function toDateStr(d) {
  if (!d) return '';
  if (typeof d === 'string') return d.split('T')[0];
  if (d instanceof Date) {
    // Use UTC parts to avoid timezone shift
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return String(d);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

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

    // Lấy ngày bị khoá toàn bộ
    const blocked = await pool.query(`
      SELECT blocked_date FROM blocked_dates
      WHERE blocked_date > $1
      ORDER BY blocked_date
    `, [today]);

    // Lấy ngày tour bị khoá riêng (is_blocked = true cho tour_id này)
    const tourBlocked = await pool.query(`
      SELECT available_date FROM tour_schedules
      WHERE tour_id = $1 AND is_blocked = true AND available_date > $2
    `, [tour_id, today]);

    // Convert dates SAFELY (handle both Date objects and strings)
    const result = {
      available: schedules.rows.map(r => ({
        ...r,
        available_date: toDateStr(r.available_date)
      })),
      blocked_all: blocked.rows.map(r => toDateStr(r.blocked_date)),
      blocked_tour: tourBlocked.rows.map(r => toDateStr(r.available_date)),
      has_fixed_schedule: schedules.rows.length > 0
    };

    console.log(`[/api/schedule] tour_id=${tour_id} - blocked_all=${result.blocked_all.length}, blocked_tour=${result.blocked_tour.length}`);

    res.status(200).json(result);

  } catch (err) {
    console.error('[/api/schedule] ERROR:', err);
    res.status(500).json({ error: 'Lỗi server', detail: err.message });
  }
};
