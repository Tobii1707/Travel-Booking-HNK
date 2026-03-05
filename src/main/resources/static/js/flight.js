'use strict';

(function () {
  if (!document.body || !document.body.classList.contains('hust-flight-page')) return;

  let globalHolidayPolicies = [];

  document.addEventListener('DOMContentLoaded', function () {
    initUserMenu();
    initFlightDateStore();
    fetchHolidayPolicies();
    initFlightsPage();
  });

  // ===== HELPER FUNCTIONS =====
  function extractTime(isoString) {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? '--:--' : date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDateNice(isoString) {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('vi-VN');
  }

  function formatCurrency(amount) {
    return Number(amount || 0).toLocaleString('vi-VN');
  }

  // TẢI CHÍNH SÁCH TỪ DATABASE
  function fetchHolidayPolicies() {
    fetch('/flight/holiday-policies')
        .then(res => res.json())
        .then(result => {
          if (result.code === 1000 && result.data) {
            globalHolidayPolicies = result.data;
          } else if (Array.isArray(result)) {
            globalHolidayPolicies = result;
          }
        })
        .catch(err => console.error("Lỗi khi tải chính sách giá:", err));
  }

  function getHolidayPolicy(isoString) {
    if (!isoString || globalHolidayPolicies.length === 0) return null;

    const flightTime = new Date(isoString).getTime();
    if (isNaN(flightTime)) return null;

    for (let i = 0; i < globalHolidayPolicies.length; i++) {
      const policy = globalHolidayPolicies[i];

      const pStart = policy.startDate || policy.start_date || policy.fromDate;
      const pEnd = policy.endDate || policy.end_date || policy.toDate;

      if (!pStart || !pEnd) continue;

      const startTime = new Date(pStart).getTime();
      const endTime = new Date(pEnd).getTime() + 86399999;

      if (flightTime >= startTime && flightTime <= endTime) {
        const pName = policy.name || policy.policyName || policy.title || 'Sự kiện';

        let pMarkup = 0;
        if (policy.increasePercentage !== undefined) pMarkup = policy.increasePercentage;
        else if (policy.percentage !== undefined) pMarkup = policy.percentage;
        else if (policy.value !== undefined) pMarkup = policy.value;

        return {
          name: String(pName),
          markup: parseFloat(pMarkup) || 0
        };
      }
    }
    return null;
  }

  // [ĐÃ FIX LỖI]: KHÔNG TỰ ĐỘNG NHÂN % NỮA, TÔN TRỌNG GIÁ GỐC 100%
  function calculateSeatFinalPrice(seatObj, baseFlightPrice) {
    let seatBasePrice = Number(seatObj.price);
    // Nếu backend chưa có giá riêng cho từng ghế thì lấy đúng giá của chuyến bay
    if (isNaN(seatBasePrice) || seatBasePrice === 0) {
      return baseFlightPrice;
    }
    return seatBasePrice;
  }
  // ================================================================

  // ===== USER MENU =====
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

  // ===== STORE FLIGHT DATE =====
  function initFlightDateStore() {
    const flightDateInput = document.querySelector('input[name="flightDate"]');
    if (!flightDateInput) return;

    flightDateInput.addEventListener('change', function () {
      localStorage.setItem('flightDate', this.value);
    });
  }

  // ===== FLIGHT LOGIC =====
  let globalOrderId = null;

  function initFlightsPage() {
    const urlParams = new URLSearchParams(window.location.search);
    globalOrderId = urlParams.get('orderId');

    const flightList = document.getElementById('flight-list');
    if (!flightList) return;

    flightList.innerHTML = '<div class="loading">Đang tìm kiếm các chuyến bay tốt nhất...</div>';
    fetchFlights(globalOrderId);
  }

  function fetchFlights(orderId) {
    fetch('/flight/upcoming')
        .then(response => response.json())
        .then(result => {
          if (result.code === 1000 && result.data) {
            renderFlights(result.data, orderId);
          } else {
            showError('Rất tiếc, hiện tại không thể tải danh sách chuyến bay. Vui lòng thử lại sau!');
          }
        })
        .catch(() => showError('Kết nối bị gián đoạn. Không thể tải danh sách chuyến bay!'));
  }

  // --- TÌM KIẾM CHUYẾN BAY ---
  window.searchFlightsAPI = function() {
    const from = document.getElementById('searchFrom').value.trim();
    const to = document.getElementById('searchTo').value.trim();

    if(!from || !to) {
      alert("Vui lòng cho chúng tôi biết bạn muốn đi từ đâu và đến đâu nhé!");
      return;
    }

    const flightList = document.getElementById('flight-list');
    flightList.innerHTML = '<div class="loading">Hệ thống đang quét các chuyến bay phù hợp...</div>';

    fetch(`/flight/suggest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
        .then(res => res.json())
        .then(result => {
          if (result.code === 1000 || result.data) {
            renderFlights(result.data, globalOrderId);
          } else {
            showError(result.message || 'Không tìm thấy chuyến bay nào phù hợp với hành trình của bạn.');
          }
        })
        .catch(err => showError('Lỗi kết nối mạng khi tìm kiếm chuyến bay!'));
  };

  window.resetFlights = function() {
    document.getElementById('searchFrom').value = '';
    document.getElementById('searchTo').value = '';
    initFlightsPage();
  };

  function renderFlights(flights, orderId) {
    const flightList = document.getElementById('flight-list');
    if (!flightList) return;

    flightList.innerHTML = '';

    if (!flights || flights.length === 0) {
      showError('Hiện không có chuyến bay nào trống cho chặng này.');
      return;
    }

    flights.forEach(flight => {
      const tenHang = flight.airline?.airlineName || flight.airline?.name || flight.airlineName || 'Đang cập nhật hãng bay';
      const soHieu = flight.airplaneName || null;
      const gioDi = extractTime(flight.checkInDate);
      const gioDen = extractTime(flight.checkOutDate);
      const ngayDiFormatted = formatDateNice(flight.checkInDate);

      let hangVe = flight.ticketClass || 'Phổ thông';
      if (hangVe === 'NORMAL_CLASS' || hangVe === 'ECONOMY') hangVe = 'Phổ thông';
      else if (hangVe === 'BUSINESS') hangVe = 'Thương gia';
      else if (hangVe === 'FIRST_CLASS') hangVe = 'Hạng nhất';

      const flightItem = document.createElement('div');
      flightItem.classList.add('flight-item');

      flightItem.innerHTML = `
        <div class="flight-info-left">
            <div class="airline-badge">
                <i class="fas fa-plane-departure" style="color: var(--primary);"></i>
                <span class="airline-name-txt">${tenHang}</span>
                ${soHieu ? `<span class="airplane-code">${soHieu}</span>` : ''}
            </div>

            <div class="route-time-container">
                <div class="time-point dept">
                    <div class="huge-time">${gioDi}</div>
                    <div class="location-code">${flight.departureLocation || 'N/A'}</div>
                </div>

                <div class="route-arrow-visual">
                    <div class="route-line"></div>
                </div>

                <div class="time-point arr">
                    <div class="huge-time">${gioDen}</div>
                    <div class="location-code">${flight.arrivalLocation || 'N/A'}</div>
                </div>
            </div>

            <div class="secondary-details">
                <div class="detail-tag" title="Ngày khởi hành">
                    <i class="far fa-calendar-alt"></i> ${ngayDiFormatted}
                </div>
                <div class="detail-tag" title="Hạng vé tiêu chuẩn">
                    <i class="fas fa-ticket-alt"></i> ${hangVe}
                </div>
                <div class="detail-tag" title="Số ghế trống" style="color: ${flight.seatAvailable < 10 ? '#e74c3c' : 'inherit'}">
                    <i class="fas fa-chair"></i> Còn ${flight.seatAvailable} chỗ
                </div>
            </div>
        </div>

        <div class="flight-action-right">
            <div class="price-tag-huge">
                ${formatCurrency(flight.price)} <span class="price-unit">VND</span>
            </div>
            <button class="choose-flight-btn choose-flight" 
                    data-flight-id="${flight.id}" 
                    data-order-id="${orderId || ''}" 
                    data-flight='${JSON.stringify(flight)}'>
                Chọn chuyến này <i class="fas fa-arrow-right" style="margin-left: 5px; font-size: 0.9em;"></i>
            </button>
        </div>
      `;

      flightList.appendChild(flightItem);
    });

    document.querySelectorAll('.choose-flight').forEach(button => {
      button.addEventListener('click', function () {
        const flightId = this.getAttribute('data-flight-id');
        const flightData = JSON.parse(this.getAttribute('data-flight'));
        openSeatSelectionModal(orderId, flightId, flightData);
      });
    });
  }

  function chooseFlightOldWay(orderId, flightId) {
    if (!orderId) {
      alert('Hệ thống cần mã đơn hàng để tiếp tục. Vui lòng tiến hành Đặt tour trước nhé!');
      return;
    }

    fetch(`/order/chooseFlight/${orderId}/${flightId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
        .then(response => response.json())
        .then(result => {
          if (result.message === 'success' || result.code === 1000) {
            alert('Lưu chuyến bay thành công! Đang chuyển hướng đến trang thanh toán...');
            window.location.href = '/plan-trip';
          } else {
            alert((result && result.message) || 'Có lỗi xảy ra khi chọn chuyến bay. Vui lòng thử lại!');
          }
        })
        .catch(() => alert('Lỗi kết nối. Không thể hoàn tất thao tác!'));
  }

  function showError(message) {
    const flightList = document.getElementById('flight-list');
    if (!flightList) return;
    flightList.innerHTML = `<p class="error-message" style="text-align:center; width:100%; color: #e74c3c; font-weight:500; padding: 20px;"><i class="fas fa-exclamation-circle"></i> ${message}</p>`;
  }

  // ===== SEAT SELECTION MODAL =====
  let selectedSeats = [];
  let currentOrderId = null;
  let currentFlightId = null;
  let currentFlightData = null;
  let requiredSeats = 0;
  let currentSeatsList = [];

  function openSeatSelectionModal(orderId, flightId, flightData) {
    currentOrderId = orderId;
    currentFlightId = flightId;
    currentFlightData = flightData;
    selectedSeats = [];
    currentSeatsList = [];

    if (orderId) {
      fetch(`/order/single/${orderId}`)
          .then(response => response.json())
          .then(result => {
            if (result.code === 1000 && result.data) {
              requiredSeats = result.data.numberOfPeople;
              loadAvailableSeats(flightId, flightData);
            } else {
              alert('Hệ thống không tìm thấy thông tin số lượng khách trong đơn hàng của bạn.');
            }
          })
          .catch(() => alert('Không thể trích xuất dữ liệu khách hàng!'));
    } else {
      requiredSeats = 1;
      loadAvailableSeats(flightId, flightData);
    }
  }

  function loadAvailableSeats(flightId, flightData) {
    fetch(`/flight-seats/all/${flightId}`)
        .then(response => response.json())
        .then(data => {
          const existingModal = document.getElementById('seatSelectionModal');

          if (data.code === 1000 && data.data && data.data.length > 0) {
            currentSeatsList = data.data;

            if (!existingModal) {
              showSeatSelectionModal(data.data, flightData);
            } else {
              renderSeats(data.data);
              updateSelectionDisplay();
            }
          } else {
            if (confirm('Hiện tại chuyến bay này chưa hỗ trợ chọn ghế trực tuyến. Bạn có muốn hệ thống sắp xếp chỗ tự động không?')) {
              chooseFlightOldWay(currentOrderId, flightId);
            }
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Không thể tải sơ đồ chỗ ngồi lúc này. Xin bạn thử lại sau ít phút!');
        });
  }

  function showSeatSelectionModal(seats, flightData) {
    const modal = document.createElement('div');
    modal.id = 'seatSelectionModal';
    modal.className = 'seat-modal';

    const tenHangModal = flightData.airline?.airlineName || flightData.airline?.name || flightData.airlineName || 'Đang cập nhật';
    const soHieuModal = flightData.airplaneName ? `<span style="font-size: 0.9rem; color: #fff; font-weight: normal; background: rgba(0,0,0,0.2); padding: 4px 10px; border-radius: 12px; margin-left: 8px;">Máy bay: ${flightData.airplaneName}</span>` : '';

    const headerTitle = currentOrderId
        ? `Lựa chọn ${requiredSeats} vị trí - ${tenHangModal} ${soHieuModal}`
        : `Sơ đồ ghế tham khảo - ${tenHangModal} ${soHieuModal}`;

    // TẠO KHỐI HIỂN THỊ CHÍNH SÁCH
    let policyHTML = '';
    const baseFlightPrice = Number(flightData.price) || 0;
    const holidayInfo = getHolidayPolicy(flightData.checkInDate);

    // 1. Thông báo dịp lễ/Sự kiện
    let holidayMsg = '';
    if (holidayInfo) {
      if (holidayInfo.markup > 0) {
        holidayMsg = `<li><i class="fas fa-calendar-star" style="color:#e74c3c;"></i> Giai đoạn <b>${holidayInfo.name}</b>: Giá vé đang áp dụng mức phụ thu <b>${Math.abs(holidayInfo.markup)}%</b>.</li>`;
      } else {
        holidayMsg = `<li><i class="fas fa-gift" style="color:#2ecc71;"></i> Chương trình <b>${holidayInfo.name}</b>: Nhận ưu đãi giảm <b>${Math.abs(holidayInfo.markup)}%</b> / vé.</li>`;
      }
    } else {
      holidayMsg = `<li><i class="fas fa-check-circle" style="color:#29b862;"></i> Áp dụng biểu giá vé tiêu chuẩn (không phát sinh phụ phí).</li>`;
    }

    // 2. Thông báo phân hạng (Dựa theo giá trả về từ DB, KHÔNG TỰ NHÂN)
    const finalPrices = seats.map(s => calculateSeatFinalPrice(s, baseFlightPrice));
    const uniquePrices = [...new Set(finalPrices)].filter(p => !isNaN(p) && p > 0).sort((a, b) => a - b);

    let classMsg = '';
    if (uniquePrices.length > 1) {
      const maxPrice = uniquePrices[uniquePrices.length - 1];
      const minPrice = uniquePrices[0];
      const diff = maxPrice - minPrice;

      classMsg = `<li><i class="fas fa-crown" style="color:#f39c12;"></i> Nâng hạng Thương gia / Đặc biệt: <b>+${formatCurrency(diff)} đ</b>.</li>`;
    } else {
      classMsg = `<li><i class="fas fa-couch" style="color:#3498db;"></i> Toàn bộ các vị trí trên sơ đồ hiện đang đồng giá.</li>`;
    }

    policyHTML = `
        <div style="margin-top: 15px; padding: 12px 15px; background: #fdfdfd; border-left: 4px solid var(--primary); border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <strong style="color: var(--text-dark); font-size: 0.95rem;">
                <i class="fas fa-info-circle" style="color: var(--primary);"></i> Thông tin biểu giá chuyến bay:
            </strong>
            <ul style="margin: 8px 0 0 5px; padding-left: 20px; font-size: 0.85rem; color: #555; line-height: 1.6;">
                ${holidayMsg}
                ${classMsg}
            </ul>
        </div>
    `;

    modal.innerHTML = `
      <div class="seat-modal-content">
        <div class="seat-modal-header">
          <h3 style="display: flex; align-items: center; justify-content: center; width: 100%;">
            ${headerTitle}
          </h3>
          <span class="seat-close-btn" title="Đóng">&times;</span>
        </div>
        <div class="seat-modal-body">
          
          <div class="seat-selection-info">
            <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 5px;">
                <div>
                    <p style="color: #666; font-size: 0.9rem;">Hành khách: <b><span id="selectedCount">0</span>/${currentOrderId ? requiredSeats : '...'}</b> người</p>
                    <p style="color: #666; font-size: 0.9rem;">Vị trí đã chọn: <span id="selectedSeats" style="font-weight:bold; color:var(--primary);">Chưa chọn</span></p>
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 0.85rem; color: #888; text-transform:uppercase; font-weight:600;">Tổng thanh toán</span><br/>
                    <span id="totalPrice" style="font-size: 1.6rem; font-weight: 800; color: var(--danger);">0 đ</span>
                </div>
            </div>
            ${policyHTML}
          </div>

          <div class="seat-legend">
             <span class="dot available"></span> Vị trí trống
             <span class="dot selected"></span> Đang chọn
             <span class="dot booked"></span> Đã được đặt
          </div>
          <div class="seat-grid" id="seatGrid"></div>
        </div>
        <div class="seat-modal-footer">
          <button class="btn-cancel-seat" onclick="closeSeatModal()">Quay lại</button>
          <button class="btn-confirm-seat" onclick="confirmSeatSelection()">Xác nhận & Tiếp tục</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    renderSeats(seats);

    modal.querySelector('.seat-close-btn').addEventListener('click', closeSeatModal);
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeSeatModal();
    });
  }

  function renderSeats(seats) {
    const seatGrid = document.getElementById('seatGrid');
    if (!seatGrid) return;

    seatGrid.innerHTML = '';
    seatGrid.classList.add('airplane-seat-map');

    const rows = {};
    const otherSeats = [];

    seats.forEach(seat => {
      const match = seat.seatNumber.match(/^(\d+)([a-zA-Z]+)$/);
      if (match) {
        const rowNum = parseInt(match[1], 10);
        const colLetter = match[2].toUpperCase();
        if (!rows[rowNum]) rows[rowNum] = [];
        rows[rowNum].push({ ...seat, rowNum, colLetter });
      } else {
        otherSeats.push(seat);
      }
    });

    const sortedRowNums = Object.keys(rows).sort((a, b) => parseInt(a) - parseInt(b));

    const bizLabel = document.createElement('div');
    bizLabel.className = 'seat-row cabin-divider business';
    seatGrid.appendChild(bizLabel);

    sortedRowNums.forEach(rowNum => {
      const rowSeats = rows[rowNum];
      rowSeats.sort((a, b) => a.colLetter.localeCompare(b.colLetter));

      if (parseInt(rowNum) === 4) {
        const ecoLabel = document.createElement('div');
        ecoLabel.className = 'seat-row cabin-divider economy';
        seatGrid.appendChild(ecoLabel);
      }

      const rowDiv = document.createElement('div');
      rowDiv.className = 'seat-row';

      const leftGroup = document.createElement('div');
      leftGroup.className = 'seat-group left-side';

      const rightGroup = document.createElement('div');
      rightGroup.className = 'seat-group right-side';

      const aisle = document.createElement('div');
      aisle.className = 'aisle';
      aisle.textContent = rowNum;

      rowSeats.forEach(seat => {
        const seatDiv = createSeatElement(seat);
        if (['A', 'B', 'C'].includes(seat.colLetter)) {
          leftGroup.appendChild(seatDiv);
        } else {
          rightGroup.appendChild(seatDiv);
        }
      });

      rowDiv.appendChild(leftGroup);
      rowDiv.appendChild(aisle);
      rowDiv.appendChild(rightGroup);

      seatGrid.appendChild(rowDiv);
    });

    if (otherSeats.length > 0) {
      const otherDiv = document.createElement('div');
      otherDiv.className = 'seat-row other-seats';
      otherSeats.forEach(seat => {
        otherDiv.appendChild(createSeatElement(seat));
      });
      seatGrid.appendChild(otherDiv);
    }
  }

  function createSeatElement(seat) {
    const seatDiv = document.createElement('div');
    seatDiv.textContent = seat.colLetter || seat.seatNumber;
    seatDiv.dataset.seatNumber = seat.seatNumber;

    const isBooked = seat.booked === true || seat.isBooked === true;

    // Chỉ gọi hàm lấy giá trị, không nhân thêm phần trăm
    const baseFlightPrice = Number(currentFlightData.price) || 0;
    const finalSeatPrice = calculateSeatFinalPrice(seat, baseFlightPrice);
    const isPremium = finalSeatPrice > baseFlightPrice;

    if (isBooked) {
      seatDiv.className = 'seat-item booked';
      seatDiv.title = `Rất tiếc! Vị trí ${seat.seatNumber} đã được đặt.`;
    } else {
      seatDiv.className = 'seat-item available';

      if (isPremium) {
        seatDiv.title = `Ghế ${seat.seatNumber} (Thương gia) | ${formatCurrency(finalSeatPrice)} đ`;
        seatDiv.style.borderColor = '#f39c12';
      } else {
        seatDiv.title = `Ghế ${seat.seatNumber} (Tiêu chuẩn) | ${formatCurrency(finalSeatPrice)} đ`;
      }

      if (selectedSeats && selectedSeats.includes(seat.seatNumber)) {
        seatDiv.classList.add('selected');
      }

      seatDiv.addEventListener('click', function() {
        toggleSeat(seat.seatNumber, seatDiv);
      });
    }
    return seatDiv;
  }

  function toggleSeat(seatNumber, seatElement) {
    const index = selectedSeats.indexOf(seatNumber);

    if (index > -1) {
      selectedSeats.splice(index, 1);
      seatElement.classList.remove('selected');
    } else {
      if (selectedSeats.length >= requiredSeats) {
        alert(`Rất tiếc, đơn hàng của bạn chỉ bao gồm ${requiredSeats} hành khách. Bạn không thể chọn dư ghế!`);
        return;
      }
      selectedSeats.push(seatNumber);
      seatElement.classList.add('selected');
    }

    updateSelectionDisplay();
  }

  function updateSelectionDisplay() {
    const selectedCount = document.getElementById('selectedCount');
    const selectedSeatsSpan = document.getElementById('selectedSeats');
    const totalPriceSpan = document.getElementById('totalPrice');

    if (selectedCount) selectedCount.textContent = selectedSeats.length;
    if (selectedSeatsSpan) {
      selectedSeatsSpan.textContent = selectedSeats.length > 0
          ? selectedSeats.join(', ')
          : 'Chưa chọn';
    }

    if (totalPriceSpan) {
      let total = 0;
      const baseFlightPrice = Number(currentFlightData.price) || 0;

      selectedSeats.forEach(seatNum => {
        const seatObj = currentSeatsList.find(s => s.seatNumber === seatNum);
        if (seatObj) {
          // Tính tổng chỉ dựa trên giá thật, tuyệt đối không cộng thêm % markup nữa
          const finalPrice = calculateSeatFinalPrice(seatObj, baseFlightPrice);
          if (!isNaN(finalPrice)) {
            total += finalPrice;
          }
        }
      });

      if (total > 0 && !isNaN(total)) {
        totalPriceSpan.innerHTML = `${formatCurrency(total)} <span style="font-size:1rem; font-weight:normal; color:#666;">đ</span>`;
      } else {
        totalPriceSpan.innerHTML = `0 đ`;
      }
    }
  }

  window.closeSeatModal = function() {
    const modal = document.getElementById('seatSelectionModal');
    if (modal) modal.remove();
    selectedSeats = [];
    currentSeatsList = [];
  };

  window.confirmSeatSelection = function() {
    if (!currentOrderId) {
      alert("Hệ thống nhận thấy bạn chưa có đơn đặt tour. Vui lòng hoàn tất Đặt tour trước khi chọn ghế máy bay nhé!");
      return;
    }

    if (selectedSeats.length !== requiredSeats) {
      alert(`Xin lưu ý: Bạn cần chọn đủ ${requiredSeats} vị trí tương ứng với số hành khách trước khi thanh toán.`);
      return;
    }

    if (!currentFlightId) {
      alert("Đã xảy ra lỗi không xác định với hệ thống chuyến bay. Vui lòng tải lại trang.");
      return;
    }

    const payload = {
      orderId: parseInt(currentOrderId),
      flightId: parseInt(currentFlightId),
      seatNumbers: selectedSeats
    };

    fetch(`/order/chooseFlightWithSeats/${currentOrderId}/${currentFlightId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
        .then(response => {
          if (!response.ok) throw new Error(`Mất kết nối máy chủ`);
          return response.json();
        })
        .then(result => {
          if (result.code === 1000) {
            alert('Tuyệt vời! Chỗ ngồi của bạn đã được giữ thành công. Đang chuyển hướng đến bước Thanh toán...');
            closeSeatModal();
            fetch(`/api/v1/email/${currentOrderId}/announce`, { method: 'POST' }).catch(console.error);

            setTimeout(() => {
              window.location.href = '/plan-trip';
            }, 800);
          }
          else if (result.code === 1048 || result.code === 7777) {
            alert('Thông báo: ' + (result.message || 'Ghế bạn chọn vừa bị khách hàng khác đặt mất. Xin vui lòng chọn lại vị trí khác.'));
            if(result.code === 1048) {
              selectedSeats = [];
              updateSelectionDisplay();
              loadAvailableSeats(currentFlightId, currentFlightData);
            }
          }
          else {
            alert('Thao tác không thành công: ' + (result.message || 'Lỗi không xác định.'));
          }
        })
        .catch(() => alert('Lỗi kết nối. Không thể hoàn tất quá trình giữ chỗ!'));
  };

})();