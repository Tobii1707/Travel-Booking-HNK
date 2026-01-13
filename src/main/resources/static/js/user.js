document.addEventListener('DOMContentLoaded', () => {
  // Clear user session when visiting login page
  localStorage.removeItem('userId');

  // Elements
  const signInBtn = document.getElementById('sign-in-button');
  const signUpBtn = document.getElementById('sign-up-button');
  const signInBtn1 = document.getElementById('sign-in-button1');
  const signUpBtn1 = document.getElementById('sign-up-button1');

  const signInForm = document.getElementById('sign-in-form');
  const signUpForm = document.getElementById('sign-up-form');

  const modal = document.getElementById('error-modal');
  const errorMessageEl = document.getElementById('error-message');
  const closeModalBtn = document.getElementById('close-modal-button');
  const closeModalX = document.querySelector('.close-modal');

  // ===== Helpers =====
  function showSignUp() {
    if (!signInForm || !signUpForm) return;

    signInForm.classList.add('hidden');
    signInForm.classList.remove('animate-in');

    signUpForm.classList.remove('hidden');
    signUpForm.classList.add('animate-in');
  }

  function showSignIn() {
    if (!signInForm || !signUpForm) return;

    signUpForm.classList.add('hidden');
    signUpForm.classList.remove('animate-in');

    signInForm.classList.remove('hidden');
    signInForm.classList.add('animate-in');
  }

  function showErrorModal(message) {
    if (!modal || !errorMessageEl) return;
    errorMessageEl.innerText = message || 'Something went wrong.';
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }

  function closeModal() {
    if (!modal) return;
    modal.style.display = 'none';
    modal.classList.add('hidden');
  }

  // ===== Toggle events =====
  if (signUpBtn) signUpBtn.addEventListener('click', showSignUp);
  if (signInBtn) signInBtn.addEventListener('click', showSignIn);
  if (signInBtn1) signInBtn1.addEventListener('click', showSignIn);
  if (signUpBtn1) signUpBtn1.addEventListener('click', showSignUp);

  // ===== Modal close =====
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (closeModalX) closeModalX.addEventListener('click', closeModal);

  window.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  // ===== Login =====
  if (signInForm) {
    signInForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const phone = document.getElementById('login-phone')?.value || '';
      const password = document.getElementById('login-password')?.value || '';

      fetch('/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.code === 1000) {
            localStorage.setItem('user', JSON.stringify(result.data));
            localStorage.setItem('userId', result.data.id);
            window.location.href = '/home';
          } else if (result.code === 8888) {
            localStorage.setItem('user', JSON.stringify(result.data));
            window.location.href = '/admin_booking';
          } else {
            showErrorModal(result.message || 'Đăng nhập thất bại!');
          }
        })
        .catch(() => showErrorModal('Có lỗi xảy ra khi đăng nhập!'));
    });
  }

  // ===== Register =====
  if (signUpForm) {
    signUpForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const fullName = document.getElementById('signup-name')?.value || '';
      const email = document.getElementById('signup-email')?.value || '';
      const phone = document.getElementById('signup-phone')?.value || '';
      const birthday = document.getElementById('birthday')?.value || '';
      const password = document.getElementById('signup-password')?.value || '';
      const confirmPassword = document.getElementById('signup-confirm-password')?.value || '';

      if (password !== confirmPassword) {
        showErrorModal('Mật khẩu không khớp!');
        return;
      }

      fetch('/user/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          birthday,
          passwordConfirm: confirmPassword
        })
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.code === 1000) {
            showErrorModal('Đăng ký thành công!');
            // nếu muốn tự chuyển về login sau đăng ký thì bật dòng dưới:
            // showSignIn();
          } else {
            showErrorModal(result.message || 'Đăng ký thất bại!');
          }
        })
        .catch(() => showErrorModal('Có lỗi xảy ra khi đăng ký!'));
    });
  }
});
