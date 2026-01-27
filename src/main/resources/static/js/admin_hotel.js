'use strict';

(function () {
  if (!document.body || !document.body.classList.contains('hust-admin-hotel')) return;

  // ================================================================
  // 1. CONFIG & UTILITIES
  // ================================================================

  const API_ADMIN = '/admin';            // API quản lý Hotel
  const API_GROUP = '/api/hotel-groups'; // API quản lý Group

  let currentTab = 'hotels';

  // Hotel State
  let hotelPage = 0;
  let hotelView = 'active';
  let allHotels = [];
  let selectedHotelIds = [];

  // Group State
  let groupView = 'active';
  let allGroups = [];

  // --- Date & Time Utils ---
  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const formatDate = (dateString) => {
    if(!dateString) return '';
    // Xử lý chuỗi ISO từ Java (yyyy-MM-ddTHH:mm:ss)
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  // --- Toast ---
  function showToast(msg, type = 'success') {
    const bg = type === 'success' ? "linear-gradient(135deg, #00b09b, #96c93d)"
        : type === 'error' ? "linear-gradient(135deg, #ff5f6d, #ffc371)"
            : "linear-gradient(135deg, #f39c12, #e67e22)";

    if (typeof Toastify === 'function') {
      Toastify({
        text: msg, duration: 3500, gravity: "top", position: "right",
        style: { background: bg }, stopOnFocus: true, close: true
      }).showToast();
    } else {
      console.log(`[${type}] ${msg}`);
    }
  }

  // --- Tabs & Modals ---
  window.switchTab = function(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-btn[onclick="switchTab('${tabName}')"]`).classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.getElementById(`tab-${tabName}`).style.display = 'block';

    if (tabName === 'hotels') {
      fetchHotels();
      if(allGroups.length > 0) renderHotelTable();
    } else if (tabName === 'groups') {
      fetchGroups();
    }
  };

  window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
  };

  window.onclick = function(event) {
    if (event.target.classList.contains('modal')) event.target.style.display = 'none';
  };

  // ================================================================
  // 2. HOTEL LOGIC
  // ================================================================

  function fetchHotels() {
    const endpoint = (hotelView === 'active') ? `${API_ADMIN}/getAllHotels` : `${API_ADMIN}/trash`;
    fetch(endpoint).then(res => res.json()).then(data => {
      const list = (data.code === 1000 || data.message === "Success" || Array.isArray(data.data)) ? data.data : [];
      allHotels = Array.isArray(list) ? list : [];
      renderHotelTable();
    }).catch(console.error);
  }

  function renderHotelTable() {
    const tbody = document.getElementById('hotelTableBody');
    tbody.innerHTML = '';
    selectedHotelIds = [];
    updateBulkActionUI();

    if (!Array.isArray(allHotels) || allHotels.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center p-3">Không có dữ liệu</td></tr>`;
      return;
    }

    const pageSize = 10;
    const start = hotelPage * pageSize;
    const end = start + pageSize;

    allHotels.slice(start, end).forEach(hotel => {
      const tr = document.createElement('tr');
      const checkbox = hotelView === 'active'
          ? `<input type="checkbox" class="hotel-cb" value="${hotel.id}" onchange="toggleHotelSelection(this)">` : '';

      // Tìm tên nhóm
      let gName = '--';
      const gId = hotel.hotelGroupId || (hotel.hotelGroup?.id);
      if (gId && allGroups.length > 0) {
        const found = allGroups.find(g => g.id == gId);
        if (found) gName = found.groupName;
      } else if (hotel.hotelGroup?.groupName) {
        gName = hotel.hotelGroup.groupName;
      }

      const badge = gName !== '--' ? `<span class="badge badge-active">${gName}</span>` : `<span style="color:#ccc;">--</span>`;

      let actions = hotelView === 'active'
          ? `<button class="btn btn-edit" onclick="openEditHotelModal(${hotel.id})"><i class="fas fa-edit"></i></button>
           <button class="btn btn-danger" onclick="deleteHotel(${hotel.id})"><i class="fas fa-trash"></i></button>`
          : `<button class="btn btn-success" onclick="restoreHotel(${hotel.id})"><i class="fas fa-undo"></i> Khôi phục</button>`;

      tr.innerHTML = `
          <td>${checkbox}</td>
          <td>${hotel.id}</td>
          <td style="font-weight:600;">${hotel.hotelName || 'N/A'}</td>
          <td>${badge}</td>
          <td style="color:var(--primary); font-weight:bold;">${formatCurrency(hotel.hotelPriceFrom || 0)}</td>
          <td>${hotel.address || ''}</td>
          <td class="text-right">${actions}</td>
      `;
      tbody.appendChild(tr);
    });

    renderPagination('pagination', Math.ceil(allHotels.length / pageSize), hotelPage, (i) => {
      hotelPage = i;
      renderHotelTable();
    });
  }

  // --- Bulk Actions ---
  window.toggleSelectAll = function() {
    const mainCb = document.getElementById('selectAllCb');
    document.querySelectorAll('.hotel-cb').forEach(cb => {
      cb.checked = mainCb.checked;
      toggleHotelSelection(cb, false);
    });
    updateBulkActionUI();
  };

  window.toggleHotelSelection = function(cb, updateUI = true) {
    const val = parseInt(cb.value);
    if(cb.checked) { if(!selectedHotelIds.includes(val)) selectedHotelIds.push(val); }
    else { selectedHotelIds = selectedHotelIds.filter(id => id !== val); }
    if(updateUI) updateBulkActionUI();
  };

  function updateBulkActionUI() {
    const count = selectedHotelIds.length;
    document.getElementById('selectedCount').innerText = count;
    document.getElementById('bulkActions').style.display = count > 0 ? 'flex' : 'none';
  }

  window.openAssignGroupModal = function() {
    if(selectedHotelIds.length === 0) return;
    loadGroupOptions('assignGroupId');
    document.getElementById('assignGroupModal').style.display = 'flex';
  };

  window.submitAssignGroup = function() {
    const groupId = document.getElementById('assignGroupId').value;
    if(!groupId) return showToast("Vui lòng chọn tập đoàn", "warning");

    Promise.all(selectedHotelIds.map(id =>
        fetch(`${API_ADMIN}/updateHotel/${id}`, {
          // Lưu ý: Logic này tạm thời giả định update từng cái nếu backend chưa có API bulk assign
          // Nếu backend chưa hỗ trợ bulk, đây là cách duy nhất.
          // Cần sửa lại logic fetch này nếu Backend yêu cầu body đầy đủ.
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ hotelGroupId: groupId })
        })
    )).then(() => {
      showToast(`Đã cập nhật ${selectedHotelIds.length} khách sạn!`);
      window.closeModal('assignGroupModal');
      selectedHotelIds = [];
      document.getElementById('selectAllCb').checked = false;
      fetchHotels();
    });
  };

  // --- CRUD Hotel ---
  function loadGroupOptions(selectId, selectedValue = null) {
    const select = document.getElementById(selectId);
    if(!select) return;
    const render = (list) => {
      let html = '<option value="">-- Không thuộc nhóm --</option>';
      list.forEach(g => html += `<option value="${g.id}" ${selectedValue == g.id ? 'selected' : ''}>${g.groupName}</option>`);
      select.innerHTML = html;
    };
    if(allGroups.length > 0) render(allGroups);
    else fetchGroups().then(() => render(allGroups));
  }

  window.openAddHotelModal = function() {
    document.getElementById('modalTitle').innerText = "Thêm Khách sạn mới";
    document.getElementById('hotelId').value = "";
    ['hotelName', 'priceFrom', 'address', 'numberFloor', 'numberRoomPerFloor'].forEach(id => document.getElementById(id).value = "");
    loadGroupOptions('hotelGroupId');
    document.getElementById('hotelModal').style.display = 'flex';
  };

  window.openEditHotelModal = function(id) {
    fetch(`${API_ADMIN}/${id}`).then(res => res.json()).then(res => {
      if(res.data) {
        const h = res.data;
        document.getElementById('modalTitle').innerText = "Cập nhật Khách sạn";
        document.getElementById('hotelId').value = h.id;
        document.getElementById('hotelName').value = h.hotelName;
        document.getElementById('priceFrom').value = h.hotelPriceFrom;
        document.getElementById('address').value = h.address;
        document.getElementById('numberFloor').value = h.numberFloor;
        document.getElementById('numberRoomPerFloor').value = h.numberRoomPerFloor;
        loadGroupOptions('hotelGroupId', h.hotelGroupId || h.hotelGroup?.id);
        document.getElementById('hotelModal').style.display = 'flex';
      }
    });
  };

  window.saveHotel = function() {
    const id = document.getElementById('hotelId').value;
    const payload = {
      hotelName: document.getElementById('hotelName').value,
      priceFrom: parseFloat(document.getElementById('priceFrom').value),
      address: document.getElementById('address').value,
      numberFloor: parseInt(document.getElementById('numberFloor').value),
      numberRoomPerFloor: parseInt(document.getElementById('numberRoomPerFloor').value),
      hotelGroupId: document.getElementById('hotelGroupId').value || null
    };

    fetch(id ? `${API_ADMIN}/updateHotel/${id}` : `${API_ADMIN}/createHotel`, {
      method: id ? 'PUT' : 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    }).then(res => res.json()).then(data => {
      if(data.code === 1000 || !data.code) {
        showToast("Thành công!");
        window.closeModal('hotelModal');
        fetchHotels();
      } else showToast(data.message, 'error');
    });
  };

  window.deleteHotel = function(id) {
    if(confirm("Bạn có chắc chắn muốn xóa?"))
      fetch(`${API_ADMIN}/${id}`, { method: 'DELETE' }).then(() => { showToast("Đã xóa"); fetchHotels(); });
  };
  window.restoreHotel = function(id) {
    fetch(`${API_ADMIN}/restore/${id}`, { method: 'PUT' }).then(() => { showToast("Đã khôi phục"); fetchHotels(); });
  };
  window.toggleHotelTrash = function() {
    hotelView = (hotelView === 'active') ? 'trash' : 'active';
    const btn = document.getElementById('toggleTrashBtn');
    btn.innerHTML = hotelView === 'trash' ? '<i class="fas fa-list"></i> Quay lại' : '<i class="fas fa-trash-restore"></i> Thùng rác';
    btn.classList.toggle('btn-warning');
    fetchHotels();
  };

  // ================================================================
  // 3. GROUP LOGIC
  // ================================================================

  window.fetchGroups = async function() {
    try {
      const url = (groupView === 'active') ? API_GROUP : `${API_GROUP}/trash`;
      const res = await fetch(url);
      const data = await res.json();

      if (Array.isArray(data)) allGroups = data;
      else if (data.result && Array.isArray(data.result)) allGroups = data.result;
      else if (data.data && Array.isArray(data.data)) allGroups = data.data;
      else allGroups = [];

      renderGroupTable();
      // Load lại bảng hotel để hiện tên Group nếu đang ở tab Hotels
      if(currentTab === 'hotels') renderHotelTable();
    } catch (e) { console.error(e); allGroups = []; }
  };

  function renderGroupTable() {
    const tbody = document.getElementById('groupTableBody');
    tbody.innerHTML = '';

    if (allGroups.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center p-3">Chưa có tập đoàn nào</td></tr>`;
      return;
    }

    allGroups.forEach(g => {
      const status = !g.deleted ? '<span class="badge badge-success">Hoạt động</span>' : '<span class="badge badge-danger">Đã xóa</span>';

      const toolBtns = !g.deleted ? `
        <button class="btn btn-info" onclick="openPolicyModal(${g.id})" title="Giá lễ"><i class="fas fa-calendar-alt"></i></button>
        <button class="btn btn-warning" onclick="openBulkPriceGroupModal(${g.id})" title="Đổi giá hàng loạt"><i class="fas fa-percentage"></i></button>
        <button class="btn btn-secondary" onclick="openHistoryModal(${g.id})" title="Lịch sử"><i class="fas fa-history"></i></button>
      ` : '';

      const actionBtns = !g.deleted ? `
        <button class="btn btn-edit" onclick="openEditGroupModal(${g.id})"><i class="fas fa-pencil-alt"></i></button>
        <button class="btn btn-danger" onclick="deleteGroup(${g.id})"><i class="fas fa-trash"></i></button>
      ` : `<button class="btn btn-success" onclick="restoreGroup(${g.id})"><i class="fas fa-undo"></i></button>`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${g.id}</td>
        <td style="font-weight:600; color:var(--primary);">${g.groupName}</td>
        <td>${g.description || ''}</td>
        <td>${status}</td>
        <td style="white-space:nowrap;">${toolBtns}</td>
        <td class="text-right" style="white-space:nowrap;">${actionBtns}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --- Group CRUD ---
  window.openGroupModal = function() {
    document.getElementById('groupModalTitle').innerText = "Tạo Tập đoàn";
    document.getElementById('groupId').value = "";
    document.getElementById('groupName').value = "";
    document.getElementById('groupDescription').value = "";
    document.getElementById('groupModal').style.display = 'flex';
  };
  window.openEditGroupModal = function(id) {
    const g = allGroups.find(x => x.id === id);
    if(!g) return;
    document.getElementById('groupModalTitle').innerText = "Sửa Tập đoàn";
    document.getElementById('groupId').value = g.id;
    document.getElementById('groupName').value = g.groupName;
    document.getElementById('groupDescription').value = g.description;
    document.getElementById('groupModal').style.display = 'flex';
  };

  window.saveGroup = function() {
    const id = document.getElementById('groupId').value;
    const name = document.getElementById('groupName').value.trim();
    if(!name) return showToast("Tên là bắt buộc", "error");

    const payload = {
      id: id ? parseInt(id) : null,
      name: name,
      description: document.getElementById('groupDescription').value.trim()
    };

    fetch(id ? `${API_GROUP}/${id}` : API_GROUP, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(async res => {
      if (res.ok) {
        showToast(id ? "Cập nhật xong" : "Tạo mới xong");
        window.closeModal('groupModal');
        fetchGroups();
      } else showToast(await res.text(), "error");
    });
  };

  window.deleteGroup = (id) => {
    if(confirm("CẢNH BÁO: Xóa tập đoàn sẽ xóa toàn bộ khách sạn con!"))
      fetch(`${API_GROUP}/${id}`, { method: 'DELETE' }).then(res => { if(res.ok) { showToast("Đã xóa"); fetchGroups(); } });
  };
  window.restoreGroup = (id) => {
    fetch(`${API_GROUP}/${id}/restore`, { method: 'PATCH' }).then(res => { if(res.ok) { showToast("Đã khôi phục"); fetchGroups(); } });
  };
  window.toggleGroupTrash = function() {
    groupView = (groupView === 'active') ? 'trash' : 'active';
    const btn = document.getElementById('toggleGroupTrashBtn');
    btn.innerHTML = groupView === 'trash' ? '<i class="fas fa-list"></i> Quay lại' : '<i class="fas fa-trash-restore"></i> Thùng rác';
    btn.classList.toggle('btn-warning');
    fetchGroups();
  };

  // ================================================================
  // 4. ADVANCED FEATURES (Policy, Bulk Price, HISTORY)
  // ================================================================

  // --- 4.1 Policy ---
  window.openPolicyModal = function(groupId) {
    document.getElementById('policyGroupId').value = groupId;
    document.getElementById('policyName').value = "";
    document.getElementById('policyStart').value = "";
    document.getElementById('policyEnd').value = "";
    document.getElementById('policyPercent').value = "";
    document.getElementById('policyModal').style.display = 'flex';
  };

  window.savePolicy = function() {
    const payload = {
      groupId: document.getElementById('policyGroupId').value,
      name: document.getElementById('policyName').value,
      startDate: document.getElementById('policyStart').value,
      endDate: document.getElementById('policyEnd').value,
      increasePercentage: parseFloat(document.getElementById('policyPercent').value)
    };

    if(!payload.name || !payload.startDate || !payload.endDate || isNaN(payload.increasePercentage))
      return showToast("Nhập thiếu thông tin", "warning");

    fetch(`${API_GROUP}/policy`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    }).then(async res => {
      if(res.ok) { showToast("Đã thêm chính sách"); window.closeModal('policyModal'); }
      else showToast(await res.text(), "error");
    });
  };

  // --- 4.2 Bulk Price ---
  window.openBulkPriceGroupModal = function(groupId) {
    document.getElementById('bulkPriceGroupId').value = groupId;
    document.getElementById('bulkPricePercent').value = "";
    document.getElementById('bulkPriceGroupModal').style.display = 'flex';
  };

  window.submitBulkPriceGroup = async function() {
    const id = document.getElementById('bulkPriceGroupId').value;
    const percent = parseFloat(document.getElementById('bulkPricePercent').value);

    if(isNaN(percent)) return showToast("Vui lòng nhập số %", "warning");
    if(percent <= -100) return showToast("Không được giảm quá 100%", "error");

    const txt = percent >= 0 ? "TĂNG" : "GIẢM";
    if(!confirm(`Xác nhận ${txt} ${Math.abs(percent)}% giá gốc toàn bộ khách sạn?`)) return;

    try {
      const res = await fetch(`${API_GROUP}/${id}/bulk-price?percentage=${percent}`, { method: 'PATCH' });
      if(res.ok) {
        showToast("Cập nhật giá thành công");
        window.closeModal('bulkPriceGroupModal');
        fetchHotels(); // Refresh giá mới
      } else showToast(await res.text(), "error");
    } catch(e) { showToast("Lỗi kết nối", "error"); }
  };

  // --- 4.3 History (Đã sửa tên biến khớp với Java Entity) ---
  window.openHistoryModal = function(groupId) {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Đang tải dữ liệu...</td></tr>';
    document.getElementById('historyModal').style.display = 'flex';

    fetch(`${API_GROUP}/${groupId}/history`)
        .then(async res => {
          if(!res.ok) throw new Error(await res.text() || "Lỗi tải dữ liệu");
          return res.json();
        })
        .then(data => renderHistoryTable(data))
        .catch(err => {
          tbody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">${err.message}</td></tr>`;
        });
  };

  function renderHistoryTable(data) {
    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';

    // Xử lý nếu data trả về là List hoặc Page
    const list = Array.isArray(data) ? data : (data.content || data.data || []);

    if(list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center">Chưa có lịch sử</td></tr>';
      return;
    }

    list.forEach(item => {
      // 1. Map tên biến từ Java Entity (GroupPriceHistory)
      // Java: percentageChange, description, actionType, createdAt
      const percent = item.percentageChange;
      const desc = item.description || 'Không có mô tả';
      const actionRaw = item.actionType; // VD: INCREASE_BASE_PRICE, ADD_HOLIDAY_POLICY

      // 2. Tạo Badge hiển thị số %
      let badge = '<span class="badge badge-secondary">0%</span>';
      if(percent > 0) badge = `<span class="badge badge-success">+${percent}%</span>`;
      else if(percent < 0) badge = `<span class="badge badge-danger">${percent}%</span>`;

      // 3. Dịch Action Type sang tiếng Việt cho đẹp
      let actionDisplay = actionRaw;
      if(actionRaw === 'INCREASE_BASE_PRICE') actionDisplay = 'Tăng giá gốc';
      else if(actionRaw === 'DECREASE_BASE_PRICE') actionDisplay = 'Giảm giá gốc';
      else if(actionRaw === 'ADD_HOLIDAY_POLICY') actionDisplay = 'Thêm chính sách lễ';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatDate(item.createdAt)}</td>
        <td style="font-weight:600;">${actionDisplay}</td>
        <td>${badge}</td>
        <td style="font-size:0.9em; color:#555;">${desc}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Helper Pagination
  function renderPagination(elemId, totalPages, currPage, cb) {
    const container = document.getElementById(elemId);
    if(!container) return;
    container.innerHTML = '';
    if(totalPages <= 1) return;
    for(let i=0; i<totalPages; i++) {
      const btn = document.createElement('button');
      btn.innerText = i + 1;
      if(i === currPage) btn.classList.add('active');
      btn.onclick = () => cb(i);
      container.appendChild(btn);
    }
  }

  // Init
  document.addEventListener('DOMContentLoaded', () => {
    fetchHotels();
    fetchGroups();
  });

})();