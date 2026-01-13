document.addEventListener('DOMContentLoaded', () => {
  initUserMenu();
  initBookNow();
});

function initUserMenu() {
  const userIcon = document.getElementById('user-icon');
  const menu = document.getElementById('user-menu');

  if (!userIcon || !menu) return;

  userIcon.addEventListener('click', (event) => {
    event.preventDefault();
    menu.style.display = (menu.style.display === 'flex') ? 'none' : 'flex';
  });

  document.addEventListener('click', (event) => {
    if (!userIcon.contains(event.target) && !menu.contains(event.target)) {
      menu.style.display = 'none';
    }
  });
}

function initBookNow() {
  const buttons = document.querySelectorAll('.js-book-now');
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      const destination = btn.getAttribute('data-destination') || '';
      if (!destination) {
        window.location.href = 'booking';
        return;
      }

      // ✅ hỗ trợ booking.js (prefillDestination())
      try {
        localStorage.setItem('prefillDestination', destination);
      } catch (_) {}

      // ✅ thêm query param để chắc chắn auto fill
      window.location.href = `booking?destination=${encodeURIComponent(destination)}`;
    });
  });
}
