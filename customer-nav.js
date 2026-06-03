(function () {
  const token = localStorage.getItem('hue_customer_token') || '';
  const customerName = localStorage.getItem('hue_customer_name') || '';

  function addStyles() {
    if (document.getElementById('customerNavStyles')) return;
    const style = document.createElement('style');
    style.id = 'customerNavStyles';
    style.textContent = `
      .customer-menu { position: relative; }
      .customer-greeting {
        background: transparent; border: 1px solid rgba(184,148,63,.45); color: rgba(255,255,255,.92);
        padding: .48rem .9rem; border-radius: 4px; cursor: pointer; font: inherit;
        max-width: 190px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .navbar.scrolled .customer-greeting { color: rgba(43,40,35,.9); }
      .customer-dropdown {
        position: absolute; top: calc(100% + 10px); right: 0; min-width: 180px;
        background: #fff; border: 1px solid rgba(184,148,63,.25); border-radius: 6px;
        box-shadow: 0 14px 36px rgba(45,40,35,.16); padding: .45rem; display: none; z-index: 200;
      }
      .customer-menu.open .customer-dropdown { display: block; }
      .customer-dropdown button {
        width: 100%; background: transparent; border: 0; color: #2b2823; text-align: left;
        padding: .65rem .75rem; border-radius: 4px; cursor: pointer; font: inherit; font-size: .88rem;
      }
      .customer-dropdown button:hover { background: rgba(201,168,76,.12); }
      .customer-dropdown .logout { color: #e74c3c; }
      .customer-bookings-modal {
        position: fixed; inset: 0; background: rgba(20,16,12,.48); z-index: 500;
        display: none; align-items: center; justify-content: center; padding: 1rem;
      }
      .customer-bookings-modal.open { display: flex; }
      .customer-bookings-panel {
        width: min(720px, 100%); max-height: min(78vh, 720px); overflow: auto;
        background: #fff; border-radius: 8px; border: 1px solid rgba(184,148,63,.22);
        box-shadow: 0 24px 70px rgba(45,40,35,.24); color: #2b2823;
      }
      .customer-bookings-head {
        display: flex; align-items: center; justify-content: space-between; gap: 1rem;
        padding: 1.1rem 1.25rem; border-bottom: 1px solid rgba(45,40,35,.08);
      }
      .customer-bookings-head h3 { margin: 0; font-family: 'Playfair Display', serif; font-size: 1.3rem; }
      .customer-bookings-close { background: transparent; border: 0; font-size: 1.4rem; cursor: pointer; color: #94897b; }
      .customer-bookings-body { padding: 1rem 1.25rem 1.25rem; }
      .customer-booking-item {
        border: 1px solid rgba(45,40,35,.09); border-radius: 6px; padding: .9rem 1rem;
        margin-bottom: .75rem; background: #fffaf3;
      }
      .customer-booking-title { font-weight: 700; margin-bottom: .45rem; color: #2b2823; }
      .customer-booking-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .35rem 1rem; color: #5d564c; font-size: .88rem; }
      .customer-booking-empty, .customer-booking-loading { color: #94897b; text-align: center; padding: 1.5rem .5rem; }
      @media (max-width: 720px) {
        .customer-menu { width: 100%; }
        .customer-greeting { width: 100%; max-width: none; text-align: left; color: #fff; }
        .customer-dropdown { left: 0; right: auto; }
        .customer-booking-meta { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  function redirectToLogin(href) {
    window.location.href = 'login.html?redirect=' + encodeURIComponent(href || 'booking.html');
  }

  function protectBookingLinks() {
    document.querySelectorAll('a[href^="booking.html"]').forEach(link => {
      link.addEventListener('click', (event) => {
        if (localStorage.getItem('hue_customer_token')) return;
        event.preventDefault();
        redirectToLogin(link.getAttribute('href') || 'booking.html');
      });
    });
  }

  function formatPrice(value) {
    return Number(value || 0).toLocaleString('vi-VN') + 'đ';
  }

  function formatDate(value) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('vi-VN');
  }

  function ensureBookingsModal() {
    let modal = document.getElementById('customerBookingsModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'customerBookingsModal';
    modal.className = 'customer-bookings-modal';
    modal.innerHTML = `
      <div class="customer-bookings-panel" role="dialog" aria-modal="true" aria-labelledby="customerBookingsTitle">
        <div class="customer-bookings-head">
          <h3 id="customerBookingsTitle">Tour đã đặt</h3>
          <button type="button" class="customer-bookings-close" aria-label="Đóng">&times;</button>
        </div>
        <div class="customer-bookings-body" id="customerBookingsBody">
          <div class="customer-booking-loading">Đang tải...</div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.customer-bookings-close').addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (event) => {
      if (event.target === modal) modal.classList.remove('open');
    });

    return modal;
  }

  async function showCustomerBookings() {
    const modal = ensureBookingsModal();
    const body = document.getElementById('customerBookingsBody');
    modal.classList.add('open');
    body.innerHTML = '<div class="customer-booking-loading">Đang tải...</div>';

    try {
      const res = await fetch('/api/customer-bookings', {
        headers: { Authorization: 'Bearer ' + localStorage.getItem('hue_customer_token') }
      });
      const data = await res.json();

      if (res.status === 401) {
        logoutCustomer();
        return;
      }
      if (!res.ok) {
        body.innerHTML = `<div class="customer-booking-empty">${data.error || 'Không tải được danh sách tour'}</div>`;
        return;
      }
      if (!data.length) {
        body.innerHTML = '<div class="customer-booking-empty">Bạn chưa đặt tour nào.</div>';
        return;
      }

      body.innerHTML = data.map(item => `
        <div class="customer-booking-item">
          <div class="customer-booking-title">#${String(item.id).padStart(4, '0')} - ${item.tour_title || 'Tour'}</div>
          <div class="customer-booking-meta">
            <span>Ngày khởi hành: <strong>${formatDate(item.departure_date)}</strong></span>
            <span>Trạng thái: <strong>${item.status || 'Chờ xác nhận'}</strong></span>
            <span>Số khách: ${Number(item.num_adults || 0)} người lớn${Number(item.num_children || 0) ? ', ' + item.num_children + ' trẻ em' : ''}</span>
            <span>Tổng tiền: <strong>${formatPrice(item.total_price)}</strong></span>
          </div>
        </div>
      `).join('');
    } catch (error) {
      body.innerHTML = '<div class="customer-booking-empty">Lỗi kết nối server.</div>';
    }
  }

  function logoutCustomer() {
    localStorage.removeItem('hue_customer_token');
    localStorage.removeItem('hue_customer_name');
    localStorage.removeItem('hue_customer_email');
    window.location.href = 'index.html';
  }

  function renderCustomerMenu() {
    if (!token || !customerName) return;
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks || document.getElementById('customerMenu')) return;

    const item = document.createElement('li');
    item.className = 'customer-menu';
    item.id = 'customerMenu';
    item.innerHTML = `
      <button type="button" class="customer-greeting" id="customerGreeting">Xin chào ${customerName}</button>
      <div class="customer-dropdown" id="customerDropdown">
        <button type="button" id="customerBookedTours">Tour đã đặt</button>
        <button type="button" class="logout" id="customerLogout">Đăng xuất</button>
      </div>
    `;

    navLinks.appendChild(item);
    document.getElementById('customerGreeting').addEventListener('click', () => item.classList.toggle('open'));
    document.getElementById('customerBookedTours').addEventListener('click', () => {
      item.classList.remove('open');
      showCustomerBookings();
    });
    document.getElementById('customerLogout').addEventListener('click', logoutCustomer);

    document.addEventListener('click', (event) => {
      if (!item.contains(event.target)) item.classList.remove('open');
    });
  }

  addStyles();
  protectBookingLinks();
  renderCustomerMenu();
})();
