'use strict';

(function () {
  if (!document.body || !document.body.classList.contains('hust-admin-room')) return;

  // ===== INIT DATE =====
  // Mặc định chọn ngày hôm nay và ngày mai khi vào trang
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  document.getElementById('checkInDate').valueAsDate = today;
  document.getElementById('checkOutDate').valueAsDate = tomorrow;

  // ===== TIME =====
  function updateTime() {
    const now = new Date();
    const dateEl = document.getElementById('currentDate');
    const timeEl = document.getElementById('currentTime');
    if (dateEl) dateEl.innerText = now.toLocaleDateString('vi-VN');
    if (timeEl) timeEl.innerText = now.toLocaleTimeString('vi-VN');
  }
  setInterval(updateTime, 1000);
  updateTime();

  // ===== USER MENU =====
  const userIcon = document.getElementById('user-icon');
  const userMenu = document.getElementById('user-menu');
  if (userIcon && userMenu) {
    userIcon.addEventListener('click', (e) => { e.preventDefault(); userMenu.style.display = userMenu.style.display === 'flex' ? 'none' : 'flex'; });
    document.addEventListener('click', (e) => { if (!userIcon.contains(e.target) && !userMenu.contains(e.target)) userMenu.style.display = 'none'; });
  }

  // ===== STATE =====
  let currentHotelId = '';
  let allRooms = []; // Cache danh sách phòng để Edit/Delete ko cần gọi lại API

  // ===== LOAD HOTELS =====
  function fetchHotels() {
    fetch('/admin/getAllHotels')
        .then(res => res.json())
        .then(data => {
          if (data.code === 1000) {
            const select = document.getElementById('hotelSelect');
            select.innerHTML = '<option value="">-- Chọn khách sạn --</option>';
            (data.data || []).forEach(hotel => {
              const option = document.createElement('option');
              option.value = hotel.id;
              option.textContent = `${hotel.hotelName} (${hotel.address})`;
              select.appendChild(option);
            });
          }
        });
  }

  // ===== FETCH ROOMS & RENDER MAP =====
  window.fetchRooms = async function() {
    const hotelId = document.getElementById('hotelSelect').value;
    const checkIn = document.getElementById('checkInDate').value;
    const checkOut = document.getElementById('checkOutDate').value;
    const mapContainer = document.getElementById('roomMapContainer');
    const addBtn = document.getElementById('addRoomBtn');

    currentHotelId = hotelId;
    addBtn.disabled = !hotelId;

    if (!hotelId) {
      mapContainer.innerHTML = '<p class="empty-message">Vui lòng chọn khách sạn để xem sơ đồ phòng</p>';
      return;
    }

    mapContainer.innerHTML = '<p class="empty-message">Đang tải dữ liệu...</p>';

    try {
      // 1. Gọi API lấy tất cả phòng của khách sạn
      // [QUAN TRỌNG] Đã sửa: Thêm tham số ?checkInDate=${checkIn} vào URL
      const roomsPromise = fetch(`/admin/rooms/${hotelId}?checkInDate=${checkIn}`).then(res => res.json());

      // 2. Gọi API kiểm tra phòng đã đặt (Nếu có ngày tháng)
      let bookedPromise = Promise.resolve([]); // Mặc định rỗng
      if (checkIn && checkOut) {
        bookedPromise = fetch(`/admin/booked-rooms?hotelId=${hotelId}&startDate=${checkIn}&endDate=${checkOut}`)
            .then(res => res.ok ? res.json() : [])
            .catch(() => []);
      }

      const [roomsResult, bookedIds] = await Promise.all([roomsPromise, bookedPromise]);

      if (roomsResult.code !== 1000 || !roomsResult.data || roomsResult.data.length === 0) {
        mapContainer.innerHTML = '<p class="empty-message">Khách sạn này chưa có phòng nào.</p>';
        allRooms = [];
        return;
      }

      allRooms = roomsResult.data;
      renderRoomMap(allRooms, Array.isArray(bookedIds) ? bookedIds : []);

    } catch (error) {
      console.error(error);
      mapContainer.innerHTML = '<p class="empty-message" style="color:red">Lỗi tải dữ liệu!</p>';
    }
  };

  // ===== RENDER LOGIC (MAP VIEW) =====
  function renderRoomMap(rooms, bookedIds) {
    const container = document.getElementById('roomMapContainer');
    container.innerHTML = '';

    // 1. Sắp xếp phòng theo số (để hiển thị đẹp)
    rooms.sort((a, b) => {
      const numA = parseInt(String(a.roomNumber).replace(/\D/g, '')) || 0;
      const numB = parseInt(String(b.roomNumber).replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    // 2. Nhóm phòng theo tầng (Lấy ký tự đầu của số phòng)
    const floors = {};
    rooms.forEach(room => {
      let floorNum = String(room.roomNumber).substring(0, 1);
      if (!floors[floorNum]) floors[floorNum] = [];
      floors[floorNum].push(room);
    });

    // 3. Vẽ HTML
    // Sắp xếp tầng từ thấp đến cao
    Object.keys(floors).sort().forEach(floorKey => {
      const floorRooms = floors[floorKey];

      const floorDiv = document.createElement('div');
      floorDiv.className = 'hotel-floor';

      const floorTitle = document.createElement('div');
      floorTitle.className = 'floor-title';
      floorTitle.innerText = `Tầng ${floorKey}`;
      floorDiv.appendChild(floorTitle);

      const gridDiv = document.createElement('div');
      gridDiv.className = 'floor-grid';

      floorRooms.forEach(room => {
        const isBooked = bookedIds.includes(room.id);
        const card = document.createElement('div');

        // Thêm class booked hoặc available
        card.className = `room-card ${isBooked ? 'booked' : 'available'}`;

        card.innerHTML = `
          <div class="room-number">${room.roomNumber}</div>
          <div class="room-type">${room.roomType}</div>
          <div class="room-price">${Number(room.price).toLocaleString()} đ</div>
          <div class="status-text">${isBooked ? 'Đã đặt' : 'Trống'}</div>
          
          <div class="room-actions">
            <button class="action-btn btn-edit-mini" onclick="openEditModal(${room.id})" title="Sửa">
                <i class="fas fa-pen"></i>
            </button>
            <button class="action-btn btn-delete-mini" onclick="deleteRoom(${room.id})" title="Xóa">
                <i class="fas fa-trash"></i>
            </button>
          </div>
        `;
        gridDiv.appendChild(card);
      });

      floorDiv.appendChild(gridDiv);
      container.appendChild(floorDiv);
    });
  }

  // ===== CRUD MODAL LOGIC (Giữ nguyên logic cũ) =====
  window.openAddModal = function() {
    document.getElementById('modalTitle').innerText = 'Thêm phòng mới';
    document.getElementById('roomId').value = '';
    document.getElementById('roomNumber').value = '';
    document.getElementById('roomType').value = 'Normal Room';
    document.getElementById('roomPrice').value = '';

    document.getElementById('saveRoomBtn').onclick = createRoom;
    document.getElementById('roomModal').style.display = 'flex';
  };

  window.openEditModal = function(roomId) {
    const room = allRooms.find(r => r.id === roomId);
    if (!room) return;

    document.getElementById('modalTitle').innerText = 'Cập nhật phòng';
    document.getElementById('roomId').value = room.id;
    document.getElementById('roomNumber').value = room.roomNumber;
    document.getElementById('roomType').value = room.roomType;
    document.getElementById('roomPrice').value = room.price;

    document.getElementById('saveRoomBtn').onclick = updateRoom;
    document.getElementById('roomModal').style.display = 'flex';
  };

  window.closeModal = function() {
    document.getElementById('roomModal').style.display = 'none';
  };

  // --- API Actions ---
  function createRoom() {
    const hotelId = currentHotelId;
    if (!hotelId) return;

    const data = {
      roomNumber: document.getElementById('roomNumber').value,
      roomType: document.getElementById('roomType').value,
      price: document.getElementById('roomPrice').value,
      hotelId: hotelId
    };

    fetch('/admin/room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()).then(result => {
      if (result.code === 1000) {
        alert('Thêm phòng thành công!');
        closeModal();
        fetchRooms(); // Load lại sơ đồ
      } else alert(result.message);
    });
  }

  function updateRoom() {
    const id = document.getElementById('roomId').value;
    const hotelId = currentHotelId;

    const data = {
      roomNumber: document.getElementById('roomNumber').value,
      roomType: document.getElementById('roomType').value,
      price: document.getElementById('roomPrice').value,
      hotelId: hotelId
    };

    fetch(`/admin/room/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(res => res.json()).then(result => {
      if (result.code === 1000) {
        alert('Cập nhật thành công!');
        closeModal();
        fetchRooms();
      } else alert(result.message);
    });
  }

  window.deleteRoom = function(id) {
    if (!confirm('Bạn có chắc muốn xóa phòng này không?')) return;
    fetch(`/admin/room/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(result => {
          if (result.code === 1000) {
            alert('Xóa thành công!');
            fetchRooms();
          } else alert(result.message);
        });
  };

  // INIT
  document.addEventListener('DOMContentLoaded', fetchHotels);

})();