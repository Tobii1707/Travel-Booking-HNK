'use strict';

(function () {
  if (!document.body || !document.body.classList.contains('hust-admin-trip')) return;

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
      userMenu.style.display = userMenu.style.display === 'flex' ? 'none' : 'flex';
    });
    document.addEventListener('click', function (event) {
      if (!userIcon.contains(event.target) && !userMenu.contains(event.target)) {
        userMenu.style.display = 'none';
      }
    });
  }

  // ===== STATE =====
  let currentOrderId = null;
  let currentPage = 0;
  const pageSize = 5;
  let isSearchMode = false;
  let currentSearchQuery = '';
  let allOrdersData = []; // Cache dữ liệu để hiển thị popup

  // ===== HELPERS =====
  function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString('vi-VN');
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  }

  // ===== RENDER BẢNG (LOGIC MỚI) =====
  function renderOrderTable(orders) {
    allOrdersData = orders; // Cập nhật cache
    const tableBody = document.querySelector('#bookingTable tbody');
    if (!tableBody) return;

    if (!Array.isArray(orders) || orders.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center">${isSearchMode ? 'Không tìm thấy kết quả' : 'Không có đơn hàng'}</td></tr>`;
      return;
    }

    tableBody.innerHTML = '';

    orders.forEach(order => {
      const row = document.createElement('tr');

      let statusClass = '';
      let statusText = 'Chưa thanh toán';
      if (order.payment) {
        if (order.payment.status === 'PAID') { statusClass = 'status-paid'; statusText = 'Đã thanh toán'; }
        else if (order.payment.status === 'VERIFYING') { statusClass = 'status-verifying'; statusText = 'Đang xác thực'; }
        else if (order.payment.status === 'PAYMENT_FAILED') { statusClass = 'status-unpaid'; statusText = 'Thất bại'; }
      }

      // Logic Hành trình:
      let journey = `<span>${order.destination || 'N/A'}</span>`;
      if (order.flight) {
        journey = `<div style="font-size:0.85em; color:#666">${order.flight.departureLocation || '...'}</div>
                   <div style="font-weight:600; color:#2c3e50;">➔ ${order.flight.arrivalLocation || order.destination}</div>`;
      }

      // Số người (mặc định là 1 nếu null)
      const peopleCount = order.numberOfPeople || 1;

      row.innerHTML = `
        <td>${order.id}</td>
        <td>${formatDateTime(order.orderDate)}</td>
        <td>${order.user ? order.user.fullName : 'Guest'}</td>
        
        <td class="text-center"><span class="badge-people">${peopleCount} <i class="fas fa-user-friends"></i></span></td>
        
        <td>${journey}</td>
        
        <td class="text-center">
            ${order.flight ? `<button class="btn-eye" onclick="showFlightDetails(${order.id})"><i class="fas fa-plane"></i></button>` : '-'}
        </td>
        
        <td class="text-center">
            ${order.hotel ? `<button class="btn-eye" onclick="showHotelDetails(${order.id})"><i class="fas fa-hotel"></i></button>` : '-'}
        </td>
        
        <td>
          <div style="display:flex; align-items:center; justify-content:space-between; gap:5px;">
            <b style="color:#d35400;">${Number(order.totalPrice || 0).toLocaleString()} đ</b>
            <button class="btn-eye-price" onclick="showPriceDetails(${order.id})"><i class="fas fa-file-invoice-dollar"></i></button>
          </div>
        </td>
        
        <td class="${statusClass}">${statusText}</td>
        
        <td>
          ${order.payment && order.payment.status === 'VERIFYING'
          ? `<button class="confirm-btn btn-verify" onclick="openPaymentModal(${order.id})">Xác thực</button>`
          : ''}
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  // ===== POPUPS CHI TIẾT (ĐÃ CẬP NHẬT THEO YÊU CẦU) =====

  // 1. Chi tiết Khách sạn (Thêm ngày nhận/trả)
  window.showHotelDetails = (orderId) => {
    const order = allOrdersData.find(o => o.id === orderId);
    if (!order || !order.hotel) return;

    // Tính số đêm
    let nights = 1;
    if(order.startHotel && order.endHotel) {
      nights = Math.ceil(Math.abs(new Date(order.endHotel) - new Date(order.startHotel)) / (1000 * 60 * 60 * 24)) || 1;
    }

    const html = `
        <div class="info-card">
            <h4 style="color:var(--primary); margin-bottom:10px; font-size:1.1em;">${order.hotel.hotelName}</h4>
            <div class="info-line"><i class="fas fa-map-marker-alt"></i> ${order.hotel.address || 'N/A'}</div>
            <div class="separator"></div>
            <div class="info-line"><i class="fas fa-calendar-check" style="color:#27ae60"></i> <b>Nhận:</b> ${formatDate(order.startHotel || order.checkinDate)}</div>
            <div class="info-line"><i class="fas fa-calendar-times" style="color:#c0392b"></i> <b>Trả:</b> ${formatDate(order.endHotel || order.checkoutDate)}</div>
            <div class="info-line"><i class="fas fa-moon"></i> <b>Thời gian:</b> ${nights} đêm</div>
            <div class="separator"></div>
            <div class="info-line"><i class="fas fa-door-open"></i> <b>Phòng:</b> ${order.listBedrooms || 'N/A'}</div>
        </div>`;
    showCustomModal("Chi tiết Khách sạn", html);
  };

  // 2. Chi tiết Chuyến bay (Thêm tuyến và giờ)
  window.showFlightDetails = (orderId) => {
    const order = allOrdersData.find(o => o.id === orderId);
    if (!order || !order.flight) return;

    const f = order.flight;
    const ticketClass = f.ticketClass === 'BUSINESS_CLASS' ? 'Thương gia' : 'Phổ thông';

    const html = `
        <div class="info-card">
            <h4 style="color:var(--primary); margin-bottom:10px; font-size:1.1em;">${f.airlineName}</h4>
            <div class="info-line"><i class="fas fa-route"></i> <b>Hành trình:</b> ${f.departureLocation} ➝ ${f.arrivalLocation}</div>
            <div class="info-line"><i class="fas fa-clock"></i> <b>Khởi hành:</b> ${formatDateTime(f.checkInDate)}</div>
            <div class="separator"></div>
            <div class="info-line"><i class="fas fa-chair"></i> <b>Ghế ngồi:</b> ${order.listSeats || 'N/A'}</div>
            <div class="info-line"><i class="fas fa-star"></i> <b>Hạng vé:</b> ${ticketClass}</div>
        </div>`;
    showCustomModal("Chi tiết Chuyến bay", html);
  };

  // 3. Chi tiết Giá (Giữ nguyên logic tách tiền)
  window.showPriceDetails = (orderId) => {
    const order = allOrdersData.find(o => o.id === orderId);
    if (!order) return;

    let flightCost = 0;
    if (order.flight) {
      let seatCount = order.flightSeats?.length || (order.listSeats ? order.listSeats.trim().split(/\s+/).length : (order.numberOfPeople || 1));
      flightCost = (order.flight.price || 0) * seatCount;
    }
    let hotelCost = Math.max(0, (order.totalPrice || 0) - flightCost);

    const html = `
        <div class="invoice-box">
            <div class="inv-item"><span>✈️ Vé máy bay:</span> <b>${flightCost.toLocaleString()} đ</b></div>
            <div class="inv-item"><span>🏨 Tiền phòng:</span> <b>${hotelCost.toLocaleString()} đ</b></div>
            <div style="font-size:0.85em; color:#777; margin-bottom:10px;">(Đã bao gồm thuế & phí dịch vụ)</div>
            <hr style="border:0; border-top:1px dashed #ccc;">
            <div class="inv-total" style="margin-top:10px;"><span>TỔNG CỘNG:</span> <span>${Number(order.totalPrice).toLocaleString()} đ</span></div>
        </div>`;
    showCustomModal("Chi tiết Hóa đơn", html);
  };

  // Modal Render Helper
  function showCustomModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal custom-info-modal';
    modal.style.display = 'flex';
    modal.style.zIndex = '9999';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:360px; border-radius:12px; animation: fadeIn 0.3s ease;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:15px;">
                <h3 style="margin:0; color:var(--primary); font-size:1.2em;">${title}</h3>
                <i class="fas fa-times" onclick="this.closest('.modal').remove()" style="cursor:pointer; color:#999;"></i>
            </div>
            ${content}
            <button class="modal-btn btn-close" onclick="this.closest('.modal').remove()" style="margin-top:20px; width:100%">Đóng</button>
        </div>`;
    document.body.appendChild(modal);
  }

  // ===== FETCHERS =====
  function renderPagination(totalPages) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';
    let pages = Math.max(1, Number(totalPages ?? 0));

    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = currentPage === 0;
    prevBtn.onclick = () => { if (currentPage > 0) { currentPage--; fetchOrdersByMode(currentPage); } };
    paginationContainer.appendChild(prevBtn);

    for (let i = 0; i < pages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i + 1;
      btn.classList.toggle('active', i === currentPage);
      btn.onclick = () => { currentPage = i; fetchOrdersByMode(currentPage); };
      paginationContainer.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage >= pages - 1;
    nextBtn.onclick = () => { if (currentPage < pages - 1) { currentPage++; fetchOrdersByMode(currentPage); } };
    paginationContainer.appendChild(nextBtn);
  }

  function fetchOrders(page) {
    return fetch(`/order/getAllOrder?pageNo=${page}&pageSize=${pageSize}`)
        .then(res => res.json())
        .then(data => {
          if (data.code === 1000) {
            renderOrderTable(data.data.items || []);
            renderPagination(data.data.totalPages);
          }
        }).catch(err => console.error('Fetch error:', err));
  }

  function fetchOrdersSearch(page, query) {
    return fetch(`/order/getAllOrderWithMultipleColumnsWithSearch?pageNo=${page}&pageSize=${pageSize}&search=${encodeURIComponent(query)}&sortBy=totalPrice:asc`)
        .then(res => res.json())
        .then(data => {
          if (data.code === 1000) {
            renderOrderTable(data.data.items || []);
            renderPagination(data.data.totalPages);
          }
        });
  }

  function fetchOrdersByMode(page) {
    return isSearchMode ? fetchOrdersSearch(page, currentSearchQuery) : fetchOrders(page);
  }

  window.fetchOrdersWithSearch = function() {
    const q = document.getElementById('bookingInput')?.value.trim();
    currentPage = 0;
    isSearchMode = !!q;
    currentSearchQuery = q;
    fetchOrdersByMode(currentPage);
  };

  // ===== PAYMENT ACTIONS =====
  window.openPaymentModal = (orderId) => {
    currentOrderId = orderId;
    document.getElementById('payment-modal').style.display = 'flex';
  };

  document.getElementById('close-modal-btn').onclick = () => document.getElementById('payment-modal').style.display = 'none';

  document.getElementById('confirm-success-btn').onclick = function () {
    if (!currentOrderId) return;
    fetch(`/order/${currentOrderId}/confirm-payment`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.code === 1000) {
            alert('Xác nhận thành công!');
            fetch(`/api/v1/email/${currentOrderId}/announce-pay-success`, { method: 'POST' });
            fetchOrdersByMode(currentPage);
          }
        }).finally(() => document.getElementById('payment-modal').style.display = 'none');
  };

  document.getElementById('confirm-failed-btn').onclick = function () {
    if (!currentOrderId) return;
    fetch(`/order/${currentOrderId}/payment-falled`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.code === 1000) {
            alert('Đã từ chối thanh toán!');
            fetch(`/api/v1/email/${currentOrderId}/announce-pay-falled`, { method: 'POST' });
            fetchOrdersByMode(currentPage);
          }
        }).finally(() => document.getElementById('payment-modal').style.display = 'none');
  };

  // ===== CSS INJECT =====
  const style = document.createElement('style');
  style.innerHTML = `
    .badge-people { background: #fff3cd; color: #856404; padding: 5px 10px; border-radius: 20px; font-weight: bold; font-size: 0.9em; display: inline-block;}
    .badge-people i { margin-left: 4px; }
    
    .btn-eye, .btn-eye-price { background:#f0f4f8; border:none; color:#2980b9; padding:6px; border-radius:4px; cursor:pointer; transition:0.2s; }
    .btn-eye:hover { background:#2980b9; color:#fff; }
    .btn-eye-price { color:#27ae60; background:#ebfbee; }
    .btn-eye-price:hover { background:#27ae60; color:#fff; }
    
    .info-line { margin-bottom: 8px; font-size: 0.95em; color: #444; display: flex; align-items: center; }
    .info-line i { width: 22px; text-align: center; margin-right: 8px; color: #666; }
    .separator { border-top: 1px dashed #eee; margin: 8px 0; }
    
    .invoice-box { text-align: left; font-size: 0.95em; }
    .inv-item { display:flex; justify-content:space-between; margin-bottom:6px; }
    .inv-total { display:flex; justify-content:space-between; font-weight:bold; color:#d35400; font-size:1.15em; }
    
    .status-paid { color: #2ecc71; font-weight: bold; }
    .status-verifying { color: #f1c40f; font-weight: bold; }
    .status-unpaid { color: #e74c3c; font-weight: bold; }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  `;
  document.head.appendChild(style);

  document.addEventListener('DOMContentLoaded', () => fetchOrdersByMode(currentPage));
})();