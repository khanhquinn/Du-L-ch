const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function getCustomerAccount(req) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token) return null;

  const result = await pool.query(
    'SELECT id, full_name, email FROM customer_accounts WHERE token = $1 AND token_exp > NOW()',
    [token]
  );
  return result.rows[0] || null;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const account = await getCustomerAccount(req);
    if (!account) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập' });
    }

    const bookings = await pool.query(
      `SELECT b.id, b.departure_date, b.num_adults, b.num_children,
              b.total_price, b.status, b.created_at,
              t.title AS tour_title, t.duration_days, t.duration_nights,
              c.full_name, c.phone, c.email
       FROM bookings b
       JOIN customers c ON b.customer_id = c.id
       JOIN tours t ON b.tour_id = t.id
       WHERE LOWER(c.email) = LOWER($1)
       ORDER BY b.created_at DESC`,
      [account.email]
    );

    res.status(200).json(bookings.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
};
