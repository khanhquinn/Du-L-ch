// api/payment-momo.js
// Xử lý thanh toán MoMo cá nhân
// POST /api/payment-momo → khách báo đã chuyển khoản
// PUT  /api/payment-momo → admin xác nhận đã nhận tiền

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ─────────────────────────────────────────────────────────────
  // POST: Khách báo đã chuyển khoản
  //   Body: { booking_id, transfer_note }
  //   → Cập nhật bookings.status = 'pending_payment'
  // ─────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { booking_id, transfer_note } = req.body || {};

    if (!booking_id) {
      return res.status(400).json({ error: 'Thiếu booking_id' });
    }

    try {
      // Chỉ cập nhật nếu booking đang ở trạng thái 'pending'
      const result = await pool.query(
        `UPDATE bookings
         SET    status        = 'pending_payment',
                payment_note  = $2
         WHERE  id            = $1
           AND  status        = 'pending'
         RETURNING id, status`,
        [booking_id, transfer_note || null]
      );

      if (result.rowCount === 0) {
        // Booking không tồn tại hoặc đã ở trạng thái khác
        const { rows } = await pool.query(
          'SELECT status FROM bookings WHERE id = $1', [booking_id]
        );
        if (!rows.length) {
          return res.status(404).json({ error: 'Không tìm thấy booking' });
        }
        // Nếu đã là pending_payment hoặc confirmed → cũng coi là OK
        if (['pending_payment', 'confirmed'].includes(rows[0].status)) {
          return res.json({ success: true, already: true });
        }
        return res.status(409).json({ error: 'Booking đã ở trạng thái: ' + rows[0].status });
      }

      return res.json({ success: true, booking_id, status: 'pending_payment' });

    } catch (err) {
      console.error('[payment-momo POST]', err);
      return res.status(500).json({ error: 'Lỗi server: ' + err.message });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PUT: Admin xác nhận đã nhận tiền MoMo
  //   Header: Authorization: Bearer {admin_token}
  //   Body: { booking_id }
  //   → Cập nhật bookings.status = 'confirmed'
  // ─────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    // Xác thực token admin
    const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
    if (!token) {
      return res.status(401).json({ error: 'Chưa đăng nhập admin' });
    }

    try {
      const { rows: admins } = await pool.query(
        `SELECT id FROM admins
         WHERE  token     = $1
           AND  token_exp > NOW()`,
        [token]
      );
      if (!admins.length) {
        return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
      }

      const { booking_id } = req.body || {};
      if (!booking_id) {
        return res.status(400).json({ error: 'Thiếu booking_id' });
      }

      const result = await pool.query(
        `UPDATE bookings
         SET    status       = 'confirmed',
                confirmed_at = NOW()
         WHERE  id           = $1
           AND  status       = 'pending_payment'
         RETURNING id, status, confirmed_at`,
        [booking_id]
      );

      if (result.rowCount === 0) {
        const { rows } = await pool.query(
          'SELECT status FROM bookings WHERE id = $1', [booking_id]
        );
        if (!rows.length) {
          return res.status(404).json({ error: 'Không tìm thấy booking' });
        }
        return res.status(409).json({
          error: 'Booking đang ở trạng thái: ' + rows[0].status
        });
      }

      return res.json({
        success:      true,
        booking_id,
        status:       'confirmed',
        confirmed_at: result.rows[0].confirmed_at
      });

    } catch (err) {
      console.error('[payment-momo PUT]', err);
      return res.status(500).json({ error: 'Lỗi server: ' + err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
