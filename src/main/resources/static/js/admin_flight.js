'use strict';

(function () {
  // Guard
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

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
  }

  window.openAddModal = openAddModal;
  window.closeModal = closeModal;
  window.openModal = openModal;

  window.addEventListener('click', function (event) {
    if (event.target && event.target.classList && event.target.classList.contains('modal')) {
      event.target.style.display = 'none';
    }
  });


  // ===== TABS SWITCHING =====
  function switchTab(tabName) {
    const sectionFlight = document.getElementById('section-flight');
    const sectionAirline = document.getElementById('section-airline');
    const btnFlight = document.getElementById('tabFlightBtn');
    const btnAirline = document.getElementById('tabAirlineBtn');

    if (tabName === 'flight') {
      if(sectionFlight) sectionFlight.style.display = 'block';
      if(sectionAirline) sectionAirline.style.display = 'none';
      if(btnFlight) btnFlight.classList.add('active');
      if(btnAirline) btnAirline.classList.remove('active');
    } else {
      if(sectionFlight) sectionFlight.style.display = 'none';
      if(sectionAirline) sectionAirline.style.display = 'block';
      if(btnFlight) btnFlight.classList.remove('active');
      if(btnAirline) btnAirline.classList.add('active');
    }
  }
  window.switchTab = switchTab;


  // ===== STATE =====
  let allFlights = [];
  let allAirlines = [];
  let currentPage = 0;
  const pageSize = 5;

  let currentPageAirline = 0;
  const pageSizeAirline = 5;

  let isTrashMode = false;
  let isAirlineTrashMode = false;

  // 👉 [QUAN TRỌNG MỚI]: BỘ NHỚ LƯU CÁC DẤU TÍCH XUYÊN SUỐT
  let selectedFlightIds = new Set();

  // MỚI: Hàm xử lý khi người dùng tích hoặc bỏ tích 1 ô
  window.handleCheckboxChange = function(checkbox, flightId) {
    if (checkbox.checked) {
      selectedFlightIds.add(flightId); // Thêm vào bộ nhớ
    } else {
      selectedFlightIds.delete(flightId); // Xóa khỏi bộ nhớ
    }
  };

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

  // ===== DATE HELPER =====
  function processDateForPayload(dateStr, isCheckOut = false) {
    if (!dateStr) return null;
    if (dateStr.includes('T')) return dateStr;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (dateStr === todayStr) {
      const safeTime = new Date(now.getTime() + (isCheckOut ? 60 * 60 * 1000 : 2 * 60 * 1000));
      const timePart = safeTime.toTimeString().split(' ')[0];
      return `${dateStr}T${timePart}`;
    }
    return `${dateStr}T00:00:00`;
  }

  // ===== HELPER RENDER SELECT OPTION CHO HÃNG BAY =====
  function renderAirlineOptions() {
    if(isAirlineTrashMode) return;

    const selects = [
      document.getElementById('airlineId'),
      document.getElementById('updateAirlineId'),
      document.getElementById('batchAirlineId'),
      document.getElementById('searchAirlineId')
    ];

    selects.forEach(select => {
      if (!select) return;
      const firstOption = select.firstElementChild;
      select.innerHTML = '';
      if(firstOption) select.appendChild(firstOption);

      allAirlines.forEach(airline => {
        const opt = document.createElement('option');
        opt.value = airline.id;
        opt.textContent = airline.airlineName;
        select.appendChild(opt);
      });
    });
  }

  // ===== UI RENDERING CHUYẾN BAY =====
  function showNoRow(message) {
    const tbody = document.querySelector('#flight-table tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="13" style="text-align:center; padding:18px;">${message}</td></tr>`;
  }

  function updateFlightTableHeader() {
    const thead = document.querySelector('#flight-table thead');
    if(!thead) return;

    if(isTrashMode) {
      thead.innerHTML = `
        <tr>
            <th>ID</th>
            <th>Hạng vé</th>
            <th>Hãng bay</th>
            <th>Số hiệu MB</th>
            <th>Điểm đi</th>
            <th>Điểm đến</th>
            <th>Giá vé</th>
            <th>Ngày đi</th>
            <th>Ngày đến</th>
            <th>Tổng ghế</th>
            <th>Còn trống</th>
            <th>Thao tác</th>
        </tr>
      `;
    } else {
      thead.innerHTML = `
        <tr>
            <th style="width: 40px; text-align: center;">
              <input type="checkbox" id="selectAllFlights" onclick="toggleAllCheckboxes(this)">
            </th>
            <th>ID</th>
            <th>Hạng vé</th>
            <th>Hãng bay</th>
            <th>Số hiệu MB</th>
            <th>Điểm đi</th>
            <th>Điểm đến</th>
            <th>Giá vé</th>
            <th>Ngày đi</th>
            <th>Ngày đến</th>
            <th>Tổng ghế</th>
            <th>Còn trống</th>
            <th>Thao tác</th>
        </tr>
      `;
    }
  }

  // 👉 SỬA LẠI: Nút chọn tất cả sẽ cập nhật cả giao diện lẫn Bộ Nhớ
  window.toggleAllCheckboxes = function(source) {
    const checkboxes = document.querySelectorAll('.flight-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = source.checked;
      const fId = parseInt(cb.value);
      if (source.checked) {
        selectedFlightIds.add(fId);
      } else {
        selectedFlightIds.delete(fId);
      }
    });
  }

  function renderFlightTable(flights) {
    updateFlightTableHeader();

    const tableBody = document.querySelector('#flight-table tbody');
    if (!tableBody) return;

    if (!Array.isArray(flights) || flights.length === 0) {
      showNoRow(isTrashMode ? 'Thùng rác trống' : 'Không tìm thấy chuyến bay nào');
      return;
    }

    tableBody.innerHTML = '';

    // Kiểm tra xem tất cả các chuyến bay trên trang này có đang được chọn không để check ô Select All
    let allOnPageSelected = true;

    flights.forEach(flight => {
      const row = document.createElement('tr');
      const formatDateShow = (d) => {
        if(!d) return 'N/A';
        return new Date(d).toLocaleString('vi-VN', { hour12: false });
      };

      const airlineNameDisplay = flight.airline ? flight.airline.airlineName : 'N/A';
      const airplaneNameDisplay = flight.airplaneName || '';

      let actionButtons = '';
      let checkboxTd = '';

      if (isTrashMode) {
        actionButtons = `<button class="btn btn-edit" style="background-color: #27ae60;" onclick="restoreFlight(${flight.id})">Restore</button>`;
      } else {
        // 👉 CẬP NHẬT: Kiểm tra xem chuyến bay có nằm trong "bộ nhớ" không để tự động check
        const isChecked = selectedFlightIds.has(flight.id);
        if(!isChecked) allOnPageSelected = false; // Nếu có 1 cái chưa check thì bỏ check ô Select All

        const checkedAttr = isChecked ? 'checked' : '';
        checkboxTd = `<td style="text-align: center;">
            <input type="checkbox" class="flight-checkbox" value="${flight.id}" ${checkedAttr} onchange="handleCheckboxChange(this, ${flight.id})">
        </td>`;

        // 👉 [MỚI]: Thêm nút xem lịch sử giá
        actionButtons = `
          <button class="btn btn-edit" style="background-color: #3498db; margin-bottom: 4px;" onclick="openPriceHistoryModal(${flight.id})">Lịch sử giá</button>
          <br>
          <button class="btn btn-edit" style="margin-bottom: 4px;" onclick="openUpdateModal(${flight.id})">Edit</button>
          <button class="btn btn-delete" onclick="deleteFlight(${flight.id})">Delete</button>
        `;
      }

      row.innerHTML = `
        ${checkboxTd}
        <td>${flight.id}</td>
        <td>${displayTicketClass(flight.ticketClass)}</td>
        <td>${airlineNameDisplay}</td> <td>${airplaneNameDisplay}</td> <td>${flight.departureLocation ?? ''}</td> 
        <td>${flight.arrivalLocation ?? ''}</td>
        <td>${flight.price ? flight.price.toLocaleString() : '0'}</td>
        <td>${formatDateShow(flight.checkInDate)}</td>
        <td>${formatDateShow(flight.checkOutDate)}</td>
        <td>${flight.numberOfChairs ?? ''}</td>
        <td>${flight.seatAvailable ?? ''}</td>
        <td>${actionButtons}</td>
      `;
      tableBody.appendChild(row);
    });

    // Cập nhật trạng thái của ô "Chọn tất cả" trên header
    const selectAllCb = document.getElementById('selectAllFlights');
    if (selectAllCb && flights.length > 0) {
      selectAllCb.checked = allOnPageSelected;
    }
  }

  // ===== PAGINATION CHUYẾN BAY =====
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
      if (currentPage > 0) { currentPage--; renderCurrentPage(); }
    };
    container.appendChild(prevBtn);

    for (let i = 0; i < pages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i + 1;
      btn.classList.toggle('active', i === currentPage);
      btn.onclick = function () { currentPage = i; renderCurrentPage(); };
      container.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage >= pages - 1;
    nextBtn.onclick = function () {
      if (currentPage < pages - 1) { currentPage++; renderCurrentPage(); }
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

  function renderAirlineTable(airlinesData) {
    const tableBody = document.querySelector('#airline-table tbody');
    if (!tableBody) return;

    if (!Array.isArray(airlinesData) || airlinesData.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:18px;">${isAirlineTrashMode ? 'Thùng rác trống' : 'Chưa có hãng bay nào'}</td></tr>`;
      return;
    }

    tableBody.innerHTML = '';
    airlinesData.forEach(airline => {
      const row = document.createElement('tr');

      let actionButtons = '';
      if(isAirlineTrashMode) {
        actionButtons = `<button class="btn btn-edit" style="background-color: #27ae60;" onclick="restoreAirline(${airline.id})">Restore</button>`;
      } else {
        actionButtons = `
          <button class="btn btn-edit" onclick="openUpdateAirlineModal(${airline.id})">Sửa</button>
          <button class="btn btn-delete" onclick="deleteAirline(${airline.id})">Xóa</button>
        `;
      }

      row.innerHTML = `
        <td>${airline.id}</td>
        <td><strong>${airline.airlineName}</strong></td>
        <td>${airline.description || ''}</td>
        <td>${actionButtons}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  function renderAirlinePagination(totalPages) {
    const container = document.getElementById('pagination-airline');
    if (!container) return;
    container.innerHTML = '';
    let pages = Number(totalPages ?? 0);
    if (!pages || pages < 1) pages = 1;
    if (currentPageAirline > pages - 1) currentPageAirline = pages - 1;
    if (currentPageAirline < 0) currentPageAirline = 0;

    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = currentPageAirline === 0;
    prevBtn.onclick = function () {
      if (currentPageAirline > 0) { currentPageAirline--; renderAirlineCurrentPage(); }
    };
    container.appendChild(prevBtn);

    for (let i = 0; i < pages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i + 1;
      btn.classList.toggle('active', i === currentPageAirline);
      btn.onclick = function () { currentPageAirline = i; renderAirlineCurrentPage(); };
      container.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPageAirline >= pages - 1;
    nextBtn.onclick = function () {
      if (currentPageAirline < pages - 1) { currentPageAirline++; renderAirlineCurrentPage(); }
    };
    container.appendChild(nextBtn);
  }

  function renderAirlineCurrentPage() {
    const start = currentPageAirline * pageSizeAirline;
    const end = start + pageSizeAirline;
    const pageItems = allAirlines.slice(start, end);
    renderAirlineTable(pageItems);
    const totalPages = Math.ceil(allAirlines.length / pageSizeAirline);
    renderAirlinePagination(totalPages);
  }

  function fetchAirlines() {
    const url = isAirlineTrashMode ? '/api/airlines/trash' : '/api/airlines';

    fetch(url)
        .then(res => {
          if (!res.ok) throw new Error("Lỗi tải danh sách hãng bay");
          return res.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            allAirlines = data;
          } else if (data && data.data) {
            allAirlines = data.data;
          } else {
            allAirlines = [];
          }
          renderAirlineOptions();
          currentPageAirline = 0;
          renderAirlineCurrentPage();
        })
        .catch(err => {
          console.error('Error fetching airlines:', err);
          allAirlines = [];
          renderAirlineCurrentPage();
        });
  }
  window.fetchAirlines = fetchAirlines;

  function toggleAirlineTrashMode() {
    isAirlineTrashMode = !isAirlineTrashMode;
    const btn = document.getElementById('btnToggleAirlineTrash');
    if (btn) {
      btn.textContent = isAirlineTrashMode ? "Quay lại danh sách" : "Xem thùng rác";
      btn.style.backgroundColor = isAirlineTrashMode ? "#7f8c8d" : "#e67e22";
    }
    const title = document.getElementById('airline-section-title');
    if (title) title.textContent = isAirlineTrashMode ? "Thùng rác Hãng bay" : "Danh sách Hãng bay";

    fetchAirlines();
  }
  window.toggleAirlineTrashMode = toggleAirlineTrashMode;

  function fetchFlights() {
    const url = isTrashMode ? '/flight/trash' : '/flight/getAll';
    fetch(url)
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
  window.fetchFlights = fetchFlights;

  function toggleTrashMode() {
    isTrashMode = !isTrashMode;
    const btn = document.getElementById('btnToggleTrash');
    if (btn) {
      btn.textContent = isTrashMode ? "Quay lại danh sách" : "Xem thùng rác";
      btn.style.backgroundColor = isTrashMode ? "#7f8c8d" : "#e67e22";
    }
    const title = document.getElementById('flight-section-title');
    if (title) title.textContent = isTrashMode ? "Thùng rác Chuyến bay" : "Danh sách Chuyến bay";

    fetchFlights();
  }
  window.toggleTrashMode = toggleTrashMode;

  function searchFlightsForAdmin() {
    if (isTrashMode) {
      alert("Tính năng tìm kiếm chỉ áp dụng ở màn hình danh sách chính, không áp dụng trong thùng rác.");
      return;
    }

    const keyword = document.getElementById('searchKeyword')?.value || '';
    const departure = document.getElementById('searchDeparture')?.value || '';
    const arrival = document.getElementById('searchArrival')?.value || '';
    const airlineId = document.getElementById('searchAirlineId')?.value || '';

    // Xây dựng chuỗi query string
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    if (departure) params.append('departure', departure);
    if (arrival) params.append('arrival', arrival);
    if (airlineId) params.append('airlineId', airlineId);

    fetch(`/flight/admin-search?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
          if (data.code === 1000 && data.data) {
            allFlights = data.data;
            currentPage = 0;
            renderCurrentPage();
            // KHÔNG xoá selectedFlightIds ở đây để giữ kết quả tích cũ khi tìm kiếm
          } else {
            allFlights = [];
            renderCurrentPage();
          }
        })
        .catch(err => {
          console.error('Lỗi khi tìm kiếm:', err);
          alert('Lỗi khi gọi API tìm kiếm!');
        });
  }
  window.searchFlightsForAdmin = searchFlightsForAdmin;

  function resetSearch() {
    if (document.getElementById('searchKeyword')) document.getElementById('searchKeyword').value = '';
    if (document.getElementById('searchDeparture')) document.getElementById('searchDeparture').value = '';
    if (document.getElementById('searchArrival')) document.getElementById('searchArrival').value = '';
    if (document.getElementById('searchAirlineId')) document.getElementById('searchAirlineId').value = '';

    // Tùy chọn: Xóa các dấu tích cũ khi reset tìm kiếm. Nếu bạn muốn giữ lại thì xóa dòng lệnh dưới đây
    selectedFlightIds.clear();
    fetchFlights();
  }
  window.resetSearch = resetSearch;

  // 👉 CẬP NHẬT: Lấy danh sách ID từ Bộ Nhớ thay vì chỉ quét trên HTML
  function openBatchPriceModal() {
    if (selectedFlightIds.size === 0) {
      alert("Vui lòng tick chọn ít nhất 1 chuyến bay (hoặc từ các trang tìm kiếm khác nhau) để điều chỉnh giá!");
      return;
    }

    // Reset và gán giá trị hiển thị cho modal
    document.getElementById('batchPricePercentage').value = '';
    const countEl = document.getElementById('selectedFlightCount');
    if(countEl) countEl.innerText = selectedFlightIds.size; // Hiện chính xác tổng số đã chọn

    openModal('batchAdjustPriceModal');
  }
  window.openBatchPriceModal = openBatchPriceModal;

  // 👉 CẬP NHẬT: Gửi danh sách ID từ Bộ Nhớ
  function saveBatchPriceAdjustment() {
    if (selectedFlightIds.size === 0) return;
    const flightIds = Array.from(selectedFlightIds);

    const percentageStr = document.getElementById('batchPricePercentage')?.value;

    if (!percentageStr) {
      alert("Vui lòng nhập phần trăm thay đổi (+ để tăng, - để giảm)!");
      return;
    }

    const percentage = parseFloat(percentageStr);

    if (percentage <= -100) {
      alert("Phần trăm giảm không được vượt quá 100%!");
      return;
    }

    const actionText = percentage > 0 ? "TĂNG" : "GIẢM";
    if (!confirm(`Bạn có CHẮC CHẮN muốn ${actionText} ${Math.abs(percentage)}% giá trị của ${flightIds.length} chuyến bay đã chọn không?`)) {
      return;
    }

    const requestBody = {
      flightIds: flightIds,
      percentage: percentage
    };

    fetch('/flight/adjust-price-batch', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })
        .then(async res => {
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Lỗi server');
          }
          return res.json();
        })
        .then(data => {
          alert(`Đã áp dụng ${actionText} giá thành công cho các chuyến bay!`);

          // Sau khi thay đổi giá thành công, ta xoá sạch bộ nhớ
          selectedFlightIds.clear();

          closeModal('batchAdjustPriceModal');
          searchFlightsForAdmin();
        })
        .catch(err => alert("Lỗi khi cập nhật giá hàng loạt: " + err.message));
  }
  window.saveBatchPriceAdjustment = saveBatchPriceAdjustment;

  // ==========================================================
  // 👉 [MỚI] API CALL VÀ HIỂN THỊ LỊCH SỬ GIÁ
  // ==========================================================

  function openPriceHistoryModal(flightId) {
    const flight = allFlights.find(f => f.id === flightId);
    if (!flight) return;

    // Hiển thị thông tin cơ bản của chuyến bay lên title modal
    document.getElementById('historyFlightInfo').innerText =
        `Chuyến bay ID: ${flight.id} - ${flight.airplaneName} (${flight.departureLocation} ✈️ ${flight.arrivalLocation})`;

    // Gọi API lấy dữ liệu lịch sử
    fetch(`/flight/price-history/${flightId}`)
        .then(res => {
          if (!res.ok) throw new Error("Lỗi khi tải lịch sử giá");
          return res.json();
        })
        .then(data => {
          if (data.code === 1000) {
            renderPriceHistoryTable(data.data);
          } else {
            renderPriceHistoryTable([]);
          }
          openModal('priceHistoryModal');
        })
        .catch(err => {
          console.error(err);
          renderPriceHistoryTable([]);
          openModal('priceHistoryModal');
        });
  }
  window.openPriceHistoryModal = openPriceHistoryModal;

  function renderPriceHistoryTable(historyData) {
    const tbody = document.querySelector('#history-table tbody');
    if (!tbody) return;

    if (!Array.isArray(historyData) || historyData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:15px; color:#7f8c8d;">Chưa có lịch sử thay đổi giá cho chuyến bay này.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    historyData.forEach((history, index) => {
      const tr = document.createElement('tr');

      const oldPrice = history.oldPrice.toLocaleString('vi-VN') + ' ₫';
      const newPrice = history.newPrice.toLocaleString('vi-VN') + ' ₫';

      const changeDate = new Date(history.changedAt).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      // Hiển thị mũi tên xanh tăng, mũi tên đỏ giảm
      let icon = '';
      if (history.newPrice > history.oldPrice) {
        icon = `<span style="color:#e74c3c; font-weight:bold;">Tăng ⬆️</span>`;
      } else if (history.newPrice < history.oldPrice) {
        icon = `<span style="color:#2ecc71; font-weight:bold;">Giảm ⬇️</span>`;
      }

      tr.innerHTML = `
        <td style="text-align:center;">${index + 1}</td>
        <td>${oldPrice}</td>
        <td>${newPrice}</td>
        <td>${changeDate}</td>
        <td>${icon}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --- CREATE FLIGHT ---
  function createFlight() {
    const uiTicket = document.getElementById('ticketClass')?.value;
    const airlineId = document.getElementById('airlineId')?.value;
    const airplaneName = document.getElementById('airplaneName')?.value || '';

    const rawCheckIn = document.getElementById('checkInDate')?.value || '';
    const rawCheckOut = document.getElementById('checkOutDate')?.value || '';
    const rawPrice = document.getElementById('price')?.value;
    const rawChairs = document.getElementById('numberOfChairs')?.value;

    if (!rawCheckIn || !rawCheckOut || !rawPrice || !rawChairs || !airlineId) {
      alert("Vui lòng điền đầy đủ thông tin (bao gồm chọn Hãng bay)!");
      return;
    }

    const checkInFormatted = processDateForPayload(rawCheckIn, false);
    const checkOutFormatted = processDateForPayload(rawCheckOut, true);

    const newFlight = {
      ticketClass: uiToApiTicketClass(uiTicket),
      airlineId: parseInt(airlineId),
      airplaneName: airplaneName,
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
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: "Lỗi hệ thống từ server" }));
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
        .catch(err => alert("Lỗi: " + err.message));
  }
  window.createFlight = createFlight;

  // --- CREATE MULTIPLE FLIGHTS ---
  function createBatchFlights(airlineId, flightList) {
    if (!airlineId || !Array.isArray(flightList) || flightList.length === 0) {
      alert("Thiếu ID hãng bay hoặc danh sách chuyến bay trống!");
      return;
    }

    fetch(`/flight/create-batch/${airlineId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flightList)
    })
        .then(async res => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: "Lỗi hệ thống từ server" }));
            throw new Error(errorData.message || 'Lỗi server');
          }
          return res.json();
        })
        .then(data => {
          if (data.code === 1000 || (data.message && data.message.includes('Successfully'))) {
            alert(`Thêm thành công ${data.data ? data.data.length : 'các'} chuyến bay!`);
            fetchFlights();
          } else {
            alert('Lỗi: ' + data.message);
          }
        })
        .catch(err => alert("Lỗi: " + err.message));
  }
  window.createBatchFlights = createBatchFlights;

  // --- DELETE FLIGHT ---
  function deleteFlight(flightId) {
    if (!confirm('Bạn có chắc chắn muốn xóa chuyến bay này? (Sẽ được chuyển vào thùng rác)')) return;
    fetch(`/flight/delete/${flightId}`, { method: 'DELETE' })
        .then(async res => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: "Lỗi hệ thống từ server" }));
            throw new Error(errorData.message || 'Lỗi không xác định từ server');
          }
          return res.json();
        })
        .then(data => {
          if (data.code === 1000 || data.message.includes('success')) {
            alert("Đã chuyển vào thùng rác!");
            // Nếu xoá máy bay đang được tích, ta cũng loại nó khỏi bộ nhớ
            selectedFlightIds.delete(flightId);
            fetchFlights();
          } else {
            alert("Thông báo: " + (data.message || "Không thể xóa"));
          }
        })
        .catch(err => alert("Lỗi: " + err.message));
  }
  window.deleteFlight = deleteFlight;

  function restoreFlight(flightId) {
    if (!confirm('Bạn có muốn khôi phục chuyến bay này không?')) return;
    fetch(`/flight/restore/${flightId}`, { method: 'PATCH' })
        .then(async res => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: "Lỗi hệ thống từ server" }));
            throw new Error(errorData.message || 'Lỗi server');
          }
          return res.json();
        })
        .then(data => {
          if (data.code === 1000) {
            alert('Khôi phục thành công!');
            fetchFlights();
          } else {
            alert('Lỗi: ' + data.message);
          }
        })
        .catch(err => alert("Lỗi: " + err.message));
  }
  window.restoreFlight = restoreFlight;

  // --- UPDATE FLIGHT MODAL ---
  function openUpdateModal(flightId) {
    const flight = allFlights.find(f => f.id === flightId);
    if (!flight) return;

    document.getElementById('updateFlightId').value = flight.id;
    document.getElementById('updateTicketClass').value = apiToUiTicketClass(flight.ticketClass);

    const airlineSelect = document.getElementById('updateAirlineId');
    if (airlineSelect && flight.airline) {
      airlineSelect.value = flight.airline.id;
    }

    document.getElementById('updateAirplaneName').value = flight.airplaneName || '';
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

  // --- SAVE UPDATE FLIGHT ---
  function saveUpdatedFlight() {
    const flightId = document.getElementById('updateFlightId')?.value;
    if (!flightId) return;

    const uiTicket = document.getElementById('updateTicketClass')?.value;
    const airlineId = document.getElementById('updateAirlineId')?.value;
    const airplaneName = document.getElementById('updateAirplaneName')?.value;

    const rawCheckIn = document.getElementById('updateCheckInDate')?.value || '';
    const rawCheckOut = document.getElementById('updateCheckOutDate')?.value || '';
    const rawPrice = document.getElementById('updatePrice')?.value;
    const rawChairs = document.getElementById('updateNumberOfChairs')?.value;

    const checkInFormatted = processDateForPayload(rawCheckIn, false);
    const checkOutFormatted = processDateForPayload(rawCheckOut, true);

    const updatedFlight = {
      ticketClass: uiToApiTicketClass(uiTicket),
      airlineId: parseInt(airlineId),
      airplaneName: airplaneName,
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
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: "Lỗi hệ thống từ server" }));
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
        .catch(err => alert("Lỗi cập nhật: " + err.message));
  }
  window.saveUpdatedFlight = saveUpdatedFlight;

  function createAirline() {
    const name = document.getElementById('newAirlineName')?.value;
    const description = document.getElementById('newAirlineDescription')?.value;

    if (!name || !name.trim()) {
      alert("Vui lòng nhập tên hãng!");
      return;
    }

    fetch('/api/airlines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        airlineName: name,
        description: description
      })
    })
        .then(async res => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || "Lỗi khi thêm hãng bay");
          }
          return res.json();
        })
        .then(() => {
          alert("Thêm hãng bay thành công!");
          document.getElementById('newAirlineName').value = '';
          document.getElementById('newAirlineDescription').value = '';
          closeModal('addAirlineModal');
          fetchAirlines();
        })
        .catch(err => alert("Lỗi: " + err.message));
  }
  window.createAirline = createAirline;

  function openUpdateAirlineModal(id) {
    const airline = allAirlines.find(a => a.id === id);
    if (!airline) return;

    document.getElementById('updateAirlineIdForm').value = airline.id;
    document.getElementById('updateAirlineName').value = airline.airlineName;
    document.getElementById('updateAirlineDescription').value = airline.description || '';
    openModal('updateAirlineModal');
  }
  window.openUpdateAirlineModal = openUpdateAirlineModal;

  function saveUpdatedAirline() {
    const id = document.getElementById('updateAirlineIdForm')?.value;
    const name = document.getElementById('updateAirlineName')?.value;
    const description = document.getElementById('updateAirlineDescription')?.value;

    if (!name || !name.trim()) {
      alert("Tên hãng không được để trống!");
      return;
    }

    fetch(`/api/airlines/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        airlineName: name,
        description: description
      })
    })
        .then(async res => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || "Lỗi cập nhật hãng bay");
          }
          return res.json();
        })
        .then(() => {
          alert("Cập nhật hãng bay thành công!");
          closeModal('updateAirlineModal');
          fetchAirlines();
          fetchFlights();
        })
        .catch(err => alert("Lỗi: " + err.message));
  }
  window.saveUpdatedAirline = saveUpdatedAirline;

  function deleteAirline(id) {
    if(!confirm("Bạn có chắc chắn muốn xóa hãng bay này? Tất cả các chuyến bay thuộc hãng này cũng sẽ được chuyển vào thùng rác!")) return;

    fetch(`/api/airlines/${id}`, { method: 'DELETE' })
        .then(async res => {
          if(res.ok) {
            alert("Xóa hãng bay thành công!");
            fetchAirlines();
            fetchFlights();
          } else {
            const errorData = await res.json().catch(() => ({}));
            alert("Lỗi: " + (errorData.message || "Không thể xóa hãng bay này. Có thể do một chuyến bay đang có khách đặt vé."));
          }
        })
        .catch(err => alert("Lỗi mạng: " + err.message));
  }
  window.deleteAirline = deleteAirline;

  function restoreAirline(id) {
    if (!confirm('Bạn có muốn khôi phục hãng bay này không? Các chuyến bay thuộc hãng cũng sẽ được khôi phục.')) return;

    fetch(`/api/airlines/restore/${id}`, { method: 'PATCH' })
        .then(async res => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: "Lỗi hệ thống từ server" }));
            throw new Error(errorData.message || 'Lỗi server khi khôi phục');
          }
          return res.json();
        })
        .then(data => {
          alert('Khôi phục hãng bay thành công!');
          fetchAirlines();
          fetchFlights();
        })
        .catch(err => alert("Lỗi: " + err.message));
  }
  window.restoreAirline = restoreAirline;

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', () => {
    fetchFlights();
    fetchAirlines();
  });
})();