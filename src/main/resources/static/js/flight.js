'use strict';

(function () {
  // Guard: tránh ảnh hưởng trang khác nếu nhúng nhầm
  if (!document.body || !document.body.classList.contains('hust-flight-page')) return;

  document.addEventListener('DOMContentLoaded', function () {
    initUserMenu();
    initFlightDateStore();
    initFlightsPage();
  });

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

  // ===== ORIGINAL FLIGHT LOGIC =====
  function initFlightsPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');

    const flightList = document.getElementById('flight-list');
    if (!flightList) return;

    flightList.innerHTML = '<div class="loading">Đang tải danh sách chuyến bay...</div>';
    fetchFlights(orderId);
  }

  function fetchFlights(orderId) {
    fetch('/flight/getAll')
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

  function renderFlights(flights, orderId) {
    const flightList = document.getElementById('flight-list');
    if (!flightList) return;

    flightList.innerHTML = '';

    if (!flights || flights.length === 0) {
      showError('Không có chuyến bay nào!');
      return;
    }

    flights.forEach(flight => {
      const flightItem = document.createElement('div');
      flightItem.classList.add('flight-item');

      flightItem.innerHTML = `
        <div class="airline-name">${flight.airlineName}</div>
        <div class="ticket-class">${flight.ticketClass}</div>
        <div class="price">${Number(flight.price || 0).toLocaleString()} VND</div>
        <div class="check-in-date">Ngày đi: ${formatDate(flight.checkInDate)}</div>
        <div class="check-out-date">Ngày về: ${formatDate(flight.checkOutDate)}</div>
        <div class="seat-available">Số ghế còn lại: ${flight.seatAvailable}</div>
        <button class="choose-flight" data-flight-id="${flight.id}" data-order-id="${orderId || ''}" data-flight='${JSON.stringify(flight)}'>
          Chọn chuyến bay
        </button>
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

  // Fallback function: Dùng khi chuyến bay không hỗ trợ chọn ghế
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
    flightList.innerHTML = `<p class="error-message">${message}</p>`;
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

    // Lấy thông tin số người từ Order
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
    // Gọi API lấy danh sách ghế (bao gồm cả ghế đã đặt)
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
    modal.innerHTML = `
      <div class="seat-modal-content">
        <div class="seat-modal-header">
          <h3>Chọn ${requiredSeats} ghế - ${flightData.airlineName}</h3>
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

  // --- HÀM XỬ LÝ ĐẶT VÉ ---
  window.confirmSeatSelection = function() {
    if (selectedSeats.length !== requiredSeats) {
      alert(`Vui lòng chọn đủ ${requiredSeats} ghế để tiếp tục.`);
      return;
    }

    const payload = {
      orderId: currentOrderId,
      flightId: currentFlightId,
      seatNumbers: selectedSeats
    };

    fetch(`/order/chooseFlightWithSeats/${currentOrderId}/${currentFlightId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
        .then(response => response.json())
        .then(result => {
          if (result.code === 1000) {
            alert('Đặt vé thành công!');
            closeSeatModal();
            fetch(`/api/v1/email/${currentOrderId}/announce`, { method: 'POST' });
            setTimeout(() => {
              window.location.href = '/plan-trip';
            }, 500);
          }
          else if (result.code === 1048) {
            alert('Rất tiếc! Một trong số các ghế bạn chọn vừa bị người khác đặt.\n\nHệ thống sẽ cập nhật lại danh sách ghế ngay bây giờ.');
            selectedSeats = [];
            updateSelectionDisplay();
            loadAvailableSeats(currentFlightId, currentFlightData);
          }
          else {
            alert(result.message || 'Lỗi không xác định khi đặt vé!');
          }
        })
        .catch((err) => {
          console.error(err);
          alert('Lỗi kết nối đến máy chủ!');
        });
  };

})();