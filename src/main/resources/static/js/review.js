document.addEventListener("DOMContentLoaded", function () {
  let currentPage = 0;
  let currentSort = "desc"; // Mặc định là mới nhất (descending)
  let totalPages = 1;

  const userIcon = document.getElementById("user-icon");
  const menu = document.getElementById("user-menu");

  const sortFilter = document.getElementById("sort-filter");
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");
  const pageInfo = document.getElementById("page-info");
  const container = document.getElementById("reviews-container");

  // ===== User dropdown (Giữ nguyên) =====
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

  // ===== Hàm render Ngôi sao =====
  function renderStars(rating) {
    const validRating = rating || 0;
    let starsHtml = "";
    for (let i = 1; i <= 5; i++) {
      starsHtml += i <= validRating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    }
    return starsHtml;
  }

  // ===== Cập nhật nút Phân trang =====
  function updatePaginationControls() {
    if (pageInfo) pageInfo.textContent = `Trang ${currentPage + 1} / ${totalPages > 0 ? totalPages : 1}`;
    if (prevBtn) prevBtn.disabled = currentPage === 0;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages - 1 || totalPages === 0;
  }

  // ===== Hàm Load Đánh Giá từ Backend =====
  function loadReviews(pageNo = 0) {
    if (!container) return;

    container.innerHTML = '<div class="loading-message">Đang tải đánh giá...</div>';

    // size = 9 để chia 3 cột (3x3) nhìn sẽ rất cân đối
    const apiUrl = `/api/reviews/public?page=${pageNo}&size=9&sort=id,${currentSort}`;

    fetch(apiUrl)
        .then((response) => {
          if (!response.ok) throw new Error("Network response was not ok");
          return response.json();
        })
        .then((pageData) => {
          const reviews = pageData.content || [];

          totalPages = pageData.totalPages || 1;
          currentPage = pageData.number || pageNo;

          updatePaginationControls();

          if (reviews.length === 0) {
            container.innerHTML = '<div class="no-reviews-message">Chưa có đánh giá nào. Hãy là người đầu tiên trải nghiệm và đánh giá nhé!</div>';
            return;
          }

          // Render HTML - Đã cập nhật cấu trúc để khớp hoàn toàn với CSS mới
          container.innerHTML = reviews
              .map(
                  (review) => `
            <div class="review-card">
              <div class="review-header">
                <div class="avatar-circle">
                  <i class="fas fa-user"></i>
                </div>
                <div class="reviewer-info">
                  <h3>${review.authorName || "Khách hàng ẩn danh"}</h3>
                  <i class="fas fa-quote-left quote-icon"></i>
                </div>
              </div>

              <div class="booked-service">
                <p><i class="fas fa-hotel"></i> <strong>Khách sạn:</strong> ${review.hotelName || "Không sử dụng"}</p>
                <p><i class="fas fa-plane"></i> <strong>Chuyến bay:</strong> ${review.flightName || "Không sử dụng"}</p>
              </div>
              
              <p class="review-comment">"${review.comment || "Không có nhận xét chi tiết."}"</p>

              <div class="rating-details">
                <div class="rating-group">
                  <span class="rating-label">Khách sạn</span>
                  <div class="stars">${renderStars(review.hotelRating)}</div>
                </div>
                <div class="rating-group">
                  <span class="rating-label">Chuyến bay</span>
                  <div class="stars">${renderStars(review.flightRating)}</div>
                </div>
                <div class="rating-group">
                  <span class="rating-label">Website</span>
                  <div class="stars">${renderStars(review.websiteRating)}</div>
                </div>
              </div>

              <div class="review-date">
                <i class="far fa-calendar-alt"></i> Ngày: ${review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'}
              </div>
            </div>
          `
              )
              .join("");
        })
        .catch((error) => {
          console.error("Lỗi khi tải đánh giá:", error);
          container.innerHTML = '<div class="error-message">Lỗi khi tải dữ liệu. Vui lòng kiểm tra lại kết nối hoặc thử lại sau.</div>';
        });
  }

  // ===== Các sự kiện (Events) =====

  if (sortFilter) {
    sortFilter.addEventListener("change", function (e) {
      currentSort = e.target.value === "newest" ? "desc" : "asc";
      currentPage = 0;
      loadReviews(currentPage);
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      if (currentPage > 0) {
        currentPage--;
        loadReviews(currentPage);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      if (currentPage < totalPages - 1) {
        currentPage++;
        loadReviews(currentPage);
      }
    });
  }

  loadReviews(0);
});