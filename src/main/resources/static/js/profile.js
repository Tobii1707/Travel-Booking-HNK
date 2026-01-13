// ==========================
// PROFILE PAGE SCRIPT
// ==========================

// Global variables
let currentOrderId = null;
let currentUserId = null;

document.addEventListener("DOMContentLoaded", function () {
  // User menu toggle
  initUserMenu();

  // Check login
  const userId = localStorage.getItem("userId");
  currentUserId = userId;

  if (!userId) {
    alert("Please log in first.");
    window.location.href = "/user";
    return;
  }

  // Init rating & modal
  initStarRating();
  initReviewModalEvents();

  // Review form submit
  initReviewFormSubmit();

  // Fetch user info
  fetchUserInfo(userId);

  // Load booking history
  loadBookings(userId);

  // Update info
  initUpdateUserInfo(userId);
});

// --------------------------
// USER MENU
// --------------------------
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

// --------------------------
// STAR RATING
// --------------------------
function initStarRating() {
  const stars = document.querySelectorAll(".star-rating i");
  const ratingValue = document.getElementById("rating-value");
  const starWrap = document.querySelector(".star-rating");

  if (!stars.length || !ratingValue || !starWrap) return;

  stars.forEach((star) => {
    star.addEventListener("click", function () {
      const rating = parseInt(this.getAttribute("data-rating"), 10);
      ratingValue.value = rating;
      updateStars(rating);
    });

    star.addEventListener("mouseover", function () {
      const rating = parseInt(this.getAttribute("data-rating"), 10);
      updateStars(rating);
    });
  });

  starWrap.addEventListener("mouseleave", function () {
    const currentRating = parseInt(ratingValue.value, 10) || 0;
    updateStars(currentRating);
  });
}

function updateStars(rating) {
  const stars = document.querySelectorAll(".star-rating i");
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.remove("far");
      star.classList.add("fas");
    } else {
      star.classList.remove("fas");
      star.classList.add("far");
    }
  });
}

// --------------------------
// REVIEW MODAL
// --------------------------
function openReviewModal(orderId, hotelName) {
  currentOrderId = orderId;

  const modal = document.getElementById("review-modal");
  const hotelNameEl = document.getElementById("review-hotel-name");
  const ratingValue = document.getElementById("rating-value");
  const commentValue = document.getElementById("comment-value");

  if (hotelNameEl) hotelNameEl.textContent = hotelName;
  if (ratingValue) ratingValue.value = "";
  if (commentValue) commentValue.value = "";

  updateStars(0);

  if (modal) modal.style.display = "block";
}

function closeReviewModal() {
  const modal = document.getElementById("review-modal");
  if (modal) modal.style.display = "none";
  currentOrderId = null;
}

function initReviewModalEvents() {
  const closeBtn = document.querySelector(".close");
  const modal = document.getElementById("review-modal");

  if (closeBtn) closeBtn.addEventListener("click", closeReviewModal);

  window.addEventListener("click", function (event) {
    if (modal && event.target === modal) closeReviewModal();
  });
}

// --------------------------
// REVIEW SUBMIT
// --------------------------
function initReviewFormSubmit() {
  const form = document.getElementById("review-form");
  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const rating = parseInt(document.getElementById("rating-value")?.value || "0", 10);
    const comment = document.getElementById("comment-value")?.value || "";

    if (!rating || rating < 1 || rating > 5) {
      alert("Please select a rating (1-5 stars)");
      return;
    }

    const reviewData = { rating, comment };

    fetch(`/review/${currentOrderId}/${currentUserId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reviewData),
    })
      .then((response) => response.json())
      .then((apiResponse) => {
        if (apiResponse.code === 1000) {
          alert("Review submitted successfully!");
          closeReviewModal();
          loadBookings(currentUserId);
        } else {
          alert("Failed to submit review: " + (apiResponse.message || "Unknown error"));
        }
      })
      .catch((error) => {
        console.error("Error submitting review:", error);
        alert("Error submitting review. Please try again.");
      });
  });
}

// --------------------------
// USER INFO
// --------------------------
function fetchUserInfo(userId) {
  fetch(`/user/${userId}`)
    .then((response) => response.json())
    .then((apiResponse) => {
      if (apiResponse.code === 1000) {
        const user = apiResponse.data || {};
        document.getElementById("user-phone").value = user.phone || "";
        document.getElementById("user-fullname").value = user.fullName || "";
        document.getElementById("user-email").value = user.email || "";
        document.getElementById("user-birthday").value = user.birthday || "";
      } else {
        alert("Could not load user information.");
      }
    })
    .catch((error) => console.error("API Error:", error));
}

function initUpdateUserInfo(userId) {
  const updateBtn = document.getElementById("update-btn");
  if (!updateBtn) return;

  updateBtn.addEventListener("click", function () {
    const updatedUser = {
      phone: document.getElementById("user-phone").value,
      fullName: document.getElementById("user-fullname").value,
      email: document.getElementById("user-email").value,
      birthday: document.getElementById("user-birthday").value,
    };

    fetch(`/user/update/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedUser),
    })
      .then((response) => response.json())
      .then((apiResponse) => {
        if (apiResponse.code === 1000) {
          alert("Update successful!");
        } else {
          alert("Update failed.");
        }
      })
      .catch((error) => console.error("Error updating:", error));
  });
}

// --------------------------
// BOOKINGS
// --------------------------
function loadBookings(userId) {
  fetch(`/order/${userId}?pageNo=0&pageSize=100`)
    .then((response) => response.json())
    .then((apiResponse) => {
      if (apiResponse.code === 1000) {
        const orders = apiResponse.data?.items || [];
        displayBookings(orders);
      } else {
        document.getElementById("bookings-list").innerHTML = "<p>No bookings found.</p>";
      }
    })
    .catch((error) => {
      console.error("Error loading bookings:", error);
      document.getElementById("bookings-list").innerHTML = "<p>Error loading bookings.</p>";
    });
}

function displayBookings(bookings) {
  const bookingsList = document.getElementById("bookings-list");
  if (!bookingsList) return;

  if (!bookings || bookings.length === 0) {
    bookingsList.innerHTML = "<p>No bookings found.</p>";
    return;
  }

  bookingsList.innerHTML = bookings
    .map((order) => {
      const isPaid = order.payment && order.payment.status === "PAID";
      const hasHotel = order.hotel != null;
      const canReview = isPaid && hasHotel;
      const isUnpaid = !isPaid;

      const statusClass = (order.payment?.status || "PENDING").toLowerCase();

      // Escape single quotes for onclick strings
      const hotelName = order.hotel?.hotelName ? order.hotel.hotelName.replace(/'/g, "\\'") : "N/A";

      return `
        <div class="booking-card">
          <div class="booking-info">
            <h3>${order.hotel ? order.hotel.hotelName : "N/A"}</h3>
            <p><strong>Order ID:</strong> ${order.id}</p>
            <p><strong>Total Price:</strong> $${order.totalPrice || 0}</p>
            <p><strong>Status:</strong>
              <span class="status-${statusClass}">
                ${order.payment?.status || "NOT PAID"}
              </span>
            </p>
            ${
              order.hotelBooking
                ? `<p><strong>Check-in:</strong> ${order.hotelBooking.checkInDate} | <strong>Check-out:</strong> ${order.hotelBooking.checkOutDate}</p>`
                : ""
            }
          </div>
          <div class="booking-actions">
            ${
              isUnpaid
                ? `<button class="btn btn-mark-paid" onclick="markAsPaid(${order.id})">
                    Mark as Paid (Test)
                   </button>`
                : ""
            }
            ${
              canReview
                ? `<button class="btn btn-review" onclick="checkAndOpenReview(${order.id}, '${hotelName}')">
                    Write Review
                   </button>`
                : ""
            }
          </div>
        </div>
      `;
    })
    .join("");
}

// --------------------------
// MARK AS PAID (TEST)
// --------------------------
function markAsPaid(orderId) {
  if (!confirm("Mark this order as PAID for testing?")) return;

  fetch(`/order/${orderId}/confirm-payment`, { method: "POST" })
    .then((response) => response.json())
    .then((apiResponse) => {
      if (apiResponse.code === 1000 || apiResponse.message === "confirm payment success") {
        alert("Order marked as PAID!");
        loadBookings(currentUserId);
      } else {
        alert("Failed to mark as paid: " + (apiResponse.message || "Unknown error"));
      }
    })
    .catch((error) => {
      console.error("Error marking as paid:", error);
      alert("Error marking as paid. Please try again.");
    });
}

// --------------------------
// CHECK REVIEW EXISTENCE
// --------------------------
function checkAndOpenReview(orderId, hotelName) {
  fetch(`/review/order/${orderId}`)
    .then((response) => response.json())
    .then((apiResponse) => {
      if (apiResponse.data) {
        alert("You have already reviewed this booking!");
      } else {
        openReviewModal(orderId, hotelName);
      }
    })
    .catch((error) => {
      console.error("Error checking review:", error);
      openReviewModal(orderId, hotelName);
    });
}

// ✅ Expose functions for inline onclick in generated HTML
window.markAsPaid = markAsPaid;
window.checkAndOpenReview = checkAndOpenReview;
