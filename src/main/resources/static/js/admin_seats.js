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

    const airlineObj = flight.airline || state.airlinesMap[flight.airlineId] || {};

    return {
      airlineName: airlineObj.name || airlineObj.airlineName || flight.airlineName || 'Chưa rõ Hãng bay',
      flightName: flight.flightNumber || flight.flightCode || flight.airplaneName || flight.airplane || flight.flightName || `Chuyến bay #${flight.id}`,
      ticketClass: flight.ticketClass === 'BUSINESS_CLASS' ? 'Thương gia' : 'Phổ thông'
    };
  }

  // ===== LOAD FLIGHTS & AIRLINES =====
  async function loadFlights() {
    try {
      const [flightRes, airlineRes] = await Promise.all([
        fetch('/flight/getAll').then(res => res.json()),
        fetch('/api/airlines').then(res => res.json())
      ]);

      const airlines = Array.isArray(airlineRes) ? airlineRes : (airlineRes.data || []);
      airlines.forEach(a => { state.airlinesMap[a.id] = a; });

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
    const detail = getFlightDetail(flight);

    flightDetails.innerHTML = `
      <p><strong>Hãng bay:</strong> <span style="color:#2980b9; font-weight:bold;">${detail.airlineName}</span></p>
      <p><strong>Số hiệu MB:</strong> <span style="background:#e8f4fd; padding:3px 8px; border-radius:4px; font-weight:bold;">${detail.flightName}</span></p>
      <p><strong>Hạng vé:</strong> <span style="color:#e67e22; font-weight:bold;">${detail.ticketClass}</span></p>
      <p><strong>Giá vé:</strong> ${Number(flight.price || 0).toLocaleString('vi-VN')} đ</p>
      <p><strong>Tổng ghế:</strong> ${flight.numberOfChairs}</p>
      <p><strong>Còn trống:</strong> ${flight.seatAvailable}</p>
    `;
  }

  // ===== CHỈNH SỬA LOGIC HIỂN THỊ SƠ ĐỒ GHẾ (ADMIN) =====
  function displaySeatMap(seats) {
    const seatMap = document.getElementById('seatMap');
    if (!seatMap) return;

    seatMap.innerHTML = '';

    if (!seats || seats.length === 0) {
      seatMap.innerHTML = '<p style="text-align: center; width: 100%; padding: 20px;">Chưa có ghế nào được tạo. Vui lòng bấm "Khởi tạo ghế" để tạo sơ đồ.</p>';
      return;
    }

    // Thêm class máy bay để nhận CSS Premium
    seatMap.classList.add('airplane-seat-map');

    const rows = {};
    const otherSeats = [];

    // Bước 1: Nhóm ghế theo hàng
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

    // Bước 2: Render từng hàng
    sortedRowNums.forEach(rowNum => {
      const rowSeats = rows[rowNum];
      rowSeats.sort((a, b) => a.colLetter.localeCompare(b.colLetter));

      // Thêm vạch ngăn khoang (Ví dụ sau hàng 4 là hạng Phổ thông)
      if (parseInt(rowNum) === 5) {
        const divider = document.createElement('div');
        divider.className = 'seat-row cabin-divider';
        seatMap.appendChild(divider);
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
        const seatDiv = createAdminSeatElement(seat);
        // Phân bổ 3-3 (A,B,C và D,E,F)
        if (['A', 'B', 'C'].includes(seat.colLetter)) {
          leftGroup.appendChild(seatDiv);
        } else {
          rightGroup.appendChild(seatDiv);
        }
      });

      rowDiv.appendChild(leftGroup);
      rowDiv.appendChild(aisle);
      rowDiv.appendChild(rightGroup);
      seatMap.appendChild(rowDiv);
    });

    // Xử lý ghế lỗi/không theo quy chuẩn
    if (otherSeats.length > 0) {
      const otherDiv = document.createElement('div');
      otherDiv.className = 'seat-row other-seats';
      otherSeats.forEach(seat => otherDiv.appendChild(createAdminSeatElement(seat)));
      seatMap.appendChild(otherDiv);
    }
  }

  // Hàm tạo Element ghế cho Admin (giữ nguyên logic check Order)
  function createAdminSeatElement(seat) {
    const seatDiv = document.createElement('div');
    seatDiv.textContent = seat.colLetter || seat.seatNumber;

    // Logic kiểm tra trạng thái đặt chỗ dành riêng cho Admin
    const isBooked = (seat.isBooked === true) || (seat.order && seat.order !== null);

    seatDiv.className = `seat-item ${isBooked ? 'booked' : 'available'}`;

    if (isBooked) {
      const orderId = seat.order ? seat.order.id : 'N/A';
      seatDiv.title = `Đã đặt - Đơn hàng #${orderId}`;
    } else {
      seatDiv.title = `Ghế ${seat.seatNumber} - Trống`;
    }

    return seatDiv;
  }

  // ===== FLIGHT SELECT CHANGE =====
  document.getElementById('flightSelect')?.addEventListener('change', function() {
    const flightId = this.value;
    if (flightId) {
      loadSeats(flightId);
    } else {
      document.getElementById('seatInfo').style.display = 'none';
      document.getElementById('seatMap').innerHTML = '';
      document.getElementById('seatMap').classList.remove('airplane-seat-map');
    }
  });

  // INITIALIZE
  loadFlights();
})();