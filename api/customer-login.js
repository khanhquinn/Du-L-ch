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
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Thiếu thông tin đăng nhập' });
    }

    const result = await pool.query(
      'SELECT id, full_name, email FROM customer_accounts WHERE email = $1 AND password = $2',
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Sai email hoặc mật khẩu' });
    }

    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const account = result.rows[0];

    await pool.query(
      'UPDATE customer_accounts SET token = $1, token_exp = $2 WHERE id = $3',
      [token, expiry, account.id]
    );

    res.status(200).json({
      token,
      full_name: account.full_name,
      email: account.email
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
};
