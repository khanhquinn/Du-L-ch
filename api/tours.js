const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const { category } = req.query;

    let query = `
      SELECT t.*, d.name AS destination_name, d.area
      FROM tours t
      JOIN destinations d ON t.destination_id = d.id
      WHERE t.is_active = true
    `;

    const params = [];
    if (category && category !== 'all') {
      query += ` AND t.category = $1`;
      params.push(category);
    }

    query += ` ORDER BY t.id`;

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};