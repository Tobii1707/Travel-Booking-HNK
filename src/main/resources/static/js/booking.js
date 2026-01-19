'use strict';

(function () {
  // Guard để lỡ nhúng nhầm JS thì không ảnh hưởng trang khác
  if (!document.body || !document.body.classList.contains('hust-booking-page')) return;

  document.addEventListener('DOMContentLoaded', function () {
    initUserMenu();         // Giữ nguyên
    initErrorModal();       // Giữ nguyên
    prefillDestination();   // Giữ nguyên
    initBookingForm();      // <--- Đã sửa logic bỏ ngày, thêm điểm xuất phát
  });

  // ===== USER MENU (GIỮ NGUYÊN KHÔNG ĐỔI) =====
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

  // ===== ERROR MODAL (GIỮ NGUYÊN KHÔNG ĐỔI) =====
  let modalEl, errorMessageEl, closeXEl, closeBtnEl;

  function initErrorModal() {
    modalEl = document.getElementById('error-modal');
    errorMessageEl = document.getElementById('error-message');
    closeXEl = document.querySelector('#error-modal .close');
    closeBtnEl = document.querySelector('#error-modal .modal-button');

    if (!modalEl) return;

    if (closeXEl) closeXEl.addEventListener('click', closeErrorModal);
    if (closeBtnEl) closeBtnEl.addEventListener('click', closeErrorModal);

    // Click ngoài modal-content để đóng
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

  // ===== PREFILL DESTINATION (GIỮ NGUYÊN KHÔNG ĐỔI) =====
  function prefillDestination() {
    const input = document.getElementById('palaceName');
    if (!input) return;

    let destination = '';

    // 1) ưu tiên lấy từ query
    try {
      const params = new URLSearchParams(window.location.search);
      destination = (params.get('destination') || '').trim();
    } catch (_) {}

    // 2) fallback lấy từ localStorage
    if (!destination) {
      try {
        destination = (localStorage.getItem('prefillDestination') || '').trim();
      } catch (_) {}
    }

    if (destination) {
      input.value = destination;
      try { localStorage.removeItem('prefillDestination'); } catch (_) {}
      input.focus();
    }
  }

  // ===== BOOKING FORM (ĐÃ SỬA: BỎ NGÀY THÁNG, THÊM CURRENT LOCATION) =====
  function initBookingForm() {
    const form = document.getElementById('booking-form');
    if (!form) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      // 1. Lấy dữ liệu từ các ô input
      // MỚI: Thêm lấy điểm xuất phát
      const currentLocation = document.getElementById('currentLocation')?.value || '';
      const palaceName = document.getElementById('palaceName')?.value || '';
      const numberOfPeople = document.getElementById('numberOfPeople')?.value || '';

      // ĐÃ XÓA: checkinTime và checkoutTime ở đây theo yêu cầu của bạn

      // Validate cơ bản
      if(!currentLocation || !palaceName) {
        showErrorModal("Vui lòng nhập điểm xuất phát và điểm đến!");
        return;
      }

      const userId = localStorage.getItem('userId') || 1;

      // 2. Tạo object gửi lên Server (Bỏ checkInDate, checkOutDate)
      const orderData = {
        currentLocation: currentLocation, // Thêm trường này cho khớp backend
        destination: palaceName,
        numberOfPeople: parseInt(numberOfPeople, 10)
        // ĐÃ XÓA: checkInDate, checkOutDate
      };

      // 3. Gọi API
      fetch(`/order/create/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })
          .then(response => response.json())
          .then(result => {
            if (result.code === 1000) {
              // Thành công -> Chuyển hướng
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