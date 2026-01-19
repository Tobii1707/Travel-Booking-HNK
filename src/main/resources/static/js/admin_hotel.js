'use strict';

(function () {
  if (!document.body || !document.body.classList.contains('hust-admin-hotel')) return;

  // ... (Phần Time và User Menu giữ nguyên như cũ) ...
  function updateTime() {
    const now = new Date();
    const dateEl = document.getElementById('currentDate');
    const timeEl = document.getElementById('currentTime');
    if (dateEl) dateEl.innerText = now.toLocaleDateString();
    if (timeEl) timeEl.innerText = now.toLocaleTimeString();
  }
  setInterval(updateTime, 1000);
  updateTime();

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

  // ===== STATE MANAGEMENT (QUẢN LÝ TRẠNG THÁI) =====
  let allHotels = [];
  let currentPage = 0;
  const pageSize = 5;
  let currentView = 'active'; // 'active': Đang hoạt động | 'trash': Thùng rác

  // ===== MODAL (Giữ nguyên logic cũ) =====
  function openAddModal() {
    const modalTitle = document.getElementById('modalTitle');
    const saveBtn = document.getElementById('saveHotelBtn');

    if (modalTitle) modalTitle.innerText = 'Add Hotel';
    if (document.getElementById('hotelId')) document.getElementById('hotelId').value = '';

    // Reset inputs
    ['hotelName', 'priceFrom', 'address', 'numberFloor', 'numberRoomPerFloor'].forEach(id => {
      if(document.getElementById(id)) document.getElementById(id).value = '';
    });

    if (saveBtn) saveBtn.onclick = createHotel;
    const modal = document.getElementById('hotelModal');
    if (modal) modal.style.display = 'flex';
  }

  function openEditModal(hotelId) {
    const hotel = allHotels.find(h => h.id === hotelId);
    if (!hotel) return;

    const modalTitle = document.getElementById('modalTitle');
    const saveBtn = document.getElementById('saveHotelBtn');

    if (modalTitle) modalTitle.innerText = 'Update Hotel';

    document.getElementById('hotelId').value = hotel.id;
    document.getElementById('hotelName').value = hotel.hotelName ?? '';
    document.getElementById('priceFrom').value = hotel.hotelPriceFrom ?? '';
    document.getElementById('address').value = hotel.address ?? '';
    document.getElementById('numberFloor').value = hotel.numberFloor ?? '';
    document.getElementById('numberRoomPerFloor').value = hotel.numberRoomPerFloor ?? '';

    if (saveBtn) saveBtn.onclick = updateHotel;
    const modal = document.getElementById('hotelModal');
    if (modal) modal.style.display = 'flex';
  }

  function closeModal() {
    const modal = document.getElementById('hotelModal');
    if (modal) modal.style.display = 'none';
  }

  // Expose modal functions global
  window.openAddModal = openAddModal;
  window.openEditModal = openEditModal;
  window.closeModal = closeModal;

  window.addEventListener('click', function (event) {
    if (event.target && event.target.classList && event.target.classList.contains('modal')) {
      event.target.style.display = 'none';
    }
  });

  // ===== UI RENDERING (SỬA ĐỔI LỚN) =====

  // Hàm chuyển đổi chế độ xem (Được gọi từ nút HTML)
  function toggleViewMode() {
    const btn = document.getElementById('toggleTrashBtn');
    const title = document.getElementById('tableTitle'); // Giả sử bạn có thẻ h2 tiêu đề bảng

    if (currentView === 'active') {
      currentView = 'trash';
      if(btn) btn.innerText = 'Quay lại danh sách';
      if(btn) btn.classList.add('btn-warning'); // Đổi màu nút cho nổi
      if(title) title.innerText = 'Thùng rác (Đã xóa)';
    } else {
      currentView = 'active';
      if(btn) btn.innerText = 'Thùng rác';
      if(btn) btn.classList.remove('btn-warning');
      if(title) title.innerText = 'Danh sách khách sạn';
    }
    fetchHotels(); // Tải lại dữ liệu theo chế độ mới
  }
  window.toggleViewMode = toggleViewMode;

  function showNoRow(message) {
    const tbody = document.getElementById('hotelTableBody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:18px;">${message}</td></tr>`;
  }

  function renderHotelTable(hotels) {
    const tbody = document.getElementById('hotelTableBody');
    if (!tbody) return;

    if (!Array.isArray(hotels) || hotels.length === 0) {
      showNoRow(currentView === 'active' ? 'No hotels found' : 'Trash is empty');
      return;
    }

    tbody.innerHTML = '';
    hotels.forEach(hotel => {
      const tr = document.createElement('tr');

      // Xử lý nút bấm dựa trên chế độ xem
      let actionButtons = '';
      if (currentView === 'active') {
        // Chế độ thường: Nút Sửa & Xóa
        actionButtons = `
          <button class="btn btn-edit" style="margin-right:5px;" onclick="openEditModal(${hotel.id})">Edit</button>
          <button class="btn btn-danger" style="background-color: #dc3545; color: white;" onclick="deleteHotel(${hotel.id})">Delete</button>
        `;
      } else {
        // Chế độ thùng rác: Nút Khôi phục
        actionButtons = `
          <button class="btn btn-success" style="background-color: #28a745; color: white;" onclick="restoreHotel(${hotel.id})">Restore</button>
        `;
      }

      tr.innerHTML = `
        <td>${hotel.id}</td>
        <td>${hotel.hotelName ?? ''}</td>
        <td>${hotel.hotelPriceFrom ?? ''}</td>
        <td>${hotel.address ?? ''}</td>
        <td>${hotel.numberFloor ?? ''}</td>
        <td>${hotel.numberRoomPerFloor ?? 'N/A'}</td> 
        <td>
          ${actionButtons}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ... (Phần Render Pagination giữ nguyên) ...
  function renderPagination(totalPages) {
    const container = document.getElementById('pagination');
    if (!container) return;
    container.innerHTML = '';
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
    const pageItems = allHotels.slice(start, end);
    renderHotelTable(pageItems);
    const totalPages = Math.ceil(allHotels.length / pageSize);
    renderPagination(totalPages);
  }

  // ===== API CALLS =====

  // 1. GET DATA (Active hoặc Trash)
  function fetchHotels() {
    // Nếu active -> gọi API getAllHotels, Nếu trash -> gọi API trash
    const endpoint = (currentView === 'active') ? '/admin/getAllHotels' : '/admin/trash';

    fetch(endpoint)
        .then(res => res.json())
        .then(data => {
          if (data.code === 1000) { // Code thành công
            allHotels = Array.isArray(data.data) ? data.data : [];
            currentPage = 0;
            renderCurrentPage();
          } else {
            allHotels = [];
            renderCurrentPage();
          }
        })
        .catch(err => {
          console.error('Error fetching hotels:', err);
          allHotels = [];
          renderCurrentPage();
        });
  }

  // 2. CREATE
  function createHotel() {
    const newHotel = {
      hotelName: document.getElementById('hotelName')?.value || '',
      priceFrom: Number(document.getElementById('priceFrom')?.value || 0),
      address: document.getElementById('address')?.value || '',
      numberFloor: Number(document.getElementById('numberFloor')?.value || 0),
      numberRoomPerFloor: Number(document.getElementById('numberRoomPerFloor')?.value || 0)
    };

    fetch('/admin/createHotel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHotel)
    })
        .then(res => res.json())
        .then(data => {
          // Check code 1000 hoặc thông báo lỗi
          if (data.code === 1000 || (data.result && !data.code)) {
            alert('Hotel added successfully!');
            fetchHotels();
            closeModal();
          } else {
            alert('Failed: ' + (data.message || 'Unknown error'));
          }
        })
        .catch(err => console.error(err));
  }
  window.createHotel = createHotel;

  // 3. UPDATE
  function updateHotel() {
    const id = document.getElementById('hotelId')?.value;
    if (!id) return;

    const updatedHotel = {
      hotelName: document.getElementById('hotelName')?.value || '',
      priceFrom: Number(document.getElementById('priceFrom')?.value || 0),
      address: document.getElementById('address')?.value || '',
      numberFloor: Number(document.getElementById('numberFloor')?.value || 0),
      numberRoomPerFloor: Number(document.getElementById('numberRoomPerFloor')?.value || 0)
    };

    fetch(`/admin/updateHotel/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedHotel)
    })
        .then(res => res.json())
        .then(data => {
          if (data.code === 1000 || (data.result && !data.code)) {
            alert('Updated successfully!');
            fetchHotels();
            closeModal();
          } else {
            alert('Failed: ' + (data.message || 'Unknown error'));
          }
        })
        .catch(err => console.error(err));
  }
  window.updateHotel = updateHotel;

  // 4. DELETE (Xử lý thông minh: Soft Delete & Force Delete)
  function deleteHotel(id, force = false) {
    if (!force && !confirm('Bạn có chắc chắn muốn xóa khách sạn này vào thùng rác?')) {
      return;
    }

    // Gọi API kèm tham số force
    fetch(`/admin/${id}?force=${force}`, {
      method: 'DELETE'
    })
        .then(res => res.json())
        .then(data => {
          // TRƯỜNG HỢP 1: Thành công (Code 1000 hoặc không có code lỗi)
          if (data.code === 1000 || (!data.code && data.message && !data.message.includes('lỗi'))) {
            alert(data.message);
            fetchHotels();
          }
          // TRƯỜNG HỢP 2: Lỗi Logic (Code 9999 - Có đơn hàng active)
          else if (data.code === 9999) {
            // Hiện Confirm Box với thông báo từ Backend
            const userChoice = confirm(data.message + "\n\nBạn có muốn HỦY TẤT CẢ ĐƠN HÀNG và XÓA khách sạn này không?");
            if (userChoice) {
              // Đệ quy: Gọi lại chính hàm này nhưng với force = true
              deleteHotel(id, true);
            }
          }
          // TRƯỜNG HỢP 3: Lỗi khác
          else {
            alert('Lỗi: ' + data.message);
          }
        })
        .catch(err => console.error('Error deleting:', err));
  }
  window.deleteHotel = deleteHotel;

  // 5. RESTORE (Khôi phục từ thùng rác)
  function restoreHotel(id) {
    if (!confirm('Bạn muốn khôi phục khách sạn này hoạt động trở lại?')) return;

    fetch(`/admin/restore/${id}`, {
      method: 'PUT'
    })
        .then(res => res.json())
        .then(data => {
          alert(data.message || 'Khôi phục thành công!');
          fetchHotels(); // Load lại danh sách thùng rác (item đó sẽ biến mất)
        })
        .catch(err => console.error('Error restoring:', err));
  }
  window.restoreHotel = restoreHotel;

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', fetchHotels);

})();