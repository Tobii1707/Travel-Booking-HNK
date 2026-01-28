// --- ORDER & PAYMENT + USER MENU + REVIEW LOGIC ---

let currentPage = 0;
let totalPages = 1;
const userId = localStorage.getItem('userId');

// Review UI refs
let reviewModal = null;

document.addEventListener('DOMContentLoaded', () => {
  initUserMenu();

  // 1. Kiểm tra đăng nhập
  if (!userId) {
    alert('Vui lòng đăng nhập để xem chuyến đi của bạn!');
    window.location.href = '/user';
    return;
  }

  // 2. Tải dữ liệu ban đầu
  loadOrders(currentPage, 5);

  // 3. Xử lý phân trang
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 0) loadOrders(currentPage - 1, 5);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages - 1) loadOrders(currentPage + 1, 5);
    });
  }

  // 4. Khởi tạo các nút chức năng
  initActionButtons();

  // 5. Khởi tạo chức năng Đánh giá
  initReviewUI();
});

// --- USER MENU ---
function initUserMenu() {
  const userIcon = document.getElementById('user-icon');
  const menu = document.getElementById('user-menu');
  if (!userIcon || !menu) return;

  userIcon.addEventListener('click', (e) => {
    e.preventDefault();
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
  });
  document.addEventListener('click', (e) => {
    if (!userIcon.contains(e.target) && !menu.contains(e.target)) {
      menu.style.display = 'none';
    }
  });
}

// --- LOAD DATA TỪ API ---
function loadOrders(pageNo, pageSize) {
  fetch(`/order/${userId}?pageNo=${pageNo}&pageSize=${pageSize}`)
      .then((response) => response.json())
      .then((result) => {
        if (result.code === 1000 && result.data) {
          let { pageNo: pNo, totalPages: tPages, items } = result.data;

          let list = [];
          if (Array.isArray(items)) list = items;
          else if (items && items.content) list = items.content;
          else if (result.data.content) list = result.data.content;

          totalPages = tPages > 0 ? tPages : 1;
          currentPage = pNo >= 0 ? pNo : 0;

          renderOrders(list);
          updatePaginationInfo();
        } else {
          renderOrders([]);
        }
      })
      .catch((err) => {
        console.error(err);
        renderOrders([]);
      });
}

// --- RENDER BẢNG (ĐÃ CẬP NHẬT LOGIC MỚI NHẤT) ---
function renderOrders(orders) {
  const tbody = document.querySelector('#order-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!orders || orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="padding:20px; text-align:center; color:#666;">Không tìm thấy chuyến đi nào.</td></tr>`;
    return;
  }

  orders.forEach((order) => {
    const row = document.createElement('tr');
    // Lưu object order vào dataset để dùng lại cho các modal
    row.dataset.order = JSON.stringify(order);

    // 1. Checkbox
    const checkboxHtml = `<td><input type="checkbox" value="${order.id}"></td>`;

    // 2. Mã đơn
    const idHtml = `<td>${order.id}</td>`;

    // 3. Hành trình (LOGIC THÔNG MINH: ƯU TIÊN MÁY BAY ĐỂ TRÁNH LỖI "HÀ NỘI -> HÀ NỘI")
    let startPoint = '...';
    let endPoint = '...';

    // -- Nếu có máy bay, lấy địa điểm từ vé máy bay (chính xác nhất)
    if (order.flight) {
      startPoint = order.flight.departureLocation || order.flight.departure || order.flight.startPoint || '...';
      endPoint = order.flight.arrivalLocation || order.flight.arrival || order.flight.destination || '...';
    }
    // -- Nếu chỉ có khách sạn (không bay)
    else {
      startPoint = order.currentLocation || order.CurrentLocation || '...';

      // Kiểm tra nếu Destination trùng StartPoint thì lấy địa chỉ khách sạn
      if (order.destination && order.destination !== startPoint) {
        endPoint = order.destination;
      } else if (order.hotel) {
        endPoint = order.hotel.address ? order.hotel.address.split(',').pop().trim() : 'Điểm đến';
      } else {
        endPoint = order.destination || 'N/A';
      }
    }

    const journeyHtml = `
        <td>
            <div style="display:flex; align-items:center; gap:5px; font-weight:500;">
                <span style="color:#666">${startPoint}</span>
                <i class="fas fa-arrow-right" style="font-size:0.8em; color:#bbb;"></i>
                <span style="color:var(--primary); font-weight:bold;">${endPoint}</span>
            </div>
        </td>`;

    // 4. Icon Khách sạn
    const hotelIcon = order.hotel
        ? `<button class="btn-icon-eye" onclick="showHotelDetails(${order.id})" title="Xem chi tiết khách sạn"><i class="fas fa-eye"></i></button>`
        : `<span style="color:#ccc; font-size:1.2em;">-</span>`;
    const hotelHtml = `<td class="text-center">${hotelIcon}</td>`;

    // 5. Icon Máy bay
    const flightIcon = order.flight
        ? `<button class="btn-icon-eye" onclick="showFlightDetails(${order.id})" title="Xem chi tiết chuyến bay"><i class="fas fa-eye"></i></button>`
        : `<span style="color:#ccc; font-size:1.2em;">-</span>`;
    const flightHtml = `<td class="text-center">${flightIcon}</td>`;

    // 6. Giá (CẬP NHẬT: THÊM NÚT XEM CHI TIẾT GIÁ)
    const price = order.totalPrice ? order.totalPrice.toLocaleString('vi-VN') : '0';
    const priceHtml = `
        <td>
            <div style="display:flex; align-items:center; justify-content:space-between; gap:5px;">
                <span style="font-weight:bold;">${price} đ</span>
                <button class="btn-icon-eye" style="color:#27ae60; background:rgba(39, 174, 96, 0.1); width:24px; height:24px; font-size:0.8em;" 
                        onclick="showPriceDetails(${order.id})" title="Xem chi tiết hóa đơn">
                    <i class="fas fa-search-dollar"></i>
                </button>
            </div>
        </td>`;

    // 7. Trạng thái
    let statusText = 'Chưa thanh toán';
    let statusColor = 'red';
    if (order.payment) {
      if (order.payment.status === 'PAID') {
        statusText = 'Đã thanh toán'; statusColor = 'green';
      } else if (order.payment.status === 'VERIFYING') {
        statusText = 'Đang xác thực'; statusColor = 'orange';
      } else if (order.payment.status === 'PAYMENT_FAILED') {
        statusText = 'Thanh toán lỗi'; statusColor = 'darkred';
      }
    }
    const statusHtml = `<td style="color:${statusColor}; font-weight:600; font-size:0.9em;">${statusText}</td>`;

    // 8. Review
    const canReview = order.hotel && order.payment && order.payment.status === 'PAID';
    const hotelName = order.hotel ? order.hotel.hotelName.replace(/'/g, "\\'") : '';
    const reviewHtml = `
        <td>
            ${canReview
        ? `<button class="btn review-btn" onclick="openReviewModal(${order.id}, '${hotelName}')"><i class="fas fa-star"></i></button>`
        : ''}
        </td>`;

    row.innerHTML = checkboxHtml + idHtml + journeyHtml + hotelHtml + flightHtml + priceHtml + statusHtml + reviewHtml;
    tbody.appendChild(row);
  });
}

function updatePaginationInfo() {
  const pageInfo = document.getElementById('page-info');
  if (pageInfo) pageInfo.textContent = `Trang ${currentPage + 1} / ${totalPages}`;

  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  if (prevBtn) prevBtn.disabled = currentPage === 0;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages - 1;
}

// --- CÁC HÀM TIỆN ÍCH ---

function getOrderData(orderId) {
  const checkbox = document.querySelector(`input[value="${orderId}"]`);
  if(!checkbox) return null;
  return JSON.parse(checkbox.closest('tr').dataset.order);
}

// Hàm format ngày tháng cơ bản
function formatDate(dateStr) {
  return dateStr ? new Date(dateStr).toLocaleDateString('vi-VN') : 'N/A';
}

// Hàm lấy giờ (HH:mm)
function getTime(dateStr) {
  if (!dateStr) return '--:--';
  return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// Hàm lấy ngày (DD/MM/YYYY)
function getDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function showCustomModal(title, content) {
  const existing = document.getElementById('custom-detail-modal');
  if(existing) existing.remove();

  const modalHtml = `
        <div id="custom-detail-modal" class="modal" style="display:flex; align-items:center; justify-content:center;">
            <div class="modal-content detail-content bounce-in">
                <span class="close-modal" onclick="document.getElementById('custom-detail-modal').remove()">&times;</span>
                <div style="padding-bottom: 0;">${content}</div>
                <div style="text-align:center; padding: 15px; background: #f8f9fa; border-top: 1px solid #eee;">
                    <button class="btn cancel" onclick="document.getElementById('custom-detail-modal').remove()">Đóng</button>
                </div>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// --- POPUP: CHI TIẾT KHÁCH SẠN (GIAO DIỆN VOUCHER MỚI) ---
window.showHotelDetails = (orderId) => {
  const order = getOrderData(orderId);
  if (!order || !order.hotel) return;

  const h = order.hotel;

  // Tính toán số đêm
  const start = new Date(order.startHotel);
  const end = new Date(order.endHotel);
  const nights = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

  const html = `
        <div class="hotel-voucher">
            <div class="hotel-header">
                <h3>${h.hotelName}</h3>
                <div class="hotel-stars">
                    <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                </div>
            </div>
            <div class="hotel-body">
                <div class="date-grid">
                    <div class="date-box">
                        <span class="label">NHẬN PHÒNG</span>
                        <span class="big-date">${getDate(order.startHotel)}</span>
                        <span class="time">Sau 14:00</span>
                    </div>
                    <div class="date-box">
                        <span class="label">TRẢ PHÒNG</span>
                        <span class="big-date">${getDate(order.endHotel)}</span>
                        <span class="time">Trước 12:00</span>
                    </div>
                </div>

                <div class="info-list">
                    <div class="info-item">
                        <span style="display:flex; align-items:center; gap:5px;"><i class="fas fa-map-marker-alt"></i> <b>Địa chỉ:</b></span>
                        <span style="text-align:right; max-width:60%;">${h.address || 'Đang cập nhật'}</span>
                    </div>
                    <div class="info-item">
                        <span style="display:flex; align-items:center; gap:5px;"><i class="fas fa-moon"></i> <b>Lưu trú:</b></span>
                        <span style="color:var(--primary); font-weight:bold;">${nights} đêm</span>
                    </div>
                    <div class="info-item">
                        <span style="display:flex; align-items:center; gap:5px;"><i class="fas fa-bed"></i> <b>Phòng:</b></span>
                        <span class="room-badge">${order.listBedrooms || 'Theo sắp xếp'}</span>
                    </div>
                     <div class="info-item">
                        <span style="display:flex; align-items:center; gap:5px;"><i class="fas fa-user-friends"></i> <b>Số khách:</b></span>
                        <span>${order.numberOfPeople || 1} người</span>
                    </div>
                </div>
                
                ${h.description ? `
                <div style="margin-top:15px; padding:10px; background:#f9f9f9; border-radius:8px; font-size:0.9em; font-style:italic; color:#666;">
                    <i class="fas fa-quote-left" style="color:#ddd;"></i> ${h.description}
                </div>` : ''}
            </div>
        </div>
    `;
  showCustomModal("Xác nhận đặt phòng", html);
};

// --- POPUP: CHI TIẾT MÁY BAY (GIAO DIỆN VÉ MÁY BAY MỚI) ---
window.showFlightDetails = (orderId) => {
  const order = getOrderData(orderId);
  if (!order || !order.flight) return;

  const f = order.flight;

  // Xử lý dữ liệu fallback
  const checkIn = f.checkInDate || f.startDate || f.departureTime;
  const checkOut = f.checkOutDate || f.endDate || f.arrivalTime;

  // Tách địa điểm để lấy Mã sân bay giả định (3 chữ cái đầu hoặc tên)
  const depFull = f.departureLocation || f.departure || 'N/A';
  const destFull = f.arrivalLocation || f.destination || 'N/A';

  const depCode = depFull.split(',')[0].substring(0, 3).toUpperCase();
  const destCode = destFull.split(',')[0].substring(0, 3).toUpperCase();

  // Ghế ngồi
  let seatDisplay = 'Chưa chọn';
  if (order.listSeats && order.listSeats.trim() !== "") seatDisplay = order.listSeats;
  else if (order.flightSeats && order.flightSeats.length > 0) seatDisplay = order.flightSeats.map(s => s.seatNumber).join(', ');

  const html = `
        <div class="flight-ticket">
            <div class="flight-header">
                <div class="airline-brand"><i class="fas fa-plane-departure"></i> ${f.brand || 'Hãng bay'}</div>
                <div class="flight-class">${f.ticketClass || 'Phổ thông'}</div>
            </div>
            
            <div class="flight-body">
                <div class="route-visual">
                    <div class="loc-box">
                        <span class="loc-code">${depCode}</span>
                        <span class="loc-name">${depFull.split(',')[0]}</span>
                        <span class="loc-time">${getTime(checkIn)}</span>
                        <span style="font-size:0.8em; color:#999;">${getDate(checkIn)}</span>
                    </div>
                    
                    <div style="text-align:center; flex-grow:1;">
                        <i class="fas fa-long-arrow-alt-right plane-icon"></i>
                        <div style="font-size:0.75rem; color:#999; margin-top:2px;">Bay thẳng</div>
                    </div>
                    
                    <div class="loc-box">
                        <span class="loc-code">${destCode}</span>
                        <span class="loc-name">${destFull.split(',')[0]}</span>
                        <span class="loc-time">${getTime(checkOut)}</span>
                         <span style="font-size:0.8em; color:#999;">${getDate(checkOut)}</span>
                    </div>
                </div>

                <hr style="border:0; border-top:1px dashed #ddd; margin: 15px 0;">

                <div class="flight-details-grid">
                    <div class="detail-item">
                        <span class="detail-label">SỐ HIỆU</span>
                        <span class="detail-val">${f.flightNumber || 'VN-Default'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">GHẾ NGỒI</span>
                        <span class="detail-val" style="color:#e74c3c;">${seatDisplay}</span>
                    </div>
                     <div class="detail-item">
                        <span class="detail-label">HÀNH KHÁCH</span>
                        <span class="detail-val">${order.numberOfPeople} người</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">TRẠNG THÁI</span>
                        <span class="detail-val" style="color:#27ae60;">Đã xác nhận</span>
                    </div>
                </div>
            </div>
        </div>
    `;
  showCustomModal("Vé Máy Bay Điện Tử", html);
};

// --- POPUP: CHI TIẾT HÓA ĐƠN (GIAO DIỆN INVOICE CHUYÊN NGHIỆP) ---
window.showPriceDetails = (orderId) => {
  const order = getOrderData(orderId);
  if (!order) return;

  // --- 1. TÍNH TOÁN DỮ LIỆU ---

  // A. VÉ MÁY BAY
  let flightHtml = '';
  let flightTotal = 0;

  if (order.flight) {
    // Số lượng khách
    const paxCount = order.numberOfPeople || 1;
    // Đơn giá vé
    const ticketPrice = order.flight.price || 0;
    // Tổng tiền vé
    flightTotal = ticketPrice * paxCount;

    // Thông tin hiển thị
    const brand = order.flight.brand || 'Hãng bay';
    const route = `${order.flight.departureLocation ? order.flight.departureLocation.split(',')[0] : 'Đi'} - ${order.flight.arrivalLocation ? order.flight.arrivalLocation.split(',')[0] : 'Đến'}`;

    flightHtml = `
      <tr>
        <td>
            <div class="item-title">Vé máy bay (${brand})</div>
            <div class="item-desc">${route}</div>
        </td>
        <td class="text-center">${paxCount} khách</td>
        <td class="text-right">${ticketPrice.toLocaleString('vi-VN')} ₫</td>
        <td class="text-right font-weight-bold">${flightTotal.toLocaleString('vi-VN')} ₫</td>
      </tr>
    `;
  }

  // B. KHÁCH SẠN
  let hotelHtml = '';
  let hotelTotal = 0;

  if (order.hotel) {
    // Lấy tổng tiền đơn hàng (backend trả về)
    const grandTotal = order.totalPrice || 0;

    // Tính tiền khách sạn = Tổng - Vé máy bay (Logic suy luận để khớp tổng)
    hotelTotal = grandTotal - flightTotal;
    if (hotelTotal < 0) hotelTotal = 0;

    // Tính số đêm lưu trú
    const start = new Date(order.startHotel);
    const end = new Date(order.endHotel);
    let nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (nights < 1) nights = 1;

    // Tính đơn giá trung bình 1 đêm (để khách tham khảo)
    const pricePerNight = hotelTotal / nights;

    hotelHtml = `
      <tr>
        <td>
            <div class="item-title">Khách sạn ${order.hotel.hotelName}</div>
            <div class="item-desc">Phòng: ${order.listBedrooms || 'Tiêu chuẩn'}</div>
        </td>
        <td class="text-center">${nights} đêm</td>
        <td class="text-right">${pricePerNight.toLocaleString('vi-VN')} ₫</td>
        <td class="text-right font-weight-bold">${hotelTotal.toLocaleString('vi-VN')} ₫</td>
      </tr>
    `;
  }

  // C. TỔNG CỘNG
  const finalTotal = (order.totalPrice || (flightTotal + hotelTotal));

  // Trạng thái thanh toán để đóng dấu
  let paymentStatus = 'UNPAID';
  let stampHtml = '';
  if (order.payment) {
    if (order.payment.status === 'PAID') {
      stampHtml = '<div class="invoice-stamp paid">ĐÃ THANH TOÁN</div>';
    } else if (order.payment.status === 'VERIFYING') {
      stampHtml = '<div class="invoice-stamp verifying">ĐANG DUYỆT</div>';
    } else {
      stampHtml = '<div class="invoice-stamp unpaid">CHƯA THANH TOÁN</div>';
    }
  }

  // --- 2. TẠO HTML GIAO DIỆN ---
  const html = `
    <div class="invoice-wrapper">
        ${stampHtml}
        
        <div class="invoice-header-top">
            <div class="inv-brand"><i class="fas fa-receipt"></i> HÓA ĐƠN CHI TIẾT</div>
            <div class="inv-id">Mã đơn: #${order.id}</div>
        </div>

        <div class="invoice-info-row">
            <div>
                <span class="lbl">Khách hàng:</span> <span class="val">${localStorage.getItem('username') || 'Khách'}</span>
            </div>
            <div>
                <span class="lbl">Ngày tạo:</span> <span class="val">${new Date().toLocaleDateString('vi-VN')}</span>
            </div>
        </div>

        <table class="invoice-table">
            <thead>
                <tr>
                    <th style="width: 40%">Dịch vụ</th>
                    <th style="width: 15%" class="text-center">SL</th>
                    <th style="width: 20%" class="text-right">Đơn giá</th>
                    <th style="width: 25%" class="text-right">Thành tiền</th>
                </tr>
            </thead>
            <tbody>
                ${flightHtml}
                ${hotelHtml}
            </tbody>
        </table>

        <div class="invoice-summary">
            <div class="sum-row">
                <span>Tổng tiền vé máy bay:</span>
                <span>${flightTotal.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div class="sum-row">
                <span>Tổng tiền khách sạn:</span>
                <span>${hotelTotal.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div class="sum-row final">
                <span>TỔNG THANH TOÁN:</span>
                <span class="amount">${finalTotal.toLocaleString('vi-VN')} ₫</span>
            </div>
        </div>
        
        <div style="margin-top: 15px; font-size: 0.85em; color: #777; text-align: center; font-style: italic;">
            * Giá trên đã bao gồm thuế và phí dịch vụ.
        </div>
    </div>
  `;

  showCustomModal("Chi Tiết Hóa Đơn", html);
};

// --- ACTION BUTTONS ---
function initActionButtons() {
  const cancelBtn = document.getElementById('cancel-btn');
  const payBtn = document.getElementById('pay-btn');
  const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const chooseFlightBtn = document.getElementById('choose-flight-btn');
  const chooseHotelBtn = document.getElementById('choose-hotel-btn');
  const paymentModal = document.getElementById('payment-modal');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      const selected = document.querySelector('input[type="checkbox"]:checked');
      if (!selected) return alert('Vui lòng chọn chuyến đi để hủy!');
      if (confirm('Bạn có chắc chắn muốn hủy chuyến đi này không?')) {
        fetch(`/order/${selected.value}`, { method: 'DELETE' }).then(res => {
          if(res.ok) { alert('Hủy chuyến thành công!'); window.location.reload(); }
          else alert('Lỗi khi hủy chuyến!');
        });
      }
    });
  }

  if (payBtn) {
    payBtn.addEventListener('click', () => {
      const selected = document.querySelector('input[type="checkbox"]:checked');
      if (!selected) return alert('Vui lòng chọn chuyến đi để thanh toán!');
      if (paymentModal) paymentModal.style.display = 'flex';
      if (confirmPaymentBtn) confirmPaymentBtn.dataset.tripId = selected.value;
    });
  }

  if (confirmPaymentBtn) {
    confirmPaymentBtn.addEventListener('click', function() {
      fetch(`/order/${this.dataset.tripId}/verifying-payment`, { method: 'POST' })
          .then(res => res.json())
          .then(d => {
            if(d.code===1000) { alert('Đã gửi yêu cầu xác nhận!'); window.location.reload(); }
            else alert('Lỗi: ' + d.message);
          });
    });
  }

  if (closeModalBtn) closeModalBtn.addEventListener('click', () => { if(paymentModal) paymentModal.style.display='none'; });

  if (chooseFlightBtn) {
    chooseFlightBtn.addEventListener('click', () => {
      const selected = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(c => c.value);
      if(selected.length) window.location.href = `/flight?orderId=${selected.join(',')}`;
      else alert('Vui lòng chọn chuyến đi!');
    });
  }
  if (chooseHotelBtn) {
    chooseHotelBtn.addEventListener('click', () => {
      const selected = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(c => c.value);
      if(selected.length) window.location.href = `/hotel?orderId=${selected.join(',')}`;
      else alert('Vui lòng chọn chuyến đi!');
    });
  }
}

// --- REVIEW LOGIC ---
function initReviewUI() {
  reviewModal = document.getElementById('review-modal');
  const starsEl = document.querySelectorAll('.star-rating i');

  if (!reviewModal) return;

  starsEl.forEach(s => {
    s.addEventListener('click', function() {
      const r = parseInt(this.dataset.rating);
      document.getElementById('review-rating').value = r;
      updateStars(r);
    });
  });

  document.getElementById('submit-review-btn')?.addEventListener('click', submitReview);
  document.getElementById('delete-review-btn')?.addEventListener('click', deleteReview);
  document.getElementById('close-review-modal-btn')?.addEventListener('click', () => reviewModal.style.display = 'none');
}

function updateStars(rating) {
  document.querySelectorAll('.star-rating i').forEach(s => {
    s.classList.toggle('active', parseInt(s.dataset.rating) <= rating);
  });
}

window.openReviewModal = async function(orderId, hotelName) {
  if (!reviewModal) reviewModal = document.getElementById('review-modal');
  document.getElementById('review-order-id').value = orderId;
  document.getElementById('review-hotel-display').textContent = hotelName;
  document.getElementById('review-rating').value = 0;
  document.getElementById('review-comment').value = '';
  updateStars(0);

  try {
    const res = await fetch(`/review/order/${orderId}`).then(r => r.json());
    if(res.code === 1000 && res.data) {
      document.getElementById('review-modal-title').textContent = 'Sửa đánh giá';
      document.getElementById('review-id').value = res.data.id;
      document.getElementById('review-rating').value = res.data.rating;
      document.getElementById('review-comment').value = res.data.comment || '';
      document.getElementById('delete-review-btn').style.display = 'inline-block';
      updateStars(res.data.rating);
    } else {
      document.getElementById('review-modal-title').textContent = 'Viết đánh giá';
      document.getElementById('review-id').value = '';
      document.getElementById('delete-review-btn').style.display = 'none';
    }
  } catch(e) {}

  reviewModal.style.display = 'flex';
};

async function submitReview() {
  const orderId = document.getElementById('review-order-id').value;
  const reviewId = document.getElementById('review-id').value;
  const rating = document.getElementById('review-rating').value;
  const comment = document.getElementById('review-comment').value;

  if(rating < 1) return alert('Vui lòng chọn số sao!');

  const url = reviewId ? `/review/${reviewId}/${userId}` : `/review/${orderId}/${userId}`;
  const method = reviewId ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method: method,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({rating, comment})
  }).then(r => r.json());

  if(res.code === 1000) { alert('Thành công!'); reviewModal.style.display = 'none'; }
  else alert(res.message);
}

async function deleteReview() {
  if(!confirm('Xóa đánh giá này?')) return;
  const id = document.getElementById('review-id').value;
  const res = await fetch(`/review/${id}/${userId}`, {method: 'DELETE'}).then(r => r.json());
  if(res.code === 1000) { alert('Đã xóa!'); reviewModal.style.display = 'none'; }
}

// --- CSS INJECT (Fallback cho Modal Styles) ---
const style = document.createElement('style');
style.innerHTML = `
    .btn-icon-eye {
        border: none; width: 32px; height: 32px; border-radius: 50%;
        cursor: pointer; transition: all 0.3s;
        display: inline-flex; align-items: center; justify-content: center;
        background: rgba(52, 152, 219, 0.1); color: #3498db;
    }
    .btn-icon-eye:hover { background: #3498db; color: white; transform: scale(1.1); }
    .text-center { text-align: center; }
    
    .bounce-in { animation: bounceIn 0.4s; }
    @keyframes bounceIn {
      0% { transform: scale(0.5); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    /* Modal Specifics Override if needed */
    .modal-content.detail-content { max-width: 600px; padding: 0; border-radius: 12px; overflow: hidden; }
    
    /* Hotel Voucher Basic Styles (Fallback) */
    .hotel-header { background: #2c3e50; color: #fff; padding: 20px; text-align: center; }
    .hotel-header h3 { margin: 0; font-size: 1.4rem; color: #fff; }
    .hotel-stars { color: #f1c40f; margin-top: 5px; }
    .hotel-body { padding: 25px; background: #fff; }
    .date-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; border-bottom: 1px dashed #eee; padding-bottom: 15px; margin-bottom: 15px; }
    .date-box { text-align: center; }
    .date-box .label { font-size: 0.8rem; color: #7f8c8d; display: block; }
    .date-box .big-date { font-size: 1.2rem; font-weight: bold; color: #2c3e50; display: block; margin: 5px 0; }
    .date-box .time { font-size: 0.85rem; color: #e67e22; }
    .info-list .info-item { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.95rem; }
    
    /* Flight Ticket Basic Styles (Fallback) */
    .flight-header { background: linear-gradient(135deg, #3498db, #2980b9); color: #fff; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; }
    .flight-body { padding: 25px; background: #fff; }
    .route-visual { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .loc-box { text-align: center; width: 35%; }
    .loc-code { font-size: 1.8rem; font-weight: bold; color: #2c3e50; display: block; }
    .loc-time { color: #3498db; font-weight: 600; font-size: 1.1rem; display: block; margin-top: 5px; }
    .plane-icon { font-size: 1.5rem; color: #95a5a6; }
    .flight-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8f9fa; padding: 15px; border-radius: 8px; }
    .detail-item span { display: block; }
    .detail-label { font-size: 0.75rem; color: #7f8c8d; margin-bottom: 3px; }
    .detail-val { font-weight: 600; color: #333; }
`;
document.head.appendChild(style);