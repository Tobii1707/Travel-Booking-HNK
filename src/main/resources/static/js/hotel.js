document.addEventListener("DOMContentLoaded", function () {
  initUserMenu();
  bindModalClose();
  bindHotelFormSubmit();
  fetchHotels();
});

let hotelData = [];
let selectedRooms = []; // Mảng toàn cục lưu các phòng đang chọn

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
    // Backend Spring Boot chỉ cần ID để map entity
    const cleanRoomList = selectedRooms.map(room => ({
      id: room.id
      // Nếu Backend yêu cầu bắt buộc phải có price/roomNumber thì uncomment dòng dưới:
      // , price: room.price, roomNumber: room.roomNumber
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
            // Cố gắng đọc lỗi text hoặc json
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
            // Nếu lỗi là text raw (ví dụ stacktrace)
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

/* ================= LOGIC MODAL & ROOM LIST ================= */

function openHotelModal(hotelId) {
  const hotelIdInput = document.getElementById("hotel-id");
  if (hotelIdInput) hotelIdInput.value = hotelId;

  selectedRooms = [];
  updateSelectedUI();

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
    let floorNum = String(room.roomNumber).substring(0, 1);
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

function updateSelectedUI() {
  let infoDiv = document.getElementById("selected-info");

  if (!infoDiv) {
    const modalBody = document.querySelector("#hotel-modal .modal-content");
    if (modalBody) {
      infoDiv = document.createElement("div");
      infoDiv.id = "selected-info";
      infoDiv.style.marginTop = "10px";
      infoDiv.style.fontWeight = "bold";
      infoDiv.style.color = "var(--primary-color)";
      modalBody.insertBefore(infoDiv, document.getElementById("hotel-form"));
    } else return;
  }

  if (selectedRooms.length === 0) {
    infoDiv.innerText = "Chưa chọn phòng nào.";
  } else {
    const total = selectedRooms.reduce((sum, r) => sum + r.price, 0);
    infoDiv.innerText = `Đã chọn: ${selectedRooms.length} phòng. Tổng tạm tính: ${total.toLocaleString()} VND`;
  }
}