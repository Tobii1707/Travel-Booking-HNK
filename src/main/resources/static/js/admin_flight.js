'use strict';

(function () {
  // Guard để không ảnh hưởng trang khác
  if (!document.body || !document.body.classList.contains('hust-admin-flight')) return;

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

  // ===== MODAL (global for onclick) =====
  function openAddModal() {
    const modal = document.getElementById('addFlightModal');
    if (modal) modal.style.display = 'flex';
  }
  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
  }

  window.openAddModal = openAddModal;
  window.closeModal = closeModal;

  // Không ghi đè window.onclick -> dùng addEventListener
  window.addEventListener('click', function (event) {
    if (event.target && event.target.classList && event.target.classList.contains('modal')) {
      event.target.style.display = 'none';
    }
  });

  // ===== STATE =====
  let allFlights = [];
  let currentPage = 0;
  const pageSize = 5;

  // ===== Ticket Class mapping (UI <-> backend) =====
  function uiToApiTicketClass(uiValue) {
    // UI: ECONOMY/BUSINESS -> API: NORMAL_CLASS/BUSINESS_CLASS
    if (uiValue === 'BUSINESS') return 'BUSINESS_CLASS';
    return 'NORMAL_CLASS';
  }

  function apiToUiTicketClass(apiValue) {
    // API: NORMAL_CLASS/BUSINESS_CLASS -> UI: ECONOMY/BUSINESS
    if (apiValue === 'BUSINESS_CLASS') return 'BUSINESS';
    return 'ECONOMY';
  }

  function displayTicketClass(apiValue) {
    // hiển thị trên table
    return apiToUiTicketClass(apiValue);
  }

  // ===== UI HELPERS =====
  function showNoRow(message) {
    const tbody = document.querySelector('#flight-table tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:18px;">${message}</td></tr>`;
  }

  function renderFlightTable(flights) {
    const tableBody = document.querySelector('#flight-table tbody');
    if (!tableBody) return;

    if (!Array.isArray(flights) || flights.length === 0) {
      showNoRow('No flights found');
      return;
    }

    tableBody.innerHTML = '';
    flights.forEach(flight => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${flight.id}</td>
        <td>${displayTicketClass(flight.ticketClass)}</td>
        <td>${flight.airlineName ?? ''}</td>
        <td>${flight.price ?? ''}</td>
        <td>${flight.checkInDate ? new Date(flight.checkInDate).toLocaleDateString() : 'N/A'}</td>
        <td>${flight.checkOutDate ? new Date(flight.checkOutDate).toLocaleDateString() : 'N/A'}</td>
        <td>${flight.numberOfChairs ?? ''}</td>
        <td>${flight.seatAvailable ?? ''}</td>
        <td>
          <button class="btn btn-edit" onclick="openUpdateModal(${flight.id})">Edit</button>
          <button class="btn btn-delete" onclick="deleteFlight(${flight.id})">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  // Pagination giống admin_booking/admin_account: luôn có Prev 1 Next
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
    const pageItems = allFlights.slice(start, end);
    renderFlightTable(pageItems);

    const totalPages = Math.ceil(allFlights.length / pageSize);
    renderPagination(totalPages);
  }

  // ===== API =====
  function fetchFlights() {
    fetch('/flight/getAll')
      .then(res => res.json())
      .then(data => {
        if (data.code === 1000) {
          allFlights = Array.isArray(data.data) ? data.data : [];
          currentPage = 0;
          renderCurrentPage();
        } else {
          allFlights = [];
          renderCurrentPage();
        }
      })
      .catch(err => {
        console.error('Error fetching flights:', err);
        allFlights = [];
        renderCurrentPage();
      });
  }

  function createFlight() {
    const uiTicket = document.getElementById('ticketClass')?.value;
    const newFlight = {
      ticketClass: uiToApiTicketClass(uiTicket),
      airlineName: document.getElementById('airlineName')?.value || '',
      price: document.getElementById('price')?.value || 0,
      checkInDate: document.getElementById('checkInDate')?.value || '',
      checkOutDate: document.getElementById('checkOutDate')?.value || '',
      numberOfChairs: document.getElementById('numberOfChairs')?.value || 0
    };

    fetch('/flight/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFlight)
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === 1000) {
          alert('Flight added successfully!');
          fetchFlights();
          closeModal('addFlightModal');
        } else {
          alert('Error: ' + data.message);
        }
      })
      .catch(err => console.error('Error adding flight:', err));
  }
  window.createFlight = createFlight;

  function deleteFlight(flightId) {
    if (!confirm('Are you sure you want to delete this flight?')) return;

    fetch(`/flight/delete/${flightId}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => fetchFlights())
      .catch(err => console.error('Error deleting flight:', err));
  }
  window.deleteFlight = deleteFlight;

  function openUpdateModal(flightId) {
    const flight = allFlights.find(f => f.id === flightId);
    if (!flight) return;

    document.getElementById('updateFlightId').value = flight.id;

    // API -> UI
    document.getElementById('updateTicketClass').value = apiToUiTicketClass(flight.ticketClass);

    document.getElementById('updateAirlineName').value = flight.airlineName || '';
    document.getElementById('updatePrice').value = flight.price || 0;
    document.getElementById('updateCheckInDate').value = flight.checkInDate ? flight.checkInDate.split('T')[0] : '';
    document.getElementById('updateCheckOutDate').value = flight.checkOutDate ? flight.checkOutDate.split('T')[0] : '';
    document.getElementById('updateNumberOfChairs').value = flight.numberOfChairs || 0;

    const modal = document.getElementById('updateFlightModal');
    if (modal) modal.style.display = 'flex';
  }
  window.openUpdateModal = openUpdateModal;

  function saveUpdatedFlight() {
    const flightId = document.getElementById('updateFlightId')?.value;
    if (!flightId) return;

    const uiTicket = document.getElementById('updateTicketClass')?.value;

    const updatedFlight = {
      ticketClass: uiToApiTicketClass(uiTicket),
      airlineName: document.getElementById('updateAirlineName')?.value || '',
      price: document.getElementById('updatePrice')?.value || 0,
      checkInDate: document.getElementById('updateCheckInDate')?.value || '',
      checkOutDate: document.getElementById('updateCheckOutDate')?.value || '',
      numberOfChairs: document.getElementById('updateNumberOfChairs')?.value || 0
    };

    fetch(`/flight/update/${flightId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFlight)
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === 1000) {
          alert('Flight updated successfully!');
          fetchFlights();
          closeModal('updateFlightModal');
        } else {
          alert('Failed to update flight: ' + data.message);
        }
      })
      .catch(err => console.error('Error updating flight:', err));
  }
  window.saveUpdatedFlight = saveUpdatedFlight;

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', fetchFlights);
})();
