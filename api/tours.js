const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const { INDEX_TOUR_IDS } = require('./_tourCatalog');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const { category } = req.query;

    let query = `
      SELECT t.*, d.name AS destination_name, d.area
      FROM tours t
      JOIN destinations d ON t.destination_id = d.id
      WHERE t.is_active = true
        AND t.id = ANY($1::int[])
    `;

    const params = [INDEX_TOUR_IDS];
    if (category && category !== 'all') {
      query += ` AND t.category = $2`;
      params.push(category);
    }

    query += ` ORDER BY array_position($1::int[], t.id)`;

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};
