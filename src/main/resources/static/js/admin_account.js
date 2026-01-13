'use strict';

(function () {
  if (!document.body || !document.body.classList.contains('hust-admin-account')) return;

  // ===== TIME =====
  function updateTime() {
    const now = new Date();
    const dateEl = document.getElementById('currentDate');
    const timeEl = document.getElementById('currentTime');
    if (dateEl) dateEl.innerText = now.toLocaleDateString();
    if (timeEl) timeEl.innerText = now.toLocaleTimeString();
  }
  setInterval(updateTime, 1000);
  updateTime();

  // ===== USER MENU =====
  const userIcon = document.getElementById('user-icon');
  const userMenu = document.getElementById('user-menu');
  if (userIcon && userMenu) {
    userIcon.addEventListener('click', function (event) {
      event.preventDefault();
      userMenu.style.display = (userMenu.style.display === 'flex') ? 'none' : 'flex';
    });

    document.addEventListener('click', function (event) {
      if (!userIcon.contains(event.target) && !userMenu.contains(event.target)) {
        userMenu.style.display = 'none';
      }
    });
  }

  // ===== MODAL (global cho HTML onclick) =====
  function openModal() {
    const modal = document.getElementById('createStaffModal');
    if (modal) modal.style.display = 'flex';
  }
  function closeModal() {
    const modal = document.getElementById('createStaffModal');
    if (modal) modal.style.display = 'none';
  }
  window.openModal = openModal;
  window.closeModal = closeModal;

  window.addEventListener('click', function (event) {
    const modal = document.getElementById('createStaffModal');
    if (modal && event.target === modal) modal.style.display = 'none';
  });

  // ===== STATE =====
  let currentPage = 0;
  const pageSize = 5;

  let isSearchMode = false;
  let currentSearchQuery = '';

  // ===== TABLE HELPERS =====
  function showNoRow(message) {
    const tbody = document.querySelector('#userTable tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:18px;">${message}</td></tr>`;
  }

  function renderUserTable(users) {
    const tableBody = document.querySelector('#userTable tbody');
    if (!tableBody) return;

    if (!Array.isArray(users) || users.length === 0) {
      showNoRow(isSearchMode ? 'No matching accounts found' : 'No accounts found');
      return;
    }

    tableBody.innerHTML = '';
    users.forEach(user => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${user.fullName ?? ''}</td>
        <td>${user.phone ?? ''}</td>
        <td>${user.birthday ?? ''}</td>
        <td>${user.email ?? ''}</td>
        <td>${user.status ? 'Active' : 'Locked'}</td>
        <td>
          <div class="action-buttons">
            <button class="toggle-status-btn" onclick="toggleStatus(${user.id})">
              ${user.status ? 'Lock' : 'Unlock'}
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  // ✅ Pagination giống admin_booking: luôn có Prev 1 Next
  function renderPagination(totalPages) {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    let pages = Number(totalPages ?? 0);
    if (!pages || pages < 1) pages = 1;

    if (currentPage > pages - 1) currentPage = pages - 1;
    if (currentPage < 0) currentPage = 0;

    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = currentPage === 0;
    prevBtn.onclick = function () {
      if (currentPage > 0) {
        currentPage--;
        loadUsersByMode(currentPage);
      }
    };
    paginationContainer.appendChild(prevBtn);

    for (let i = 0; i < pages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i + 1;
      btn.classList.toggle('active', i === currentPage);
      btn.onclick = function () {
        currentPage = i;
        loadUsersByMode(currentPage);
      };
      paginationContainer.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage >= pages - 1;
    nextBtn.onclick = function () {
      if (currentPage < pages - 1) {
        currentPage++;
        loadUsersByMode(currentPage);
      }
    };
    paginationContainer.appendChild(nextBtn);
  }

  // ===== FETCHERS =====
  function loadUsers(pageNo) {
    return fetch(`/user/allUsers?pageNo=${pageNo}&pageSize=${pageSize}`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        const items = data?.data?.items ?? [];
        const totalPages = Number(data?.data?.totalPages ?? 0);

        if (data.code === 1000) {
          renderUserTable(items);
          renderPagination(totalPages);
        } else {
          console.error('Error fetching users: ', data.message);
          renderUserTable([]);
          renderPagination(1);
        }
      })
      .catch(err => {
        console.error('Error fetching users:', err);
        renderUserTable([]);
        renderPagination(1);
      });
  }

  function loadUsersSearch(pageNo, query) {
    return fetch(`/user/searchUser?pageNo=${pageNo}&pageSize=${pageSize}&search=${encodeURIComponent(query)}`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        const items = data?.data?.items ?? [];
        const totalPages = Number(data?.data?.totalPages ?? 0);

        if (data.code === 1000) {
          if (!items.length) alert('No matching accounts found.');
          renderUserTable(items);
          renderPagination(totalPages);
        } else {
          alert('Search failed: ' + (data.message || 'Unknown error'));
          renderUserTable([]);
          renderPagination(1);
        }
      })
      .catch(err => {
        console.error('Error searching users:', err);
        alert('Error searching users.');
        renderUserTable([]);
        renderPagination(1);
      });
  }

  function loadUsersByMode(pageNo) {
    if (isSearchMode && currentSearchQuery) {
      return loadUsersSearch(pageNo, currentSearchQuery);
    }
    return loadUsers(pageNo);
  }

  // ===== SEARCH (global cho HTML onclick) =====
  function searchUsers() {
    const input = document.getElementById('search');
    const q = (input ? input.value : '').trim();

    currentPage = 0;

    if (!q) {
      isSearchMode = false;
      currentSearchQuery = '';
      loadUsersByMode(currentPage);
      return;
    }

    isSearchMode = true;
    currentSearchQuery = q;
    loadUsersByMode(currentPage);
  }
  window.searchUsers = searchUsers;

  // (optional) Enter để search
  const searchInput = document.getElementById('search');
  if (searchInput) {
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchUsers();
      }
    });
  }

  // ===== TOGGLE STATUS (global) =====
  function toggleStatus(userId) {
    if (!confirm('Are you sure you want to change the status of this account?')) return;

    fetch(`/user/changeStatus/${userId}`, { method: 'PATCH' })
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        if (data.code === 1000) {
          alert('Status changed successfully!');
          loadUsersByMode(currentPage); // ✅ giữ mode (search/all)
        } else {
          alert('Failed to change status: ' + data.message);
        }
      })
      .catch(err => console.error('Error toggling status:', err));
  }
  window.toggleStatus = toggleStatus;

  // ===== CREATE STAFF =====
  const createStaffForm = document.getElementById('createStaffForm');
  if (createStaffForm) {
    createStaffForm.addEventListener('submit', function (event) {
      event.preventDefault();

      const formData = {
        phone: document.getElementById('phone')?.value || '',
        password: document.getElementById('password')?.value || '',
        passwordConfirm: document.getElementById('passwordConfirm')?.value || '',
        fullName: document.getElementById('fullName')?.value || '',
        email: document.getElementById('email')?.value || '',
        birthday: document.getElementById('birthday')?.value || ''
      };

      if (formData.password !== formData.passwordConfirm) {
        alert('Confirm password does not match!');
        return;
      }

      fetch('/admin/acc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
        .then(res => res.json())
        .then(data => {
          if (data.code === 1000) {
            alert('Staff created successfully!');
            createStaffForm.reset();
            closeModal();
            loadUsersByMode(currentPage); // ✅ giữ mode
          } else {
            alert('Error: ' + data.message);
          }
        })
        .catch(err => console.error('Error creating staff:', err));
    });
  }

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', function () {
    loadUsersByMode(currentPage);
  });
})();
