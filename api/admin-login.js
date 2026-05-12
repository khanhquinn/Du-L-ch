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
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Thiếu thông tin đăng nhập' });

    // Kiểm tra tài khoản
    const result = await pool.query(
      'SELECT * FROM admins WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });

    // Tạo token đơn giản
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 giờ

    await pool.query(
      'UPDATE admins SET token = $1, token_exp = $2 WHERE id = $3',
      [token, expiry, result.rows[0].id]
    );

    res.status(200).json({ token, username: result.rows[0].username });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
};
