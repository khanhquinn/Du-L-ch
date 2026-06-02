const fs = require('fs');
let html = fs.readFileSync('booking.html', 'utf8');

const itineraries = {
  1: `,
        itinerary: [
          {
            day: 'Ngày 1: Quần thể di tích Cố đô Huế',
            activities: [
              { time: '08:00', desc: 'Đón khách, khởi hành tham quan Đại Nội, Ngọ Môn, điện Thái Hòa.' },
              { time: '12:00', desc: 'Ăn trưa tại nhà hàng địa phương và nghỉ ngơi.' },
              { time: '14:00', desc: 'Tìm hiểu Châu bản triều Nguyễn và Thơ văn trên kiến trúc cung đình Huế.' },
              { time: '18:00', desc: 'Ăn tối, sau đó thưởng thức Nhã nhạc cung đình Huế trên thuyền rồng.' }
            ]
          },
          {
            day: 'Ngày 2: Khám phá văn hóa & lịch sử',
            activities: [
              { time: '08:00', desc: 'Điểm tâm. Khởi hành tham quan khu trưng bày Mộc bản triều Nguyễn.' },
              { time: '12:00', desc: 'Dùng bữa trưa và nghỉ ngơi.' },
              { time: '14:00', desc: 'Trải nghiệm không gian văn hóa tín ngưỡng thờ Mẫu và tham gia nghệ thuật Bài Chòi.' },
              { time: '18:00', desc: 'Ăn tối tự do, dạo quanh phố đi bộ và khám phá Cố Đô về đêm.' }
            ]
          },
          {
            day: 'Ngày 3: Tự do & Mua sắm',
            activities: [
              { time: '08:00', desc: 'Điểm tâm sáng. Tự do tham quan và mua sắm đặc sản, quà lưu niệm.' },
              { time: '11:30', desc: 'Làm thủ tục trả phòng khách sạn, kết thúc chương trình.' }
            ]
          }
        ]`,
  3: `,
        itinerary: [
          {
            day: 'Ngày 1: Hành trình khám phá ẩm thực',
            activities: [
              { time: '08:00', desc: 'Thưởng thức bữa sáng với Bún bò Huế trứ danh.' },
              { time: '09:30', desc: 'Tham quan chợ Đông Ba, tìm hiểu và thử các loại bánh truyền thống (bánh bèo, nậm, lọc, ram ít).' },
              { time: '12:00', desc: 'Ăn trưa với món Bánh khoái, Nem lụi, Vả trộn.' },
              { time: '15:00', desc: 'Khám phá các món ăn vặt, thưởng thức chè Huế thanh mát, kẹo cau.' },
              { time: '18:00', desc: 'Ăn tối với đặc sản Cơm hến, Bún hến hoặc Bánh canh Nam Phổ. Tự do khám phá phố đêm.' }
            ]
          },
          {
            day: 'Ngày 2: Mua sắm đặc sản',
            activities: [
              { time: '08:00', desc: 'Điểm tâm nhẹ, thưởng thức cà phê muối.' },
              { time: '09:00', desc: 'Mua sắm đặc sản làm quà (mè xửng, mắm tôm chua, trà cung đình, hạt sen).' },
              { time: '11:00', desc: 'Kết thúc tour.' }
            ]
          }
        ]`,
  4: `,
        itinerary: [
          {
            day: 'Ngày 1: Lăng Gia Long, Minh Mạng, Thiệu Trị, Tự Đức',
            activities: [
              { time: '08:00', desc: 'Đón khách, khởi hành tham quan Lăng Gia Long hùng vĩ và hoang sơ.' },
              { time: '10:00', desc: 'Tham quan Lăng Minh Mạng với kiến trúc chuẩn mực cung đình.' },
              { time: '12:00', desc: 'Dùng bữa trưa và nghỉ ngơi.' },
              { time: '14:00', desc: 'Tham quan Lăng Thiệu Trị giản dị và hài hòa.' },
              { time: '15:30', desc: 'Di chuyển tham quan Lăng Tự Đức thơ mộng, hữu tình.' },
              { time: '18:00', desc: 'Ăn tối, tự do khám phá thành phố Huế về đêm.' }
            ]
          },
          {
            day: 'Ngày 2: Lăng Dục Đức, Đồng Khánh, Khải Định',
            activities: [
              { time: '08:00', desc: 'Điểm tâm. Viếng thăm Lăng Dục Đức.' },
              { time: '09:30', desc: 'Khám phá Lăng Đồng Khánh với kiến trúc giao thoa văn hóa.' },
              { time: '11:00', desc: 'Chiêm ngưỡng Lăng Khải Định lộng lẫy và vô cùng độc đáo.' },
              { time: '12:30', desc: 'Dùng bữa trưa và kết thúc hành trình.' }
            ]
          }
        ]`,
  5: `,
        itinerary: [
          {
            day: 'Ngày 1: Rừng ngập mặn Rú Chá & Vịnh Lăng Cô',
            activities: [
              { time: '08:30', desc: 'Đón khách, khởi hành đi rừng ngập mặn Rú Chá, check-in không gian hoang sơ.' },
              { time: '11:30', desc: 'Di chuyển về Vịnh Lăng Cô, nhận phòng và ăn trưa hải sản tươi sống.' },
              { time: '15:00', desc: 'Tự do tắm biển, dạo chơi trên bãi cát trắng.' },
              { time: '18:00', desc: 'Ăn tối, nghỉ ngơi tại Lăng Cô.' }
            ]
          },
          {
            day: 'Ngày 2: Đèo Hải Vân hùng vĩ',
            activities: [
              { time: '08:00', desc: 'Điểm tâm. Hành trình chinh phục Đèo Hải Vân, dừng chân tại Hải Vân Quan.' },
              { time: '10:30', desc: 'Ngắm nhìn toàn cảnh biển núi ngoạn mục từ đỉnh đèo.' },
              { time: '12:00', desc: 'Quay về Lăng Cô dùng bữa trưa.' },
              { time: '14:00', desc: 'Khởi hành về lại trung tâm Huế. Kết thúc tour.' }
            ]
          }
        ]`,
  6: `,
        itinerary: [
          {
            day: 'Lịch trình 1 ngày',
            activities: [
              { time: '07:30', desc: 'Đón khách, khởi hành tham quan Thiền viện Trúc Lâm Bạch Mã.' },
              { time: '09:30', desc: 'Viếng thăm Chùa Huyền Không Sơn Thượng thanh tịnh, uy nghiêm.' },
              { time: '11:00', desc: 'Tham quan Chùa Từ Hiếu, ngôi chùa cổ kính khuất trong rừng thông.' },
              { time: '12:30', desc: 'Ăn trưa chay và nghỉ ngơi.' },
              { time: '14:00', desc: 'Tham quan Chùa Báo Quốc trên đồi Hàm Long.' },
              { time: '15:30', desc: 'Viếng Chùa Từ Đàm, cái nôi của Phật giáo Huế.' },
              { time: '16:30', desc: 'Tham quan Quốc tự Chùa Diệu Đế.' },
              { time: '17:30', desc: 'Xe đưa đoàn về lại điểm đón. Kết thúc tour.' }
            ]
          }
        ]`,
  8: `,
        itinerary: [
          {
            day: 'Ngày 1: Rú Chá & Săn Hoàng Hôn Phá Tam Giang',
            activities: [
              { time: '14:00', desc: 'Đón khách, khởi hành đến rừng ngập mặn Rú Chá.' },
              { time: '15:30', desc: 'Lên thuyền tham quan hệ Đầm phá Tam Giang.' },
              { time: '17:00', desc: 'Săn hoàng hôn rực rỡ trên đầm phá, tham gia trải nghiệm đổ nò, bắt cá.' },
              { time: '18:30', desc: 'Thưởng thức bữa tối hải sản tươi sống và bánh khoái cá kình. Nghỉ đêm tại homestay.' }
            ]
          },
          {
            day: 'Ngày 2: Đón Bình Minh & Làng chài',
            activities: [
              { time: '05:30', desc: 'Đón bình minh trên phá Tam Giang, tận hưởng không khí trong lành.' },
              { time: '07:30', desc: 'Ăn sáng, thăm làng chài cổ Thái Dương Hạ.' },
              { time: '10:00', desc: 'Trải nghiệm mua sắm hải sản tươi ngon.' },
              { time: '11:30', desc: 'Lên xe trở về Huế. Kết thúc chương trình.' }
            ]
          }
        ]`,
  9: `,
        itinerary: [
          {
            day: 'Lịch trình 1 ngày',
            activities: [
              { time: '07:30', desc: 'Xe và hướng dẫn viên đón quý khách tại điểm hẹn hoặc khách sạn, khởi hành đi VQG Bạch Mã.' },
              { time: '09:00', desc: 'Đến chân núi, tham quan nhà trưng bày VQG Bạch Mã.' },
              { time: '09:30', desc: 'Bắt đầu hành trình lên Vọng Hải Đài, ngắm toàn cảnh sông núi.' },
              { time: '09:45', desc: 'Di chuyển đến điểm trekking Ngũ Hồ bằng xe máy trung chuyển.' },
              { time: '10:15', desc: 'Bắt đầu trekking Ngũ Hồ, tắm suối, ăn trưa picnic và khám phá Thác Đỗ Quyên.' },
              { time: '14:00', desc: 'Chinh phục Hải Vọng Đài 1450m.' },
              { time: '15:00', desc: 'Xuống núi theo đường cũ, trở lại TP Huế. Kết thúc chương trình khoảng 17h00.' }
            ]
          }
        ]`,
  11: `,
        itinerary: [
          {
            day: 'Lịch trình 1 ngày',
            activities: [
              { time: '07:00', desc: 'Xe và HDV đón khách tại khách sạn (Đà Nẵng), đưa đến Ga Đà Nẵng check-in.' },
              { time: '07:50', desc: 'Di chuyển bằng tàu HD2, ngắm cảnh đèo Hải Vân.' },
              { time: '09:05', desc: 'Đến ga Lăng Cô, tham quan Vịnh Lăng Cô, khu chế tác Ngọc Trai, làng nghề tinh dầu tràm.' },
              { time: '10:30', desc: 'Tham quan Lăng Vua Khải Định kiến trúc tinh xảo.' },
              { time: '12:00', desc: 'Dùng bữa trưa tại nhà hàng và nghỉ ngơi.' },
              { time: '13:00', desc: 'Bách bộ tham quan Đại Nội (Ngọ Môn, Thế Miếu, Hiển Lâm Các...).' },
              { time: '15:00', desc: 'Viếng chùa Thiên Mụ nổi tiếng.' },
              { time: '16:00', desc: 'Thưởng thức và mua sắm đặc sản Huế.' },
              { time: '16:30', desc: 'Lên xe trở về Đà Nẵng. Khoảng 18h00 kết thúc chương trình.' }
            ]
          }
        ]`,
  12: `,
        itinerary: [
          {
            day: 'Lịch trình 1 ngày',
            activities: [
              { time: '07:30', desc: 'Đón khách, nhận xe đạp và bắt đầu hành trình.' },
              { time: '08:00', desc: 'Đạp xe tham quan Vườn Kim Long, tận hưởng không gian xanh mát.' },
              { time: '10:00', desc: 'Di chuyển đến Làng Thủy Biều, khám phá đời sống và các vườn thanh trà.' },
              { time: '11:00', desc: 'Tham quan đấu trường Hổ Quyền và Voi Ré.' },
              { time: '12:30', desc: 'Ăn trưa với đặc sản địa phương tại Thủy Biều.' },
              { time: '14:00', desc: 'Đạp xe đến Cầu ngói Thanh Toàn, chiêm ngưỡng cây cầu cổ kính.' },
              { time: '16:00', desc: 'Khởi hành về trung tâm, trả xe và kết thúc tour.' }
            ]
          }
        ]`
};

for (const id in itineraries) {
    const regex = new RegExp(\`(\${id}:\\\\s*\\\\{[\\\\s\\\\S]*?sections:\\\\s*\\\\[[\\\\s\\\\S]*?\\\\])(\\\\s*\\\\})\`);
    html = html.replace(regex, (match, p1, p2) => p1 + itineraries[id] + p2);
}

const renderTourOriginal = \`    function renderTourDescription(tourId) {
      const section = document.getElementById('tourDescriptionSection');
      const desc = TOUR_DESCRIPTIONS[tourId];

      if (!desc) {
        section.style.display = 'none';
        return;
      }

      let html = \\\`
      <span class="tour-desc-label">\\\${desc.label || 'Giới Thiệu'}</span>
      <h2 class="tour-desc-title">\\\${desc.title}</h2>
    \\\`;

      if (desc.intro) {
        html += \\\`<p class="tour-desc-intro">\\\${desc.intro}</p>\\\`;
      }

      desc.sections.forEach(s => {
        html += \\\`
        <div class="desc-section">
          <h3>\\\${s.heading}</h3>
          <p>\\\${s.body}</p>
          \\\${s.highlight ? \\\`<p class="desc-highlight">📍 <strong>Điểm nhấn:</strong> \\\${s.highlight}</p>\\\` : ''}
        </div>
      \\\`;
      });

      html += COMMON_TOUR_NOTES;
      section.innerHTML = html;
      section.style.display = 'block';
    }\`;

const renderTourReplacement = \`    function renderTourDescription(tourId) {
      const section = document.getElementById('tourDescriptionSection');
      const desc = TOUR_DESCRIPTIONS[tourId];

      if (!desc) {
        section.style.display = 'none';
        return;
      }

      let html = \\\`
      <span class="tour-desc-label">\\\${desc.label || 'Giới Thiệu'}</span>
      <h2 class="tour-desc-title">\\\${desc.title}</h2>
    \\\`;

      if (desc.intro) {
        html += \\\`<p class="tour-desc-intro">\\\${desc.intro}</p>\\\`;
      }

      desc.sections.forEach(s => {
        html += \\\`
        <div class="desc-section">
          <h3>\\\${s.heading}</h3>
          <p>\\\${s.body}</p>
          \\\${s.highlight ? \\\`<p class="desc-highlight">📍 <strong>Điểm nhấn:</strong> \\\${s.highlight}</p>\\\` : ''}
        </div>
      \\\`;
      });

      if (desc.itinerary) {
        html += \\\`<div class="desc-section tour-itinerary">
          <h3 style="margin-bottom: 1.5rem; color: var(--gold-light);">Lịch Trình Chi Tiết</h3>\\\`;
        desc.itinerary.forEach(day => {
          html += \\\`<div class="itinerary-day" style="margin-bottom: 1.5rem;">
            <h4 style="color: #000; font-family: var(--font-display); font-size: 1.1rem; margin-bottom: 0.8rem; padding-bottom: 0.5rem; border-bottom: 1px dashed rgba(0,0,0,0.1);">\\\${day.day}</h4>
            <ul style="list-style-type: none; padding-left: 0; margin: 0;">\\\`;
          day.activities.forEach(act => {
            html += \\\`<li style="margin-bottom: 0.8rem; display: flex; align-items: flex-start; gap: 10px;">
              <strong style="color: var(--gold); min-width: 50px;">\\\${act.time}</strong> 
              <span style="color: #333; line-height: 1.5;">\\\${act.desc}</span>
            </li>\\\`;
          });
          html += \\\`</ul></div>\\\`;
        });
        html += \\\`</div>\\\`;
      }

      html += COMMON_TOUR_NOTES;
      section.innerHTML = html;
      section.style.display = 'block';
    }\`;

html = html.replace(renderTourOriginal, renderTourReplacement);

fs.writeFileSync('booking.html', html, 'utf8');
console.log('Update complete. Itineraries added.');
