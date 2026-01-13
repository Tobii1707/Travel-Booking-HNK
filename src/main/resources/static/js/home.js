document.addEventListener('DOMContentLoaded', () => {
  // ===== Video slider =====
  const videoSlider = document.getElementById('video-slider');
  const controlButtons = document.querySelectorAll('.vid-btn');

  if (videoSlider && controlButtons.length) {
    controlButtons.forEach(button => {
      button.addEventListener('click', () => {
        controlButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const newSrc = button.getAttribute('data-src');
        if (!newSrc) return;

        videoSlider.src = newSrc;
        videoSlider.load();
        videoSlider.play();
      });
    });
  }

  // ===== User dropdown menu =====
  const userIcon = document.getElementById('user-icon');
  const menu = document.getElementById('user-menu');

  if (userIcon && menu) {
    userIcon.addEventListener('click', (event) => {
      event.preventDefault();
      menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
    });

    document.addEventListener('click', (event) => {
      if (!userIcon.contains(event.target) && !menu.contains(event.target)) {
        menu.style.display = 'none';
      }
    });
  }

  // ===== Booking navigation helpers =====
  function goToBooking(destination) {
    try {
      if (destination) localStorage.setItem('prefillDestination', destination);
    } catch (_) {}

    const url = destination
      ? `booking?destination=${encodeURIComponent(destination)}`
      : 'booking';

    window.location.href = url;
  }

  // ✅ Hero CTA -> booking (no prefill)
  const goBookingBtn = document.getElementById('go-booking-btn');
  if (goBookingBtn) {
    goBookingBtn.addEventListener('click', () => goToBooking());
  }

  // ✅ Top Trending cards -> booking + prefill
  document.querySelectorAll('.js-booking-card[data-destination]').forEach(card => {
    card.addEventListener('click', (e) => {
      // nếu click vào link thì vẫn chặn default để điều hướng theo goToBooking()
      e.preventDefault();
      const destination = card.getAttribute('data-destination');
      if (destination) goToBooking(destination);
    });
  });

  // ✅ Popular packages Book Now -> booking + prefill
  document.querySelectorAll('.js-package-book[data-destination]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const destination = btn.getAttribute('data-destination');
      if (destination) goToBooking(destination);
      else goToBooking();
    });
  });
});
