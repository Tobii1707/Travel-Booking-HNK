// --- ORDER & PAYMENT + USER MENU + REVIEW LOGIC (extracted) ---

let currentPage = 0;
let totalPages = 1;
const userId = localStorage.getItem('userId');

// Review UI refs
let reviewModal = null;
let stars = [];
let reviewComment = null;
let charCount = null;

document.addEventListener('DOMContentLoaded', () => {
  initUserMenu();

  // Auth check
  if (!userId) {
    alert('Please login to view your trips!');
    window.location.href = '/user';
    return;
  }

  // Load orders
  loadOrders(currentPage, 5);

  // Pagination
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

  // Action buttons
  initActionButtons();

  // Review interactions
  initReviewUI();
});

function initUserMenu() {
  const userIcon = document.getElementById('user-icon');
  const menu = document.getElementById('user-menu');
  if (!userIcon || !menu) return;

  userIcon.addEventListener('click', function (event) {
    event.preventDefault();
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
  });

  document.addEventListener('click', function (event) {
    if (!userIcon.contains(event.target) && !menu.contains(event.target)) {
      menu.style.display = 'none';
    }
  });
}

function loadOrders(pageNo, pageSize) {
  fetch(`/order/${userId}?pageNo=${pageNo}&pageSize=${pageSize}`)
    .then((response) => response.json())
    .then((result) => {
      if (result.code === 1000 && result.data) {
        const { pageNo: currentPageNo, totalPages: totalPagesData, items } = result.data;

        totalPages =
          Number.isFinite(Number(totalPagesData)) && Number(totalPagesData) > 0
            ? Number(totalPagesData)
            : 1;

        currentPage =
          Number.isFinite(Number(currentPageNo)) && Number(currentPageNo) >= 0
            ? Number(currentPageNo)
            : 0;

        const list = items || [];
        renderOrders(list);
        updatePaginationInfo();
      } else {
        renderOrders([]);
        totalPages = 1;
        currentPage = 0;
        updatePaginationInfo();
      }
    })
    .catch((error) => {
      console.error('Error fetching data:', error);
      renderOrders([]);
      totalPages = 1;
      currentPage = 0;
      updatePaginationInfo();
    });
}

function renderOrders(orders) {
  const tbody = document.querySelector('#order-table tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!orders || orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="12" style="padding:20px; color:#666; text-align:center;">
          No trips found.
        </td>
      </tr>
    `;
    return;
  }

  orders.forEach((order) => {
    const row = document.createElement('tr');

    const selectCell = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = order.id;
    selectCell.appendChild(checkbox);
    row.appendChild(selectCell);

    const canReview = order.hotel && order.payment && order.payment.status === 'PAID';
    const hotelName = order.hotel ? order.hotel.hotelName : '';

    row.innerHTML += `
      <td>${order.id}</td>
      <td>${order.destination}</td>
      <td>${order.numberOfPeople}</td>
      <td>${new Date(order.checkinDate).toLocaleDateString()}</td>
      <td>${new Date(order.checkoutDate).toLocaleDateString()}</td>
      <td>${order.hotel ? order.hotel.hotelName : 'N/A'}</td>
      <td>${order.hotel && order.listBedrooms ? order.listBedrooms : 'N/A'}</td>
      <td>${order.flight ? new Date(order.flight.checkInDate).toLocaleDateString() : 'N/A'}</td>
      <td>${order.totalPrice.toLocaleString()} VND</td>
      <td style="color: ${
        order.payment && order.payment.status === 'PAID' ? 'var(--primary)' : 'var(--danger)'
      }; font-weight: 600;">
        ${order.payment ? getPaymentStatus(order.payment.status) : 'Unpaid'}
      </td>
      <td>
        ${
          canReview
            ? `<button class="btn review-btn" onclick="openReviewModal(${order.id}, '${hotelName.replace(/'/g, "\\'")}')">
                 <i class="fas fa-star"></i> Review
               </button>`
            : '<span style="color:#999;">-</span>'
        }
      </td>
    `;

    tbody.appendChild(row);
  });
}

function updatePaginationInfo() {
  const safeTotal = Number.isFinite(Number(totalPages)) && Number(totalPages) > 0 ? Number(totalPages) : 1;
  const safeCurrent = Math.min(Math.max(0, Number(currentPage) || 0), safeTotal - 1);

  totalPages = safeTotal;
  currentPage = safeCurrent;

  const pageInfo = document.getElementById('page-info');
  if (pageInfo) pageInfo.textContent = `Page ${safeCurrent + 1} of ${safeTotal}`;

  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  if (prevBtn) prevBtn.disabled = safeCurrent === 0;
  if (nextBtn) nextBtn.disabled = safeCurrent >= safeTotal - 1;
}

function initActionButtons() {
  const cancelBtn = document.getElementById('cancel-btn');
  const payBtn = document.getElementById('pay-btn');
  const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const chooseFlightBtn = document.getElementById('choose-flight-btn');
  const chooseHotelBtn = document.getElementById('choose-hotel-btn');

  const paymentModal = document.getElementById('payment-modal');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
      const selectedRow = document.querySelector('input[type="checkbox"]:checked');
      if (!selectedRow) {
        alert('Please select a trip to cancel!');
        return;
      }

      if (confirm('Are you sure you want to cancel this trip?')) {
        const tripId = selectedRow.value;
        fetch(`/order/${tripId}`, { method: 'DELETE' }).then((response) => {
          if (response.ok) {
            alert('Trip cancelled successfully!');
            window.location.reload();
          } else {
            alert('Cannot cancel trip!');
          }
        });
      }
    });
  }

  if (payBtn) {
    payBtn.addEventListener('click', function () {
      const selectedRow = document.querySelector('input[type="checkbox"]:checked');
      if (!selectedRow) {
        alert('Please select a trip to pay!');
        return;
      }

      const tripId = selectedRow.value;
      if (paymentModal) paymentModal.style.display = 'flex';
      if (confirmPaymentBtn) confirmPaymentBtn.dataset.tripId = tripId;
    });
  }

  if (confirmPaymentBtn) {
    confirmPaymentBtn.addEventListener('click', function () {
      const tripId = this.dataset.tripId;

      fetch(`/order/${tripId}/verifying-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
        .then((response) => response.json())
        .then((apiResponse) => {
          if (apiResponse.code === 1000) {
            alert('Payment verified successfully!');
            if (paymentModal) paymentModal.style.display = 'none';
            window.location.reload();
          } else {
            alert('Payment verification failed: ' + apiResponse.message);
          }
        })
        .catch((error) => {
          console.error('Payment error:', error);
          alert('Error verifying payment.');
        });
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', function () {
      if (paymentModal) paymentModal.style.display = 'none';
    });
  }

  if (chooseFlightBtn) {
    chooseFlightBtn.addEventListener('click', function () {
      const selectedRows = document.querySelectorAll('input[type="checkbox"]:checked');
      if (selectedRows.length === 0) {
        alert('Please select a trip to choose flight!');
        return;
      }
      const orderId = Array.from(selectedRows).map((checkbox) => checkbox.value);
      window.location.href = `/flight?orderId=${orderId.join(',')}`;
    });
  }

  if (chooseHotelBtn) {
    chooseHotelBtn.addEventListener('click', function () {
      const selectedRows = document.querySelectorAll('input[type="checkbox"]:checked');
      if (selectedRows.length === 0) {
        alert('Please select a trip to choose hotel!');
        return;
      }
      const orderId = Array.from(selectedRows).map((checkbox) => checkbox.value);
      window.location.href = `/hotel?orderId=${orderId.join(',')}`;
    });
  }
}

function getPaymentStatus(status) {
  switch (status) {
    case 'PAID': return 'Paid';
    case 'UNPAID': return 'Unpaid';
    case 'VERIFYING': return 'Verifying';
    case 'PAYMENT_FAILED': return 'Failed';
    default: return 'Unpaid';
  }
}

// -------- REVIEW LOGIC --------

function initReviewUI() {
  reviewModal = document.getElementById('review-modal');
  stars = Array.from(document.querySelectorAll('.star-rating i'));
  reviewComment = document.getElementById('review-comment');
  charCount = document.getElementById('char-count');

  if (!reviewModal || !stars.length) return;

  // Star interaction
  stars.forEach((star) => {
    star.addEventListener('click', function () {
      const rating = parseInt(this.dataset.rating, 10);
      const ratingInput = document.getElementById('review-rating');
      if (ratingInput) ratingInput.value = rating;
      updateStars(rating);
    });

    star.addEventListener('mouseover', function () {
      const rating = parseInt(this.dataset.rating, 10);
      updateStars(rating);
    });

    star.addEventListener('mouseout', function () {
      const ratingInput = document.getElementById('review-rating');
      const currentRating = parseInt(ratingInput ? ratingInput.value : '0', 10) || 0;
      updateStars(currentRating);
    });
  });

  // Character count
  if (reviewComment && charCount) {
    reviewComment.addEventListener('input', function () {
      charCount.textContent = String(this.value.length);
    });
  }

  // Close review modal
  const closeReviewBtn = document.getElementById('close-review-modal-btn');
  if (closeReviewBtn) {
    closeReviewBtn.addEventListener('click', function () {
      reviewModal.style.display = 'none';
    });
  }

  // Submit review
  const submitReviewBtn = document.getElementById('submit-review-btn');
  if (submitReviewBtn) {
    submitReviewBtn.addEventListener('click', submitReview);
  }

  // Delete review
  const deleteReviewBtn = document.getElementById('delete-review-btn');
  if (deleteReviewBtn) {
    deleteReviewBtn.addEventListener('click', deleteReview);
  }

  // Close on outside click
  window.addEventListener('click', function (event) {
    if (event.target === reviewModal) {
      reviewModal.style.display = 'none';
    }
  });
}

function updateStars(rating) {
  stars.forEach((star) => {
    const starRating = parseInt(star.dataset.rating, 10);
    if (starRating <= rating) star.classList.add('active');
    else star.classList.remove('active');
  });
}

// Make openReviewModal callable from inline onclick in table rows
window.openReviewModal = async function openReviewModal(orderId, hotelName) {
  if (!reviewModal) reviewModal = document.getElementById('review-modal');

  const orderInput = document.getElementById('review-order-id');
  const hotelDisplay = document.getElementById('review-hotel-display');
  const ratingInput = document.getElementById('review-rating');
  const commentEl = document.getElementById('review-comment');
  const countEl = document.getElementById('char-count');

  if (orderInput) orderInput.value = orderId;
  if (hotelDisplay) hotelDisplay.textContent = hotelName;

  if (ratingInput) ratingInput.value = 0;
  if (commentEl) commentEl.value = '';
  if (countEl) countEl.textContent = '0';
  updateStars(0);

  const titleEl = document.getElementById('review-modal-title');
  const reviewIdEl = document.getElementById('review-id');
  const deleteBtn = document.getElementById('delete-review-btn');

  // Check existing review
  try {
    const response = await fetch(`/review/order/${orderId}`);
    const result = await response.json();

    if (result.code === 1000 && result.data) {
      if (titleEl) titleEl.textContent = 'Edit Your Review';
      if (reviewIdEl) reviewIdEl.value = result.data.id;

      if (ratingInput) ratingInput.value = result.data.rating;
      if (commentEl) commentEl.value = result.data.comment || '';
      if (countEl) countEl.textContent = String((result.data.comment || '').length);

      updateStars(result.data.rating);
      if (deleteBtn) deleteBtn.style.display = 'inline-block';
    } else {
      if (titleEl) titleEl.textContent = 'Write a Review';
      if (reviewIdEl) reviewIdEl.value = '';
      if (deleteBtn) deleteBtn.style.display = 'none';
    }
  } catch (error) {
    console.error('Error checking review:', error);
    if (titleEl) titleEl.textContent = 'Write a Review';
    if (reviewIdEl) reviewIdEl.value = '';
    if (deleteBtn) deleteBtn.style.display = 'none';
  }

  if (reviewModal) reviewModal.style.display = 'flex';
};

async function submitReview() {
  const orderId = document.getElementById('review-order-id')?.value;
  const reviewId = document.getElementById('review-id')?.value;
  const rating = parseInt(document.getElementById('review-rating')?.value || '0', 10);
  const comment = document.getElementById('review-comment')?.value || '';

  if (rating < 1 || rating > 5) {
    alert('Please select a rating (1-5 stars)');
    return;
  }

  const reviewData = { rating, comment };

  try {
    let response;
    if (reviewId) {
      response = await fetch(`/review/${reviewId}/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      });
    } else {
      response = await fetch(`/review/${orderId}/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
      });
    }

    const result = await response.json();
    if (result.code === 1000) {
      alert(reviewId ? 'Review updated successfully!' : 'Review submitted successfully!');
      if (reviewModal) reviewModal.style.display = 'none';
    } else {
      alert('Error: ' + result.message);
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    alert('Error submitting review. Please try again.');
  }
}

async function deleteReview() {
  if (!confirm('Are you sure you want to delete this review?')) return;

  const reviewId = document.getElementById('review-id')?.value;
  if (!reviewId) return;

  try {
    const response = await fetch(`/review/${reviewId}/${userId}`, { method: 'DELETE' });
    const result = await response.json();

    if (result.code === 1000) {
      alert('Review deleted successfully!');
      if (reviewModal) reviewModal.style.display = 'none';
    } else {
      alert('Error: ' + result.message);
    }
  } catch (error) {
    console.error('Error deleting review:', error);
    alert('Error deleting review. Please try again.');
  }
}
