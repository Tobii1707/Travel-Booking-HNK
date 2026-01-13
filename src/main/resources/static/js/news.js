document.addEventListener('DOMContentLoaded', () => {
  const userIcon = document.getElementById('user-icon');
  const menu = document.getElementById('user-menu');

  if (!userIcon || !menu) return;

  userIcon.addEventListener('click', function (event) {
    event.preventDefault();
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
  });

  document.addEventListener('click', function (event) {
    if (!userIcon.contains(event.target) && !menu.contains(event.target)) {
      menu.style.display = 'none';
    }
  });
});
