'use strict';

(function () {
  // Guard tránh ảnh hưởng trang khác
  if (!document.body || !document.body.classList.contains('hust-auth-page')) return;

  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('forgot-password-form');
    const successMessage = document.getElementById('success-message');
    const modal = document.getElementById('error-modal');
    const closeModalBtn = document.getElementById('close-modal-button');
    const emailInput = document.getElementById('forgot-email');
    const errorMessageEl = document.getElementById('error-message');

    if (!form || !successMessage || !modal || !closeModalBtn || !emailInput || !errorMessageEl) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const email = (emailInput.value || '').trim();

      try {
        const response = await fetch('/user/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        const result = await response.json();

        if (result.code === 1000) {
          form.classList.add('hidden');
          successMessage.classList.remove('hidden');
        } else {
          errorMessageEl.textContent = result.message || 'Request failed. Please try again.';
          modal.style.display = 'flex';
          modal.classList.remove('hidden');
        }
      } catch (error) {
        console.error('Error:', error);
        errorMessageEl.textContent = 'An error occurred. Please try again.';
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
      }
    });

    closeModalBtn.addEventListener('click', function () {
      modal.style.display = 'none';
    });

    // Không ghi đè window.onclick để tránh ảnh hưởng project tổng thể
    window.addEventListener('click', function (event) {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
})();
