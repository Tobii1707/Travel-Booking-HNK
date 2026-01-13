'use strict';

(function () {
  if (!document.body || !document.body.classList.contains('hust-gallery-page')) return;

  const PLACES = {
    tokyo: {
      name: 'Tokyo',
      subtitle: 'A city where neon skylines and centuries-old shrines coexist—fast, flavorful, and endlessly surprising.',
      image: '/images/tokyo.jpg',
      bestTime: 'March–May (sakura) and October–November (autumn foliage).',
      highlights: [
        'Senso-ji Temple & Asakusa streets: lanterns, street snacks, traditional vibes',
        'Shibuya Crossing & Harajuku: youth culture, fashion, iconic city energy',
        'Tsukiji outer market food crawl: sushi, wagyu skewers, matcha desserts',
        'TeamLab / modern museums: immersive art, futuristic installations',
        'Night views from Tokyo Tower / Skytree: city lights that feel infinite'
      ],
      tips: [
        'Get a transit IC card (Suica/Pasmo) to tap-and-go across trains and buses.',
        'Eat like a local: small shops, ramen counters, and depachika (basement food halls).',
        'Plan neighborhoods by day: Tokyo is huge—group spots by area to avoid wasting time.',
        'Carry cash: many small places still prefer it, though cards are improving.'
      ],
      photoSpots: [
        'Shinjuku skyline viewpoints',
        'Meiji Jingu gates & forest paths',
        'Odaiba waterfront at sunset',
        'Asakusa pagoda angle shots'
      ],
      itinerary: {
        day1: ['Morning: Asakusa & Senso-ji', 'Afternoon: Ueno Park / museums', 'Evening: Akihabara lights & arcades'],
        day2: ['Morning: Meiji Jingu + Harajuku', 'Afternoon: Shibuya + shopping', 'Evening: Shinjuku night views + izakaya alley']
      }
    },

    saturnia: {
      name: 'Saturnia (Tuscany)',
      subtitle: 'Thermal cascades, countryside air, and slow Italian afternoons—this is Tuscany at its most magical.',
      image: '/images/Saturnia-ý.jpg',
      bestTime: 'April–June or September–October for pleasant weather and fewer crowds.',
      highlights: [
        'Cascate del Mulino: natural hot spring waterfalls with milky-blue pools',
        'Tuscan countryside drives: rolling hills, cypress roads, golden sunset fields',
        'Local trattorias: rustic pasta, olive oil, pecorino, and wines',
        'Nearby medieval villages: Pitigliano, Sovana, Sorano for stone streets and views',
        'Spa relaxation: thermal soaking + wellness for the ultimate reset'
      ],
      tips: [
        'Bring water shoes: the rocks can be slippery at the cascades.',
        'Go early morning or late afternoon to avoid peak crowds.',
        'Pack a towel + robe: facilities are minimal in natural areas.',
        'Respect nature: keep the place clean and avoid loud music.'
      ],
      photoSpots: [
        'Top of the cascades for layered pool shots',
        'Golden-hour countryside panoramas',
        'Stone village viewpoints at dusk'
      ],
      itinerary: {
        day1: ['Morning: Cascate del Mulino soak', 'Afternoon: lunch in Saturnia village', 'Evening: sunset countryside photo stop'],
        day2: ['Morning: Pitigliano exploration', 'Afternoon: wine/olive tasting', 'Evening: thermal soak round 2 (less crowded!)']
      }
    },

    mumbai: {
      name: 'Mumbai',
      subtitle: 'A city that never whispers—markets, oceanside promenades, and cinematic energy everywhere you look.',
      image: '/images/p-1.jpg',
      bestTime: 'November–February for cooler weather and clearer skies.',
      highlights: [
        'Gateway of India & Colaba: iconic monuments + café culture',
        'Marine Drive: the “Queen’s Necklace” at night with ocean breeze',
        'Street food adventures: vada pav, pav bhaji, bhel puri, cutting chai',
        'Art & heritage walks: colonial architecture, museums, galleries',
        'Bollywood vibes: a city built on stories and ambition'
      ],
      tips: [
        'Traffic is real: plan buffers and use local trains/ride-hailing smartly.',
        'Drink bottled water; go easy on spicy food if you’re not used to it.',
        'Carry small cash for markets and snacks.',
        'Best sunsets: Marine Drive / Bandra Bandstand.'
      ],
      photoSpots: [
        'Gateway of India at sunrise',
        'Marine Drive long exposure',
        'Bandra-Worli Sea Link at twilight'
      ],
      itinerary: {
        day1: ['Morning: Gateway + Colaba stroll', 'Afternoon: museum / heritage district', 'Evening: Marine Drive sunset & snacks'],
        day2: ['Morning: markets + local eats', 'Afternoon: Bandra cafés & street art', 'Evening: sea link viewpoints + dessert']
      }
    },

    hamnoy: {
      name: 'Hamnøy (Lofoten)',
      subtitle: 'Red cabins, Arctic peaks, and glassy waters—Hamnøy is pure Norway postcard material.',
      image: '/images/Hamnoy-nauy.jpg',
      bestTime: 'February–March for northern lights; June–August for midnight sun and hikes.',
      highlights: [
        'Classic red rorbuer cabins against fjords and mountains',
        'Epic hikes with panoramic viewpoints (weather permitting)',
        'Northern lights chasing on clear winter nights',
        'Seafood and cozy fishing-village vibes',
        'Photography heaven: dramatic skies, reflections, and clean air'
      ],
      tips: [
        'Weather changes fast: dress in layers and bring a waterproof jacket.',
        'Rent a car for flexibility; public transport is limited in remote areas.',
        'In winter, drive carefully—roads can be icy and windy.',
        'For photos: sunrise/sunset is unreal even in summer (long golden hours).'
      ],
      photoSpots: [
        'Hamnøy bridge viewpoint',
        'Nearby Reine panoramas',
        'Fjord reflections after rain'
      ],
      itinerary: {
        day1: ['Morning: Hamnøy viewpoints', 'Afternoon: Reine village', 'Evening: aurora hunt / cozy cabin dinner'],
        day2: ['Morning: short hike (weather check)', 'Afternoon: seafood stop', 'Evening: sunset photography session']
      }
    },

    mauritius: {
      name: 'Mauritius',
      subtitle: 'Turquoise lagoons, calm beaches, and island culture—perfect for slow travel and easy happiness.',
      image: '/images/Mauri.jpg',
      bestTime: 'May–December for drier weather; avoid cyclones in January–March.',
      highlights: [
        'Lagoon beaches: clear water, snorkeling, and soft sand',
        'Chamarel: colored earth and scenic viewpoints',
        'Island-hopping: nearby islets and coral reefs',
        'Local food: Creole flavors, seafood, tropical fruits',
        'Sunset cruises: golden horizons and ocean breeze'
      ],
      tips: [
        'Use reef-safe sunscreen to protect marine life.',
        'Book snorkeling/boat trips in the morning for calmer sea.',
        'Try street food markets for authentic flavors.',
        'Bring a light jacket: evenings can be breezy by the coast.'
      ],
      photoSpots: [
        'Lagoon aerial viewpoints',
        'Sunset on the west coast',
        'Chamarel viewpoints'
      ],
      itinerary: {
        day1: ['Morning: beach + snorkeling', 'Afternoon: local market lunch', 'Evening: sunset cruise'],
        day2: ['Morning: Chamarel scenic loop', 'Afternoon: waterfall stop', 'Evening: seafood dinner by the beach']
      }
    },

    cappadocia: {
      name: 'Cappadocia',
      subtitle: 'Fairy chimneys, cave hotels, and balloons at sunrise—this is one of the world’s dreamiest landscapes.',
      image: '/images/dia-diem-tho-nhi-ky.jpg',
      bestTime: 'April–June and September–October for comfortable weather and balloon chances.',
      highlights: [
        'Hot air balloons at sunrise (weather dependent)',
        'Cave hotels: unique stays carved into stone',
        'Göreme Open-Air Museum: rock-cut churches and frescoes',
        'Underground cities: ancient hidden architecture',
        'Valley hikes: surreal shapes and wide open views'
      ],
      tips: [
        'Balloon rides depend on wind: keep a flexible morning schedule.',
        'Pack layers: mornings can be cold even when afternoons are warm.',
        'Good shoes = must for dusty trails and rocky paths.',
        'Book popular cave hotels early if traveling in peak season.'
      ],
      photoSpots: [
        'Sunrise viewpoints over Göreme',
        'Love Valley / Rose Valley sunset',
        'Cave hotel terraces with balloons'
      ],
      itinerary: {
        day1: ['Morning: balloon / sunrise viewpoint', 'Afternoon: Göreme museum', 'Evening: valley sunset hike'],
        day2: ['Morning: underground city', 'Afternoon: pottery town visit', 'Evening: Turkish dinner + tea with views']
      }
    },

    hallstatt: {
      name: 'Hallstatt',
      subtitle: 'A tiny lakeside village with storybook charm—mountains, reflections, and quiet lanes.',
      image: '/images/Hallstatt.jpg',
      bestTime: 'May–June and September for fewer crowds and pleasant temperatures.',
      highlights: [
        'Lake viewpoints: iconic postcard angle of the village',
        'Salt mine: history + scenic funicular ride',
        'Lakeside walks: calm, slow, and photogenic',
        'Mountain backdrops: dramatic scenery from every corner',
        'Day trip friendly: easy to combine with nearby Austrian towns'
      ],
      tips: [
        'Arrive early: it gets crowded midday.',
        'Respect residents: keep noise low in narrow streets.',
        'Bring a light jacket: lakeside weather can flip quickly.',
        'Try local pastries and warm drinks by the lake.'
      ],
      photoSpots: [
        'Classic lakeside viewpoint platform',
        'Salt mine skywalk view',
        'Sunrise reflections on the lake'
      ],
      itinerary: {
        day1: ['Morning: viewpoint + village stroll', 'Afternoon: salt mine visit', 'Evening: lakeside sunset walk'],
        day2: ['Morning: quiet photo route', 'Afternoon: café + souvenir stop', 'Evening: relax and enjoy the scenery']
      }
    },

    pisa: {
      name: 'Pisa',
      subtitle: 'More than a leaning tower—Pisa is history, piazzas, and timeless Italian architecture.',
      image: '/images/thap-nghieng-Pisa.png',
      bestTime: 'April–June and September–October for mild weather and easier sightseeing.',
      highlights: [
        'Leaning Tower: the icon everyone comes for',
        'Piazza dei Miracoli: cathedral + baptistery + grand lawns',
        'Riverside walks along the Arno: calm views and local life',
        'Old streets and cafés: simple pleasures and Italian charm',
        'Easy day trip: pairs nicely with Florence/Lucca itineraries'
      ],
      tips: [
        'Book tower time slots in advance during peak season.',
        'Go early morning for fewer crowds and cleaner photos.',
        'Walk a bit away from the main square for cheaper, better food.',
        'Keep your schedule flexible if combining with nearby cities.'
      ],
      photoSpots: [
        'Wide shot from the lawn',
        'Cathedral symmetry angles',
        'Arno river golden-hour reflections'
      ],
      itinerary: {
        day1: ['Morning: Piazza dei Miracoli full visit', 'Afternoon: riverside stroll + lunch', 'Evening: relaxed old-town café'],
        day2: ['Morning: nearby town day trip', 'Afternoon: shopping/souvenirs', 'Evening: sunset walk and photos']
      }
    }
  };

  let modalEl, backdropEl, dialogEl, closeBtnEl, titleEl, subtitleEl, contentEl, bookBtnEl;
  let currentPlaceKey = null;

  document.addEventListener('DOMContentLoaded', function () {
    initUserMenu();
    initModal();
    bindSeeMoreButtons();
  });

  function initUserMenu() {
    const userIcon = document.getElementById('user-icon');
    const menu = document.getElementById('user-menu');
    if (!userIcon || !menu) return;

    userIcon.addEventListener('click', function (event) {
      event.preventDefault();
      menu.style.display = (menu.style.display === 'flex') ? 'none' : 'flex';
    });

    document.addEventListener('click', function (event) {
      if (!userIcon.contains(event.target) && !menu.contains(event.target)) {
        menu.style.display = 'none';
      }
    });
  }

  function initModal() {
    modalEl = document.getElementById('placeModal');
    if (!modalEl) return;

    backdropEl = modalEl.querySelector('.place-modal__backdrop');
    dialogEl = modalEl.querySelector('.place-modal__dialog');
    closeBtnEl = modalEl.querySelector('.place-modal__close');

    titleEl = document.getElementById('placeModalTitle');
    subtitleEl = document.getElementById('placeModalSubtitle');
    contentEl = document.getElementById('placeModalContent');
    bookBtnEl = document.getElementById('placeModalBookBtn');

    if (backdropEl) backdropEl.addEventListener('click', closeModal);
    if (closeBtnEl) closeBtnEl.addEventListener('click', closeModal);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modalEl.classList.contains('is-open')) {
        closeModal();
      }
    });

    if (bookBtnEl) {
      bookBtnEl.addEventListener('click', function () {
        if (!currentPlaceKey || !PLACES[currentPlaceKey]) return;
        const place = PLACES[currentPlaceKey];

        try { localStorage.setItem('prefillDestination', place.name); } catch (_) {}

        window.location.href = `booking?destination=${encodeURIComponent(place.name)}`;
      });
    }
  }

  function bindSeeMoreButtons() {
    document.querySelectorAll('.js-see-more').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const item = btn.closest('.gallery-item');
        const key = item?.getAttribute('data-place');
        if (!key || !PLACES[key]) return;
        openModal(key);
      });
    });
  }

  function openModal(placeKey) {
    const place = PLACES[placeKey];
    if (!place || !modalEl) return;

    currentPlaceKey = placeKey;

    if (titleEl) titleEl.textContent = place.name;
    if (subtitleEl) subtitleEl.textContent = place.subtitle;
    if (contentEl) contentEl.innerHTML = buildLongDetailsHtml(place);

    modalEl.classList.add('is-open');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const bodyEl = modalEl.querySelector('.place-modal__body');
    if (bodyEl) bodyEl.scrollTop = 0;

    if (closeBtnEl) closeBtnEl.focus();
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('is-open');
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    currentPlaceKey = null;
  }

  function buildLongDetailsHtml(place) {
    const safe = (s) => String(s || '');
    const li = (arr) => (arr || []).map(x => `<li>${safe(x)}</li>`).join('');
    const itinerary = place.itinerary || { day1: [], day2: [] };

    return `
      <h3>Overview</h3>
      <p>
        ${safe(place.name)} isn’t just a destination—it’s a full mood. If you love places that feel
        cinematic, layered, and alive with detail, this one delivers from the first minute.
      </p>
      <p>
        The best way to experience it is to slow down: walk more than you plan, pause for small local snacks,
        and let a few “unplanned” turns happen.
      </p>
      <p>
        Below is a practical deep-dive so you can imagine the trip clearly before you book. Scroll all the way
        down to the end—there’s a <b>Book Now</b> button waiting for you.
      </p>

      <h3>Top Highlights</h3>
      <ul>${li(place.highlights)}</ul>

      <h3>Best Time to Visit</h3>
      <p><b>Recommended:</b> ${safe(place.bestTime)}</p>

      <h3>Suggested 2-Day Plan (easy to follow)</h3>
      <p><b>Day 1</b></p>
      <ul>${li(itinerary.day1)}</ul>
      <p><b>Day 2</b></p>
      <ul>${li(itinerary.day2)}</ul>

      <h3>Practical Tips</h3>
      <ul>${li(place.tips)}</ul>

      <h3>Best Photo Spots</h3>
      <ul>${li(place.photoSpots)}</ul>

      <h3>Why this place is worth booking</h3>
      <p>
        If you’re ready, scroll a little more and hit <b>Book Now</b>.
      </p>
    `;
  }
})();
