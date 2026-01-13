'use strict';

(function () {
  // Guard để lỡ nhúng nhầm JS thì không ảnh hưởng trang khác
  if (!document.body || !document.body.classList.contains('hust-booking-page')) return;

  document.addEventListener('DOMContentLoaded', function () {
    initUserMenu();
    initErrorModal();
    prefillDestination();     // <-- NEW
    initBookingForm();
  });

  // ===== USER MENU =====
  function initUserMenu() {
    const userIcon = document.getElementById('user-icon');
    const menu = document.getElementById('user-menu');
    if (!userIcon || !menu) return;

    userIcon.addEventListener('click', function (event) {
      event.preventDefault();
      menu.style.display = (menu.style.display === 'flex') ? 'none' : 'flex';
    });

    document.addEventListener('click', function (event) {
      if (!userIcon.contains(event.target) && !menu.contains(event.target)) {
        menu.style.display = 'none';
      }
    });
  }

  // ===== ERROR MODAL =====
  let modalEl, errorMessageEl, closeXEl, closeBtnEl;

  function initErrorModal() {
    modalEl = document.getElementById('error-modal');
    errorMessageEl = document.getElementById('error-message');
    closeXEl = document.querySelector('#error-modal .close');
    closeBtnEl = document.querySelector('#error-modal .modal-button');

    if (!modalEl) return;

    if (closeXEl) closeXEl.addEventListener('click', closeErrorModal);
    if (closeBtnEl) closeBtnEl.addEventListener('click', closeErrorModal);

    // Click ngoài modal-content để đóng (không ghi đè window.onclick)
    modalEl.addEventListener('click', function (e) {
      if (e.target === modalEl) closeErrorModal();
    });
  }

  function showErrorModal(message) {
    if (!modalEl || !errorMessageEl) return;
    errorMessageEl.innerText = message || 'Something went wrong!';
    modalEl.style.display = 'flex';
  }

  function closeErrorModal() {
    if (!modalEl) return;
    modalEl.style.display = 'none';
  }

  // ===== PREFILL DESTINATION (NEW) =====
  function prefillDestination() {
    const input = document.getElementById('palaceName');
    if (!input) return;

    let destination = '';

    // 1) ưu tiên lấy từ query: booking?destination=Tokyo
    try {
      const params = new URLSearchParams(window.location.search);
      destination = (params.get('destination') || '').trim();
    } catch (_) {}

    // 2) fallback lấy từ localStorage (gallery.js set trước khi redirect)
    if (!destination) {
      try {
        destination = (localStorage.getItem('prefillDestination') || '').trim();
      } catch (_) {}
    }

    if (destination) {
      input.value = destination;

      // clear để lần sau không bị fill bậy
      try { localStorage.removeItem('prefillDestination'); } catch (_) {}

      // optional: focus nhẹ cho UX
      input.focus();
    }
  }

  // ===== BOOKING FORM =====
  function initBookingForm() {
    const form = document.getElementById('booking-form');
    if (!form) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      const palaceName = document.getElementById('palaceName')?.value || '';
      const numberOfPeople = document.getElementById('numberOfPeople')?.value || '';
      const checkinTime = document.getElementById('checkinTime')?.value || '';
      const checkoutTime = document.getElementById('checkoutTime')?.value || '';

      const userId = localStorage.getItem('userId') || 1;

      const orderData = {
        destination: palaceName,
        numberOfPeople: parseInt(numberOfPeople, 10),
        checkInDate: checkinTime,
        checkOutDate: checkoutTime
      };

      fetch(`/order/create/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })
        .then(response => response.json())
        .then(result => {
          if (result.code === 1000) {
            window.location.href = `/hotel?orderId=${result.data.id}`;
          } else {
            showErrorModal(result.message || 'Booking failed!');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          showErrorModal('An error occurred while booking!');
        });
    });
  }
})();
