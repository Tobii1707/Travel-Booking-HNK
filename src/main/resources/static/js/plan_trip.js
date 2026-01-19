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
  // Tìm input checkbox tương ứng với orderId để lấy dataset từ thẻ tr cha
  const checkbox = document.querySelector(`input[value="${orderId}"]`);
  if(!checkbox) return null;
  return JSON.parse(checkbox.closest('tr').dataset.order);
}

function formatDate(dateStr) {
  return dateStr ? new Date(dateStr).toLocaleDateString('vi-VN') : 'N/A';
}

function showCustomModal(title, content) {
  const existing = document.getElementById('custom-detail-modal');
  if(existing) existing.remove();

  const modalHtml = `
        <div id="custom-detail-modal" class="modal" style="display:flex; align-items:center; justify-content:center;">
            <div class="modal-content detail-content bounce-in" style="max-width:500px;">
                <span class="close-modal" onclick="document.getElementById('custom-detail-modal').remove()">&times;</span>
                <h2 style="text-align:center; color:var(--primary); margin-bottom:15px; font-size:1.5rem;">${title}</h2>
                ${content}
                <div style="text-align:center; margin-top:20px;">
                    <button class="btn cancel" onclick="document.getElementById('custom-detail-modal').remove()">Đóng</button>
                </div>
            </div>
        </div>
    `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// --- POPUP: CHI TIẾT KHÁCH SẠN ---
window.showHotelDetails = (orderId) => {
  const order = getOrderData(orderId);
  if (!order || !order.hotel) return;

  const h = order.hotel;
  const html = `
        <div class="detail-card hotel-card full-width">
            <h3><i class="fas fa-hotel"></i> ${h.hotelName}</h3>
            <div class="info-row"><span class="label">Địa chỉ:</span> <span class="value" style="max-width:250px; text-align:right;">${h.address || 'N/A'}</span></div>
            <div class="info-row"><span class="label">Nhận phòng:</span> <span class="value">${formatDate(order.startHotel)}</span></div>
            <div class="info-row"><span class="label">Trả phòng:</span> <span class="value">${formatDate(order.endHotel)}</span></div>
            <div class="info-row"><span class="label">Phòng:</span> <span class="value room-badge">${order.listBedrooms || 'Chưa chọn'}</span></div>
            ${h.description ? `<div style="margin-top:10px; font-size:0.9em; color:#555; font-style:italic; border-top:1px dashed #eee; padding-top:5px;">"${h.description}"</div>` : ''}
        </div>
    `;
  showCustomModal("Thông tin Khách sạn", html);
};

// --- POPUP: CHI TIẾT MÁY BAY (ĐÃ FIX LỖI HIỂN THỊ THIẾU THÔNG TIN) ---
window.showFlightDetails = (orderId) => {
  const order = getOrderData(orderId);
  if (!order || !order.flight) return;

  const f = order.flight;

  // Xử lý biến ngày tháng (check nhiều trường hợp tên biến)
  const startDate = f.checkInDate || f.startDate || f.departureTime;
  const endDate = f.checkOutDate || f.endDate || f.arrivalTime;

  // Xử lý địa điểm
  const dep = f.departureLocation || f.departure || 'N/A';
  const dest = f.arrivalLocation || f.destination || f.arrival || 'N/A';

  // Xử lý ghế ngồi (Fallback: listSeats -> flightSeats -> numberOfPeople)
  let seatDisplay = 'Chưa chọn ghế';
  if (order.listSeats && order.listSeats.trim() !== "") {
    seatDisplay = order.listSeats;
  } else if (order.flightSeats && order.flightSeats.length > 0) {
    seatDisplay = order.flightSeats.map(s => s.seatNumber).join(', ');
  }

  const html = `
        <div class="detail-card flight-card full-width">
            <h3><i class="fas fa-plane"></i> ${f.brand || 'Hãng bay'}</h3>
            <div class="info-row"><span class="label">Ngày đi:</span> <span class="value">${formatDate(startDate)}</span></div>
            <div class="info-row"><span class="label">Ngày về:</span> <span class="value">${formatDate(endDate)}</span></div>
            <div class="info-row"><span class="label">Nơi đi:</span> <span class="value highlight">${dep}</span></div>
            <div class="info-row"><span class="label">Nơi đến:</span> <span class="value highlight">${dest}</span></div>
            <div class="info-row"><span class="label">Hạng vé:</span> <span class="value">${f.ticketClass || 'Phổ thông'}</span></div>
            <div class="info-row"><span class="label">Ghế ngồi:</span> <span class="value seat-badge">${seatDisplay}</span></div>
            <div class="info-row"><span class="label">Giá vé gốc:</span> <span class="value">${f.price ? f.price.toLocaleString() : 0} VND</span></div>
        </div>
    `;
  showCustomModal("Thông tin Chuyến bay", html);
};

// --- POPUP: CHI TIẾT GIÁ (MỚI THÊM) ---
window.showPriceDetails = (orderId) => {
  const order = getOrderData(orderId);
  if (!order) return;

  // 1. Tính toán chi phí Máy bay
  let flightCost = 0;
  let flightInfo = '<span style="color:#999; font-style:italic;">Không đặt vé máy bay</span>';

  if (order.flight) {
    let seatCount = 0;
    // Đếm số lượng ghế logic fallback
    if (order.flightSeats && order.flightSeats.length > 0) {
      seatCount = order.flightSeats.length;
    } else if (order.listSeats) {
      seatCount = order.listSeats.trim().split(/\s+/).length;
    } else {
      seatCount = order.numberOfPeople; // Mặc định theo số người
    }

    const pricePerTicket = order.flight.price || 0;
    flightCost = pricePerTicket * seatCount;

    flightInfo = `
            <div style="display:flex; justify-content:space-between; font-weight:500;">
                <span>Vé máy bay (${seatCount} vé):</span>
                <span>${flightCost.toLocaleString()} đ</span>
            </div>
            <div style="font-size:0.85em; color:#666; padding-left:10px;">
                (${pricePerTicket.toLocaleString()} đ / vé)
            </div>
        `;
  }

  // 2. Tính toán chi phí Khách sạn = Tổng - Máy bay
  let total = order.totalPrice || 0;
  let hotelCost = total - flightCost;
  if (hotelCost < 0) hotelCost = 0; // Fix trường hợp data lỗi âm tiền

  let hotelInfo = '<span style="color:#999; font-style:italic;">Không đặt khách sạn</span>';
  if (order.hotel) {
    hotelInfo = `
            <div style="display:flex; justify-content:space-between; font-weight:500;">
                <span>Khách sạn (${order.hotel.hotelName}):</span>
                <span>${hotelCost.toLocaleString()} đ</span>
            </div>
        `;
  }

  const html = `
        <div class="detail-card full-width" style="border-top: 3px solid #27ae60;">
            <h3 style="color:#27ae60; margin-top:0;"><i class="fas fa-file-invoice-dollar"></i> Chi tiết thanh toán</h3>
            
            <div style="background:#f9f9f9; padding:15px; border-radius:8px; margin-bottom:15px;">
                <div style="margin-bottom: 12px; border-bottom:1px dashed #ddd; padding-bottom:12px;">
                    ${flightInfo}
                </div>
                <div>
                    ${hotelInfo}
                </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; font-size:1.3em; font-weight:bold; color:#333; border-top:2px solid #eee; padding-top:15px;">
                <span>Tổng cộng:</span>
                <span style="color:#d35400;">${total.toLocaleString()} VND</span>
            </div>
        </div>
    `;

  showCustomModal("Chi tiết giá", html);
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

// --- CSS INJECT (CẬP NHẬT CSS MỚI CHO MODAL & BUTTONS) ---
const style = document.createElement('style');
style.innerHTML = `
    .btn-icon-eye {
        border: none;
        width: 32px; height: 32px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.3s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(52, 152, 219, 0.1);
        color: #3498db;
    }
    .btn-icon-eye:hover { background: #3498db; color: white; transform: scale(1.1); }
    
    .text-center { text-align: center; }
    
    .detail-card h3 { border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 15px; color: #333; font-size: 1.2rem; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dashed #f0f0f0; padding-bottom: 5px; }
    .info-row .label { color: #666; font-weight: 500; }
    .info-row .value { color: #333; font-weight: 600; text-align: right; }
    
    .highlight { color: #2ecc71; }
    .seat-badge, .room-badge { background: #e0f2fe; color: #0284c7; padding: 2px 8px; border-radius: 4px; font-size: 0.9em; font-weight: bold; }
    
    .bounce-in { animation: bounceIn 0.4s; }
    @keyframes bounceIn {
      0% { transform: scale(0.5); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
`;
document.head.appendChild(style);