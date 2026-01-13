document.addEventListener('DOMContentLoaded', () => {
  // ===== USER MENU =====
  const userIcon = document.getElementById('user-icon');
  const menu = document.getElementById('user-menu');

  if (userIcon && menu) {
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

  // ===== TRENDING -> BOOKING (AUTOFILL DESTINATION) =====
  const grid = document.querySelector('.hust-trending-page .grid-container');
  if (!grid) return;

  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;

    const destination = (card.dataset.destination || '').trim();
    if (!destination) return;

    // chặn click default (ví dụ click vào <a>)
    e.preventDefault();

    // backup để booking dùng nếu không đọc query
    localStorage.setItem('bookingDestination', destination);

    // chuyển sang booking kèm query
    window.location.href = `booking?destination=${encodeURIComponent(destination)}`;
  });
});
