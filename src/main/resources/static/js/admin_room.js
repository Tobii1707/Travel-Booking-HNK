'use strict';

(function () {
  // Guard để không ảnh hưởng trang khác
  if (!document.body || !document.body.classList.contains('hust-admin-room')) return;

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

  // ===== STATE =====
  let currentHotelId = '';
  let allRooms = [];
  let currentPage = 0;
  const pageSize = 5;

  // ===== HELPERS =====
  function showNoRow(message) {
    const tbody = document.getElementById('roomTableBody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5" class="empty-message">${message}</td></tr>`;
  }

  function renderRoomTable(rooms) {
    const tbody = document.getElementById('roomTableBody');
    if (!tbody) return;

    if (!Array.isArray(rooms) || rooms.length === 0) {
      showNoRow('No rooms found for this hotel');
      return;
    }

    tbody.innerHTML = '';
    rooms.forEach(room => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${room.id}</td>
        <td>${room.roomNumber}</td>
        <td>${room.roomType}</td>
        <td>${Number(room.price || 0).toLocaleString()} VND</td>
        <td>
          <button class="btn btn-edit" onclick="openEditModal(${room.id})">Edit</button>
          <button class="btn btn-delete" onclick="deleteRoom(${room.id})">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderPagination(totalPages) {
    const container = document.getElementById('pagination');
    if (!container) return;

    container.innerHTML = '';

    // giống account/booking: luôn render Prev 1 Next (kể cả không có data)
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
        renderCurrentPage();
      }
    };
    container.appendChild(prevBtn);

    for (let i = 0; i < pages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i + 1;
      btn.classList.toggle('active', i === currentPage);
      btn.onclick = function () {
        currentPage = i;
        renderCurrentPage();
      };
      container.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage >= pages - 1;
    nextBtn.onclick = function () {
      if (currentPage < pages - 1) {
        currentPage++;
        renderCurrentPage();
      }
    };
    container.appendChild(nextBtn);
  }

  function renderCurrentPage() {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    const pageItems = allRooms.slice(start, end);

    renderRoomTable(pageItems);

    const totalPages = Math.ceil(allRooms.length / pageSize);
    renderPagination(totalPages);
  }

  function setAddButtonState(hotelId) {
    const addBtn = document.getElementById('addRoomBtn');
    if (!addBtn) return;
    addBtn.disabled = !hotelId;
  }

  // ===== LOAD HOTELS =====
  function fetchHotels() {
    fetch('/admin/getAllHotels')
      .then(res => res.json())
      .then(data => {
        if (data.code === 1000) {
          const select = document.getElementById('hotelSelect');
          if (!select) return;

          // tránh append trùng nếu js reload
          select.innerHTML = '<option value="">-- Select a Hotel --</option>';

          (data.data || []).forEach(hotel => {
            const option = document.createElement('option');
            option.value = hotel.id;
            option.textContent = `${hotel.hotelName} (${hotel.address})`;
            select.appendChild(option);
          });
        }
      })
      .catch(err => console.error('Error fetching hotels:', err));
  }

  // ===== FETCH ROOMS =====
  function fetchRooms() {
    const hotelId = document.getElementById('hotelSelect')?.value || '';
    currentHotelId = hotelId;

    setAddButtonState(hotelId);

    if (!hotelId) {
      allRooms = [];
      currentPage = 0;
      showNoRow('Please select a hotel to view rooms');
      renderPagination(1);
      return;
    }

    fetch(`/admin/rooms/${hotelId}`)
      .then(res => res.json())
      .then(data => {
        if (data.code === 1000) {
          allRooms = Array.isArray(data.data) ? data.data : [];
          currentPage = 0;
          renderCurrentPage();
        } else {
          allRooms = [];
          currentPage = 0;
          renderCurrentPage();
        }
      })
      .catch(err => {
        console.error('Error fetching rooms:', err);
        allRooms = [];
        currentPage = 0;
        renderCurrentPage();
      });
  }

  // export global vì HTML onchange gọi
  window.fetchRooms = fetchRooms;

  // ===== MODAL =====
  function openAddModal() {
    document.getElementById('modalTitle').innerText = 'Add Room';
    document.getElementById('roomId').value = '';
    document.getElementById('roomNumber').value = '';
    document.getElementById('roomType').value = 'Normal Room';
    document.getElementById('roomPrice').value = '';
    document.getElementById('saveRoomBtn').onclick = createRoom;

    const modal = document.getElementById('roomModal');
    if (modal) modal.style.display = 'flex';
  }

  function openEditModal(roomId) {
    const room = allRooms.find(r => r.id === roomId);
    if (!room) return;

    document.getElementById('modalTitle').innerText = 'Update Room';
    document.getElementById('roomId').value = room.id;
    document.getElementById('roomNumber').value = room.roomNumber;
    document.getElementById('roomType').value = room.roomType;
    document.getElementById('roomPrice').value = room.price;
    document.getElementById('saveRoomBtn').onclick = updateRoom;

    const modal = document.getElementById('roomModal');
    if (modal) modal.style.display = 'flex';
  }

  function closeModal() {
    const modal = document.getElementById('roomModal');
    if (modal) modal.style.display = 'none';
  }

  window.openAddModal = openAddModal;
  window.openEditModal = openEditModal;
  window.closeModal = closeModal;

  // Không ghi đè window.onclick
  window.addEventListener('click', function (event) {
    if (event.target && event.target.classList && event.target.classList.contains('modal')) {
      event.target.style.display = 'none';
    }
  });

  // ===== CRUD =====
  function createRoom() {
    const hotelId = currentHotelId || (document.getElementById('hotelSelect')?.value || '');
    if (!hotelId) return;

    const newRoom = {
      roomNumber: parseInt(document.getElementById('roomNumber')?.value || 0, 10),
      roomType: document.getElementById('roomType')?.value || 'Normal Room',
      price: parseFloat(document.getElementById('roomPrice')?.value || 0),
      hotelId: parseInt(hotelId, 10)
    };

    fetch('/admin/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRoom)
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === 1000) {
          alert('Room added successfully!');
          fetchRooms(); // reload đúng hotel hiện tại
          closeModal();
        } else {
          alert('Failed to add room: ' + data.message);
        }
      })
      .catch(err => console.error('Error creating room:', err));
  }

  function updateRoom() {
    const id = document.getElementById('roomId')?.value;
    const hotelId = currentHotelId || (document.getElementById('hotelSelect')?.value || '');
    if (!id || !hotelId) return;

    const updatedRoom = {
      roomNumber: parseInt(document.getElementById('roomNumber')?.value || 0, 10),
      roomType: document.getElementById('roomType')?.value || 'Normal Room',
      price: parseFloat(document.getElementById('roomPrice')?.value || 0),
      hotelId: parseInt(hotelId, 10)
    };

    fetch(`/admin/room/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedRoom)
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === 1000) {
          alert('Room updated successfully!');
          fetchRooms();
          closeModal();
        } else {
          alert('Failed to update room: ' + data.message);
        }
      })
      .catch(err => console.error('Error updating room:', err));
  }

  function deleteRoom(id) {
    if (!confirm('Are you sure you want to delete this room?')) return;

    fetch(`/admin/room/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.code === 1000) {
          alert('Room deleted successfully!');
          fetchRooms();
        } else {
          alert('Failed to delete room: ' + data.message);
        }
      })
      .catch(err => console.error('Error deleting room:', err));
  }

  window.deleteRoom = deleteRoom;

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', function () {
    fetchHotels();
    renderPagination(1); // để pagination luôn hiện giống các trang khác
  });
})();
