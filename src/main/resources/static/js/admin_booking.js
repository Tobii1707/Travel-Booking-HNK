'use strict';

(function () {
  if (!document.body || !document.body.classList.contains('hust-admin-trip')) return;

  // ============================================================
  // 1. CONFIG & STATE (Đã thêm API Máy bay & Hãng bay)
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
      // Bổ sung API mới từ Controller
      flights: '/flight/getAll',
      airlines: '/api/airlines'
    }
  };

  const state = {
    currentOrderId: null,
    currentPage: 0,
    isSearchMode: false,
    searchQuery: '',
    ordersCache: [],
    // Bộ nhớ đệm cho Máy bay & Hãng bay
    flightsMap: {},
    airlinesMap: {}
  };

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
  // 2. UTILS (Xử lý chuỗi, thời gian & bóc tách dữ liệu)
  // ============================================================
  const Utils = {
    formatMoney: (val) => Number(val || 0).toLocaleString('vi-VN') + ' đ',
    formatDateTime: (str) => str ? new Date(str).toLocaleString('vi-VN', { hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit', year:'numeric'}) : 'N/A',
    formatDate: (str) => str ? new Date(str).toLocaleDateString('vi-VN') : 'N/A',
    getTime: (str) => str ? new Date(str).toLocaleTimeString('vi-VN', { hour: '2-digit', minute:'2-digit' }) : '--:--',
    calcNights: (start, end) => {
      if (!start || !end) return 1;
      const days = Math.round(Math.abs(new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 1;
    },

    // --- HÀM MỚI: Bóc tách rạch ròi Máy bay và Hãng bay ---
    getFlightDetail: (orderFlight) => {
      if (!orderFlight) return null;

      const flightId = orderFlight.id;
      const mappedFlight = state.flightsMap[flightId] || orderFlight;
      const airlineObj = mappedFlight.airline || state.airlinesMap[mappedFlight.airlineId] || {};

      return {
        airlineName: airlineObj.name || airlineObj.airlineName || mappedFlight.airlineName || 'Chưa rõ Hãng bay',

        // [ĐÃ FIX] Bổ sung thêm các trường hợp tên biến phổ biến (flightNumber, airplaneName, planeCode...)
        flightName: mappedFlight.flightNumber || mappedFlight.flightCode || mappedFlight.airplaneName || mappedFlight.airplane || mappedFlight.flightName || `Chuyến bay #${flightId}`,

        depLoc: mappedFlight.departureLocation || 'N/A',
        arrLoc: mappedFlight.arrivalLocation || 'N/A',
        checkIn: mappedFlight.checkInDate,
        ticketClass: mappedFlight.ticketClass === 'BUSINESS_CLASS' ? 'Thương gia' : 'Phổ thông',
        price: mappedFlight.price || 0
      };
    }
  };

  // ============================================================
  // 3. UI RENDERER (Xử lý giao diện ĐÃ CHIA RÕ MÁY BAY/HÃNG BAY)
  // ============================================================
  const Render = {
    customModal: (title, contentHTML) => {
      const oldModal = document.querySelector('.custom-info-modal');
      if (oldModal) oldModal.remove();

      const modal = document.createElement('div');
      modal.className = 'modal custom-info-modal';
      modal.style.cssText = 'display: flex; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 9999;';

      modal.innerHTML = `
        <div class="modal-content bounce-in" style="display: flex; flex-direction: column; max-height: 90vh; background: #fff; width: 600px; max-width: 95%; border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
            <div class="modal-header-sticky" style="flex-shrink: 0; padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: #fff; border-radius: 8px 8px 0 0;">
                <h3 style="margin:0; font-size:1.25rem;">${title}</h3>
                <i class="fas fa-times" onclick="this.closest('.modal').remove()" style="cursor:pointer; font-size:1.2rem; color:#666;"></i>
            </div>
            <div class="modal-body-content" style="flex-grow: 1; overflow-y: auto; padding: 20px;">
                ${contentHTML}
            </div>
            <div class="modal-btn-group" style="flex-shrink: 0; padding: 15px; border-top: 1px solid #eee; background: #f9f9f9; border-radius: 0 0 8px 8px; text-align: right;">
                <button class="modal-btn btn-close" onclick="this.closest('.modal').remove()" style="width:100px; padding:8px 0; cursor:pointer;">Đóng</button>
            </div>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    },

    // Popup 1: Vé Máy Bay (GIAO DIỆN ĐÃ ĐƯỢC CHIA RÕ HÃNG BÀY VÀ TÊN CHUYẾN BAY)
    popupFlight: (id) => {
      const order = state.ordersCache.find(o => o.id === id);
      if (!order?.flight) return;

      const fInfo = Utils.getFlightDetail(order.flight);
      const seatDisplay = order.listSeats ? order.listSeats.replace(/,/g, ', ') : 'Chưa chọn ghế';
      const depCode = fInfo.depLoc !== 'N/A' ? fInfo.depLoc.substring(0,3).toUpperCase() : 'N/A';
      const arrCode = fInfo.arrLoc !== 'N/A' ? fInfo.arrLoc.substring(0,3).toUpperCase() : 'N/A';

      const html = `
        <div class="admin-ticket" style="border:1px solid #e0e0e0; border-radius:8px; overflow:hidden;">
            <div class="ticket-header" style="background:#f0f8ff; padding:15px; display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px dashed #bdc3c7;">
                <div>
                    <div style="font-size:1.2rem; font-weight:bold; color:#2980b9;">
                        <i class="fas fa-plane-departure"></i> ${fInfo.airlineName}
                    </div>
                    <div style="font-size:0.95rem; color:#34495e; margin-top:5px;">
                        Máy bay / Số hiệu: <span style="background:#e8f4fd; padding:3px 8px; border-radius:4px; font-weight:bold;">${fInfo.flightName}</span>
                    </div>
                </div>
                <span class="class-badge" style="background:#e67e22; color:#fff; padding:5px 12px; border-radius:15px; font-size:0.85rem; font-weight:bold;">
                    ${fInfo.ticketClass}
                </span>
            </div>
            
            <div class="ticket-body" style="padding:20px;">
                <div class="route-visual">
                    <div class="point">
                        <span class="code">${depCode}</span>
                        <span class="city">${fInfo.depLoc}</span>
                        <span class="time">${Utils.getTime(fInfo.checkIn)}</span>
                    </div>
                    <div class="flight-icon">
                        <i class="fas fa-plane"></i>
                        <span class="date-small">${Utils.formatDate(fInfo.checkIn)}</span>
                    </div>
                    <div class="point">
                        <span class="code">${arrCode}</span>
                        <span class="city">${fInfo.arrLoc}</span>
                        <span class="time">--:--</span>
                    </div>
                </div>

                <div class="ticket-footer" style="margin-top:20px; background:#fafafa; padding:10px; border-radius:6px; text-align:center;">
                    <span style="color:#7f8c8d; font-size:0.9rem;">SỐ GHẾ ĐÃ ĐẶT</span><br/>
                    <span style="font-size:1.2rem; font-weight:bold; color:#27ae60;">${seatDisplay}</span>
                </div>
            </div>
        </div>`;
      Render.customModal('Chi tiết Vé Máy Bay', html);
    },

    popupHotel: (id) => {
      // [Giữ nguyên code popupHotel của bạn]
      const order = state.ordersCache.find(o => o.id === id);
      if (!order?.hotel) return;

      const nights = Utils.calcNights(order.startHotel, order.endHotel);
      const checkIn = order.startHotel ? new Date(order.startHotel) : new Date();
      const checkOut = order.endHotel ? new Date(order.endHotel) : new Date();
      const hotelName = order.hotel.hotelName || 'Chưa rõ tên khách sạn';

      const html = `
          <div class="admin-voucher">
              <div class="voucher-header">
                  <i class="fas fa-hotel"></i> ${hotelName}
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
                  <div class="info-grid">
                      <div class="info-item" style="border-bottom:1px dashed #eee; padding-bottom:8px;">
                          <span class="lbl"><i class="fas fa-map-marker-alt"></i> Địa chỉ:</span>
                          <div class="val">${order.hotel.address || 'N/A'}</div>
                      </div>
                      <div class="info-item" style="background:#f0f8ff; padding:10px; border-radius:6px; margin-top:5px">
                          <span class="lbl" style="color:#2980b9"><i class="fas fa-bed"></i> Chi tiết phòng:</span>
                          <div class="val highlight">${order.listBedrooms || 'Theo sắp xếp của khách sạn'}</div>
                      </div>
                  </div>
              </div>
          </div>`;
      Render.customModal('Voucher Khách Sạn', html);
    },

    // Popup 3: Bảng kê chi tiết tính tiền (HÓA ĐƠN)
    popupPrice: (id) => {
      const order = state.ordersCache.find(o => o.id === id);
      if (!order) return;

      let flightRows = '';
      let flightTotal = 0;

      if (order.flight) {
        const fInfo = Utils.getFlightDetail(order.flight);
        const seatStr = order.listSeats ? order.listSeats.trim() : "";
        const seats = seatStr.length > 0 ? seatStr.split(/\s+/) : [];
        const seatCount = seats.length > 0 ? seats.length : (order.numberOfPeople || 1);
        flightTotal = fInfo.price * seatCount;
        const isVip = fInfo.ticketClass === 'Thương gia';

        // Render Hóa đơn: Tên hãng màu xanh nhạt, Tên máy bay in đậm
        const flightDescHTML = `
            <div style="font-size:0.85em; color:#7f8c8d; margin-top:4px;">
                <i class="far fa-building"></i> Hãng: <strong style="color:#2980b9">${fInfo.airlineName}</strong><br/>
                <i class="fas fa-plane"></i> Chuyến: <strong>${fInfo.flightName}</strong>
            </div>
        `;

        if (seats.length > 0) {
          flightRows = seats.map((seat) => `
                <tr>
                    <td>
                        <div style="font-weight:500;"><i class="fas fa-chair"></i> Ghế: ${seat} ${isVip ? '<span style="color:#d35400">(VIP)</span>' : ''}</div>
                        ${flightDescHTML}
                    </td>
                    <td class="text-right">${Utils.formatMoney(fInfo.price)}</td>
                    <td class="text-center">1</td>
                    <td class="text-right font-weight-bold">${Utils.formatMoney(fInfo.price)}</td>
                </tr>
            `).join('');
        } else {
          flightRows = `<tr>
                <td>Vé máy bay ${flightDescHTML}</td>
                <td class="text-right">${Utils.formatMoney(fInfo.price)}</td>
                <td class="text-center">${seatCount}</td>
                <td class="text-right font-weight-bold">${Utils.formatMoney(flightTotal)}</td>
            </tr>`;
        }
      }

      let hotelRows = '';
      let hotelSubTotal = Math.max(0, (order.totalPrice || 0) - flightTotal);

      if (order.hotel) {
        const hotelName = order.hotel.hotelName || 'Khách sạn N/A';
        const roomStr = order.listBedrooms ? order.listBedrooms.trim() : "";
        const rooms = roomStr.length > 0 ? roomStr.split(/\s+/) : [];
        const nights = Utils.calcNights(order.startHotel, order.endHotel);
        const avgPrice = rooms.length > 0 ? (hotelSubTotal / rooms.length) : hotelSubTotal;

        if (rooms.length > 0) {
          hotelRows = rooms.map(room => `
                <tr>
                    <td>
                        <div style="font-weight:500;"><i class="fas fa-bed"></i> Phòng: ${room}</div>
                        <div style="font-size:0.8em; color:#7f8c8d;">${hotelName} <span style="color:#e67e22; font-weight:bold;">(${nights} đêm)</span></div>
                    </td>
                    <td class="text-right">${Utils.formatMoney(avgPrice)}</td>
                    <td class="text-center">1</td>
                    <td class="text-right font-weight-bold">${Utils.formatMoney(avgPrice)}</td>
                </tr>`).join('');
        } else {
          hotelRows = `<tr><td>Phòng khách sạn (${nights} đêm)</td><td class="text-right">${Utils.formatMoney(hotelSubTotal)}</td><td class="text-center">1</td><td class="text-right font-weight-bold">${Utils.formatMoney(hotelSubTotal)}</td></tr>`;
        }
      }

      const html = `
        <div class="invoice-box">
            <div class="invoice-meta">
                <div><strong>Mã đơn:</strong> #${order.id}</div>
                <div><strong>Khách:</strong> ${order.user && order.user.fullName ? order.user.fullName : 'Guest'}</div>
            </div>
            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Hạng mục</th><th class="text-right">Đơn giá</th><th class="text-center">SL</th><th class="text-right">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>${flightRows}${hotelRows}</tbody>
            </table>
            <div class="invoice-footer">
                <span class="label">Tổng cộng</span><span class="total-price">${Utils.formatMoney(order.totalPrice)}</span>
            </div>
        </div>`;
      Render.customModal('Hóa đơn chi tiết', html);
    },

    table: (orders) => {
      // [Giữ nguyên logic bảng cũ của bạn, vì thông tin hãng/máy bay nằm trong popup là chủ yếu]
      // Nếu muốn show ra cả ở bảng, tôi có thể sửa cột "Hành trình". Tạm thời giữ nguyên để tối ưu diện tích.
      state.ordersCache = orders;
      if (!DOM.tableBody) return;

      if (!Array.isArray(orders) || orders.length === 0) {
        DOM.tableBody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 20px;">${state.isSearchMode ? 'Không tìm thấy kết quả' : 'Chưa có đơn hàng nào'}</td></tr>`;
        return;
      }

      DOM.tableBody.innerHTML = orders.map(order => {
        let statusHtml = '<span style="color:#999">N/A</span>';
        if (order.payment && order.payment.status) {
          const s = order.payment.status;
          if (s === 'PAID') statusHtml = '<span class="status-paid">Đã thanh toán</span>';
          else if (s === 'VERIFYING') statusHtml = '<span class="status-verifying">Đang xác thực</span>';
          else if (s === 'PAYMENT_FAILED') statusHtml = '<span class="status-unpaid">Thất bại</span>';
        }

        let journey = `<span>${order.destination || 'N/A'}</span>`;
        if (order.flight) {
          const fInfo = Utils.getFlightDetail(order.flight);
          journey = `
              <div style="font-size:0.8rem; color:#7f8c8d;">${fInfo.depLoc}</div>
              <div style="font-weight:600; color:#2c3e50; font-size:0.9rem;">➝ ${fInfo.arrLoc}</div>`;
        }

        const people = order.numberOfPeople || 1;
        const userName = (order.user && order.user.fullName) ? order.user.fullName : 'Khách vãng lai';

        return `
            <tr>
              <td>#${order.id}</td>
              <td>${Utils.formatDate(order.orderDate)}</td>
              <td><strong>${userName}</strong></td>
              <td class="text-center"><span class="badge-people">${people} <i class="fas fa-user"></i></span></td>
              <td>${journey}</td>
              <td class="text-center">${order.flight ? `<button class="btn-eye" onclick="window.Action.viewFlight(${order.id})"><i class="fas fa-plane"></i></button>` : '<span style="color:#ccc">-</span>'}</td>
              <td class="text-center">${order.hotel ? `<button class="btn-eye" onclick="window.Action.viewHotel(${order.id})"><i class="fas fa-hotel"></i></button>` : '<span style="color:#ccc">-</span>'}</td>
              <td>
                <div style="display:flex; align-items:center; gap:8px;">
                  <b style="color:#d35400;">${Utils.formatMoney(order.totalPrice)}</b>
                  <button class="btn-eye-price" onclick="window.Action.viewPrice(${order.id})"><i class="fas fa-info"></i></button>
                </div>
              </td>
              <td>${statusHtml}</td>
              <td>${order.payment && order.payment.status === 'VERIFYING' ? `<button class="confirm-btn btn-verify" onclick="window.Action.openVerify(${order.id})">Duyệt</button>` : ''}</td>
            </tr>
          `;
      }).join('');
    },

    pagination: (totalPages) => {
      // [Giữ nguyên hàm render pagination]
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
  // 4. API HANDLER (Tích hợp thêm việc Fetch Data Airline & Flight)
  // ============================================================
  const API = {
    // Hàm gọi lấy Reference Data 1 lần lúc mới tải trang
    initReferenceData: async () => {
      try {
        const [flightRes, airlineRes] = await Promise.all([
          fetch(CONFIG.api.flights).then(res => res.json()),
          fetch(CONFIG.api.airlines).then(res => res.json())
        ]);

        // Map Hãng bay (API Airline trả về trực tiếp mảng hoặc bọc trong data)
        const airlines = Array.isArray(airlineRes) ? airlineRes : (airlineRes.data || []);
        airlines.forEach(a => state.airlinesMap[a.id] = a);

        // Map Chuyến bay (API Flight bọc trong ApiResponse)
        const flights = flightRes.data || [];
        flights.forEach(f => state.flightsMap[f.id] = f);

      } catch (error) {
        console.warn("Không thể tải reference data máy bay/hãng bay:", error);
      }
    },

    fetchData: async () => {
      try {
        let url = state.isSearchMode
            ? `${CONFIG.api.search}?pageNo=${state.currentPage}&pageSize=${CONFIG.pageSize}&search=${encodeURIComponent(state.searchQuery)}&sortBy=totalPrice:asc`
            : `${CONFIG.api.getAll}?pageNo=${state.currentPage}&pageSize=${CONFIG.pageSize}`;

        const response = await fetch(url);
        const result = await response.json();

        if (result.code === 1000) {
          Render.table(result.data.items || []);
          Render.pagination(result.data.totalPages);
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu Order:", error);
      }
    },

    confirmPayment: async (isSuccess) => {
      // [Giữ nguyên logic confirm Payment]
      if (!state.currentOrderId) return;
      const url = isSuccess ? CONFIG.api.confirmPay(state.currentOrderId) : CONFIG.api.rejectPay(state.currentOrderId);
      const emailUrl = isSuccess ? CONFIG.api.emailSuccess(state.currentOrderId) : CONFIG.api.emailFail(state.currentOrderId);

      try {
        const res = await fetch(url, { method: 'POST' });
        const data = await res.json();
        if (data.code === 1000) {
          alert(isSuccess ? "Đã xác nhận thanh toán!" : "Đã từ chối thanh toán!");
          fetch(emailUrl, { method: 'POST' });
          if (DOM.modalPayment) DOM.modalPayment.style.display = 'none';
          API.fetchData();
        } else {
          alert("Lỗi: " + (data.message || "Không thể xử lý"));
        }
      } catch (e) {
        alert("Lỗi kết nối server");
      }
    }
  };

  // ============================================================
  // 5. GLOBAL ACTIONS
  // ============================================================
  window.Action = {
    viewFlight: (id) => Render.popupFlight(id),
    viewHotel: (id) => Render.popupHotel(id),
    viewPrice: (id) => Render.popupPrice(id),
    openVerify: (id) => {
      state.currentOrderId = id;
      if (DOM.modalPayment) DOM.modalPayment.style.display = 'flex';
    }
  };

  // ============================================================
  // 6. INITIALIZATION & EVENTS
  // ============================================================
  const initEvents = async () => {
    const elDate = document.getElementById('currentDate');
    const elTime = document.getElementById('currentTime');

    setInterval(() => {
      const now = new Date();
      if(elDate) elDate.innerText = now.toLocaleDateString('vi-VN');
      if(elTime) elTime.innerText = now.toLocaleTimeString('vi-VN');
    }, 1000);

    const uIcon = document.getElementById('user-icon');
    const uMenu = document.getElementById('user-menu');
    if (uIcon && uMenu) {
      uIcon.onclick = (e) => { e.preventDefault(); uMenu.style.display = uMenu.style.display === 'flex' ? 'none' : 'flex'; };
      document.onclick = (e) => { if (!uIcon.contains(e.target) && !uMenu.contains(e.target)) uMenu.style.display = 'none'; };
    }

    window.fetchOrdersWithSearch = () => {
      if (!DOM.searchInput) return;
      state.isSearchMode = !!DOM.searchInput.value.trim();
      state.searchQuery = DOM.searchInput.value.trim();
      state.currentPage = 0;
      API.fetchData();
    };

    if(DOM.btnClosePayment) DOM.btnClosePayment.onclick = () => DOM.modalPayment.style.display = 'none';
    if(DOM.btnConfirmSuccess) DOM.btnConfirmSuccess.onclick = () => API.confirmPayment(true);
    if(DOM.btnConfirmFail) DOM.btnConfirmFail.onclick = () => API.confirmPayment(false);

    // BƯỚC 1: Load dữ liệu Hãng & Máy bay trước
    await API.initReferenceData();
    // BƯỚC 2: Gọi data đơn hàng sau khi đã có dữ liệu map
    API.fetchData();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEvents);
  } else {
    initEvents();
  }

})();