'use strict';

(function () {
  // --- CẤU HÌNH ---
  const API_BASE_URL = 'http://localhost:8080/api/contact';
  const CURRENT_USER_ID = localStorage.getItem('userId') || 1;

  // --- STATE ---
  let currentPage = 0;
  const pageSize = 10;
  let currentKeyword = '';
  let currentFilterMode = 'all';
  let currentReplyId = null; // [MỚI] Lưu ID của contact đang trả lời

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

            // 1. Mapping trạng thái
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

            // 3. Filter
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
      const statusBadge = isRead
          ? `<span class="badge" style="background:#e2e6ea; color:#6c757d; padding:5px 10px; border-radius:20px; font-size:0.85rem; font-weight:500;">Đã xử lý</span>`
          : `<span class="badge" style="background:#d4edda; color:#155724; padding:5px 10px; border-radius:20px; font-size:0.85rem; font-weight:600;">Chưa đọc</span>`;

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
    const prev = document.createElement('button');
    prev.innerText = '«';
    prev.disabled = currentPage === 0;
    prev.onclick = () => { if(currentPage > 0) { currentPage--; loadContacts(currentPage); }};
    div.appendChild(prev);

    for(let i=0; i<totalPages; i++){
      const btn = document.createElement('button');
      btn.innerText = i + 1;
      if(i === currentPage) btn.classList.add('active');
      btn.onclick = () => { currentPage = i; loadContacts(currentPage); };
      div.appendChild(btn);
    }

    const next = document.createElement('button');
    next.innerText = '»';
    next.disabled = currentPage >= totalPages - 1;
    next.onclick = () => { if(currentPage < totalPages - 1) { currentPage++; loadContacts(currentPage); }};
    div.appendChild(next);
  }

  // --- EVENTS (Global) ---

  // 1. Xem chi tiết
  window.viewContact = function(encodedContact) {
    const contact = JSON.parse(decodeURIComponent(encodedContact));
    document.getElementById('modalFullName').innerText = contact.fullName;
    document.getElementById('modalEmail').innerText = contact.email;
    document.getElementById('modalSubject').innerText = contact.subject;
    document.getElementById('modalDate').innerText = formatDate(contact.createdAt);
    document.getElementById('modalStatus').innerText = contact.isRead ? 'Đã xử lý' : 'Chưa đọc';
    document.getElementById('modalMessage').innerText = contact.message || '';

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

    const btnReplyInModal = document.getElementById('btnReplyInModal');
    if(btnReplyInModal) {
      btnReplyInModal.onclick = function() {
        window.closeViewModal();
        // Mở modal trả lời mới
        window.openReplyModal(contact.id);
      };
    }
    document.getElementById('viewMessageModal').style.display = 'block';
  };

  // 2. Mở Modal Trả lời (NEW)
  window.openReplyModal = function(id) {
    currentReplyId = id; // Lưu ID lại
    document.getElementById('replyTextContent').value = ''; // Xóa nội dung cũ
    document.getElementById('replyInputModal').style.display = 'block'; // Hiện modal
    document.getElementById('replyTextContent').focus();
  };

  // 3. Gửi Trả lời (NEW Logic)
  window.submitReplyFromModal = function() {
    const content = document.getElementById('replyTextContent').value;
    if (!content || content.trim() === "") {
      alert("Vui lòng nhập nội dung trả lời!");
      return;
    }

    if (!currentReplyId) return;

    // Gọi API
    fetch(`${API_BASE_URL}/${currentReplyId}/reply`, {
      method: 'PUT',
      headers: getHeaders(),
      body: content
    })
        .then(res => res.json())
        .then(data => {
          if (data.code === 1000) {
            alert("Đã gửi câu trả lời thành công!");
            window.closeReplyInputModal();
            loadContacts(currentPage);
          } else {
            alert("Lỗi: " + data.message);
          }
        })
        .catch(err => alert("Lỗi hệ thống!"));
  };

  window.closeReplyInputModal = () => document.getElementById('replyInputModal').style.display = 'none';
  window.closeViewModal = () => document.getElementById('viewMessageModal').style.display = 'none';
  window.closeConfirmModal = () => document.getElementById('confirmModal').style.display = 'none';

  window.filterContacts = (type) => { currentFilterMode = type; loadContacts(0); };
  window.searchContacts = () => { currentKeyword = document.getElementById('search').value; loadContacts(0); };
  window.deleteContactFromModal = () => alert("Chức năng xóa chưa được kích hoạt ở Backend.");

  document.addEventListener('DOMContentLoaded', () => {
    loadContacts(0);
    setInterval(() => {
      const d = new Date();
      if(document.getElementById('currentDate')) document.getElementById('currentDate').innerText = d.toLocaleDateString();
      if(document.getElementById('currentTime')) document.getElementById('currentTime').innerText = d.toLocaleTimeString();
    }, 1000);
  });
})();