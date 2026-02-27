'use strict';

(function () {
  // Guard: tránh ảnh hưởng trang khác nếu nhúng nhầm
  if (!document.body || !document.body.classList.contains('hust-flight-page')) return;

  document.addEventListener('DOMContentLoaded', function () {
    initUserMenu();
    initFlightDateStore();
    initFlightsPage();
  });

  // ===== HELPER FUNCTIONS (Thêm vào để phục vụ giao diện mới) =====
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

    flightList.innerHTML = '<div class="loading">Đang tải danh sách chuyến bay...</div>';
    fetchFlights(globalOrderId);
  }

  function fetchFlights(orderId) {
    fetch('/flight/upcoming')
        .then(response => response.json())
        .then(result => {
          if (result.code === 1000 && result.data) {
            renderFlights(result.data, orderId);
          } else {
            showError('Lỗi tải danh sách chuyến bay!');
          }
        })
        .catch(() => showError('Không thể tải danh sách chuyến bay!'));
  }

  // --- TÌM KIẾM CHUYẾN BAY ---
  window.searchFlightsAPI = function() {
    const from = document.getElementById('searchFrom').value.trim();
    const to = document.getElementById('searchTo').value.trim();

    if(!from || !to) {
      alert("Vui lòng nhập cả điểm đi và điểm đến!");
      return;
    }

    const flightList = document.getElementById('flight-list');
    flightList.innerHTML = '<div class="loading">Đang tìm chuyến bay phù hợp...</div>';

    fetch(`/flight/suggest?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
        .then(res => res.json())
        .then(result => {
          if (result.code === 1000 || result.data) {
            renderFlights(result.data, globalOrderId);
          } else {
            showError(result.message || 'Không tìm thấy chuyến bay nào!');
          }
        })
        .catch(err => showError('Lỗi kết nối khi tìm kiếm!'));
  };

  window.resetFlights = function() {
    document.getElementById('searchFrom').value = '';
    document.getElementById('searchTo').value = '';
    initFlightsPage();
  };

  // -------------------------------------
  // HÀM RENDER ĐÃ ĐƯỢC CHỈNH SỬA CHO GIAO DIỆN NGUYÊN BẢN CỦA YÊU CẦU MỚI
  function renderFlights(flights, orderId) {
    const flightList = document.getElementById('flight-list');
    if (!flightList) return;

    flightList.innerHTML = '';

    if (!flights || flights.length === 0) {
      showError('Không tìm thấy chuyến bay phù hợp!');
      return;
    }

    flights.forEach(flight => {
      // Dữ liệu cho giao diện
      const tenHang = flight.airline?.airlineName || flight.airline?.name || flight.airlineName || 'Chưa rõ hãng bay';
      const soHieu = flight.airplaneName || null;
      const gioDi = extractTime(flight.checkInDate);
      const gioDen = extractTime(flight.checkOutDate);
      const ngayDiFormatted = formatDateNice(flight.checkInDate);

      // --- XỬ LÝ DỊCH HẠNG VÉ ---
      let hangVe = flight.ticketClass || 'Phổ thông';
      if (hangVe === 'NORMAL_CLASS' || hangVe === 'ECONOMY') hangVe = 'Phổ thông';
      else if (hangVe === 'BUSINESS') hangVe = 'Thương gia';
      else if (hangVe === 'FIRST_CLASS') hangVe = 'Hạng nhất';
      // --------------------------

      const flightItem = document.createElement('div');
      flightItem.classList.add('flight-item');

      // Cấu trúc HTML theo CSS Flex/Grid chia 2 cột (Trái: Info, Phải: Nút Chọn)
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
                <div class="detail-tag" title="Hạng vé">
                    <i class="fas fa-ticket-alt"></i> ${hangVe}
                </div>
                <div class="detail-tag" title="Số ghế còn lại" style="color: ${flight.seatAvailable < 10 ? '#e74c3c' : 'inherit'}">
                    <i class="fas fa-chair"></i> Còn ${flight.seatAvailable} ghế
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
                Chọn chuyến bay <i class="fas fa-arrow-right" style="margin-left: 5px; font-size: 0.9em;"></i>
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
      showError('Không tìm thấy orderId. Vui lòng đặt tour trước!');
      return;
    }

    fetch(`/order/chooseFlight/${orderId}/${flightId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
        .then(response => response.json())
        .then(result => {
          if (result.message === 'success' || result.code === 1000) {
            alert('Chọn chuyến bay thành công!');
            window.location.href = '/plan-trip';
          } else {
            alert((result && result.message) || 'Chọn chuyến bay thất bại!');
          }
        })
        .catch(() => alert('Lỗi khi chọn chuyến bay!'));
  }

  function showError(message) {
    const flightList = document.getElementById('flight-list');
    if (!flightList) return;
    flightList.innerHTML = `<p class="error-message" style="text-align:center; width:100%; color: red; font-weight:bold; padding: 20px;">${message}</p>`;
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
  }

  // ===== SEAT SELECTION MODAL =====
  let selectedSeats = [];
  let currentOrderId = null;
  let currentFlightId = null;
  let currentFlightData = null;
  let requiredSeats = 0;

  function openSeatSelectionModal(orderId, flightId, flightData) {
    if (!orderId) {
      showError('Không tìm thấy orderId. Vui lòng đặt tour trước!');
      return;
    }

    currentOrderId = orderId;
    currentFlightId = flightId;
    currentFlightData = flightData;
    selectedSeats = [];

    fetch(`/order/single/${orderId}`)
        .then(response => response.json())
        .then(result => {
          if (result.code === 1000 && result.data) {
            requiredSeats = result.data.numberOfPeople;
            loadAvailableSeats(flightId, flightData);
          } else {
            alert('Không thể tải thông tin đơn hàng');
          }
        })
        .catch(() => alert('Lỗi khi tải thông tin đơn hàng!'));
  }

  function loadAvailableSeats(flightId, flightData) {
    fetch(`/flight-seats/all/${flightId}`)
        .then(response => response.json())
        .then(data => {
          const existingModal = document.getElementById('seatSelectionModal');

          if (data.code === 1000 && data.data && data.data.length > 0) {
            if (!existingModal) {
              showSeatSelectionModal(data.data, flightData);
            } else {
              renderSeats(data.data);
              updateSelectionDisplay();
            }
          } else {
            if (confirm('Chuyến bay này chưa có hệ thống chọn ghế. Bạn có muốn đặt vé ngẫu nhiên không?')) {
              chooseFlightOldWay(currentOrderId, flightId);
            }
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Lỗi khi tải danh sách ghế!');
        });
  }

  function showSeatSelectionModal(seats, flightData) {
    const modal = document.createElement('div');
    modal.id = 'seatSelectionModal';
    modal.className = 'seat-modal';

    // Xử lý tiêu đề Modal đẹp hơn
    const tenHangModal = flightData.airline?.airlineName || flightData.airline?.name || flightData.airlineName || 'Chưa rõ hãng bay';
    const soHieuModal = flightData.airplaneName ? `<span style="font-size: 0.9rem; color: #555; font-weight: normal; background: #eee; padding: 2px 8px; border-radius: 12px; margin-left: 8px;">Tàu bay: ${flightData.airplaneName}</span>` : '';

    modal.innerHTML = `
      <div class="seat-modal-content">
        <div class="seat-modal-header">
          <h3 style="display: flex; align-items: center; justify-content: center; width: 100%;">
            Chọn ${requiredSeats} ghế - ${tenHangModal} ${soHieuModal}
          </h3>
          <span class="seat-close-btn">&times;</span>
        </div>
        <div class="seat-modal-body">
          <div class="seat-legend">
             <span class="dot available"></span> Trống
             <span class="dot selected"></span> Đang chọn
             <span class="dot booked"></span> Đã đặt
          </div>
          <div class="seat-selection-info">
            <p>Đã chọn: <span id="selectedCount">0</span>/${requiredSeats}</p>
            <p>Ghế: <span id="selectedSeats" style="font-weight:bold">...</span></p>
          </div>
          <div class="seat-grid" id="seatGrid"></div>
        </div>
        <div class="seat-modal-footer">
          <button class="btn-cancel-seat" onclick="closeSeatModal()">Hủy</button>
          <button class="btn-confirm-seat" onclick="confirmSeatSelection()">Xác nhận đặt vé</button>
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

    seats.forEach(seat => {
      const seatDiv = document.createElement('div');
      seatDiv.textContent = seat.seatNumber;
      seatDiv.dataset.seatNumber = seat.seatNumber;

      const isBooked = seat.booked === true || seat.isBooked === true;

      if (isBooked) {
        seatDiv.className = 'seat-item booked';
        seatDiv.title = 'Ghế này đã có người đặt';
      } else {
        seatDiv.className = 'seat-item available';

        seatDiv.addEventListener('click', function() {
          toggleSeat(seat.seatNumber, seatDiv);
        });
      }

      seatGrid.appendChild(seatDiv);
    });
  }

  function toggleSeat(seatNumber, seatElement) {
    const index = selectedSeats.indexOf(seatNumber);

    if (index > -1) {
      selectedSeats.splice(index, 1);
      seatElement.classList.remove('selected');
    } else {
      if (selectedSeats.length >= requiredSeats) {
        alert(`Bạn chỉ được chọn tối đa ${requiredSeats} ghế!`);
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

    if (selectedCount) selectedCount.textContent = selectedSeats.length;
    if (selectedSeatsSpan) {
      selectedSeatsSpan.textContent = selectedSeats.length > 0
          ? selectedSeats.join(', ')
          : '...';
    }
  }

  window.closeSeatModal = function() {
    const modal = document.getElementById('seatSelectionModal');
    if (modal) modal.remove();
    selectedSeats = [];
  };

  window.confirmSeatSelection = function() {
    if (selectedSeats.length !== requiredSeats) {
      alert(`Vui lòng chọn đủ ${requiredSeats} ghế để tiếp tục.`);
      return;
    }

    if (!currentOrderId || !currentFlightId) {
      console.error("Lỗi dữ liệu: Thiếu OrderId hoặc FlightId", { currentOrderId, currentFlightId });
      alert("Lỗi hệ thống: Không tìm thấy mã đơn hàng. Vui lòng tải lại trang và thử lại.");
      return;
    }

    const payload = {
      orderId: parseInt(currentOrderId),
      flightId: parseInt(currentFlightId),
      seatNumbers: selectedSeats
    };

    console.log("Đang gửi dữ liệu lên server:", payload);

    fetch(`/order/chooseFlightWithSeats/${currentOrderId}/${currentFlightId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Lỗi kết nối Server (Mã lỗi: ${response.status})`);
          }
          return response.json();
        })
        .then(result => {
          if (result.code === 1000) {
            alert('Đặt vé thành công!');
            closeSeatModal();
            fetch(`/api/v1/email/${currentOrderId}/announce`, { method: 'POST' }).catch(console.error);

            setTimeout(() => {
              window.location.href = '/plan-trip';
            }, 500);
          }
          else if (result.code === 1048 || result.code === 7777) {
            alert('Thông báo: ' + (result.message || 'Có lỗi xảy ra khi đặt ghế.'));
            if(result.code === 1048) {
              selectedSeats = [];
              updateSelectionDisplay();
              loadAvailableSeats(currentFlightId, currentFlightData);
            }
          }
          else {
            alert('Lỗi: ' + (result.message || 'Không xác định'));
          }
        })
        .catch((err) => {
          console.error("Chi tiết lỗi:", err);
          alert('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng hoặc thử lại sau.');
        });
  };

})();