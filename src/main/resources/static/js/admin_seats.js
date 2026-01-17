'use strict';

(function () {
  if (!document.body || !document.body.classList.contains('hust-admin-seats')) return;

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

  // ===== LOAD FLIGHTS =====
  function loadFlights() {
    fetch('/flight/getAll')
      .then(response => response.json())
      .then(data => {
        if (data.code === 1000 && data.data) {
          populateFlightSelect(data.data);
        }
      })
      .catch(error => console.error('Error loading flights:', error));
  }

  function populateFlightSelect(flights) {
    const select = document.getElementById('flightSelect');
    if (!select) return;

    select.innerHTML = '<option value="">-- Select a flight --</option>';

    flights.forEach(flight => {
      const option = document.createElement('option');
      option.value = flight.id;
      option.textContent = `Flight #${flight.id} - ${flight.airlineName} (${flight.ticketClass})`;
      option.dataset.flight = JSON.stringify(flight);
      select.appendChild(option);
    });
  }

  // ===== INITIALIZE SEATS =====
  window.initializeSeats = function() {
    const select = document.getElementById('flightSelect');
    const flightId = select.value;

    if (!flightId) {
      alert('Please select a flight first');
      return;
    }

    const selectedOption = select.options[select.selectedIndex];
    const flight = JSON.parse(selectedOption.dataset.flight);
    const numberOfSeats = flight.numberOfChairs;

    if (confirm(`Initialize ${numberOfSeats} seats for this flight?`)) {
      fetch(`/flight-seats/initialize/${flightId}?numberOfSeats=${numberOfSeats}`, {
        method: 'POST'
      })
      .then(response => response.json())
      .then(data => {
        if (data.code === 1000) {
          alert('Seats initialized successfully');
          loadSeats(flightId);
        } else {
          alert('Error: ' + data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Failed to initialize seats');
      });
    }
  };

  // ===== LOAD SEATS =====
  function loadSeats(flightId) {
    const select = document.getElementById('flightSelect');
    const selectedOption = select.options[select.selectedIndex];
    const flight = JSON.parse(selectedOption.dataset.flight);

    fetch(`/flight-seats/all/${flightId}`)
      .then(response => response.json())
      .then(data => {
        if (data.code === 1000) {
          displayFlightInfo(flight);
          displaySeatMap(data.data);
        }
      })
      .catch(error => console.error('Error loading seats:', error));
  }

  function displayFlightInfo(flight) {
    const seatInfo = document.getElementById('seatInfo');
    const flightDetails = document.getElementById('flightDetails');

    if (!seatInfo || !flightDetails) return;

    seatInfo.style.display = 'flex';

    flightDetails.innerHTML = `
      <p><strong>Airline:</strong> ${flight.airlineName}</p>
      <p><strong>Class:</strong> ${flight.ticketClass}</p>
      <p><strong>Price:</strong> $${flight.price}</p>
      <p><strong>Total Seats:</strong> ${flight.numberOfChairs}</p>
      <p><strong>Available:</strong> ${flight.seatAvailable}</p>
    `;
  }

  function displaySeatMap(seats) {
    const seatMap = document.getElementById('seatMap');
    if (!seatMap) return;

    seatMap.innerHTML = '';

    if (!seats || seats.length === 0) {
      seatMap.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No seats found. Click "Initialize Seats" to create them.</p>';
      return;
    }

    seats.forEach(seat => {
      const seatDiv = document.createElement('div');

      // --- SỬA LOGIC TẠI ĐÂY ---
      // Ghế được tính là đã đặt nếu: isBooked = true HOẶC có thông tin đơn hàng (seat.order khác null)
      const isBooked = (seat.isBooked === true) || (seat.order && seat.order !== null);

      // Gán class dựa trên logic mới
      seatDiv.className = `seat ${isBooked ? 'booked' : 'available'}`;
      seatDiv.textContent = seat.seatNumber;

      if (isBooked) {
        // Lấy ID đơn hàng an toàn hơn
        const orderId = seat.order ? seat.order.id : 'N/A';
        seatDiv.title = `Booked by Order #${orderId}`;
      } else {
        seatDiv.title = 'Available';
      }

      seatMap.appendChild(seatDiv);
    });
  }

  // ===== FLIGHT SELECT CHANGE =====
  document.getElementById('flightSelect')?.addEventListener('change', function() {
    const flightId = this.value;
    if (flightId) {
      loadSeats(flightId);
    } else {
      document.getElementById('seatInfo').style.display = 'none';
      document.getElementById('seatMap').innerHTML = '';
    }
  });

  // ===== INITIALIZE =====
  loadFlights();
})();
