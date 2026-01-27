'use strict';

(function () {
  // Guard để không ảnh hưởng trang khác
  if (!document.body || !document.body.classList.contains('hust-admin-flight')) return;

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

  // ===== MODAL =====
  function openAddModal() {
    const modal = document.getElementById('addFlightModal');
    if (modal) modal.style.display = 'flex';
  }
  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
  }

  window.openAddModal = openAddModal;
  window.closeModal = closeModal;

  window.addEventListener('click', function (event) {
    if (event.target && event.target.classList && event.target.classList.contains('modal')) {
      event.target.style.display = 'none';
    }
  });

  // ===== STATE =====
  let allFlights = [];
  let currentPage = 0;
  const pageSize = 5;

  // ===== TICKET CLASS HELPER =====
  function uiToApiTicketClass(uiValue) {
    if (uiValue === 'BUSINESS') return 'BUSINESS_CLASS';
    return 'NORMAL_CLASS';
  }

  function apiToUiTicketClass(apiValue) {
    if (apiValue === 'BUSINESS_CLASS') return 'BUSINESS';
    return 'ECONOMY';
  }

  function displayTicketClass(apiValue) {
    return apiToUiTicketClass(apiValue);
  }

  // ===== DATE HELPER (FIX LỖI 1009) =====
  function processDateForPayload(dateStr, isCheckOut = false) {
    if (!dateStr) return null;
    if (dateStr.includes('T')) return dateStr;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

    if (dateStr === todayStr) {
      const safeTime = new Date(now.getTime() + (isCheckOut ? 60 * 60 * 1000 : 2 * 60 * 1000));
      const timePart = safeTime.toTimeString().split(' ')[0];
      return `${dateStr}T${timePart}`;
    }
    return `${dateStr}T00:00:00`;
  }

  // ===== UI RENDERING =====
  function showNoRow(message) {
    const tbody = document.querySelector('#flight-table tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:18px;">${message}</td></tr>`;
  }

  function renderFlightTable(flights) {
    const tableBody = document.querySelector('#flight-table tbody');
    if (!tableBody) return;

    if (!Array.isArray(flights) || flights.length === 0) {
      showNoRow('No flights found');
      return;
    }

    tableBody.innerHTML = '';
    flights.forEach(flight => {
      const row = document.createElement('tr');
      const formatDateShow = (d) => {
        if(!d) return 'N/A';
        return new Date(d).toLocaleString('vi-VN', { hour12: false });
      };

      row.innerHTML = `
        <td>${flight.id}</td>
        <td>${displayTicketClass(flight.ticketClass)}</td>
        <td>${flight.airlineName ?? ''}</td>
        <td>${flight.departureLocation ?? ''}</td> 
        <td>${flight.arrivalLocation ?? ''}</td>
        <td>${flight.price ? flight.price.toLocaleString() : '0'}</td>
        <td>${formatDateShow(flight.checkInDate)}</td>
        <td>${formatDateShow(flight.checkOutDate)}</td>
        <td>${flight.numberOfChairs ?? ''}</td>
        <td>${flight.seatAvailable ?? ''}</td>
        <td>
          <button class="btn btn-edit" onclick="openUpdateModal(${flight.id})">Edit</button>
          <button class="btn btn-delete" onclick="deleteFlight(${flight.id})">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  // ===== PAGINATION =====
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
    const pageItems = allFlights.slice(start, end);
    renderFlightTable(pageItems);
    const totalPages = Math.ceil(allFlights.length / pageSize);
    renderPagination(totalPages);
  }

  // ===== API CALLS =====
  function fetchFlights() {
    fetch('/flight/getAll')
        .then(res => res.json())
        .then(data => {
          if (data.code === 1000) {
            allFlights = Array.isArray(data.data) ? data.data : [];
            currentPage = 0;
            renderCurrentPage();
          } else {
            allFlights = [];
            renderCurrentPage();
          }
        })
        .catch(err => {
          console.error('Error fetching flights:', err);
          allFlights = [];
          renderCurrentPage();
        });
  }

  // --- CREATE FLIGHT (UPDATED ERROR HANDLING) ---
  function createFlight() {
    const uiTicket = document.getElementById('ticketClass')?.value;
    const rawCheckIn = document.getElementById('checkInDate')?.value || '';
    const rawCheckOut = document.getElementById('checkOutDate')?.value || '';
    const rawPrice = document.getElementById('price')?.value;
    const rawChairs = document.getElementById('numberOfChairs')?.value;

    if (!rawCheckIn || !rawCheckOut || !rawPrice || !rawChairs) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    const checkInFormatted = processDateForPayload(rawCheckIn, false);
    const checkOutFormatted = processDateForPayload(rawCheckOut, true);

    const newFlight = {
      ticketClass: uiToApiTicketClass(uiTicket),
      airlineName: document.getElementById('airlineName')?.value || '',
      departureLocation: document.getElementById('departureLocation')?.value || '',
      arrivalLocation: document.getElementById('arrivalLocation')?.value || '',
      price: parseFloat(rawPrice),
      numberOfChairs: parseInt(rawChairs),
      checkInDate: checkInFormatted,
      checkOutDate: checkOutFormatted
    };

    fetch('/flight/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFlight)
    })
        .then(async res => {
          // [FIX] Kiểm tra status code (400, 500...)
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Lỗi server');
          }
          return res.json();
        })
        .then(data => {
          if (data.code === 1000) {
            alert('Thêm chuyến bay thành công!');
            fetchFlights();
            closeModal('addFlightModal');
          } else {
            alert('Lỗi: ' + data.message);
          }
        })
        .catch(err => {
          console.error('Error adding flight:', err);
          // [FIX] Hiển thị message lỗi trực tiếp
          alert("Lỗi: " + err.message);
        });
  }
  window.createFlight = createFlight;

  // --- DELETE (UPDATED LOGIC ĐỂ HIỆN LỖI 400) ---
  function deleteFlight(flightId) {
    if (!confirm('Bạn có chắc chắn muốn xóa chuyến bay này?')) return;

    fetch(`/flight/delete/${flightId}`, { method: 'DELETE' })
        .then(async res => {
          // [FIX] Quan trọng: Kiểm tra HTTP status nếu bị chặn xóa (400 Bad Request)
          if (!res.ok) {
            const errorData = await res.json();
            // Ném lỗi với message từ server (VD: Không thể xóa vì đã có người đặt)
            throw new Error(errorData.message || 'Lỗi không xác định từ server');
          }
          return res.json();
        })
        .then(data => {
          // Trường hợp server trả về 200 OK nhưng code nghiệp vụ báo lỗi (nếu có)
          if (data.code === 1000 || data.message === 'Flight deleted') {
            alert("Xóa thành công!");
            fetchFlights();
          } else {
            alert("Thông báo: " + (data.message || "Không thể xóa"));
          }
        })
        .catch(err => {
          console.error('Error deleting flight:', err);
          // [FIX] Alert lỗi ra màn hình
          alert("Lỗi: " + err.message);
        });
  }
  window.deleteFlight = deleteFlight;

  // --- OPEN UPDATE MODAL ---
  function openUpdateModal(flightId) {
    const flight = allFlights.find(f => f.id === flightId);
    if (!flight) return;

    document.getElementById('updateFlightId').value = flight.id;
    document.getElementById('updateTicketClass').value = apiToUiTicketClass(flight.ticketClass);
    document.getElementById('updateAirlineName').value = flight.airlineName || '';
    document.getElementById('updateDepartureLocation').value = flight.departureLocation || '';
    document.getElementById('updateArrivalLocation').value = flight.arrivalLocation || '';
    document.getElementById('updatePrice').value = flight.price || 0;
    document.getElementById('updateCheckInDate').value = flight.checkInDate ? flight.checkInDate.split('T')[0] : '';
    document.getElementById('updateCheckOutDate').value = flight.checkOutDate ? flight.checkOutDate.split('T')[0] : '';
    document.getElementById('updateNumberOfChairs').value = flight.numberOfChairs || 0;

    const modal = document.getElementById('updateFlightModal');
    if (modal) modal.style.display = 'flex';
  }
  window.openUpdateModal = openUpdateModal;

  // --- SAVE UPDATE (UPDATED ERROR HANDLING) ---
  function saveUpdatedFlight() {
    const flightId = document.getElementById('updateFlightId')?.value;
    if (!flightId) return;

    const uiTicket = document.getElementById('updateTicketClass')?.value;
    const rawCheckIn = document.getElementById('updateCheckInDate')?.value || '';
    const rawCheckOut = document.getElementById('updateCheckOutDate')?.value || '';
    const rawPrice = document.getElementById('updatePrice')?.value;
    const rawChairs = document.getElementById('updateNumberOfChairs')?.value;

    const checkInFormatted = processDateForPayload(rawCheckIn, false);
    const checkOutFormatted = processDateForPayload(rawCheckOut, true);

    const updatedFlight = {
      ticketClass: uiToApiTicketClass(uiTicket),
      airlineName: document.getElementById('updateAirlineName')?.value || '',
      departureLocation: document.getElementById('updateDepartureLocation')?.value || '',
      arrivalLocation: document.getElementById('updateArrivalLocation')?.value || '',
      price: parseFloat(rawPrice),
      numberOfChairs: parseInt(rawChairs),
      checkInDate: checkInFormatted,
      checkOutDate: checkOutFormatted
    };

    fetch(`/flight/update/${flightId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFlight)
    })
        .then(async res => {
          // [FIX] Kiểm tra status code
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Lỗi server');
          }
          return res.json();
        })
        .then(data => {
          if (data.code === 1000) {
            alert('Cập nhật chuyến bay thành công!');
            fetchFlights();
            closeModal('updateFlightModal');
          } else {
            alert('Lỗi cập nhật: ' + data.message);
          }
        })
        .catch(err => {
          console.error('Error updating flight:', err);
          // [FIX] Hiển thị message lỗi trực tiếp
          alert("Lỗi cập nhật: " + err.message);
        });
  }
  window.saveUpdatedFlight = saveUpdatedFlight;

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', fetchFlights);
})();