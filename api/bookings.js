const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ═══════════════════════ EMAIL HELPERS ═══════════════════════

const formatPrice = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

const formatDate = (date) => {
  const d = new Date(date);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
};

function buildEmailHtml({ bookingId, customerName, tourTitle, departureDate, numAdults, numChildren, totalPrice }) {
  const peopleStr = `${numAdults} người lớn${numChildren ? `, ${numChildren} trẻ em` : ''}`;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f6f0e7;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(140,110,70,0.12);">
    <div style="background:linear-gradient(135deg,#c9a84c 0%,#b8943f 100%);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:32px;font-family:'Playfair Display',Georgia,serif;letter-spacing:-1px;">Huế Tour</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.92);font-size:12px;letter-spacing:3px;">WELCOME TO HUE CITY</p>
    </div>
    <div style="padding:32px 28px;">
      <h2 style="color:#2b2823;font-size:22px;margin:0 0 16px;">Đặt tour thành công! 🎉</h2>
      <p style="color:#5d564c;font-size:15px;line-height:1.7;margin:0 0 18px;">
        Xin chào <strong>${customerName}</strong>,<br><br>
        Cảm ơn bạn đã đặt tour tại <strong>Huế Tour</strong>. Chúng tôi đã nhận được yêu cầu và sẽ liên hệ xác nhận trong vòng <strong>2 giờ</strong>.
      </p>
      <div style="background:#fdf8f1;border-left:4px solid #c9a84c;padding:20px 22px;margin:20px 0;border-radius:4px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#2b2823;">
          <tr><td style="padding:7px 0;color:#94897b;width:150px;">Mã booking:</td><td style="padding:7px 0;"><strong>#${bookingId}</strong></td></tr>
          <tr><td style="padding:7px 0;color:#94897b;">Tour:</td><td style="padding:7px 0;"><strong>${tourTitle}</strong></td></tr>
          <tr><td style="padding:7px 0;color:#94897b;">Ngày khởi hành:</td><td style="padding:7px 0;">${formatDate(departureDate)}</td></tr>
          <tr><td style="padding:7px 0;color:#94897b;">Số người:</td><td style="padding:7px 0;">${peopleStr}</td></tr>
          <tr><td style="padding:10px 0 4px;color:#94897b;border-top:1px solid rgba(0,0,0,0.08);">Tổng tiền:</td><td style="padding:10px 0 4px;border-top:1px solid rgba(0,0,0,0.08);"><strong style="color:#b8943f;font-size:19px;">${formatPrice(totalPrice)}</strong></td></tr>
        </table>
      </div>
      <p style="color:#5d564c;font-size:14px;line-height:1.7;margin:0 0 14px;">
        Nhân viên sẽ gọi điện đến số bạn đã đăng ký để xác nhận và hướng dẫn thanh toán.
      </p>
      <p style="color:#5d564c;font-size:14px;line-height:1.7;margin:0;">
        Mọi thắc mắc xin liên hệ:<br>
        📞 Hotline: <strong>0234 567 890</strong><br>
        📧 Email: <strong>support@huetour.vn</strong>
      </p>
    </div>
    <div style="background:#efe6d8;padding:18px;text-align:center;color:#94897b;font-size:11.5px;line-height:1.6;">
      <p style="margin:0;">© 2026 Huế Tour — Cố Đô Huế, Việt Nam</p>
      <p style="margin:6px 0 0;font-size:11px;">Email gửi tự động, vui lòng không trả lời trực tiếp.</p>
    </div>
  </div>
</body></html>`;
}

async function sendBookingEmail(data) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('[Email] Missing GMAIL_USER or GMAIL_APP_PASSWORD env vars - skip');
    return false;
  }
  if (!data.email) {
    console.warn('[Email] Customer email empty - skip');
    return false;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });

  await transporter.sendMail({
    from: `"Huế Tour" <${process.env.GMAIL_USER}>`,
    to: data.email,
    subject: `Xác nhận đặt tour #${data.bookingId} - Huế Tour`,
    html: buildEmailHtml(data),
  });

  console.log(`[Email] Sent to ${data.email} for booking #${data.bookingId}`);
  return true;
}

// ═══════════════════════ BOOKING ENDPOINT ═══════════════════════

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const {
      full_name, phone, email,
      tour_id, departure_date,
      num_adults, num_children, note
    } = req.body;

    // Validate bắt buộc (defense-in-depth, dù frontend đã validate)
    if (!full_name || !phone || !email || !tour_id || !departure_date) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc (họ tên, SĐT, email, tour, ngày)' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email không hợp lệ' });
    }

    // Tìm hoặc tạo khách hàng
    let customerResult = await pool.query(
      'SELECT id FROM customers WHERE phone = $1', [phone]
    );

    let customer_id;
    if (customerResult.rows.length > 0) {
      customer_id = customerResult.rows[0].id;
    } else {
      const newCustomer = await pool.query(
        'INSERT INTO customers (full_name, phone, email) VALUES ($1,$2,$3) RETURNING id',
        [full_name, phone, email]
      );
      customer_id = newCustomer.rows[0].id;
    }

    // Lấy giá + tên tour (cần title cho email)
    const tourResult = await pool.query(
      'SELECT title, price_adult, price_child FROM tours WHERE id = $1',
      [tour_id]
    );
    const tour = tourResult.rows[0];
    const childPrice = tour.price_child || Math.round(tour.price_adult * 0.7);
    const total = (tour.price_adult * num_adults) + (childPrice * (num_children || 0));

    // Tạo booking
    const booking = await pool.query(
      `INSERT INTO bookings
       (tour_id, customer_id, departure_date, num_adults, num_children, total_price, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [tour_id, customer_id, departure_date, num_adults, num_children || 0, total, note]
    );

    const bookingId = booking.rows[0].id;

    // ═══ GỬI EMAIL XÁC NHẬN ═══
    // Wrap trong try/catch riêng để email lỗi KHÔNG làm booking thất bại
    try {
      await sendBookingEmail({
        email,
        bookingId,
        customerName: full_name,
        tourTitle: tour.title,
        departureDate: departure_date,
        numAdults: num_adults,
        numChildren: num_children || 0,
        totalPrice: total,
      });
    } catch (emailErr) {
      console.error('[Email error]', emailErr.message);
      // Tiếp tục - booking đã lưu vào DB, chỉ là email không gửi được
    }

    res.status(200).json({
      booking_id: bookingId,
      total_price: total
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi khi đặt tour' });
  }
};
