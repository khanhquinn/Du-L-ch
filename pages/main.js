// ===== NAVBAR SCROLL =====
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// ===== MOBILE MENU =====
const navToggle = document.getElementById('navToggle');
const navLinks  = document.querySelector('.nav-links');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.style.display === 'flex';
    Object.assign(navLinks.style, {
      display:        isOpen ? 'none' : 'flex',
      flexDirection:  'column',
      position:       'absolute',
      top:            '70px',
      right:          '1.5rem',
      background:     'rgba(10,10,10,0.97)',
      padding:        '1rem 2rem',
      borderRadius:   '4px',
      border:         '1px solid rgba(201,168,76,0.2)',
      gap:            '1rem'
    });
  });
}

// ===== FILTER TOURS =====
const filterBtns = document.querySelectorAll('.filter-btn');
const tourCards  = document.querySelectorAll('.tour-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Active button
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const cat = btn.dataset.cat;
    tourCards.forEach(card => {
      if (cat === 'all' || card.dataset.cat === cat) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  });
});

// ===== SCROLL FADE IN =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.tour-card, .feature-item, .dest-card').forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = `opacity 0.5s ${(i % 5) * 0.1}s ease, transform 0.5s ${(i % 5) * 0.1}s ease`;
  observer.observe(el);
});
