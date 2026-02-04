'use strict';

(function () {
  if (!document.body || !document.body.classList.contains('hust-admin-hotel')) return;

  // --- CẤU HÌNH API ---
  const API_ADMIN = '/admin';

  // [FIX QUAN TRỌNG]: Đổi từ '/admin/hotel-groups' thành '/api/hotel-groups'
  // để khớp với HotelGroupController.java
  const API_GROUP = '/api/hotel-groups';

  let currentTab = 'hotels';

  // --- STATE QUẢN LÝ ---
  let hotelPage = 0;
  let hotelView = 'active';
  let allHotels = [];
  let selectedHotelIds = [];
  let currentSearchKeyword = '';

  let groupView = 'active';
  let allGroups = [];
  let currentGroupPolicies = [];
  let currentEditingGroupPolicyId = null;

  let currentHistoryHotelId = null;
  let currentEditingHotelPolicyId = null;

  // ================================================================
  // 1. UTILS (TIỆN ÍCH DÙNG CHUNG)
  // ================================================================
  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', {style: 'currency', currency: 'VND'}).format(val);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const toInputDate = (dateString) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  function showToast(msg, type = 'success') {
    const bg = type === 'success' ? "linear-gradient(135deg, #00b09b, #96c93d)"
        : type === 'error' ? "linear-gradient(135deg, #ff5f6d, #ffc371)"
            : "linear-gradient(135deg, #f39c12, #e67e22)";

    if (typeof Toastify === 'function') {
      Toastify({
        text: msg, duration: 3500, gravity: "top", position: "right",
        style: {background: bg}, stopOnFocus: true, close: true
      }).showToast();
    } else {
      console.log(`[${type}] ${msg}`);
    }
  }

  // --- Tabs & Modals Helper ---
  window.switchTab = function (tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-btn[onclick="switchTab('${tabName}')"]`).classList.add('active');

    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    document.getElementById(`tab-${tabName}`).style.display = 'block';

    if (tabName === 'hotels') {
      selectedHotelIds = [];
      const cb = document.getElementById('selectAllCb');
      if(cb) cb.checked = false;
      fetchHotels();
      if (allGroups.length > 0) renderHotelTable();
    } else if (tabName === 'groups') {
      fetchGroups();
    }
  };

  window.closeModal = function (id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
  };

  window.onclick = function (event) {
    if (event.target.classList.contains('modal')) event.target.style.display = 'none';
  };

  // ================================================================
  // 2. HOTEL LOGIC
  // ================================================================

  window.triggerSearch = function (keyword) {
    currentSearchKeyword = keyword.trim();
    hotelPage = 0;
    fetchHotels();
  };

  function fetchHotels() {
    let endpoint = '';
    if (hotelView === 'trash') {
      endpoint = `${API_ADMIN}/trash`;
    } else if (currentSearchKeyword.length > 0) {
      endpoint = `${API_ADMIN}/search?keyword=${encodeURIComponent(currentSearchKeyword)}`;
    } else {
      endpoint = `${API_ADMIN}/getAllHotels`;
    }

    fetch(endpoint)
        .then(res => res.json())
        .then(data => {
          const list = (data.data) ? data.data : (Array.isArray(data) ? data : []);
          allHotels = Array.isArray(list) ? list : [];
          renderHotelTable();
        })
        .catch(console.error);
  }

  function renderHotelTable() {
    const tbody = document.getElementById('hotelTableBody');
    tbody.innerHTML = '';
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
      const isChecked = selectedHotelIds.includes(hotel.id) ? 'checked' : '';

      const checkbox = hotelView === 'active'
          ? `<input type="checkbox" class="hotel-cb" value="${hotel.id}" ${isChecked} onchange="toggleHotelSelection(this)">`
          : '';

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
          ? `<button class="btn btn-info" onclick="openHotelHistoryModal(${hotel.id})" title="Lịch sử giá"><i class="fas fa-history"></i></button>
             <button class="btn btn-edit" onclick="openEditHotelModal(${hotel.id})" title="Sửa"><i class="fas fa-edit"></i></button>
             <button class="btn btn-danger" onclick="deleteHotel(${hotel.id})" title="Xóa"><i class="fas fa-trash"></i></button>`
          : `<button class="btn btn-success" onclick="restoreHotel(${hotel.id})"><i class="fas fa-undo"></i> Khôi phục</button>`;

      tr.innerHTML = `
        <td>${checkbox}</td>
        <td>${hotel.id}</td>
        <td style="font-weight:600;">${hotel.hotelName || 'N/A'}</td>
        <td>${badge}</td>
        <td style="color:var(--primary); font-weight:bold;">${formatCurrency(hotel.hotelPriceFrom || 0)}</td>
        <td>${hotel.address || ''}</td>
        <td class="text-right" style="white-space:nowrap;">${actions}</td>
      `;
      tbody.appendChild(tr);
    });

    const pageIds = allHotels.slice(start, end).map(h => h.id);
    const allSelected = pageIds.length > 0 && pageIds.every(id => selectedHotelIds.includes(id));
    const selectAllCb = document.getElementById('selectAllCb');
    if(selectAllCb) selectAllCb.checked = allSelected;

    renderPagination('pagination', Math.ceil(allHotels.length / pageSize), hotelPage, (i) => {
      hotelPage = i;
      renderHotelTable();
    });
  }

  // --- Logic Chọn Nhiều ---
  window.toggleSelectAll = function () {
    const mainCb = document.getElementById('selectAllCb');
    document.querySelectorAll('.hotel-cb').forEach(cb => {
      cb.checked = mainCb.checked;
      toggleHotelSelection(cb, false);
    });
    updateBulkActionUI();
  };

  window.toggleHotelSelection = function (cb, updateUI = true) {
    const val = parseInt(cb.value);
    if (cb.checked) {
      if (!selectedHotelIds.includes(val)) selectedHotelIds.push(val);
    } else {
      selectedHotelIds = selectedHotelIds.filter(id => id !== val);
    }
    if (updateUI) updateBulkActionUI();
  };

  window.clearAllSelection = function () {
    selectedHotelIds = [];
    document.getElementById('selectAllCb').checked = false;
    renderHotelTable();
  };

  function updateBulkActionUI() {
    const count = selectedHotelIds.length;
    const countSpan = document.getElementById('selectedCount');
    const actionDiv = document.getElementById('bulkActions');

    if (countSpan) {
      countSpan.innerHTML = `${count} <a href="javascript:void(0)" onclick="clearAllSelection()" style="color: #dc3545; margin-left:5px; text-decoration:none;" title="Bỏ chọn tất cả"><i class="fas fa-times-circle"></i></a>`;
    }
    if (actionDiv) actionDiv.style.display = count > 0 ? 'flex' : 'none';
  }

  // --- CRUD Khách sạn ---
  window.openAddHotelModal = function () {
    document.getElementById('modalTitle').innerText = "Thêm Khách sạn mới";
    document.getElementById('hotelId').value = "";
    ['hotelName', 'priceFrom', 'address', 'numberFloor', 'numberRoomPerFloor'].forEach(id => document.getElementById(id).value = "");
    loadGroupOptions('hotelGroupId');
    document.getElementById('hotelModal').style.display = 'flex';
  };

  window.openEditHotelModal = function (id) {
    fetch(`${API_ADMIN}/${id}`).then(res => res.json()).then(res => {
      const data = res.data || res;
      if (data) {
        document.getElementById('modalTitle').innerText = "Cập nhật Khách sạn";
        document.getElementById('hotelId').value = data.id;
        document.getElementById('hotelName').value = data.hotelName;
        document.getElementById('priceFrom').value = data.hotelPriceFrom;
        document.getElementById('address').value = data.address;
        document.getElementById('numberFloor').value = data.numberFloor;
        document.getElementById('numberRoomPerFloor').value = data.numberRoomPerFloor;
        loadGroupOptions('hotelGroupId', data.hotelGroupId || data.hotelGroup?.id);
        document.getElementById('hotelModal').style.display = 'flex';
      }
    });
  };

  window.saveHotel = function () {
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
      if (data.code === 1000 || data.message?.includes("thành công") || !data.code) {
        showToast("Thành công!");
        window.closeModal('hotelModal');
        fetchHotels();
      } else showToast(data.message, 'error');
    });
  };

  window.deleteHotel = function (id) {
    if (confirm("Bạn có chắc chắn muốn xóa?")) fetch(`${API_ADMIN}/${id}`, {method: 'DELETE'}).then(() => {
      showToast("Đã xóa");
      fetchHotels();
    });
  };

  window.restoreHotel = function (id) {
    fetch(`${API_ADMIN}/restore/${id}`, {method: 'PUT'}).then(() => {
      showToast("Đã khôi phục");
      fetchHotels();
    });
  };

  window.toggleHotelTrash = function () {
    hotelView = (hotelView === 'active') ? 'trash' : 'active';
    const btn = document.getElementById('toggleTrashBtn');
    btn.innerHTML = hotelView === 'trash' ? '<i class="fas fa-list"></i> Quay lại' : '<i class="fas fa-trash-restore"></i> Thùng rác';
    btn.classList.toggle('btn-warning');
    selectedHotelIds = [];
    document.getElementById('selectAllCb').checked = false;
    if (hotelView === 'trash') {
      currentSearchKeyword = '';
      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.value = '';
    }
    fetchHotels();
  };

  // ================================================================
  // 3. BULK ACTIONS
  // ================================================================

  window.openAssignGroupModal = function () {
    if (selectedHotelIds.length === 0) return;
    loadGroupOptions('assignGroupId');
    document.getElementById('assignGroupModal').style.display = 'flex';
  };

  window.submitAssignGroup = function () {
    const groupId = document.getElementById('assignGroupId').value;
    if (!groupId) return showToast("Vui lòng chọn tập đoàn", "warning");

    fetch(`${API_ADMIN}/assign-group`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({groupId: parseInt(groupId), hotelIds: selectedHotelIds})
    }).then(async res => {
      if (res.ok) {
        showToast(`Đã thêm ${selectedHotelIds.length} khách sạn vào nhóm!`);
        window.closeModal('assignGroupModal');
        selectedHotelIds = [];
        document.getElementById('selectAllCb').checked = false;
        fetchHotels();
      } else {
        showToast(await res.text(), "error");
      }
    });
  };

  window.openBulkUpdateListModal = function () {
    if (selectedHotelIds.length === 0) return showToast("Chưa chọn khách sạn nào!", "warning");
    const infoText = document.getElementById('bulkListInfo');
    if (infoText) infoText.innerHTML = `Đang áp dụng cho: <b style="color:blue">${selectedHotelIds.length}</b> khách sạn.`;
    document.getElementById('bulkListPercent').value = "";
    document.getElementById('safetyCheck').checked = false;
    checkSafetyCondition();
    document.getElementById('bulkUpdateListModal').style.display = 'flex';
  };

  window.checkSafetyCondition = function () {
    const percent = document.getElementById('bulkListPercent').value;
    const isChecked = document.getElementById('safetyCheck').checked;
    const btn = document.getElementById('btnSubmitBulk');
    if (percent !== "" && isChecked) {
      btn.disabled = false;
      btn.style.background = "#28a745";
      btn.style.cursor = "pointer";
    } else {
      btn.disabled = true;
      btn.style.background = "#ccc";
      btn.style.cursor = "not-allowed";
    }
  };

  window.submitBulkUpdateList = function () {
    const percent = parseFloat(document.getElementById('bulkListPercent').value);
    fetch(`${API_ADMIN}/bulk-update-price-list`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({hotelIds: selectedHotelIds, percentage: percent})
    }).then(async res => {
      if (res.ok) {
        alert(`Thành công! Đã cập nhật giá cho ${selectedHotelIds.length} khách sạn.`);
        closeModal('bulkUpdateListModal');
        location.reload();
      } else {
        alert("Lỗi: " + await res.text());
      }
    });
  };

  window.openAddPolicyListModal = function () {
    if (selectedHotelIds.length === 0) return showToast("Chưa chọn khách sạn nào!", "warning");
    ['bulkPolicyName', 'bulkPolicyStart', 'bulkPolicyEnd', 'bulkPolicyPercent'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    const modal = document.getElementById('bulkPolicyListModal');
    if (modal) {
      const infoSpan = document.getElementById('bulkPolicyInfo');
      if (infoSpan) infoSpan.innerText = `Áp dụng cho: ${selectedHotelIds.length} khách sạn`;
      modal.style.display = 'flex';
    }
  };

  window.submitAddPolicyList = function () {
    const payload = {
      hotelIds: selectedHotelIds,
      policyName: document.getElementById('bulkPolicyName').value,
      startDate: document.getElementById('bulkPolicyStart').value,
      endDate: document.getElementById('bulkPolicyEnd').value,
      percentage: parseFloat(document.getElementById('bulkPolicyPercent').value)
    };

    if (!payload.policyName || !payload.startDate || !payload.endDate || isNaN(payload.percentage)) {
      return showToast("Vui lòng nhập đủ thông tin!", "warning");
    }

    fetch(`${API_ADMIN}/add-policy-list`, {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    }).then(async res => {
      if (res.ok) {
        showToast(`Thành công!`);
        closeModal('bulkPolicyListModal');
        selectedHotelIds = [];
        document.getElementById('selectAllCb').checked = false;
        fetchHotels();
      } else {
        let txt = await res.text();
        try { txt = JSON.parse(txt).message; } catch(e){}
        showToast("Lỗi: " + txt, "error");
      }
    });
  };

  // ================================================================
  // 4. GROUP LOGIC
  // ================================================================

  window.fetchGroups = async function () {
    try {
      const url = (groupView === 'active') ? API_GROUP : `${API_GROUP}/trash`;
      const res = await fetch(url);

      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();

      if (data.data) allGroups = data.data;
      else if (Array.isArray(data)) allGroups = data;
      else allGroups = [];

      renderGroupTable();
      if (currentTab === 'hotels') renderHotelTable();
    } catch (e) {
      console.error("Lỗi tải Group:", e);
      allGroups = [];
      renderGroupTable();
    }
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
        <button class="btn btn-info" onclick="openGroupPolicyModal(${g.id})" title="Giá lễ (Group)"><i class="fas fa-calendar-alt"></i></button>
        <button class="btn btn-warning" onclick="openBulkPriceGroupModal(${g.id})" title="Đổi giá hàng loạt"><i class="fas fa-percentage"></i></button>
        <button class="btn btn-secondary" onclick="openGroupHistoryModal(${g.id})" title="Lịch sử Group"><i class="fas fa-history"></i></button>
      ` : '';

      const actionBtns = !g.deleted ? `
        <button class="btn btn-edit" onclick="openEditGroupModal(${g.id})"><i class="fas fa-pencil-alt"></i></button>
        <button class="btn btn-danger" onclick="deleteGroup(${g.id})"><i class="fas fa-trash"></i></button>
      ` : `<button class="btn btn-success" onclick="restoreGroup(${g.id})"><i class="fas fa-undo"></i></button>`;

      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${g.id}</td><td style="font-weight:600; color:var(--primary);">${g.groupName}</td><td>${g.description || ''}</td><td>${status}</td><td style="white-space:nowrap;">${toolBtns}</td><td class="text-right" style="white-space:nowrap;">${actionBtns}</td>`;
      tbody.appendChild(tr);
    });
  }

  // --- Group Basic CRUD ---
  window.openGroupModal = function () {
    document.getElementById('groupModalTitle').innerText = "Tạo Tập đoàn";
    document.getElementById('groupId').value = "";
    document.getElementById('groupName').value = "";
    document.getElementById('groupDescription').value = "";
    document.getElementById('groupModal').style.display = 'flex';
  };

  window.openEditGroupModal = function (id) {
    const g = allGroups.find(x => x.id === id);
    if (!g) return;
    document.getElementById('groupModalTitle').innerText = "Sửa Tập đoàn";
    document.getElementById('groupId').value = g.id;
    document.getElementById('groupName').value = g.groupName;
    document.getElementById('groupDescription').value = g.description;
    document.getElementById('groupModal').style.display = 'flex';
  };

  window.saveGroup = function () {
    const id = document.getElementById('groupId').value;
    const name = document.getElementById('groupName').value.trim();
    if (!name) return showToast("Tên là bắt buộc", "error");

    const payload = {
      name: name,
      description: document.getElementById('groupDescription').value.trim()
    };

    fetch(id ? `${API_GROUP}/${id}` : API_GROUP, {
      method: id ? 'PUT' : 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    }).then(async res => {
      const data = await res.json();
      if (res.ok && (data.code === 1000 || !data.code || data.message?.includes("thành công"))) {
        showToast(id ? "Cập nhật xong" : "Tạo mới xong");
        window.closeModal('groupModal');
        fetchGroups();
      } else {
        showToast(data.message || "Có lỗi xảy ra", "error");
      }
    });
  };

  window.deleteGroup = (id) => {
    if (confirm("CẢNH BÁO: Xóa tập đoàn sẽ xóa toàn bộ khách sạn con!")) {
      fetch(`${API_GROUP}/${id}`, {method: 'DELETE'}).then(async res => {
        if (res.ok) { showToast("Đã xóa vào thùng rác"); fetchGroups(); }
      });
    }
  };

  window.restoreGroup = (id) => {
    fetch(`${API_GROUP}/${id}/restore`, {method: 'PATCH'}).then(async res => {
      if (res.ok) { showToast("Đã khôi phục"); fetchGroups(); }
    });
  };

  window.toggleGroupTrash = function () {
    groupView = (groupView === 'active') ? 'trash' : 'active';
    const btn = document.getElementById('toggleGroupTrashBtn');
    btn.innerHTML = groupView === 'trash' ? '<i class="fas fa-list"></i> Quay lại' : '<i class="fas fa-trash-restore"></i> Thùng rác';
    btn.classList.toggle('btn-warning');
    fetchGroups();
  };

  function loadGroupOptions(selectId, selectedValue = null) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const render = (list) => {
      let html = '<option value="">-- Không thuộc nhóm --</option>';
      list.forEach(g => html += `<option value="${g.id}" ${selectedValue == g.id ? 'selected' : ''}>${g.groupName}</option>`);
      select.innerHTML = html;
    };
    if (allGroups.length > 0) render(allGroups);
    else fetchGroups().then(() => render(allGroups));
  }

  // --- GROUP POLICY LOGIC ---

  window.openGroupPolicyModal = function (groupId) {
    document.getElementById('policyGroupId').value = groupId;

    fetch(`${API_GROUP}/${groupId}`)
        .then(res => res.json())
        .then(resData => {
          const group = resData.data || resData;
          const policies = group.holidayPolicies || [];
          currentGroupPolicies = policies;
          renderGroupPolicyTable(policies);
        });

    document.getElementById('policyModal').style.display = 'flex';
  };

  function renderGroupPolicyTable(policies) {
    const tbody = document.getElementById('policyTableBody');
    if(!tbody) return;
    tbody.innerHTML = '';

    if(!policies || policies.length===0) {
      tbody.innerHTML='<tr><td colspan="4" class="text-center">Chưa có chính sách nào</td></tr>';
      return;
    }

    policies.forEach(p => {
      const name = p.name || p.policyName;
      const start = toInputDate(p.startDate);
      const end = toInputDate(p.endDate);
      const percent = p.increasePercentage;
      const id = p.id;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${name}</td>
        <td>${start} -> ${end}</td>
        <td class="text-center">${percent}%</td>
        <td class="text-center">
            <button class="btn btn-sm btn-warning" onclick="editGroupPolicy(${id}, '${name}', '${start}', '${end}', ${percent})">Sửa</button>
            <button class="btn btn-sm btn-danger" onclick="deleteGroupPolicy(${id})">Xóa</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  window.resetGroupPolicyForm = function() {
    // 1. Reset biến toàn cục theo dõi ID đang sửa
    currentEditingGroupPolicyId = null;

    // 2. Reset các ô input (Kiểm tra kỹ xem có tồn tại không mới reset)
    const elName = document.getElementById('policyName');
    if (elName) elName.value = '';

    const elStart = document.getElementById('policyStart');
    if (elStart) elStart.value = '';

    const elEnd = document.getElementById('policyEnd');
    if (elEnd) elEnd.value = '';

    const elPercent = document.getElementById('policyPercent');
    if (elPercent) elPercent.value = '';

    // 3. Reset nút bấm và tiêu đề (Phần hay gây lỗi)
    // Thay vì getElementById (dễ lỗi nếu quên ID), ta dùng querySelector tìm trong modal
    const btnSave = document.querySelector('#policyModal .btn-warning');
    if (btnSave) {
      btnSave.innerText = 'Lưu Chính Sách'; // Reset text nút về mặc định
      btnSave.onclick = function() { window.saveGroupPolicy(); }; // Reset hành động click
    }

    const modalTitle = document.querySelector('#policyModal .modal-header h3');
    if (modalTitle) {
      modalTitle.innerHTML = '<i class="fas fa-tags"></i> Quản Lý Chính Sách Giá (Group)';
    }
  };

  window.editGroupPolicy = function(id, name, start, end, percent) {
    currentEditingGroupPolicyId = id;
    document.getElementById('policyName').value = name;
    document.getElementById('policyStart').value = start;
    document.getElementById('policyEnd').value = end;
    document.getElementById('policyPercent').value = percent;

    document.getElementById('btnSaveGroupPolicy').innerText = "Cập nhật";
    document.getElementById('btnCancelEditGroupPolicy').style.display = 'inline-block';
  };

  window.saveGroupPolicy = function() {
    const groupId = parseInt(document.getElementById('policyGroupId').value);
    const name = document.getElementById('policyName').value;
    const start = document.getElementById('policyStart').value;
    const end = document.getElementById('policyEnd').value;
    const percent = parseFloat(document.getElementById('policyPercent').value);

    // 1. Validate cơ bản ở Frontend trước
    if(!name || !start || !end || isNaN(percent)) return showToast("Nhập thiếu thông tin", "warning");

    if (new Date(start) > new Date(end)) {
      return showToast("Ngày bắt đầu không được lớn hơn ngày kết thúc", "error");
    }

    const payload = {
      groupId: groupId,
      name: name,
      startDate: start,
      endDate: end,
      increasePercentage: percent
    };

    let url = `${API_GROUP}/policy`;
    let method = 'POST';

    if (currentEditingGroupPolicyId) {
      url = `${API_GROUP}/policy/${currentEditingGroupPolicyId}`;
      method = 'PUT';
    }

    fetch(url, {
      method: method,
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    })
        .then(async res => {
          // --- ĐOẠN FIX LỖI Ở ĐÂY ---
          // Đọc phản hồi dưới dạng text trước để tránh lỗi JSON parse
          const responseText = await res.text();
          let data;

          try {
            // Cố gắng chuyển text thành JSON
            data = JSON.parse(responseText);
          } catch (e) {
            // Nếu không phải JSON (ví dụ lỗi 500 trả về text thô), gán text vào message
            data = { message: responseText };
          }
          // ---------------------------

          if(res.ok) {
            showToast(currentEditingGroupPolicyId ? "Cập nhật thành công" : "Thêm mới thành công");
            resetGroupPolicyForm();
            window.openGroupPolicyModal(groupId);
          } else {
            // Hiển thị lỗi thực sự từ server (lỗi 500)
            console.error("Server Error:", data);
            // Cắt bớt chuỗi nếu quá dài để hiển thị toast đẹp hơn
            const msg = data.message || "Lỗi lưu chính sách";
            showToast(msg.length > 100 ? msg.substring(0, 100) + "..." : msg, "error");
          }
        })
        .catch(err => {
          console.error("Network error:", err);
          showToast("Không thể kết nối đến server", "error");
        });
  };

  window.deleteGroupPolicy = function(id) {
    if(!confirm('Xóa chính sách nhóm này?')) return;
    fetch(`${API_GROUP}/policy/${id}`, {method:'DELETE'}).then(async res => {
      if(res.ok) {
        showToast("Đã xóa");
        window.openGroupPolicyModal(document.getElementById('policyGroupId').value);
      } else {
        showToast("Lỗi xóa", "error");
      }
    });
  };

  window.openBulkPriceGroupModal = function(id) {
    document.getElementById('bulkPriceGroupId').value=id;
    document.getElementById('bulkPriceGroupModal').style.display='flex';
  };

  window.submitBulkPriceGroup = function() {
    const id = document.getElementById('bulkPriceGroupId').value;
    const p = document.getElementById('bulkPricePercent').value;
    if(confirm('Chắc chắn đổi giá toàn bộ khách sạn trong nhóm?')) {
      fetch(`${API_GROUP}/${id}/bulk-price?percentage=${p}`, {method:'PATCH'}).then(async res => {
        if(res.ok) { alert('Xong'); location.reload(); }
        else { alert('Lỗi'); }
      });
    }
  };

  window.openGroupHistoryModal = function (groupId) {
    const tbody = document.getElementById('historyTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center">Đang tải dữ liệu...</td></tr>';
    document.getElementById('historyModal').style.display = 'flex';
    document.getElementById('historyModalTitle').innerText = "Lịch sử thay đổi Tập đoàn";

    fetch(`${API_GROUP}/${groupId}/history`)
        .then(res => res.json())
        .then(resData => {
          const data = resData.data || resData;
          renderHotelHistoryTable(data, true);
        });
  };

  // ================================================================
  // 5. HOTEL HISTORY & INDIVIDUAL POLICY
  // ================================================================

  window.openHotelHistoryModal = function (hotelId) {
    currentHistoryHotelId = hotelId;
    const tbody = document.getElementById('historyTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center">Đang tải dữ liệu...</td></tr>';
    document.getElementById('historyModal').style.display = 'flex';
    document.getElementById('historyModalTitle').innerText = "Lịch sử giá Khách sạn";

    fetch(`${API_ADMIN}/hotels/${hotelId}/policies`)
        .then(async res => { if (!res.ok) throw new Error("Lỗi tải"); return res.json(); })
        .then(responseWrapper => {
          const data = responseWrapper.data ? responseWrapper.data : responseWrapper;
          renderHotelHistoryTable(data, false);
        })
        .catch(err => {
          if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Lỗi: ${err.message}</td></tr>`;
        });
  };

  function renderHotelHistoryTable(data, isGroupMode = false) {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const list = Array.isArray(data) ? data : [];

    if (list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Chưa có lịch sử thay đổi giá</td></tr>';
      return;
    }

    list.forEach(item => {
      let typeBadge = '', detailInfo = '', actionButtons = '';
      const isPolicy = item.type === 'POLICY' || item.actionType?.includes('POLICY');

      if (isPolicy) {
        typeBadge = '<span class="badge badge-info">Thời vụ (Lễ/Tết)</span>';
        const start = item.startDate ? toInputDate(item.startDate) : '?';
        const end = item.endDate ? toInputDate(item.endDate) : '?';
        detailInfo = `<small class="text-muted">Hiệu lực: ${start} <i class="fas fa-arrow-right"></i> ${end}</small>`;

        if (!isGroupMode) {
          const safeName = (item.name || '').replace(/'/g, "\\'");
          const pct = item.percentage || item.percentageChange;
          actionButtons = `
                <button class="btn btn-sm btn-warning" title="Sửa" 
                    onclick="openEditHotelPolicyModal(${item.id}, '${safeName}', ${pct}, '${item.startDate}', '${item.endDate}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" title="Xóa" 
                    onclick="deleteHotelPolicy(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>`;
        } else {
          actionButtons = '<small class="text-muted">Quản lý tại bảng Policy</small>';
        }
      } else {
        typeBadge = '<span class="badge badge-warning">Thay đổi giá gốc</span>';
        if (item.oldPrice != null && item.newPrice != null) {
          detailInfo = `<small class="text-muted">${formatCurrency(item.oldPrice)} <i class="fas fa-arrow-right"></i> <b>${formatCurrency(item.newPrice)}</b></small>`;
        } else if (item.description) {
          detailInfo = `<small class="text-muted">${item.description}</small>`;
        }
        actionButtons = '<span class="text-muted">-</span>';
      }

      const percent = item.percentage || item.percentageChange || 0;
      let percentBadge = percent > 0 ? `<span class="badge badge-success">+${percent}%</span>` : (percent < 0 ? `<span class="badge badge-danger">${percent}%</span>` : `<span class="badge badge-secondary">0%</span>`);
      const dateDisplay = item.createdAt ? formatDate(item.createdAt).replace('T', ' ') : '';

      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${dateDisplay}</td><td>${typeBadge}</td><td class="text-center">${percentBadge}</td><td><div style="font-weight:600;">${item.name || item.actionType || 'Không có tên'}</div>${detailInfo}</td><td class="text-center">${actionButtons}</td>`;
      tbody.appendChild(tr);
    });
  }

  window.deleteHotelPolicy = function(policyId) {
    if (!confirm("Bạn có chắc chắn muốn xóa chính sách này? Giá sẽ quay về ban đầu.")) return;
    fetch(`${API_ADMIN}/policies/${policyId}`, { method: 'DELETE' })
        .then(async res => {
          if (res.ok) {
            showToast("Đã xóa chính sách thành công!");
            if (currentHistoryHotelId) window.openHotelHistoryModal(currentHistoryHotelId);
            fetchHotels();
          } else {
            const text = await res.text();
            showToast("Lỗi: " + text, "error");
          }
        });
  };

  window.openEditHotelPolicyModal = function(id, name, percentage, startDate, endDate) {
    currentEditingHotelPolicyId = id;
    const nameInput = document.getElementById('editPolicyName');
    const percentInput = document.getElementById('editPolicyPercent');
    const startInput = document.getElementById('editPolicyStart');
    const endInput = document.getElementById('editPolicyEnd');
    const modal = document.getElementById('editPolicyModal');

    if(nameInput) nameInput.value = name;
    if(percentInput) percentInput.value = percentage;
    if(startInput) startInput.value = toInputDate(startDate);
    if(endInput) endInput.value = toInputDate(endDate);

    if(modal) {
      modal.style.display = 'flex';
    }
  };

  window.submitUpdateHotelPolicy = function() {
    if (!currentEditingHotelPolicyId) return;
    const name = document.getElementById('editPolicyName').value;
    const percentage = document.getElementById('editPolicyPercent').value;
    const startDate = document.getElementById('editPolicyStart').value;
    const endDate = document.getElementById('editPolicyEnd').value;

    if(!name || !startDate || !endDate || percentage === "") return showToast("Nhập thiếu thông tin", "warning");

    const bodyData = {
      policyName: name,
      percentage: parseFloat(percentage),
      startDate: startDate,
      endDate: endDate
    };

    fetch(`${API_ADMIN}/policies/${currentEditingHotelPolicyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyData)
    })
        .then(async res => {
          if (res.ok) {
            showToast("Cập nhật thành công!");
            closeModal('editPolicyModal');
            if (currentHistoryHotelId) {
              window.openHotelHistoryModal(currentHistoryHotelId);
            }
            fetchHotels();
          } else {
            const data = await res.json();
            showToast(data.message || "Lỗi cập nhật", "error");
          }
        });
  };

  // ================================================================
  // 6. INITIALIZATION
  // ================================================================

  function renderPagination(elemId, totalPages, currPage, cb) {
    const container = document.getElementById(elemId);
    if (!container) return;
    container.innerHTML = '';
    if (totalPages <= 1) return;
    for (let i = 0; i < totalPages; i++) {
      const btn = document.createElement('button');
      btn.innerText = i + 1;
      if (i === currPage) btn.classList.add('active');
      btn.onclick = () => cb(i);
      container.appendChild(btn);
    }
  }

  function startRealtimeClock() {
    const dateEl = document.getElementById('currentDate');
    const timeEl = document.getElementById('currentTime');
    if (!dateEl || !timeEl) return;
    setInterval(() => {
      const now = new Date();
      dateEl.innerText = now.toLocaleDateString('en-GB');
      timeEl.innerText = now.toLocaleTimeString('vi-VN', {hour12: false});
    }, 1000);
  }

  function setupUserDropdown() {
    const userIcon = document.getElementById('user-icon');
    const userMenu = document.getElementById('user-menu');
    if (userIcon && userMenu) {
      userIcon.addEventListener('click', (e) => { e.stopPropagation(); userMenu.classList.toggle('active'); });
      document.addEventListener('click', (e) => { if (!userMenu.contains(e.target) && e.target !== userIcon) userMenu.classList.remove('active'); });
    }
    const logoutBtn = document.querySelector('a[href="/user"]');
    if (logoutBtn) logoutBtn.addEventListener('click', (e) => { if (!confirm('Đăng xuất?')) e.preventDefault(); });
  }

  document.addEventListener('DOMContentLoaded', () => {
    fetchHotels();
    fetchGroups();
    startRealtimeClock();
    setupUserDropdown();

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      let timeout = null;
      searchInput.addEventListener('keyup', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => window.triggerSearch(e.target.value), 300);
      });
    }
  });

})();