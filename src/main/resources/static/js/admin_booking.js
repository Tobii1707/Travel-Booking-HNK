'use strict';

(function () {
  // Guard clause: Chỉ chạy nếu body có class này
  if (!document.body || !document.body.classList.contains('hust-admin-trip')) return;

  // ============================================================
  // 1. CONFIG & STATE (Cấu hình & Trạng thái)
  // ============================================================
  const CONFIG = {
    pageSize: 5,
    api: {
      getAll: '/order/getAllOrder',
      search: '/order/getAllOrderWithMultipleColumnsWithSearch',
      confirmPay: (id) => `/order/${id}/confirm-payment`,
      rejectPay: (id) => `/order/${id}/payment-falled`,
      emailSuccess: (id) => `/api/v1/email/${id}/announce-pay-success`,
      emailFail: (id) => `/api/v1/email/${id}/announce-pay-falled`,
    }
  };

  const state = {
    currentOrderId: null,
    currentPage: 0,
    isSearchMode: false,
    searchQuery: '',
    ordersCache: [] // Lưu dữ liệu để hiển thị popup mà không cần gọi lại API
  };

  // Cache DOM Elements
  const DOM = {
    tableBody: document.querySelector('#bookingTable tbody'),
    pagination: document.getElementById('pagination'),
    modalPayment: document.getElementById('payment-modal'),
    searchInput: document.getElementById('bookingInput'),
    btnClosePayment: document.getElementById('close-modal-btn'),
    btnConfirmSuccess: document.getElementById('confirm-success-btn'),
    btnConfirmFail: document.getElementById('confirm-failed-btn'),
  };

  // ============================================================
  // 2. UTILS (Các hàm tiện ích)
  // ============================================================
  const Utils = {
    formatMoney: (val) => Number(val || 0).toLocaleString('vi-VN') + ' đ',

    formatDateTime: (str) => str ? new Date(str).toLocaleString('vi-VN', { hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit', year:'numeric'}) : 'N/A',

    formatDate: (str) => str ? new Date(str).toLocaleDateString('vi-VN') : 'N/A',

    getTime: (str) => str ? new Date(str).toLocaleTimeString('vi-VN', { hour: '2-digit', minute:'2-digit' }) : '--:--',

    calcNights: (start, end) => {
      if (!start || !end) return 1;
      const diff = new Date(end) - new Date(start);
      const days = Math.ceil(Math.abs(diff) / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 1;
    }
  };

  // ============================================================
  // 3. UI RENDERER (Xử lý giao diện)
  // ============================================================
  const Render = {
    // Render Modal chung
    customModal: (title, contentHTML) => {
      // Xóa modal cũ nếu có
      const oldModal = document.querySelector('.custom-info-modal');
      if (oldModal) oldModal.remove();

      const modal = document.createElement('div');
      modal.className = 'modal custom-info-modal';
      modal.style.display = 'flex';
      modal.innerHTML = `
        <div class="modal-content bounce-in" style="max-width:450px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="margin:0; color:#2c3e50; font-size:1.2rem;">${title}</h3>
                <i class="fas fa-times" onclick="this.closest('.modal').remove()" style="cursor:pointer; color:#95a5a6; font-size:1.2rem;"></i>
            </div>
            ${contentHTML}
            <div class="modal-btn-group" style="margin-top:20px; border-top:1px solid #eee; padding-top:15px;">
                <button class="modal-btn btn-close" onclick="this.closest('.modal').remove()" style="width:100%">Đóng</button>
            </div>
        </div>`;
      document.body.appendChild(modal);
    },

    // Popup 1: Vé Máy Bay (ĐÃ SỬA: Bỏ người đặt, Nổi bật ghế ngồi)
    popupFlight: (id) => {
      const order = state.ordersCache.find(o => o.id === id);
      if (!order?.flight) return;

      const f = order.flight;
      const ticketClass = f.ticketClass === 'BUSINESS_CLASS' ? 'Thương gia' : 'Phổ thông';
      // Format ghế ngồi cho đẹp (thêm khoảng trắng sau dấu phẩy)
      const seatDisplay = order.listSeats ? order.listSeats.replace(/,/g, ', ') : 'Chưa chọn ghế';

      const html = `
        <div class="admin-ticket">
            <div class="ticket-header">
                <span class="brand"><i class="fas fa-plane-departure"></i> ${f.airlineName}</span>
                <span class="class-badge">${ticketClass}</span>
            </div>
            
            <div class="ticket-body">
                <div class="route-visual">
                    <div class="point">
                        <span class="code">${f.departureLocation.substring(0,3).toUpperCase()}</span>
                        <span class="city">${f.departureLocation}</span>
                        <span class="time">${Utils.getTime(f.checkInDate)}</span>
                    </div>
                    <div class="flight-icon">
                        <i class="fas fa-plane"></i>
                        <span class="date-small">${Utils.formatDate(f.checkInDate)}</span>
                    </div>
                    <div class="point">
                        <span class="code">${f.arrivalLocation.substring(0,3).toUpperCase()}</span>
                        <span class="city">${f.arrivalLocation}</span>
                        <span class="time">--:--</span>
                    </div>
                </div>

                <div class="ticket-footer" style="display:block; text-align:center; background:#f8f9fa; margin-top:15px; padding:10px; border-radius:8px;">
                    <span class="lbl" style="display:block; font-size:0.85em; color:#888; margin-bottom:5px;">SỐ GHẾ</span>
                    <span class="val seat-val" style="font-size:1.4em; color:#2c3e50; font-weight:bold; letter-spacing:1px;">${seatDisplay}</span>
                </div>
            </div>
        </div>`;
      Render.customModal('Chi tiết Vé Máy Bay', html);
    },

    // Popup 2: Khách sạn (ĐÃ SỬA: Bỏ người đặt, Address và Room full dòng)
    popupHotel: (id) => {
      const order = state.ordersCache.find(o => o.id === id);
      if (!order?.hotel) return;

      const nights = Utils.calcNights(order.startHotel, order.endHotel);
      const checkIn = order.startHotel ? new Date(order.startHotel) : new Date();
      const checkOut = order.endHotel ? new Date(order.endHotel) : new Date();

      const html = `
        <div class="admin-voucher">
            <div class="voucher-header">
                <i class="fas fa-hotel"></i> ${order.hotel.hotelName}
            </div>
            
            <div class="voucher-body">
                <div class="date-row">
                    <div class="date-col">
                        <span class="lbl">Nhận phòng</span>
                        <span class="val big">${checkIn.getDate()}/${checkIn.getMonth() + 1}</span>
                        <span class="lbl">${checkIn.getFullYear()}</span>
                    </div>
                    <div class="arrow-col">
                        <span class="nights-badge">${nights} Đêm</span>
                        <i class="fas fa-long-arrow-alt-right"></i>
                    </div>
                    <div class="date-col">
                        <span class="lbl">Trả phòng</span>
                        <span class="val big">${checkOut.getDate()}/${checkOut.getMonth() + 1}</span>
                        <span class="lbl">${checkOut.getFullYear()}</span>
                    </div>
                </div>

                <div class="info-grid" style="display:flex; flex-direction:column; gap:12px; margin-top:15px;">
                    <div class="info-item" style="border-bottom:1px dashed #eee; padding-bottom:8px;">
                        <span class="lbl" style="color:#666; font-weight:500;"><i class="fas fa-map-marker-alt" style="width:20px; text-align:center"></i> Địa chỉ:</span>
                        <div class="val" style="margin-top:4px; padding-left:25px; color:#333;">${order.hotel.address || 'N/A'}</div>
                    </div>
                    
                    <div class="info-item" style="background:#f0f8ff; padding:10px; border-radius:6px;">
                        <span class="lbl" style="color:#2980b9; font-weight:500;"><i class="fas fa-bed" style="width:20px; text-align:center"></i> Chi tiết phòng:</span>
                        <div class="val highlight" style="margin-top:4px; padding-left:25px; font-weight:bold; color:#2c3e50;">${order.listBedrooms || 'Theo sắp xếp của khách sạn'}</div>
                    </div>
                </div>
            </div>
        </div>`;
      Render.customModal('Voucher Khách Sạn', html);
    },

    // Popup 3: Giá tiền
    popupPrice: (id) => {
      const order = state.ordersCache.find(o => o.id === id);
      if (!order) return;

      let flightCost = 0;
      if (order.flight) {
        // Ước tính giá vé (Logic tạm vì BE trả về tổng)
        const seatStr = order.listSeats || "";
        let seatCount = seatStr.split(',').filter(s => s.trim() !== '').length;
        if (seatCount === 0) seatCount = order.numberOfPeople || 1;
        flightCost = (order.flight.price || 0) * seatCount;
      }
      const hotelCost = Math.max(0, (order.totalPrice || 0) - flightCost);

      const html = `
        <div class="invoice-box">
            <div class="inv-row">
                <span><i class="fas fa-plane" style="color:#3498db"></i> Vé máy bay:</span>
                <b>${Utils.formatMoney(flightCost)}</b>
            </div>
            <div class="inv-row">
                <span><i class="fas fa-hotel" style="color:#e67e22"></i> Khách sạn:</span>
                <b>${Utils.formatMoney(hotelCost)}</b>
            </div>
            <div class="inv-divider"></div>
            <div class="inv-note">(Đã bao gồm thuế & phí dịch vụ)</div>
            <div class="inv-total">
                <span>TỔNG THANH TOÁN</span>
                <span>${Utils.formatMoney(order.totalPrice)}</span>
            </div>
        </div>`;
      Render.customModal('Chi tiết Thanh toán', html);
    },

    // Render Bảng chính
    table: (orders) => {
      state.ordersCache = orders;
      if (!DOM.tableBody) return;

      if (!Array.isArray(orders) || orders.length === 0) {
        DOM.tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 20px;">${state.isSearchMode ? 'Không tìm thấy kết quả' : 'Chưa có đơn hàng nào'}</td></tr>`;
        return;
      }

      DOM.tableBody.innerHTML = orders.map(order => {
        // Xử lý status
        let statusHtml = '<span style="color:#999">N/A</span>';
        if (order.payment) {
          const s = order.payment.status;
          if (s === 'PAID') statusHtml = '<span class="status-paid">Đã thanh toán</span>';
          else if (s === 'VERIFYING') statusHtml = '<span class="status-verifying">Đang xác thực</span>';
          else if (s === 'PAYMENT_FAILED') statusHtml = '<span class="status-unpaid">Thất bại</span>';
        }

        // Xử lý hành trình
        let journey = `<span>${order.destination || 'N/A'}</span>`;
        if (order.flight) {
          journey = `
            <div style="font-size:0.8rem; color:#7f8c8d;">${order.flight.departureLocation}</div>
            <div style="font-weight:600; color:#2c3e50; font-size:0.9rem;">➝ ${order.flight.arrivalLocation}</div>`;
        }

        const people = order.numberOfPeople || 1;

        return `
          <tr>
            <td>#${order.id}</td>
            <td>${Utils.formatDate(order.orderDate)}</td>
            <td><strong>${order.user ? order.user.fullName : 'Khách vãng lai'}</strong></td>
            
            <td class="text-center"><span class="badge-people">${people} <i class="fas fa-user"></i></span></td>
            
            <td>${journey}</td>
            
            <td class="text-center">
                ${order.flight ? `<button class="btn-eye" onclick="window.Action.viewFlight(${order.id})"><i class="fas fa-plane"></i></button>` : '<span style="color:#ccc">-</span>'}
            </td>
            
            <td class="text-center">
                ${order.hotel ? `<button class="btn-eye" onclick="window.Action.viewHotel(${order.id})"><i class="fas fa-hotel"></i></button>` : '<span style="color:#ccc">-</span>'}
            </td>
            
            <td>
              <div style="display:flex; align-items:center; gap:8px;">
                <b style="color:#d35400;">${Utils.formatMoney(order.totalPrice)}</b>
                <button class="btn-eye-price" onclick="window.Action.viewPrice(${order.id})"><i class="fas fa-info"></i></button>
              </div>
            </td>
            
            <td>${statusHtml}</td>
            
            <td>
              ${order.payment && order.payment.status === 'VERIFYING'
            ? `<button class="confirm-btn btn-verify" onclick="window.Action.openVerify(${order.id})">Duyệt</button>`
            : ''}
            </td>
          </tr>
        `;
      }).join('');
    },

    // Render Phân trang
    pagination: (totalPages) => {
      if (!DOM.pagination) return;
      DOM.pagination.innerHTML = '';
      const pages = Math.max(1, Number(totalPages || 0));

      const createBtn = (label, page, isActive = false, isDisabled = false) => {
        const btn = document.createElement('button');
        btn.innerHTML = label;
        if (isActive) btn.classList.add('active');
        if (isDisabled) btn.disabled = true;
        btn.onclick = () => {
          if (!isDisabled && page !== state.currentPage) {
            state.currentPage = page;
            API.fetchData();
          }
        };
        return btn;
      };

      DOM.pagination.appendChild(createBtn('<i class="fas fa-chevron-left"></i>', state.currentPage - 1, false, state.currentPage === 0));

      for (let i = 0; i < pages; i++) {
        // Chỉ hiện tối đa 5 trang
        if (i === 0 || i === pages - 1 || Math.abs(state.currentPage - i) <= 1) {
          DOM.pagination.appendChild(createBtn(i + 1, i, i === state.currentPage));
        } else if (DOM.pagination.lastChild.innerText !== '...') {
          const span = document.createElement('span'); span.innerText = '...'; span.style.margin = '0 5px';
          DOM.pagination.appendChild(span);
        }
      }

      DOM.pagination.appendChild(createBtn('<i class="fas fa-chevron-right"></i>', state.currentPage + 1, false, state.currentPage >= pages - 1));
    }
  };

  // ============================================================
  // 4. API HANDLER
  // ============================================================
  const API = {
    fetchData: async () => {
      try {
        let url;
        if (state.isSearchMode) {
          url = `${CONFIG.api.search}?pageNo=${state.currentPage}&pageSize=${CONFIG.pageSize}&search=${encodeURIComponent(state.searchQuery)}&sortBy=totalPrice:asc`;
        } else {
          url = `${CONFIG.api.getAll}?pageNo=${state.currentPage}&pageSize=${CONFIG.pageSize}`;
        }

        const response = await fetch(url);
        const result = await response.json();

        if (result.code === 1000) {
          Render.table(result.data.items || []);
          Render.pagination(result.data.totalPages);
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      }
    },

    confirmPayment: async (isSuccess) => {
      if (!state.currentOrderId) return;
      const url = isSuccess ? CONFIG.api.confirmPay(state.currentOrderId) : CONFIG.api.rejectPay(state.currentOrderId);
      const emailUrl = isSuccess ? CONFIG.api.emailSuccess(state.currentOrderId) : CONFIG.api.emailFail(state.currentOrderId);

      try {
        const res = await fetch(url, { method: 'POST' });
        const data = await res.json();

        if (data.code === 1000) {
          alert(isSuccess ? "Đã xác nhận thanh toán!" : "Đã từ chối thanh toán!");
          fetch(emailUrl, { method: 'POST' }); // Gửi mail ngầm
          DOM.modalPayment.style.display = 'none';
          API.fetchData(); // Reload table
        } else {
          alert("Lỗi: " + (data.message || "Không thể xử lý"));
        }
      } catch (e) {
        alert("Lỗi kết nối server");
      }
    }
  };

  // ============================================================
  // 5. GLOBAL ACTIONS (Gắn vào window để gọi từ HTML onclick)
  // ============================================================
  window.Action = {
    viewFlight: (id) => Render.popupFlight(id),
    viewHotel: (id) => Render.popupHotel(id),
    viewPrice: (id) => Render.popupPrice(id),
    openVerify: (id) => {
      state.currentOrderId = id;
      DOM.modalPayment.style.display = 'flex';
    }
  };

  // ============================================================
  // 6. INITIALIZATION & EVENTS
  // ============================================================

  // Update Time Realtime
  setInterval(() => {
    const now = new Date();
    const d = document.getElementById('currentDate');
    const t = document.getElementById('currentTime');
    if(d) d.innerText = now.toLocaleDateString('vi-VN');
    if(t) t.innerText = now.toLocaleTimeString('vi-VN');
  }, 1000);

  // User Menu Toggle
  const uIcon = document.getElementById('user-icon');
  const uMenu = document.getElementById('user-menu');
  if (uIcon && uMenu) {
    uIcon.onclick = (e) => { e.preventDefault(); uMenu.style.display = uMenu.style.display === 'flex' ? 'none' : 'flex'; };
    document.onclick = (e) => { if (!uIcon.contains(e.target) && !uMenu.contains(e.target)) uMenu.style.display = 'none'; };
  }

  // Search Event
  window.fetchOrdersWithSearch = () => {
    const val = DOM.searchInput.value.trim();
    state.isSearchMode = !!val;
    state.searchQuery = val;
    state.currentPage = 0;
    API.fetchData();
  };

  // Payment Modal Events
  if(DOM.btnClosePayment) DOM.btnClosePayment.onclick = () => DOM.modalPayment.style.display = 'none';
  if(DOM.btnConfirmSuccess) DOM.btnConfirmSuccess.onclick = () => API.confirmPayment(true);
  if(DOM.btnConfirmFail) DOM.btnConfirmFail.onclick = () => API.confirmPayment(false);

  // Start
  document.addEventListener('DOMContentLoaded', () => API.fetchData());

})();