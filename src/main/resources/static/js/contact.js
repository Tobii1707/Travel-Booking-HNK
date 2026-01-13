document.addEventListener("DOMContentLoaded", function () {
  // --- CẤU HÌNH ---
  const API_BASE_URL = "http://localhost:8080/api/contact";
  const LOGIN_PAGE_URL = "/login";

  // --- LẤY THÔNG TIN USER TỪ LOCAL STORAGE ---
  const userId = localStorage.getItem("userId");
  const storedName = localStorage.getItem("userName");
  const storedEmail = localStorage.getItem("userEmail");

  // --- DOM ELEMENTS ---
  const contactForm = document.getElementById("contact-form");
  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const subjectInput = document.getElementById("subject");
  const messageInput = document.getElementById("message");
  const btnSend = document.querySelector(".btn-send");

  // Elements cho History
  const historySection = document.getElementById("history-section");
  const historyListBody = document.getElementById("history-list");

  // Elements cho Modal & Menu
  const modal = document.getElementById("contact-modal");
  const closeModalBtn = document.querySelector(".close");
  const modalOkBtn = document.querySelector(".modal-button");
  const modalIcon = document.getElementById("modal-icon");
  const modalMessage = document.getElementById("modal-message");
  const userIcon = document.getElementById("user-icon");
  const userMenu = document.getElementById("user-menu");

  // ============================================================
  // 1. TỰ ĐỘNG ĐIỀN THÔNG TIN & LOAD LỊCH SỬ
  // ============================================================
  if (userId) {
    if (storedName) {
      fullNameInput.value = storedName;
      fullNameInput.readOnly = true;
      fullNameInput.classList.add("auto-filled");
    }
    if (storedEmail) {
      emailInput.value = storedEmail;
      emailInput.readOnly = true;
      emailInput.classList.add("auto-filled");
    }

    // Load lịch sử ngay khi vào trang
    loadUserHistory();
  }

  // ============================================================
  // 2. XỬ LÝ SỰ KIỆN GỬI FORM
  // ============================================================
  if (contactForm) {
    contactForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      if (!userId) {
        if(confirm("Bạn cần đăng nhập để gửi tin nhắn. Chuyển đến trang đăng nhập?")) {
          window.location.href = LOGIN_PAGE_URL;
        }
        return;
      }

      // Validate user
      const currentName = fullNameInput.value.trim();
      const currentEmail = emailInput.value.trim();
      if (storedName && currentName !== storedName) return showModal("error", "Họ tên không khớp tài khoản.");
      if (storedEmail && currentEmail !== storedEmail) return showModal("error", "Email không khớp tài khoản.");

      const formData = {
        fullName: currentName,
        email: currentEmail,
        subject: subjectInput.value.trim(),
        message: messageInput.value.trim()
      };

      // Loading effect
      const originalBtnText = btnSend.textContent;
      btnSend.textContent = "Đang gửi...";
      btnSend.disabled = true;

      try {
        const response = await fetch(`${API_BASE_URL}/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "userId": userId
          },
          body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok && result.code === 1000) {
          showModal("success", "Gửi phản hồi thành công!");
          subjectInput.value = "";
          messageInput.value = "";

          // Load lại bảng lịch sử để cập nhật tin mới nhất
          loadUserHistory();
        } else {
          showModal("error", result.message || "Có lỗi xảy ra.");
        }
      } catch (error) {
        console.error("Error:", error);
        showModal("error", "Lỗi kết nối đến máy chủ.");
      } finally {
        btnSend.textContent = originalBtnText;
        btnSend.disabled = false;
      }
    });
  }

  // ============================================================
  // 3. HÀM LOAD LỊCH SỬ TỪ BE
  // ============================================================
  async function loadUserHistory() {
    if (!userId || !historyListBody) return;

    try {
      const response = await fetch(`${API_BASE_URL}/my-history`, {
        method: "GET",
        headers: { "userId": userId }
      });
      const result = await response.json();

      if (response.ok && result.code === 1000) {
        const contacts = result.data;

        if (contacts && contacts.length > 0) {
          historySection.style.display = "block";
          renderHistoryTableRows(contacts);
        } else {
          historySection.style.display = "none";
        }
      }
    } catch (error) {
      console.error("Không thể tải lịch sử:", error);
    }
  }

  // ============================================================
  // 4. HÀM RENDER DÒNG BẢNG (ĐÃ SỬA: Chỉ hiện ngày trả lời)
  // ============================================================
  function renderHistoryTableRows(contacts) {
    historyListBody.innerHTML = "";

    // Sắp xếp ID giảm dần (mới nhất lên đầu)
    contacts.sort((a, b) => b.id - a.id);

    contacts.forEach(contact => {
      const row = document.createElement("tr");

      // 1. Ngày khách gửi (Created At)
      const dateSent = contact.createdAt
          ? new Date(contact.createdAt).toLocaleDateString('vi-VN')
          : '---';

      // 2. Logic hiển thị phản hồi
      const hasReply = contact.replyNote && contact.replyNote.trim() !== "";

      let adminContentHtml = "";

      if (hasReply) {
        // [SỬA LẠI] Chỉ hiển thị NGÀY trả lời, bỏ giờ phút
        let replyTimeStr = "";
        if (contact.repliedAt) {
          const rDate = new Date(contact.repliedAt);
          replyTimeStr = rDate.toLocaleDateString('vi-VN'); // Kết quả: 12/01/2026
        }

        // Tạo HTML hiển thị nội dung + ngày bên dưới
        adminContentHtml = `
            <div class="admin-reply-wrapper">
                <div class="reply-text">
                    <i class="fas fa-check-circle" style="color: var(--primary);"></i> 
                    ${escapeHtml(contact.replyNote)}
                </div>
                <div class="reply-time" style="font-size: 0.8rem; color: #999; margin-top: 5px; margin-left: 24px;">
                    Đã phản hồi ngày: ${replyTimeStr}
                </div>
            </div>`;
      } else {
        // Trạng thái chờ xử lý (Câu từ thân thiện)
        adminContentHtml = `<span class="status-badge pending">Đang chờ tư vấn...</span>`;
      }

      // Render dòng
      row.innerHTML = `
            <td class="date-col">${dateSent}</td>
            <td>
                <span class="msg-subject">${escapeHtml(contact.subject)}</span>
                <div class="msg-body">${escapeHtml(contact.message)}</div>
            </td>
            <td class="admin-col ${hasReply ? 'has-reply' : ''}">
                ${adminContentHtml}
            </td>
      `;

      historyListBody.appendChild(row);
    });
  }

  // Hàm chống XSS đơn giản
  function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
  }

  // ============================================================
  // 5. UI HELPER FUNCTIONS
  // ============================================================
  function showModal(type, message) {
    if (type === "success") {
      modalIcon.className = "fas fa-check-circle";
      modalIcon.style.color = "#2ecc71";
    } else {
      modalIcon.className = "fas fa-times-circle";
      modalIcon.style.color = "#e74c3c";
    }
    modalMessage.textContent = message;
    modal.style.display = "block";
  }

  const hideModal = () => { modal.style.display = "none"; };
  if (closeModalBtn) closeModalBtn.onclick = hideModal;
  if (modalOkBtn) modalOkBtn.onclick = hideModal;
  window.onclick = function(event) { if (event.target == modal) hideModal(); }

  if (userIcon && userMenu) {
    userIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      userMenu.style.display = (userMenu.style.display === "block") ? "none" : "block";
    });
    document.addEventListener("click", (e) => {
      if (!userIcon.contains(e.target) && !userMenu.contains(e.target)) {
        userMenu.style.display = "none";
      }
    });
  }
});