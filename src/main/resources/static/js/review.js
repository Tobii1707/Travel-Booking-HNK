document.addEventListener("DOMContentLoaded", function () {
  let currentPage = 0;
  let currentHotelFilter = "";
  let totalPages = 1;

  const userIcon = document.getElementById("user-icon");
  const menu = document.getElementById("user-menu");

  const hotelFilter = document.getElementById("hotel-filter");
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");
  const pageInfo = document.getElementById("page-info");
  const container = document.getElementById("reviews-container");

  // ===== User dropdown =====
  if (userIcon && menu) {
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

  function loadHotels() {
    fetch("/admin/getAllHotels")
      .then((response) => response.json())
      .then((apiResponse) => {
        if (apiResponse.code === 1000 && apiResponse.data && hotelFilter) {
          apiResponse.data.forEach((hotel) => {
            const option = document.createElement("option");
            option.value = hotel.id;
            option.textContent = hotel.hotelName;
            hotelFilter.appendChild(option);
          });
        }
      })
      .catch((error) => console.error("Error loading hotels:", error));
  }

  function renderStars(rating) {
    let starsHtml = "";
    for (let i = 1; i <= 5; i++) {
      starsHtml += i <= rating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    }
    return starsHtml;
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  function updatePaginationControls() {
    if (pageInfo) pageInfo.textContent = `Page ${currentPage + 1} of ${totalPages}`;
    if (prevBtn) prevBtn.disabled = currentPage === 0;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages - 1;
  }

  function loadReviews(hotelId = "", pageNo = 0) {
    if (!container) return;

    container.innerHTML = '<div class="loading-message">Loading reviews...</div>';

    const apiUrl = hotelId
      ? `/review/hotel/${hotelId}?pageNo=${pageNo}&pageSize=8`
      : `/review/all?pageNo=${pageNo}&pageSize=8`;

    fetch(apiUrl)
      .then((response) => response.json())
      .then((apiResponse) => {
        if (apiResponse.code === 1000) {
          const pageResponse = apiResponse.data || {};
          const reviews = pageResponse.items || [];

          totalPages = pageResponse.totalPages || 1;
          currentPage = pageNo;

          updatePaginationControls();

          if (reviews.length === 0) {
            container.innerHTML = hotelId
              ? '<div class="no-reviews-message">No reviews found for this hotel.</div>'
              : '<div class="no-reviews-message">No reviews yet. Be the first to leave a review!</div>';
            return;
          }

          container.innerHTML = reviews
            .map(
              (review) => `
              <div class="review-card">
                <div class="avatar-circle">
                  <i class="fas fa-user"></i>
                </div>
                <h3>${review.userName || "Anonymous"}</h3>
                <p class="hotel-name-tag">${review.hotelName || "Hotel"}</p>
                <p class="review-comment">"${review.comment || "No comment provided."}"</p>
                <div class="stars">
                  ${renderStars(review.rating)}
                </div>
                <p class="review-date">${formatDate(review.createdAt)}</p>
              </div>
            `
            )
            .join("");
        } else {
          container.innerHTML = '<div class="error-message">Failed to load reviews.</div>';
        }
      })
      .catch((error) => {
        console.error("Error loading reviews:", error);
        container.innerHTML =
          '<div class="error-message">Error loading reviews. Please try again later.</div>';
      });
  }

  // ===== Events =====
  if (hotelFilter) {
    hotelFilter.addEventListener("change", function (e) {
      currentHotelFilter = e.target.value;
      currentPage = 0;
      loadReviews(currentHotelFilter, currentPage);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      if (currentPage > 0) {
        currentPage--;
        loadReviews(currentHotelFilter, currentPage);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      if (currentPage < totalPages - 1) {
        currentPage++;
        loadReviews(currentHotelFilter, currentPage);
      }
    });
  }

  // ===== Init =====
  loadHotels();
  loadReviews("", 0);
});
