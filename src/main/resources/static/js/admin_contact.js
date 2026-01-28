'use strict';

(function () {
  // --- CẤU HÌNH ---
  const API_BASE_URL = 'http://localhost:8080/api/contact';
  const CURRENT_USER_ID = localStorage.getItem('userId') || 1;

  // --- STATE ---
  let currentPage = 0;
  const pageSize = 10;
  let currentKeyword = '';
  let currentFilterMode = 'all'; // 'all' hoặc 'unread'
  let currentReplyId = null;     // Lưu ID của contact đang trả lời

  // --- HELPER ---
  function getHeaders() {
    return {
      'Content-Type': 'application/json',
      'userId': CURRENT_USER_ID
    };
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
  }

  // --- API & LOGIC ---
  function loadContacts(pageNo) {
    let url = `${API_BASE_URL}/admin/list?pageNo=${pageNo}&pageSize=${pageSize}`;
    if (currentKeyword) url += `&keyword=${encodeURIComponent(currentKeyword)}`;

    fetch(url, { method: 'GET', headers: getHeaders() })
        .then(res => res.json())
        .then(data => {
          if (data.code === 1000) {
            const pageData = data.data;
            let items = pageData.items || [];

            // 1. Mapping trạng thái (Nếu đã có nội dung trả lời => Đã xử lý)
            items = items.map(item => {
              const hasReply = (item.replyNote && item.replyNote.trim() !== "")
                  || (item.replyContent && item.replyContent.trim() !== "");
              if (hasReply) item.isRead = true;
              return item;
            });

            // 2. Counters
            const totalAll = pageData.totalElements || items.length;
            let totalUnread = items.filter(i => !i.isRead).length;

            if(document.getElementById('allCount')) document.getElementById('allCount').innerText = totalAll;
            if(document.getElementById('unreadCount')) document.getElementById('unreadCount').innerText = totalUnread;

            // 3. Filter Client-side (nếu cần thiết)
            if (currentFilterMode === 'unread') {
              items = items.filter(item => !item.isRead);
            }

            // 4. Render
            renderContactTable(items);
            renderPagination(pageData.totalPages || 0);
          } else {
            console.error(data.message);
          }
        })
        .catch(err => console.error("Lỗi tải trang:", err));
  }

  // --- RENDER ---
  function renderContactTable(contacts) {
    const tbody = document.querySelector('#contactTable tbody');
    tbody.innerHTML = '';

    if (!contacts || contacts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:20px;">Không có dữ liệu</td></tr>`;
      return;
    }

    contacts.forEach(contact => {
      const tr = document.createElement('tr');
      const isRead = contact.isRead;

      // Badge trạng thái đẹp hơn
      const statusBadge = isRead
          ? `<span class="status-badge" style="background:#e2e6ea; color:#6c757d;">Đã xử lý</span>`
          : `<span class="status-badge" style="background:#d4edda; color:#155724;">Chưa đọc</span>`;

      // Encode object để truyền vào hàm view
      const contactString = encodeURIComponent(JSON.stringify(contact));

      tr.innerHTML = `
                <td>#${contact.id}</td>
                <td style="font-weight: 500;">${contact.fullName || 'Ẩn danh'}</td>
                <td>${contact.email || ''}</td>
                <td>${(contact.subject || '').substring(0, 30)}...</td>
                <td>${formatDate(contact.createdAt)}</td>
                <td>${statusBadge}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="table-action-btn btn-view" onclick="window.viewContact('${contactString}')">
                            <i class="fas fa-eye"></i> Xem
                        </button>
                        <button class="table-action-btn btn-reply" onclick="window.openReplyModal(${contact.id})">
                            <i class="fas fa-reply"></i> Trả lời
                        </button>
                    </div>
                </td>
            `;
      tbody.appendChild(tr);
    });
  }

  function renderPagination(totalPages) {
    const div = document.querySelector('.pagination');
    div.innerHTML = '';

    // Nút Previous
    const prev = document.createElement('button');
    prev.innerText = '«';
    prev.disabled = currentPage === 0;
    prev.onclick = () => { if(currentPage > 0) { currentPage--; loadContacts(currentPage); }};
    div.appendChild(prev);

    // Các trang số
    for(let i=0; i<totalPages; i++){
      const btn = document.createElement('button');
      btn.innerText = i + 1;
      if(i === currentPage) btn.classList.add('active');
      btn.onclick = () => { currentPage = i; loadContacts(currentPage); };
      div.appendChild(btn);
    }

    // Nút Next
    const next = document.createElement('button');
    next.innerText = '»';
    next.disabled = currentPage >= totalPages - 1;
    next.onclick = () => { if(currentPage < totalPages - 1) { currentPage++; loadContacts(currentPage); }};
    div.appendChild(next);
  }

  // --- EVENTS GLOBAL (Gắn vào window để HTML gọi được) ---

  // 1. Xem chi tiết (Modal View)
  window.viewContact = function(encodedContact) {
    const contact = JSON.parse(decodeURIComponent(encodedContact));

    // Fill thông tin
    document.getElementById('modalFullName').innerText = contact.fullName;
    document.getElementById('modalEmail').innerText = contact.email;
    document.getElementById('modalSubject').innerText = contact.subject;
    document.getElementById('modalDate').innerText = formatDate(contact.createdAt);
    document.getElementById('modalStatus').innerText = contact.isRead ? 'Đã xử lý' : 'Chưa đọc';
    document.getElementById('modalMessage').innerText = contact.message || '';

    // Fill phần Admin trả lời (nếu có)
    const replySection = document.getElementById('adminReplySection');
    const replyText = contact.replyNote || contact.replyContent || '';

    if (replyText && replyText.trim() !== '') {
      replySection.style.display = 'block';
      document.getElementById('modalReplyContent').innerText = replyText;
      const timeReply = contact.repliedAt || contact.updatedAt;
      document.getElementById('modalReplyDate').innerText = timeReply ? `${formatDate(timeReply)}` : '';
    } else {
      replySection.style.display = 'none';
    }

    // Xử lý nút "Trả lời ngay" trong Modal Xem
    const btnReplyInModal = document.getElementById('btnReplyInModal');
    if(btnReplyInModal) {
      btnReplyInModal.onclick = function() {
        window.closeViewModal();
        window.openReplyModal(contact.id); // Chuyển sang modal nhập liệu
      };
    }

    document.getElementById('viewMessageModal').style.display = 'block';
  };

  // 2. Mở Modal Nhập liệu Trả lời
  window.openReplyModal = function(id) {
    currentReplyId = id;
    document.getElementById('replyTextContent').value = ''; // Reset form
    document.getElementById('replyInputModal').style.display = 'block';
    // Focus vào ô nhập liệu
    setTimeout(() => document.getElementById('replyTextContent').focus(), 100);
  };

  // 3. Gửi câu trả lời (Call API)
  window.submitReplyFromModal = function() {
    const content = document.getElementById('replyTextContent').value;
    if (!content || content.trim() === "") {
      alert("Vui lòng nhập nội dung trả lời!");
      return;
    }

    if (!currentReplyId) return;

    fetch(`${API_BASE_URL}/${currentReplyId}/reply`, {
      method: 'PUT',
      headers: getHeaders(),
      body: content // Gửi nội dung trả lời
    })
        .then(res => res.json())
        .then(data => {
          if (data.code === 1000) {
            // Sử dụng Toastify nếu có thư viện, hoặc alert mặc định
            alert("Đã gửi phản hồi thành công!");
            window.closeReplyInputModal();
            loadContacts(currentPage); // Reload lại bảng
          } else {
            alert("Lỗi: " + data.message);
          }
        })
        .catch(err => {
          console.error(err);
          alert("Lỗi hệ thống khi gửi phản hồi!");
        });
  };

  // 4. Các hàm đóng Modal
  window.closeReplyInputModal = () => document.getElementById('replyInputModal').style.display = 'none';
  window.closeViewModal = () => document.getElementById('viewMessageModal').style.display = 'none';
  window.closeConfirmModal = () => document.getElementById('confirmModal').style.display = 'none';

  // 5. Filter & Search & Delete
  window.filterContacts = (type) => {
    currentFilterMode = type;
    loadContacts(0);
  };

  window.searchContacts = () => {
    currentKeyword = document.getElementById('search').value;
    loadContacts(0);
  };

  window.deleteContactFromModal = () => {
    // Placeholder cho chức năng xóa
    if(confirm("Bạn có chắc muốn xóa liên hệ này? (Chức năng Demo)")) {
      alert("Đã gửi yêu cầu xóa.");
      window.closeViewModal();
    }
  };

  // --- INIT ---
  document.addEventListener('DOMContentLoaded', () => {
    loadContacts(0);

    // Đồng hồ
    setInterval(() => {
      const d = new Date();
      if(document.getElementById('currentDate')) document.getElementById('currentDate').innerText = d.toLocaleDateString('vi-VN');
      if(document.getElementById('currentTime')) document.getElementById('currentTime').innerText = d.toLocaleTimeString('vi-VN');
    }, 1000);

    // ============================================
    // --- [CẬP NHẬT] LOGIC MENU USER (DROPDOWN) ---
    // ============================================
    const userIcon = document.getElementById('user-icon');
    const userMenu = document.getElementById('user-menu');

    if (userIcon && userMenu) {
      // Toggle menu khi click vào icon
      userIcon.addEventListener('click', (e) => {
        e.stopPropagation(); // Ngăn chặn sự kiện click lan ra ngoài ngay lập tức
        userMenu.classList.toggle('active'); // Thêm/Bỏ class .active (đã có trong CSS)
      });

      // Đóng menu khi click bất kỳ đâu bên ngoài
      window.addEventListener('click', (e) => {
        if (!userIcon.contains(e.target) && !userMenu.contains(e.target)) {
          userMenu.classList.remove('active');
        }
      });
    }
  });

})();