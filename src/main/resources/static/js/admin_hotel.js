'use strict';

(function () {
  // Guard để không ảnh hưởng trang khác
  if (!document.body || !document.body.classList.contains('hust-admin-hotel')) return;

  // ===== TIME =====
  function updateTime() {
    const now = new Date();
    const dateEl = document.getElementById('currentDate');
    const timeEl = document.getElementById('currentTime');
    if (dateEl) dateEl.innerText = now.toLocaleDateString();
    if (timeEl) timeEl.innerText = now.toLocaleTimeString();
  }
  setInterval(updateTime, 1000);
  updateTime();

  // ===== USER MENU =====
  const userIcon = document.getElementById('user-icon');
  const userMenu = document.getElementById('user-menu');

  if (userIcon && userMenu) {
    userIcon.addEventListener('click', function (event) {
      event.preventDefault();
      userMenu.style.display = (userMenu.style.display === 'flex') ? 'none' : 'flex';
    });

    document.addEventListener('click', function (event) {
      if (!userIcon.contains(event.target) && !userMenu.contains(event.target)) {
        userMenu.style.display = 'none';
      }
    });
  }

  // ===== STATE =====
  let allHotels = [];
  let currentPage = 0;
  const pageSize = 5;

  // ===== MODAL =====
  function openAddModal() {
    const modalTitle = document.getElementById('modalTitle');
    const saveBtn = document.getElementById('saveHotelBtn');

    if (modalTitle) modalTitle.innerText = 'Add Hotel';
    if (document.getElementById('hotelId')) document.getElementById('hotelId').value = '';

    if (document.getElementById('hotelName')) document.getElementById('hotelName').value = '';
    if (document.getElementById('priceFrom')) document.getElementById('priceFrom').value = '';
    if (document.getElementById('address')) document.getElementById('address').value = '';
    if (document.getElementById('numberFloor')) document.getElementById('numberFloor').value = '';

    if (saveBtn) saveBtn.onclick = createHotel;

    const modal = document.getElementById('hotelModal');
    if (modal) modal.style.display = 'flex';
  }

  function openEditModal(hotelId) {
    const hotel = allHotels.find(h => h.id === hotelId);
    if (!hotel) return;

    const modalTitle = document.getElementById('modalTitle');
    const saveBtn = document.getElementById('saveHotelBtn');

    if (modalTitle) modalTitle.innerText = 'Update Hotel';

    document.getElementById('hotelId').value = hotel.id;
    document.getElementById('hotelName').value = hotel.hotelName ?? '';
    document.getElementById('priceFrom').value = hotel.hotelPriceFrom ?? '';
    document.getElementById('address').value = hotel.address ?? '';
    document.getElementById('numberFloor').value = hotel.numberFloor ?? '';

    if (saveBtn) saveBtn.onclick = updateHotel;

    const modal = document.getElementById('hotelModal');
    if (modal) modal.style.display = 'flex';
  }

  function closeModal() {
    const modal = document.getElementById('hotelModal');
    if (modal) modal.style.display = 'none';
  }

  // Export global cho HTML onclick
  window.openAddModal = openAddModal;
  window.openEditModal = openEditModal;
  window.closeModal = closeModal;

  // Không ghi đè window.onclick
  window.addEventListener('click', function (event) {
    if (event.target && event.target.classList && event.target.classList.contains('modal')) {
      event.target.style.display = 'none';
    }
  });

  // ===== UI HELPERS =====
  function showNoRow(message) {
    const tbody = document.getElementById('hotelTableBody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:18px;">${message}</td></tr>`;
  }

  function renderHotelTable(hotels) {
    const tbody = document.getElementById('hotelTableBody');
    if (!tbody) return;

    if (!Array.isArray(hotels) || hotels.length === 0) {
      showNoRow('No hotels found');
      return;
    }

    tbody.innerHTML = '';
    hotels.forEach(hotel => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${hotel.id}</td>
        <td>${hotel.hotelName ?? ''}</td>
        <td>${hotel.hotelPriceFrom ?? ''}</td>
        <td>${hotel.address ?? ''}</td>
        <td>${hotel.numberFloor ?? ''}</td>
        <td>
          <button class="btn btn-edit" onclick="openEditModal(${hotel.id})">Edit</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderPagination(totalPages) {
    const container = document.getElementById('pagination');
    if (!container) return;

    container.innerHTML = '';

    let pages = Number(totalPages ?? 0);
    if (!pages || pages < 1) pages = 1;

    if (currentPage > pages - 1) currentPage = pages - 1;
    if (currentPage < 0) currentPage = 0;

    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = currentPage === 0;
    prevBtn.onclick = function () {
      if (currentPage > 0) {
        currentPage--;
        renderCurrentPage();
      }
    };
    container.appendChild(prevBtn);

    for (let i = 0; i < pages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i + 1;
      btn.classList.toggle('active', i === currentPage);
      btn.onclick = function () {
        currentPage = i;
        renderCurrentPage();
      };
      container.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage >= pages - 1;
    nextBtn.onclick = function () {
      if (currentPage < pages - 1) {
        currentPage++;
        renderCurrentPage();
      }
    };
    container.appendChild(nextBtn);
  }

  function renderCurrentPage() {
    const start = currentPage * pageSize;
    const end = start + pageSize;
    const pageItems = allHotels.slice(start, end);

    renderHotelTable(pageItems);

    const totalPages = Math.ceil(allHotels.length / pageSize);
    renderPagination(totalPages);
  }

  // ===== API =====
  function fetchHotels() {
    fetch('/admin/getAllHotels')
      .then(res => res.json())
      .then(data => {
        if (data.code === 1000) {
          allHotels = Array.isArray(data.data) ? data.data : [];
          currentPage = 0;
          renderCurrentPage();
        } else {
          allHotels = [];
          renderCurrentPage();
        }
      })
      .catch(err => {
        console.error('Error fetching hotels:', err);
        allHotels = [];
        renderCurrentPage();
      });
  }

  function createHotel() {
    const newHotel = {
      hotelName: document.getElementById('hotelName')?.value || '',
      priceFrom: Number(document.getElementById('priceFrom')?.value || 0),
      address: document.getElementById('address')?.value || '',
      numberFloor: Number(document.getElementById('numberFloor')?.value || 0)
    };

    fetch('/admin/createHotel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHotel)
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === 1000) {
          alert('Hotel added successfully!');
          fetchHotels();
          closeModal();
        } else {
          alert('Failed to add hotel: ' + data.message);
        }
      })
      .catch(err => console.error('Error creating hotel:', err));
  }
  window.createHotel = createHotel;

  function updateHotel() {
    const id = document.getElementById('hotelId')?.value;
    if (!id) return;

    const updatedHotel = {
      hotelName: document.getElementById('hotelName')?.value || '',
      priceFrom: Number(document.getElementById('priceFrom')?.value || 0),
      address: document.getElementById('address')?.value || '',
      numberFloor: Number(document.getElementById('numberFloor')?.value || 0)
    };

    fetch(`/admin/updateHotel/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedHotel)
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === 1000) {
          alert('Hotel updated successfully!');
          fetchHotels();
          closeModal();
        } else {
          alert('Failed to update hotel: ' + data.message);
        }
      })
      .catch(err => console.error('Error updating hotel:', err));
  }
  window.updateHotel = updateHotel;

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', fetchHotels);
})();
