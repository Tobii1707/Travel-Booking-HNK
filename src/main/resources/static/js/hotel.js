document.addEventListener("DOMContentLoaded", function () {
  initUserMenu();
  bindModalClose();
  bindHotelFormSubmit();
  fetchHotels();
});

let hotelData = [];
let selectedRooms = []; // Lưu danh sách phòng đã chọn

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
    const modal = document.getElementById("hotel-modal");
    if (modal) modal.style.display = "none";
  });
}

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

    console.log("Dữ liệu gửi đi:", {
      startHotel: checkinDate,
      endHotel: checkoutDate,
      hotelBedroomList: selectedRooms
    });

    fetch(`/order/chooseHotel/${orderId}/${hotelId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startHotel: checkinDate,
        endHotel: checkoutDate,
        hotelBedroomList: selectedRooms
      })
    })
      .then(response => response.json())
      .then(result => {
        if (result.message === "success") {
          alert("Chọn khách sạn và phòng thành công!");
          document.getElementById("hotel-modal").style.display = "none";
          window.location.href = `/flight?orderId=${result.data.id}`;
        } else {
          alert(result.message || "Chọn khách sạn và phòng thất bại!");
        }
      })
      .catch(error => {
        console.error("Lỗi khi chọn khách sạn và phòng:", error);
        alert("Lỗi khi chọn khách sạn và phòng!");
      });
  });
}

function fetchHotels() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("orderId");

  let apiUrl = "/admin/getAllHotels"; // Mặc định lấy tất cả khách sạn
  if (orderId) {
    apiUrl = `/admin/hotel-in-destination?orderId=${orderId}`; // Nếu có orderId, chỉ lấy theo điểm đến
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
      console.error("Lỗi khi tải danh sách khách sạn:", error);
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
      <div class="hotel-price">Giá từ: ${hotel.hotelPriceFrom.toLocaleString()} VND</div>
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
  if (!hotelList) return;
  hotelList.innerHTML = `<p class="error-message">${message}</p>`;
}

function openHotelModal(hotelId) {
  document.getElementById("hotel-id").value = hotelId;
  document.getElementById("hotel-modal").style.display = "flex";

  const roomList = document.getElementById("room-list");
  roomList.style.display = "none";

  const chooseRoomBtn = document.getElementById("choose-room-btn");

  // ✅ dùng onclick để tránh addEventListener bị nhân bản khi mở modal nhiều lần
  chooseRoomBtn.onclick = function () {
    const hotel = hotelData.find(h => h.id == hotelId);
    if (hotel && hotel.hotelBedrooms.length > 0) {
      if (roomList.style.display === "none") {
        renderRoomList(hotel.hotelBedrooms);
        roomList.style.display = "block";
        chooseRoomBtn.textContent = "Ẩn danh sách phòng";
      } else {
        roomList.style.display = "none";
        chooseRoomBtn.textContent = "Chọn phòng";
      }
    } else {
      roomList.innerHTML = "<p class='error-message'>Không có phòng nào!</p>";
    }
  };
}

function renderRoomList(rooms) {
  const roomList = document.getElementById("room-list");
  roomList.innerHTML = "";

  rooms.forEach(room => {
    const roomItem = document.createElement("div");
    roomItem.classList.add("room-item");

    const isChecked = selectedRooms.some(selected => selected.id === room.id) ? "checked" : "";

    roomItem.innerHTML = `
      <input type="checkbox" id="room-${room.id}" value="${room.id}" ${isChecked}>
      <label for="room-${room.id}">
        Phòng ${room.roomNumber} - ${room.roomType} (${room.price.toLocaleString()} VND)
      </label>
    `;
    roomList.appendChild(roomItem);
  });

  document.querySelectorAll("#room-list input[type='checkbox']").forEach(checkbox => {
    checkbox.addEventListener("change", function () {
      const roomId = parseInt(this.value);
      const room = rooms.find(r => r.id === roomId);

      if (this.checked) {
        selectedRooms.push({
          id: room.id,
          roomNumber: room.roomNumber,
          price: room.price,
          roomType: room.roomType
        });
      } else {
        selectedRooms = selectedRooms.filter(r => r.id !== roomId);
      }
    });
  });
}
