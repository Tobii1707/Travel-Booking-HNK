document.addEventListener("DOMContentLoaded", function () {
  initUserMenu();
  bindModalClose();
  bindHotelFormSubmit();
  fetchHotels();
});

let hotelData = [];
let selectedRooms = []; // Mảng toàn cục lưu các phòng đang chọn
let currentHotelPolicies = []; // [MỚI] Lưu danh sách chính sách của khách sạn đang xem

/* ================= CHỨC NĂNG CŨ (GIỮ NGUYÊN) ================= */

function initUserMenu() {
  const userIcon = document.getElementById("user-icon");
  const menu = document.getElementById("user-menu");
  if (!userIcon || !menu) return;

  userIcon.addEventListener("click", function (event) {
    event.preventDefault();
    menu.style.display = menu.style.display === "flex" ? "none" : "flex";
  });

  document.addEventListener("click", function (event) {
    if (!userIcon.contains(event.target) && !menu.contains(event.target)) {
      menu.style.display = "none";
    }
  });
}

function bindModalClose() {
  const closeBtn = document.querySelector(".close-modal");
  if (!closeBtn) return;
  closeBtn.addEventListener("click", function () {
    document.getElementById("hotel-modal").style.display = "none";
  });
}

// --- HÀM XỬ LÝ NGÀY GIỜ ---
function formatHotelDate(dateStr, isCheckOut) {
  if (!dateStr) return null;
  if (dateStr.includes('T')) return dateStr;

  if (isCheckOut) {
    return dateStr + 'T12:00:00';
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (dateStr === todayStr) {
    const safeTime = new Date(now.getTime() + 5 * 60 * 1000);
    const timePart = safeTime.toTimeString().split(' ')[0];
    return `${dateStr}T${timePart}`;
  } else {
    return dateStr + 'T14:00:00';
  }
}

// --- SỬA HÀM SUBMIT FORM (FIX LỖI BYTEBUDDY) ---
function bindHotelFormSubmit() {
  const form = document.getElementById("hotel-form");
  if (!form) return;

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get("orderId");

    if (!orderId) {
      alert("Không tìm thấy orderId. Vui lòng đặt tour trước!");
      return;
    }

    const hotelId = document.getElementById("hotel-id").value;
    const checkinDate = document.getElementById("checkin-date").value;
    const checkoutDate = document.getElementById("checkout-date").value;

    if (!hotelId || !checkinDate || !checkoutDate || selectedRooms.length === 0) {
      alert("Vui lòng nhập đầy đủ thông tin và chọn ít nhất một phòng!");
      return;
    }

    const startHotelISO = formatHotelDate(checkinDate, false);
    const endHotelISO = formatHotelDate(checkoutDate, true);

    // --- FIX QUAN TRỌNG: Map lại object để loại bỏ ByteBuddy Proxy ---
    const cleanRoomList = selectedRooms.map(room => ({
      id: room.id
    }));

    const payload = {
      startHotel: startHotelISO,
      endHotel: endHotelISO,
      hotelBedroomList: cleanRoomList
    };

    console.log("Payload sạch gửi đi:", payload);

    fetch(`/order/chooseHotel/${orderId}/${hotelId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
        .then(async response => {
          if (!response.ok) {
            const text = await response.text();
            try {
              const jsonError = JSON.parse(text);
              throw new Error(JSON.stringify(jsonError));
            } catch(e) {
              throw new Error(text);
            }
          }
          return response.json();
        })
        .then(result => {
          if (result.code === 1000 || result.code === 200) {
            alert("Đặt phòng thành công!");
            document.getElementById("hotel-modal").style.display = "none";
            window.location.href = `/flight?orderId=${result.data.id || orderId}`;
          } else {
            alert(result.message || "Thất bại!");
          }
        })
        .catch(error => {
          console.error("Lỗi:", error);
          try {
            const errJson = JSON.parse(error.message);
            alert("Lỗi: " + (errJson.message || "Hệ thống bận"));
          } catch(e) {
            alert("Lỗi hệ thống: " + error.message.substring(0, 100) + "...");
          }
        });
  });
}

function fetchHotels() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("orderId");

  let apiUrl = "/admin/getAllHotels";
  if (orderId) {
    apiUrl = `/admin/hotel-in-destination?orderId=${orderId}`;
  }

  fetch(apiUrl)
      .then(response => response.json())
      .then(result => {
        if (result.code === 1000 && result.data.length > 0) {
          hotelData = result.data;
          renderHotels(hotelData);
        } else {
          showError("Không có khách sạn nào!");
        }
      })
      .catch(error => {
        console.error("Lỗi tải khách sạn:", error);
        showError("Không thể tải danh sách khách sạn!");
      });
}

function renderHotels(hotels) {
  const hotelList = document.getElementById("hotel-list");
  if (!hotelList) return;
  hotelList.innerHTML = "";

  hotels.forEach(hotel => {
    const hotelItem = document.createElement("div");
    hotelItem.classList.add("hotel-item");
    hotelItem.innerHTML = `
      <div class="hotel-name">${hotel.hotelName}</div>
      <div class="hotel-price">Giá từ: ${hotel.hotelPriceFrom ? hotel.hotelPriceFrom.toLocaleString() : 0} VND</div>
      <div class="hotel-address">Địa chỉ: ${hotel.address}</div>
      <div class="hotel-floors">Số tầng: ${hotel.numberFloor}</div>
      <button class="choose-hotel" data-hotel-id="${hotel.id}">Chọn khách sạn</button>
    `;
    hotelList.appendChild(hotelItem);
  });

  document.querySelectorAll(".choose-hotel").forEach(button => {
    button.addEventListener("click", function () {
      const hotelId = this.getAttribute("data-hotel-id");
      openHotelModal(hotelId);
    });
  });
}

function showError(message) {
  const hotelList = document.getElementById("hotel-list");
  if (hotelList) hotelList.innerHTML = `<p class="error-message">${message}</p>`;
}

/* ================= LOGIC MODAL & ROOM LIST (CẬP NHẬT) ================= */

// [MỚI] Hàm hỗ trợ định dạng tiền tệ
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

// [MỚI] Hàm format ngày Việt Nam (dd/mm/yyyy)
function formatDateVN(dateStr) {
  if (!dateStr) return '...';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// [MỚI] Hàm kiểm tra ngày có nằm trong khoảng chính sách không
function isDateInPolicy(targetDateStr, startDateStr, endDateStr) {
  if (!targetDateStr || !startDateStr || !endDateStr) return false;
  const target = new Date(targetDateStr);
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  // Reset giờ về 0 để so sánh ngày chính xác
  target.setHours(0,0,0,0);
  start.setHours(0,0,0,0);
  end.setHours(0,0,0,0);

  return target >= start && target <= end;
}

// [ĐÃ SỬA] Thêm logic fetch chính sách khi mở modal
async function openHotelModal(hotelId) {
  const hotelIdInput = document.getElementById("hotel-id");
  if (hotelIdInput) hotelIdInput.value = hotelId;

  selectedRooms = [];
  currentHotelPolicies = []; // Reset chính sách cũ

  // 1. Fetch Chính sách giá từ API thật
  try {
    const policyRes = await fetch(`/admin/hotels/${hotelId}/policies`);
    const policyData = await policyRes.json();
    if (policyData.code === 1000 && policyData.data) {
      currentHotelPolicies = policyData.data;
      console.log("Đã tải chính sách KS:", currentHotelPolicies);
    }
  } catch (e) {
    console.warn("Không tải được lịch sử chính sách:", e);
  }

  updateSelectedUI(); // Reset UI về trạng thái chưa chọn

  const modal = document.getElementById("hotel-modal");
  if (modal) modal.style.display = "flex";

  const roomList = document.getElementById("room-list");
  const chooseRoomBtn = document.getElementById("choose-room-btn");

  if (roomList) {
    roomList.style.display = "none";
    roomList.innerHTML = '';
  }

  if (chooseRoomBtn) {
    chooseRoomBtn.textContent = "Kiểm tra phòng trống";
    chooseRoomBtn.onclick = async function () {
      const checkIn = document.getElementById("checkin-date").value;
      const checkOut = document.getElementById("checkout-date").value;

      if (!checkIn || !checkOut) {
        alert("Vui lòng chọn ngày nhận và trả phòng!");
        return;
      }
      if (new Date(checkIn) >= new Date(checkOut)) {
        alert("Ngày trả phòng phải sau ngày nhận phòng!");
        return;
      }

      roomList.style.display = "block";
      roomList.innerHTML = '<p style="text-align:center; padding:20px;">Đang tải sơ đồ phòng...</p>';

      try {
        const fetchAllRooms = fetch(`/admin/get-rooms/${hotelId}?checkInDate=${checkIn}`)
            .then(res => res.json());

        const fetchBookedRooms = fetch(`/admin/booked-rooms?hotelId=${hotelId}&startDate=${checkIn}&endDate=${checkOut}`)
            .then(res => {
              if (res.ok) return res.json();
              return [];
            })
            .catch(() => []);

        const [allRoomsResult, bookedIds] = await Promise.all([fetchAllRooms, fetchBookedRooms]);
        const rooms = allRoomsResult.data || allRoomsResult;

        if (Array.isArray(rooms) && rooms.length > 0) {
          renderRoomList(rooms, Array.isArray(bookedIds) ? bookedIds : []);
          chooseRoomBtn.textContent = "Cập nhật ngày";

          // [QUAN TRỌNG] Gọi lại update UI để tính lại giá theo ngày mới
          updateSelectedUI();
        } else {
          roomList.innerHTML = "<p class='error-message'>Khách sạn này chưa cập nhật danh sách phòng!</p>";
        }

      } catch (error) {
        console.error("Lỗi:", error);
        roomList.innerHTML = "<p class='error-message'>Lỗi kết nối Server!</p>";
      }
    };
  }
}

function renderRoomList(rooms, bookedIds) {
  const container = document.getElementById("room-list");
  container.innerHTML = "";

  rooms.sort((a, b) => {
    const numA = parseInt(String(a.roomNumber).replace(/\D/g, '')) || 0;
    const numB = parseInt(String(b.roomNumber).replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  const floors = {};

  rooms.forEach(room => {
    let cleanNumber = parseInt(String(room.roomNumber).replace(/\D/g, '')) || 0;
    let floorNum = Math.floor(cleanNumber / 100);
    if (floorNum === 0) floorNum = 1;

    if (!floors[floorNum]) floors[floorNum] = [];
    floors[floorNum].push(room);
  });

  for (const [floor, floorRooms] of Object.entries(floors)) {
    const floorDiv = document.createElement("div");
    floorDiv.className = "hotel-floor";
    floorDiv.innerHTML = `<div class="floor-name" style="font-weight:bold; margin:10px 0;">Tầng ${floor}</div>`;

    const roomsDiv = document.createElement("div");
    roomsDiv.className = "floor-rooms";
    roomsDiv.style.display = "flex";
    roomsDiv.style.flexWrap = "wrap";
    roomsDiv.style.gap = "10px";

    floorRooms.forEach(room => {
      const roomBox = document.createElement("div");
      roomBox.className = "room-box";
      roomBox.style.width = "80px";
      roomBox.style.height = "80px";
      roomBox.style.border = "1px solid #ccc";
      roomBox.style.display = "flex";
      roomBox.style.flexDirection = "column";
      roomBox.style.alignItems = "center";
      roomBox.style.justifyContent = "center";
      roomBox.style.cursor = "pointer";
      roomBox.style.borderRadius = "5px";

      const isBooked = bookedIds.includes(room.id);
      if (isBooked) {
        roomBox.style.backgroundColor = "#ffcccc";
        roomBox.style.color = "#a00";
        roomBox.style.cursor = "not-allowed";
        roomBox.title = "Đã có người đặt";
        roomBox.innerHTML = `
                    <span style="font-weight:bold">${room.roomNumber}</span>
                    <span style="font-size:12px">Bận</span>
                `;
      } else {
        roomBox.style.backgroundColor = "#fff";
        roomBox.innerHTML = `
                    <span style="font-weight:bold">${room.roomNumber}</span>
                    <span style="font-size:11px">${room.price.toLocaleString()}</span>
                `;
        roomBox.onclick = () => toggleSelectRoom(room, roomBox);
      }
      roomsDiv.appendChild(roomBox);
    });

    floorDiv.appendChild(roomsDiv);
    container.appendChild(floorDiv);
  }
}

function toggleSelectRoom(room, element) {
  const index = selectedRooms.findIndex(r => r.id === room.id);

  if (index > -1) {
    selectedRooms.splice(index, 1);
    element.style.backgroundColor = "#fff";
    element.style.borderColor = "#ccc";
  } else {
    selectedRooms.push(room);
    element.style.backgroundColor = "#e0f7fa";
    element.style.borderColor = "#00bcd4";
  }
  updateSelectedUI();
}

// [ĐÃ SỬA ĐẦY ĐỦ LOGIC + HIỂN THỊ CẢNH BÁO]
function updateSelectedUI() {
  let infoDiv = document.getElementById("selected-info");

  // Tạo div nếu chưa có
  if (!infoDiv) {
    const modalBody = document.querySelector("#hotel-modal .modal-content");
    if (modalBody) {
      infoDiv = document.createElement("div");
      infoDiv.id = "selected-info";
      infoDiv.style.marginTop = "15px";
      const hotelForm = document.getElementById("hotel-form");
      if (hotelForm) {
        modalBody.insertBefore(infoDiv, hotelForm);
      } else {
        modalBody.appendChild(infoDiv);
      }
    } else return;
  }

  // 1. Nếu chưa chọn phòng
  if (selectedRooms.length === 0) {
    infoDiv.innerHTML = '<div style="color: #666; text-align: center; padding: 10px;">Vui lòng chọn phòng trên sơ đồ</div>';
    infoDiv.style.display = "block";
    return;
  }
  infoDiv.style.display = "block";

  // 2. Tính tổng tiền hiện tại từ API (Đây là giá ĐÃ tính chính sách rồi)
  const currentTotalFromApi = selectedRooms.reduce((sum, r) => sum + r.price, 0);

  // 3. Tìm chính sách áp dụng
  const checkInVal = document.getElementById("checkin-date").value;
  let activePolicy = null;

  if (checkInVal && currentHotelPolicies.length > 0) {
    activePolicy = currentHotelPolicies.find(p => isDateInPolicy(checkInVal, p.startDate, p.endDate));
  }

  // 4. Logic hiển thị
  let originalPrice = currentTotalFromApi;
  let finalPrice = currentTotalFromApi;

  let percentage = 0;
  let isSurcharge = false;
  let policyName = "";
  let policyDateRange = ""; // [MỚI] Biến lưu chuỗi ngày

  if (activePolicy) {
    policyName = activePolicy.name || "Chính sách đặc biệt";

    // [MỚI] Tạo chuỗi hiển thị ngày
    const startStr = formatDateVN(activePolicy.startDate);
    const endStr = formatDateVN(activePolicy.endDate);
    policyDateRange = `${startStr} - ${endStr}`;

    percentage = activePolicy.percentage !== undefined ? activePolicy.percentage : (activePolicy.adjustmentValue || 0);
    isSurcharge = percentage > 0;

    // Tính ngược lại giá gốc để hiển thị gạch ngang (Tránh Double Discount)
    if (percentage !== 0) {
      originalPrice = currentTotalFromApi / (1 + (percentage / 100));
    }
  }

  // 5. Xây dựng HTML hiển thị
  const colorTheme = isSurcharge ? '#dc3545' : '#29b862'; // Đỏ (Tăng) hoặc Xanh (Giảm)
  const badgeText = percentage > 0 ? `+${percentage}%` : `${percentage}%`;
  const iconClass = isSurcharge ? '↑' : '↓';

  let htmlContent = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 1rem;">
            <span>Đã chọn:</span>
            <strong>${selectedRooms.length} phòng</strong>
        </div>
    `;

  // TRƯỜNG HỢP CÓ CHÍNH SÁCH
  if (percentage !== 0) {
    htmlContent += `
            <div style="background: #fff; padding: 15px; border-radius: 8px; border: 1px dashed ${colorTheme}; position: relative; overflow: hidden; margin-bottom: 10px;">
                
                <div style="
                    position: absolute; top: 0; right: 0; 
                    background: ${colorTheme}; color: white; 
                    font-size: 0.75rem; font-weight: bold; 
                    padding: 3px 10px; border-bottom-left-radius: 8px;">
                    ${policyName}
                </div>

                <div style="margin-top: 15px; margin-bottom: 10px; font-size: 0.85rem; color: #555;">
                    <i class="fa fa-calendar-check-o" aria-hidden="true"></i> Áp dụng: <strong>${policyDateRange}</strong>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                        <div style="font-size: 0.85rem; color: #888; margin-bottom: 2px;">Giá gốc (Ngày thường)</div>
                        <div style="text-decoration: line-through; color: #999; font-size: 1.1rem;">
                            ${formatCurrency(originalPrice)} 
                        </div>
                    </div>

                    <div style="text-align: right;">
                         <span style="
                            display: inline-block;
                            background: ${isSurcharge ? '#ffebee' : '#e8f5e9'}; 
                            color: ${colorTheme};
                            padding: 2px 8px; border-radius: 4px; 
                            font-size: 0.9rem; font-weight: bold; margin-bottom: 4px;">
                            ${badgeText} ${iconClass}
                        </span>
                        
                        <div style="color: ${colorTheme}; font-size: 1.5rem; font-weight: 700; line-height: 1.2;">
                            ${formatCurrency(finalPrice)}
                        </div>
                    </div>
                </div>
                
                <div style="
                    margin-top: 12px; 
                    background-color: #fff3cd; 
                    color: #856404; 
                    padding: 8px; 
                    border-radius: 4px; 
                    font-size: 0.8rem; 
                    border: 1px solid #ffeeba;">
                    <strong>Lưu ý:</strong> Mức giá ${isSurcharge ? 'phụ thu' : 'ưu đãi'} trên chỉ áp dụng cho các đêm nằm trong khoảng thời gian chính sách. Các đêm nằm ngoài khoảng này sẽ tính theo giá gốc tại thời điểm đó.
                </div>
            </div>
        `;
  }
  // TRƯỜNG HỢP KHÔNG CÓ CHÍNH SÁCH
  else {
    htmlContent += `
            <div style="text-align: right; margin-top: 15px; padding: 15px; background: #f9f9f9; border-radius: 8px;">
                <div style="font-size: 0.9rem; color: #666;">Tổng thanh toán</div>
                <div style="color: #29b862; font-size: 1.5rem; font-weight: 700;">
                    ${formatCurrency(finalPrice)}
                </div>
                <div style="font-size: 0.8rem; color: #888; margin-top: 5px;">(Đang áp dụng giá tiêu chuẩn)</div>
            </div>
        `;
  }

  infoDiv.innerHTML = htmlContent;
}