'use strict';

(function () {
  if (!document.body || !document.body.classList.contains('hust-admin-trip')) return;

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
      userMenu.style.display = userMenu.style.display === 'flex' ? 'none' : 'flex';
    });

    document.addEventListener('click', function (event) {
      if (!userIcon.contains(event.target) && !userMenu.contains(event.target)) {
        userMenu.style.display = 'none';
      }
    });
  }

  // ===== STATE =====
  let currentOrderId = null;
  let currentPage = 0;
  const pageSize = 5;

  let isSearchMode = false;
  let currentSearchQuery = '';

  // ===== HELPERS =====
  function formatDateTime(dateTimeString) {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString();
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  function showNoResultRow(message) {
    const tbody = document.querySelector('#bookingTable tbody');
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="11" style="text-align:center">${message}</td></tr>`;
  }

  function renderOrderTable(orders) {
    const tableBody = document.querySelector('#bookingTable tbody');
    if (!tableBody) return;

    if (!Array.isArray(orders) || orders.length === 0) {
      showNoResultRow(isSearchMode ? 'No matching orders found' : 'No orders found');
      return;
    }

    tableBody.innerHTML = '';

    orders.forEach(order => {
      const row = document.createElement('tr');

      let statusClass = '';
      let statusText = 'Unpaid';

      if (order.payment) {
        if (order.payment.status === 'PAID') { statusClass = 'status-paid'; statusText = 'Paid'; }
        else if (order.payment.status === 'VERIFYING') { statusClass = 'status-verifying'; statusText = 'Verifying'; }
        else if (order.payment.status === 'PAYMENT_FAILED') { statusClass = 'status-unpaid'; statusText = 'Failed'; }
      }

      row.innerHTML = `
        <td>${order.id}</td>
        <td>${formatDateTime(order.orderDate)}</td>
        <td>${order.user ? order.user.fullName : 'Guest'}</td>
        <td>${order.destination}</td>
        <td>${formatDate(order.checkinDate)}</td>
        <td>${formatDate(order.checkoutDate)}</td>
        <td>${order.flight ? order.flight.airlineName : 'N/A'}</td>
        <td>${order.hotel ? order.hotel.hotelName : 'N/A'}</td>
        <td>${Number(order.totalPrice || 0).toLocaleString()}</td>
        <td class="${statusClass}">${statusText}</td>
        <td>
          ${order.payment && order.payment.status === 'VERIFYING'
            ? `<button class="confirm-btn btn-verify" onclick="openPaymentModal(${order.id})">Verify</button>`
            : ''}
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  // ✅ Prev / pages / Next, luôn hiện ít nhất "Prev 1 Next"
  function renderPagination(totalPages) {
    const paginationContainer = document.getElementById('pagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

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
        fetchOrdersByMode(currentPage);
      }
    };
    paginationContainer.appendChild(prevBtn);

    for (let i = 0; i < pages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i + 1;
      btn.classList.toggle('active', i === currentPage);
      btn.onclick = function () {
        currentPage = i;
        fetchOrdersByMode(currentPage);
      };
      paginationContainer.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage >= pages - 1;
    nextBtn.onclick = function () {
      if (currentPage < pages - 1) {
        currentPage++;
        fetchOrdersByMode(currentPage);
      }
    };
    paginationContainer.appendChild(nextBtn);
  }

  // ===== FETCHERS =====
  function fetchOrders(page) {
    return fetch(`/order/getAllOrder?pageNo=${page}&pageSize=${pageSize}`)
      .then(res => res.json())
      .then(data => {
        const items = data?.data?.items ?? [];
        const totalPages = Number(data?.data?.totalPages ?? 0);

        if (data.code === 1000) {
          renderOrderTable(items);
          renderPagination(totalPages);
        } else {
          console.error('Error:', data.message);
          renderOrderTable([]);
          renderPagination(1);
        }
      })
      .catch(err => {
        console.error('Error fetching orders:', err);
        showNoResultRow('Error loading orders');
        renderPagination(1);
      });
  }

  function fetchOrdersSearch(page, query) {
    return fetch(`/order/getAllOrderWithMultipleColumnsWithSearch?pageNo=${page}&pageSize=${pageSize}&search=${encodeURIComponent(query)}&sortBy=totalPrice:asc`)
      .then(res => res.json())
      .then(data => {
        const items = data?.data?.items ?? [];
        const totalPages = Number(data?.data?.totalPages ?? 0);

        if (data.code === 1000) {
          if (!items.length) alert('No matching orders found.');
          renderOrderTable(items);
          renderPagination(totalPages);
        } else {
          alert('Search failed: ' + (data.message || 'Unknown error'));
          renderOrderTable([]);
          renderPagination(1);
        }
      })
      .catch(err => {
        console.error('Error searching:', err);
        alert('Error searching orders.');
        renderOrderTable([]);
        renderPagination(1);
      });
  }

  function fetchOrdersByMode(page) {
    if (isSearchMode && currentSearchQuery) {
      return fetchOrdersSearch(page, currentSearchQuery);
    }
    return fetchOrders(page);
  }

  // ===== SEARCH (global vì HTML gọi) =====
  function fetchOrdersWithSearch() {
    const input = document.getElementById('bookingInput');
    const q = (input ? input.value : '').trim();

    currentPage = 0;

    if (!q) {
      isSearchMode = false;
      currentSearchQuery = '';
      fetchOrdersByMode(currentPage);
      return;
    }

    isSearchMode = true;
    currentSearchQuery = q;
    fetchOrdersByMode(currentPage);
  }
  window.fetchOrdersWithSearch = fetchOrdersWithSearch;

  // ===== PAYMENT MODAL =====
  function openPaymentModal(orderId) {
    currentOrderId = orderId;
    const modal = document.getElementById('payment-modal');
    if (modal) modal.style.display = 'flex';
  }
  window.openPaymentModal = openPaymentModal;

  const closeModalBtn = document.getElementById('close-modal-btn');
  if (closeModalBtn) {
    closeModalBtn.onclick = function () {
      const modal = document.getElementById('payment-modal');
      if (modal) modal.style.display = 'none';
    };
  }

  const confirmSuccessBtn = document.getElementById('confirm-success-btn');
  if (confirmSuccessBtn) {
    confirmSuccessBtn.addEventListener('click', function () {
      if (!currentOrderId) return;

      fetch(`/order/${currentOrderId}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(res => res.json())
        .then(data => {
          if (data.code === 1000) {
            alert('Payment Confirmed Successfully!');
            return Promise.all([
              fetch(`/api/v1/email/${currentOrderId}/announce-pay-success`, { method: 'POST' }),
              new Promise(resolve => setTimeout(resolve, 500))
            ]).then(() => fetchOrdersByMode(currentPage));
          }
          alert('Confirmation Failed: ' + data.message);
        })
        .catch(() => alert('Error confirming payment.'))
        .finally(() => {
          const modal = document.getElementById('payment-modal');
          if (modal) modal.style.display = 'none';
        });
    });
  }

  const confirmFailedBtn = document.getElementById('confirm-failed-btn');
  if (confirmFailedBtn) {
    confirmFailedBtn.addEventListener('click', function () {
      if (!currentOrderId) return;

      fetch(`/order/${currentOrderId}/payment-falled`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(res => res.json())
        .then(data => {
          if (data.code === 1000) {
            alert('Payment Rejected!');
            return Promise.all([
              fetch(`/api/v1/email/${currentOrderId}/announce-pay-falled`, { method: 'POST' }),
              new Promise(resolve => setTimeout(resolve, 500))
            ]).then(() => fetchOrdersByMode(currentPage));
          }
          alert('Rejection Failed: ' + data.message);
        })
        .catch(() => alert('Error rejecting payment.'))
        .finally(() => {
          const modal = document.getElementById('payment-modal');
          if (modal) modal.style.display = 'none';
        });
    });
  }

  // ===== INIT =====
  document.addEventListener('DOMContentLoaded', function () {
    fetchOrdersByMode(currentPage);
  });
})();
