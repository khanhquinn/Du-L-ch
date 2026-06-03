const { Pool } = require('pg');
const nodemailer = require('nodemailer');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ═══════════════════════ TOUR ITINERARIES ═══════════════════════
// Đồng bộ với TOUR_ITINERARIES trong booking.html
const TOUR_ITINERARIES = {
  1: {
    days: [
      {
        title: 'Ngày 1: Khám Phá Đại Nội & Hoàng Thành',
        items: [
          { time: '07:30', activity: 'Đón khách tại khách sạn / điểm hẹn, khởi hành tham quan Đại Nội Huế' },
          { time: '08:30', activity: 'Tham quan Ngọ Môn – cổng chính của Hoàng Thành Huế' },
          { time: '09:30', activity: 'Khám phá Điện Thái Hòa – nơi diễn ra các nghi lễ quan trọng của triều Nguyễn' },
          { time: '11:30', activity: 'Ăn trưa tại nhà hàng đặc sản cung đình Huế' },
          { time: '13:30', activity: 'Tham quan Tử Cấm Thành – khu vực sinh hoạt của hoàng gia' },
          { time: '15:00', activity: 'Khám phá Bảo tàng Mộc bản triều Nguyễn – di sản tư liệu UNESCO' },
          { time: '17:00', activity: 'Nhận phòng khách sạn 3-4 sao, nghỉ ngơi' },
          { time: '19:00', activity: 'Ăn tối, thưởng thức biểu diễn Nhã nhạc cung đình Huế' }
        ]
      },
      {
        title: 'Ngày 2: Di Sản Văn Hóa & Tín Ngưỡng',
        items: [
          { time: '07:00', activity: 'Ăn sáng tại khách sạn' },
          { time: '08:00', activity: 'Tham quan Bảo tàng Châu bản triều Nguyễn' },
          { time: '10:00', activity: 'Khám phá hệ thống Thơ văn trên kiến trúc cung đình – các ô thơ chạm khắc' },
          { time: '11:30', activity: 'Ăn trưa với món Huế truyền thống' },
          { time: '13:30', activity: 'Tham quan đền Voi Ré và đấu trường Hổ Quyền – dấu tích thời vua chúa' },
          { time: '15:30', activity: 'Trải nghiệm tín ngưỡng thờ Mẫu, xem nghệ thuật Bài Chòi' },
          { time: '18:00', activity: 'Ăn tối, dạo thuyền sông Hương về đêm' }
        ]
      },
      {
        title: 'Ngày 3: Tham Quan & Khởi Hành',
        items: [
          { time: '07:00', activity: 'Ăn sáng, trả phòng khách sạn' },
          { time: '08:30', activity: 'Mua sắm đặc sản Huế tại chợ Đông Ba' },
          { time: '10:30', activity: 'Tham quan Chùa Thiên Mụ – biểu tượng Cố Đô' },
          { time: '12:00', activity: 'Ăn trưa, kết thúc tour, đưa khách về điểm hẹn' }
        ]
      }
    ]
  },
  3: {
    days: [
      {
        title: 'Ngày 1: Hành Trình Khám Phá Ẩm Thực Huế',
        items: [
          { time: '08:00', activity: 'Đón khách, khởi hành đi chợ Đông Ba – tham quan và tìm hiểu đặc sản' },
          { time: '09:30', activity: 'Thưởng thức Bún bò Huế đặc trưng tại quán lâu đời nổi tiếng' },
          { time: '11:00', activity: 'Khám phá ẩm thực bánh truyền thống: Bánh bèo, Bánh nậm, Bánh bột lọc, Bánh ram ít' },
          { time: '12:30', activity: 'Nghỉ trưa, thưởng thức Cơm hến / Bún hến – món dân dã đặc trưng' },
          { time: '14:00', activity: 'Tham quan làng nghề làm Mè xửng, Mắm tôm chua – đặc sản làm quà' },
          { time: '16:00', activity: 'Thưởng thức Bánh khoái với nước lèo đặc trưng' },
          { time: '18:00', activity: 'Ăn tối với Nem lụi, Tré Huế, Bánh canh Nam Phổ' },
          { time: '20:00', activity: 'Thưởng thức Chè Huế – hơn 20 loại chè thanh mát' },
          { time: '21:30', activity: 'Nhận phòng khách sạn, nghỉ ngơi' }
        ]
      }
    ]
  },
  4: {
    days: [
      {
        title: 'Ngày 1: Lăng Tẩm Phía Tây Nam',
        items: [
          { time: '07:30', activity: 'Đón khách, khởi hành tham quan Lăng Gia Long (Thiên Thọ Lăng) – lăng vị vua đầu triều Nguyễn' },
          { time: '09:30', activity: 'Khám phá Lăng Minh Mạng – kiến trúc đăng đối, uy nghi với 40 công trình' },
          { time: '11:30', activity: 'Ăn trưa tại nhà hàng địa phương' },
          { time: '13:30', activity: 'Tham quan Lăng Thiệu Trị (Xương Lăng) – không gian thanh bình, hài hòa thiên nhiên' },
          { time: '15:30', activity: 'Khám phá Lăng Tự Đức (Khiêm Lăng) – lăng thơ mộng nhất Huế, công viên rộng 12ha' },
          { time: '17:30', activity: 'Nhận phòng khách sạn, nghỉ ngơi' },
          { time: '19:00', activity: 'Ăn tối, dạo phố cổ Huế về đêm' }
        ]
      },
      {
        title: 'Ngày 2: Lăng Tẩm Phía Đông',
        items: [
          { time: '07:00', activity: 'Ăn sáng tại khách sạn, trả phòng' },
          { time: '08:00', activity: 'Tham quan Lăng Dục Đức (An Lăng) – nơi an nghỉ 3 vị vua Dục Đức, Thành Thái, Duy Tân' },
          { time: '10:00', activity: 'Khám phá Lăng Đồng Khánh (Tư Lăng) – giao thoa kiến trúc Á–Âu độc đáo' },
          { time: '12:00', activity: 'Ăn trưa với đặc sản Huế' },
          { time: '13:30', activity: 'Tham quan Lăng Khải Định (Ứng Lăng) – kiến trúc cầu kỳ ảnh hưởng châu Âu' },
          { time: '15:30', activity: 'Mua sắm đặc sản, quà lưu niệm' },
          { time: '17:00', activity: 'Khởi hành về điểm đón, kết thúc tour' }
        ]
      }
    ]
  },
  5: {
    days: [
      {
        title: 'Ngày 1: Vịnh Lăng Cô & Đèo Hải Vân',
        items: [
          { time: '07:30', activity: 'Đón khách tại khách sạn, khởi hành đi Vịnh Lăng Cô' },
          { time: '09:30', activity: 'Đến Vịnh Lăng Cô – tắm biển, check-in cát trắng nước trong xanh' },
          { time: '12:00', activity: 'Ăn trưa với hải sản tươi sống tại nhà hàng ven biển' },
          { time: '14:00', activity: 'Khởi hành chinh phục Đèo Hải Vân – "Thiên hạ đệ nhất hùng quan" dài 21km' },
          { time: '15:30', activity: 'Tham quan Hải Vân Quan – cửa ải xưa được xây từ thời nhà Trần' },
          { time: '17:00', activity: 'Quay về resort/khách sạn Lăng Cô, nhận phòng nghỉ ngơi' },
          { time: '19:00', activity: 'Ăn tối, thưởng thức không khí biển đêm' }
        ]
      },
      {
        title: 'Ngày 2: Rừng Ngập Mặn Rú Chá',
        items: [
          { time: '07:00', activity: 'Ăn sáng tại khách sạn, trả phòng' },
          { time: '08:30', activity: 'Khởi hành về Huế, đi tham quan Rừng ngập mặn Rú Chá ở làng Thuận Hòa' },
          { time: '10:00', activity: 'Khám phá khu rừng ngập mặn nguyên sinh 5ha – di sản đầm phá Tam Giang' },
          { time: '11:30', activity: 'Thưởng thức hải sản đầm phá tại làng' },
          { time: '14:00', activity: 'Tham quan cầu gỗ giữa rừng chá – góc check-in nổi tiếng' },
          { time: '16:00', activity: 'Khởi hành về Huế, kết thúc tour' }
        ]
      }
    ]
  },
  6: {
    days: [
      {
        title: 'Ngày 1: Hành Hương 6 Ngôi Chùa Linh Thiêng',
        items: [
          { time: '06:30', activity: 'Đón khách tại khách sạn, khởi hành lên Thiền viện Trúc Lâm Bạch Mã' },
          { time: '08:00', activity: 'Tham quan Thiền viện Trúc Lâm Bạch Mã – vượt 172 bậc lên chính điện' },
          { time: '10:00', activity: 'Viếng Chùa Từ Đàm – ngôi chùa cổ kính (~năm 1695) gắn lịch sử Phật giáo Huế' },
          { time: '11:00', activity: 'Khám phá Chùa Huyền Không Sơn Thượng – "cõi Phật chốn trần gian" hệ phái Nam Tông' },
          { time: '12:30', activity: 'Dùng cơm chay tại chùa hoặc nhà hàng' },
          { time: '14:00', activity: 'Viếng Chùa Báo Quốc trên đồi Hàm Long – giếng nước linh thiêng' },
          { time: '15:30', activity: 'Tham quan Chùa Diệu Đế – một trong ba Quốc tự còn tồn tại tại Huế' },
          { time: '16:30', activity: 'Khám phá Chùa Từ Hiếu – ngôi chùa thơ mộng giữa rừng thông đồi Thủy Xuân' },
          { time: '18:00', activity: 'Đưa khách về điểm hẹn, kết thúc tour' }
        ]
      }
    ]
  },
  8: {
    days: [
      {
        title: 'Ngày 1: Hoàng Hôn Phá Tam Giang',
        items: [
          { time: '13:00', activity: 'Đón khách tại khách sạn, khởi hành ra Phá Tam Giang – hệ đầm phá lớn nhất Việt Nam' },
          { time: '14:30', activity: 'Đi thuyền tham quan đầm phá 52km² (3 sông Hương, Ô Lâu, Bồ hội tụ)' },
          { time: '16:00', activity: 'Thăm làng chài cổ Thái Dương Hạ – khám phá đời sống ngư dân bình dị' },
          { time: '17:30', activity: 'Săn hoàng hôn trên Phá Tam Giang – cảnh đẹp lừng danh "đệ nhất đầm phá"' },
          { time: '19:00', activity: 'Ăn tối với hải sản tươi: lẩu cá dìa, hàu nướng mỡ hành, tôm ghẹ tươi' },
          { time: '21:00', activity: 'Nhận phòng homestay ven phá, nghỉ ngơi' }
        ]
      },
      {
        title: 'Ngày 2: Bình Minh & Rừng Ngập Mặn',
        items: [
          { time: '05:30', activity: 'Dậy sớm săn bình minh trên Phá Tam Giang' },
          { time: '07:00', activity: 'Ăn sáng với Bánh khoái cá kình – đặc sản đầm phá' },
          { time: '09:00', activity: 'Tham quan Rừng ngập mặn Rú Chá – check-in rặng chá cổ thụ' },
          { time: '11:00', activity: 'Trải nghiệm chèo thuyền nhỏ quanh đầm phá' },
          { time: '12:30', activity: 'Ăn trưa với hải sản đặc sản đầm phá' },
          { time: '14:30', activity: 'Mua đặc sản đầm phá làm quà' },
          { time: '16:00', activity: 'Khởi hành về Huế, kết thúc tour' }
        ]
      }
    ]
  },
  9: {
    days: [
      {
        title: 'Ngày 1: Trekking Vườn Quốc Gia Bạch Mã',
        items: [
          { time: '07:30', activity: 'Đón khách tại khách sạn, khởi hành đi Vườn Quốc Gia Bạch Mã' },
          { time: '09:00', activity: 'Tham quan Nhà trưng bày VQG Bạch Mã – hình ảnh động thực vật vùng rừng' },
          { time: '09:30', activity: 'Chinh phục đỉnh Bạch Mã, lên Vọng Hải Đài, vượt đoạn rừng sạt lở' },
          { time: '10:15', activity: 'Khám phá Ngũ Hồ – Thác Đỗ Quyên: tắm suối, picnic, trekking 300m' },
          { time: '14:00', activity: 'Lên Hải Vọng Đài 1450m – ngắm Đầm Cầu Hai, Đèo Hải Vân, Lăng Cô' },
          { time: '15:00', activity: 'Xuống núi, quay về Huế. Kết thúc tour khoảng 17:00' }
        ]
      }
    ]
  },
  11: {
    days: [
      {
        title: 'Ngày 1: Tour Ghép Huế 1 Ngày',
        items: [
          { time: '07:00', activity: 'Đón khách tại khách sạn, đưa đoàn đến Ga Đà Nẵng' },
          { time: '07:50', activity: 'Khởi hành tàu HD2 từ Ga Đà Nẵng đến Lăng Cô qua đèo Hải Vân' },
          { time: '09:05', activity: 'Tham quan Vịnh Lăng Cô, làng nghề Ngọc Trai, tinh dầu tràm' },
          { time: '10:30', activity: 'Tham quan Lăng Vua Khải Định – kiến trúc độc đáo' },
          { time: '12:00', activity: 'Dùng bữa trưa tại nhà hàng' },
          { time: '13:00', activity: 'Tham quan Đại Nội – Ngọ Môn, Lầu Ngũ Phụng, Thế Miếu, Hiển Lâm Các' },
          { time: '15:00', activity: 'Viếng Chùa Thiên Mụ – ngôi chùa cổ nổi tiếng' },
          { time: '16:00', activity: 'Mua sắm đặc sản Huế làm quà' },
          { time: '16:30', activity: 'Khởi hành về Đà Nẵng, kết thúc tour khoảng 18:00' }
        ]
      }
    ]
  },
  12: {
    days: [
      {
        title: 'Ngày 1: Đạp Xe Khám Phá Làng Huế',
        items: [
          { time: '07:30', activity: 'Đón khách tại khách sạn, nhận xe đạp và thiết bị bảo hộ' },
          { time: '08:00', activity: 'Khởi hành đến Vườn Kim Long – làng vườn cổ ~400 năm tuổi' },
          { time: '09:30', activity: 'Tham quan nhà vườn truyền thống, thưởng thức trà Huế giữa không gian xanh' },
          { time: '10:30', activity: 'Đạp xe đến Làng Thủy Biều – thưởng thức thanh trà đặc sản' },
          { time: '12:00', activity: 'Ăn trưa với món Huế đặc trưng tại nhà vườn' },
          { time: '13:30', activity: 'Tham quan đấu trường Hổ Quyền & Voi Ré – di tích lịch sử thời vua chúa Nguyễn' },
          { time: '15:00', activity: 'Tiếp tục đạp xe đến Cầu Ngói Thanh Toàn – cây cầu cổ ~240 năm tuổi' },
          { time: '16:30', activity: 'Trải nghiệm chợ quê và đời sống làng Thanh Toàn' },
          { time: '17:30', activity: 'Đạp xe về điểm xuất phát, kết thúc tour' }
        ]
      }
    ]
  }
};

// ═══════════════════════ EMAIL HELPERS ═══════════════════════

const formatPrice = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

const formatDate = (date) => {
  const d = new Date(date);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
};

// Build HTML lịch trình bằng <table> (chuẩn email - Gmail/Outlook đều hiển thị tốt)
function buildItineraryHtml(tourId) {
  const itinerary = TOUR_ITINERARIES[tourId];
  if (!itinerary || !itinerary.days || itinerary.days.length === 0) return '';

  let html = `
    <h3 style="color:#2b2823;font-size:18px;margin:28px 0 16px;padding-bottom:6px;border-bottom:2px solid #c9a84c;display:inline-block;font-family:'Playfair Display',Georgia,serif;">
      📅 Lịch Trình Chi Tiết
    </h3>`;

  for (const day of itinerary.days) {
    html += `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0;margin-bottom:14px;border-radius:6px;overflow:hidden;border:1px solid rgba(0,0,0,0.08);">
      <tr>
        <td style="background:#b8943f;color:#ffffff;padding:11px 16px;font-family:'Playfair Display',Georgia,serif;font-weight:700;font-size:14px;letter-spacing:0.02em;">
          ${day.title}
        </td>
      </tr>
      <tr>
        <td style="background:#ffffff;padding:6px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">`;

    day.items.forEach((item, idx) => {
      const isLast = idx === day.items.length - 1;
      const borderStyle = isLast ? '' : 'border-bottom:1px dashed rgba(0,0,0,0.08);';
      html += `
            <tr>
              <td style="padding:9px 10px 9px 16px;width:60px;color:#b8943f;font-weight:700;font-size:13px;vertical-align:top;white-space:nowrap;${borderStyle}">
                ${item.time}
              </td>
              <td style="padding:9px 16px 9px 0;color:#2b2823;font-size:13px;line-height:1.55;${borderStyle}">
                ${item.activity}
              </td>
            </tr>`;
    });

    html += `
          </table>
        </td>
      </tr>
    </table>`;
  }

  return html;
}

function buildEmailHtml({ bookingId, customerName, tourId, tourTitle, departureDate, numAdults, numChildren, totalPrice }) {
  const peopleStr = `${numAdults} người lớn${numChildren ? `, ${numChildren} trẻ em` : ''}`;
  const itineraryHtml = buildItineraryHtml(tourId);

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f6f0e7;">
  <div style="max-width:640px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 20px rgba(140,110,70,0.12);">
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

      ${itineraryHtml}

      <p style="color:#5d564c;font-size:14px;line-height:1.7;margin:24px 0 14px;">
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Vui lòng đăng nhập trước khi đặt tour' });
    }

    const account = await pool.query(
      'SELECT id FROM customer_accounts WHERE token = $1 AND token_exp > NOW()',
      [token]
    );
    if (account.rows.length === 0) {
      return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại' });
    }

    const {
      full_name, phone, email,
      tour_id, departure_date,
      num_adults, num_children, note
    } = req.body;

    // Validate bắt buộc
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

    // Lấy giá + tên tour
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

    // ═══ GỬI EMAIL XÁC NHẬN (kèm lịch trình chi tiết) ═══
    try {
      await sendBookingEmail({
        email,
        bookingId,
        customerName: full_name,
        tourId: tour_id,          // ← để lấy lịch trình
        tourTitle: tour.title,
        departureDate: departure_date,
        numAdults: num_adults,
        numChildren: num_children || 0,
        totalPrice: total,
      });
    } catch (emailErr) {
      console.error('[Email error]', emailErr.message);
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
