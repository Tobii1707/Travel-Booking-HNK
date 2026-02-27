'use strict';

(function () {
  if (!document.body || !document.body.classList.contains('hust-admin-seats')) return;

  // ===== STATE/CACHE =====
  const state = {
    airlinesMap: {} // Dùng để lưu trữ Hãng bay
  };

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

  // ===== UTILS: BÓC TÁCH MÁY BAY & HÃNG BAY =====
  function getFlightDetail(flight) {
    if (!flight) return null;

    // Tìm Hãng bay từ object lồng nhau hoặc từ Map
    const airlineObj = flight.airline || state.airlinesMap[flight.airlineId] || {};

    return {
      airlineName: airlineObj.name || airlineObj.airlineName || flight.airlineName || 'Chưa rõ Hãng bay',
      // Quét tất cả các tên biến phổ biến chứa Số hiệu máy bay (Ví dụ: VN-A686)
      flightName: flight.flightNumber || flight.flightCode || flight.airplaneName || flight.airplane || flight.flightName || `Chuyến bay #${flight.id}`,
      ticketClass: flight.ticketClass === 'BUSINESS_CLASS' ? 'Thương gia' : 'Phổ thông'
    };
  }

  // ===== LOAD FLIGHTS & AIRLINES =====
  async function loadFlights() {
    try {
      // Gọi cả 2 API cùng lúc để tối ưu tốc độ
      const [flightRes, airlineRes] = await Promise.all([
        fetch('/flight/getAll').then(res => res.json()),
        fetch('/api/airlines').then(res => res.json())
      ]);

      // 1. Lưu Hãng bay vào Cache
      const airlines = Array.isArray(airlineRes) ? airlineRes : (airlineRes.data || []);
      airlines.forEach(a => { state.airlinesMap[a.id] = a; });

      // 2. Đổ dữ liệu Chuyến bay vào Select Box
      if (flightRes.code === 1000 && flightRes.data) {
        populateFlightSelect(flightRes.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu Chuyến bay/Hãng bay:', error);
    }
  }

  function populateFlightSelect(flights) {
    const select = document.getElementById('flightSelect');
    if (!select) return;

    select.innerHTML = '<option value="">-- Chọn một chuyến bay --</option>';

    flights.forEach(flight => {
      const detail = getFlightDetail(flight);
      const option = document.createElement('option');
      option.value = flight.id;

      // HIỂN THỊ ĐẸP: Hãng bay | Số hiệu | Hạng vé
      option.textContent = `${detail.airlineName} | Số hiệu: ${detail.flightName} (${detail.ticketClass})`;
      option.dataset.flight = JSON.stringify(flight);
      select.appendChild(option);
    });
  }

  // ===== INITIALIZE SEATS =====
  window.initializeSeats = function() {
    const select = document.getElementById('flightSelect');
    const flightId = select.value;

    if (!flightId) {
      alert('Vui lòng chọn một chuyến bay trước!');
      return;
    }

    const selectedOption = select.options[select.selectedIndex];
    const flight = JSON.parse(selectedOption.dataset.flight);
    const numberOfSeats = flight.numberOfChairs;

    if (confirm(`Bạn có chắc chắn muốn tạo ${numberOfSeats} ghế cho chuyến bay này?`)) {
      fetch(`/flight-seats/initialize/${flightId}?numberOfSeats=${numberOfSeats}`, {
        method: 'POST'
      })
          .then(response => response.json())
          .then(data => {
            if (data.code === 1000) {
              alert('Khởi tạo ghế thành công!');
              loadSeats(flightId);
            } else {
              alert('Lỗi: ' + data.message);
            }
          })
          .catch(error => {
            console.error('Lỗi:', error);
            alert('Khởi tạo ghế thất bại!');
          });
    }
  };

  // ===== LOAD SEATS =====
  function loadSeats(flightId) {
    const select = document.getElementById('flightSelect');
    const selectedOption = select.options[select.selectedIndex];
    const flight = JSON.parse(selectedOption.dataset.flight);

    fetch(`/flight-seats/all/${flightId}`)
        .then(response => response.json())
        .then(data => {
          if (data.code === 1000) {
            displayFlightInfo(flight);
            displaySeatMap(data.data);
          }
        })
        .catch(error => console.error('Lỗi khi tải danh sách ghế:', error));
  }

  function displayFlightInfo(flight) {
    const seatInfo = document.getElementById('seatInfo');
    const flightDetails = document.getElementById('flightDetails');

    if (!seatInfo || !flightDetails) return;

    seatInfo.style.display = 'flex';

    // Lấy thông tin đã được bóc tách
    const detail = getFlightDetail(flight);

    // HIỂN THỊ CHI TIẾT ĐẸP VÀ RÕ RÀNG
    flightDetails.innerHTML = `
      <p><strong>Hãng bay:</strong> <span style="color:#2980b9; font-weight:bold;">${detail.airlineName}</span></p>
      <p><strong>Số hiệu MB:</strong> <span style="background:#e8f4fd; padding:3px 8px; border-radius:4px; font-weight:bold;">${detail.flightName}</span></p>
      <p><strong>Hạng vé:</strong> <span style="color:#e67e22; font-weight:bold;">${detail.ticketClass}</span></p>
      <p><strong>Giá vé:</strong> ${Number(flight.price || 0).toLocaleString('vi-VN')} đ</p>
      <p><strong>Tổng ghế:</strong> ${flight.numberOfChairs}</p>
      <p><strong>Còn trống:</strong> ${flight.seatAvailable}</p>
    `;
  }

  function displaySeatMap(seats) {
    const seatMap = document.getElementById('seatMap');
    if (!seatMap) return;

    seatMap.innerHTML = '';

    if (!seats || seats.length === 0) {
      seatMap.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Chưa có ghế nào được tạo. Vui lòng bấm "Khởi tạo ghế" để tạo sơ đồ.</p>';
      return;
    }

    seats.forEach(seat => {
      const seatDiv = document.createElement('div');

      // Ghế được tính là đã đặt nếu: isBooked = true HOẶC có thông tin đơn hàng (seat.order khác null)
      const isBooked = (seat.isBooked === true) || (seat.order && seat.order !== null);

      // Gán class dựa trên logic mới
      seatDiv.className = `seat ${isBooked ? 'booked' : 'available'}`;
      seatDiv.textContent = seat.seatNumber;

      if (isBooked) {
        // Lấy ID đơn hàng an toàn hơn
        const orderId = seat.order ? seat.order.id : 'N/A';
        seatDiv.title = `Đã được đặt bởi Đơn hàng #${orderId}`;
      } else {
        seatDiv.title = 'Còn trống';
      }

      seatMap.appendChild(seatDiv);
    });
  }

  // ===== FLIGHT SELECT CHANGE =====
  document.getElementById('flightSelect')?.addEventListener('change', function() {
    const flightId = this.value;
    if (flightId) {
      loadSeats(flightId);
    } else {
      document.getElementById('seatInfo').style.display = 'none';
      document.getElementById('seatMap').innerHTML = '';
    }
  });

  // ===== INITIALIZE =====
  loadFlights();
})();