'use strict';

(function () {
  // Guard: lỡ nhúng nhầm JS sang trang khác thì không ảnh hưởng
  if (!document.body || !document.body.classList.contains('hust-change-pass-page')) return;

  document.addEventListener('DOMContentLoaded', function () {
    initUserMenu();
    initChangePassword();
  });

  // ===== Toggle Menu =====
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

  // ===== Change Password =====
  function initChangePassword() {
    const updateBtn = document.getElementById('update-btn');
    if (!updateBtn) return;

    updateBtn.addEventListener('click', function () {
      const phone = document.getElementById('user-phone')?.value || '';
      const password = document.getElementById('user-password')?.value || '';
      const newPassword = document.getElementById('user-new-pass')?.value || '';
      const confirmPassword = document.getElementById('user-new-pass-confirm')?.value || '';

      if (!phone || !password || !newPassword || !confirmPassword) {
        alert('Please fill in all fields.');
        return;
      }

      if (newPassword !== confirmPassword) {
        alert('New passwords do not match.');
        return;
      }

      const changePassDto = {
        phone: phone,
        password: password,
        newPassword: newPassword,
        confirmPassword: confirmPassword
      };

      fetch('/user/changePassword', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changePassDto)
      })
        .then(res => res.json())
        .then(apiResponse => {
          if (apiResponse.code === 1000) {
            alert('Password changed successfully!');
            window.location.href = '/profile';
          } else {
            alert(`Failed: ${apiResponse.message}`);
          }
        })
        .catch(err => {
          console.error('Error:', err);
          alert('An error occurred. Please try again.');
        });
    });
  }
})();
