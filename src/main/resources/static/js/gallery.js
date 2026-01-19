'use strict';

(function () {
  if (!document.body || !document.body.classList.contains('hust-gallery-page')) return;

  const PLACES = {
    tokyo: {
      name: 'Tokyo',
      subtitle: 'Nơi những đường chân trời rực rỡ đèn neon và những ngôi đền hàng thế kỷ cùng tồn tại—nhanh, đậm đà bản sắc và luôn đầy ắp bất ngờ.',
      image: '/images/tokyo.jpg',
      bestTime: 'Tháng 3–5 (mùa hoa anh đào) và tháng 10–11 (mùa lá đỏ mùa thu).',
      highlights: [
        'Đền Senso-ji & phố Asakusa: đèn lồng, đồ ăn đường phố, không gian truyền thống',
        'Giao lộ Shibuya & Harajuku: văn hóa giới trẻ, thời trang, năng lượng đô thị mang tính biểu tượng',
        'Chợ ngoài Tsukiji: sushi tươi, xiên bò wagyu, tráng miệng matcha',
        'TeamLab / bảo tàng hiện đại: nghệ thuật nhập vai, các tác phẩm sắp đặt tương lai',
        'Cảnh đêm từ Tháp Tokyo / Skytree: ánh đèn thành phố trải dài vô tận'
      ],
      tips: [
        'Mua thẻ IC (Suica/Pasmo) để chạm và đi trên các chuyến tàu và xe buýt.',
        'Ăn như người bản địa: quán nhỏ, quầy ramen và depachika (khu ẩm thực tầng hầm).',
        'Lên kế hoạch theo khu vực: Tokyo rất rộng—gom các điểm gần nhau để tránh lãng phí thời gian.',
        'Mang theo tiền mặt: nhiều quán nhỏ vẫn thích tiền mặt hơn, dù thẻ đang dần phổ biến.'
      ],
      photoSpots: [
        'Các điểm ngắm cảnh đường chân trời Shinjuku',
        'Cổng Torii đền Meiji Jingu & lối đi trong rừng',
        'Bến cảng Odaiba lúc hoàng hôn',
        'Góc chụp chùa 5 tầng Asakusa'
      ],
      itinerary: {
        day1: ['Sáng: Asakusa & Đền Senso-ji', 'Chiều: Công viên Ueno / bảo tàng', 'Tối: Ánh đèn Akihabara & khu vui chơi'],
        day2: ['Sáng: Meiji Jingu + Harajuku', 'Chiều: Shibuya + mua sắm', 'Tối: Cảnh đêm Shinjuku + ngõ nhậu izakaya']
      }
    },

    saturnia: {
      name: 'Saturnia (Tuscany)',
      subtitle: 'Những thác nước nóng, không khí đồng quê và những buổi chiều Ý chậm rãi—đây là Tuscany ở thời điểm diệu kỳ nhất.',
      image: '/images/Saturnia-ý.jpg',
      bestTime: 'Tháng 4–6 hoặc tháng 9–10 để có thời tiết dễ chịu và ít đám đông hơn.',
      highlights: [
        'Cascate del Mulino: thác nước nóng tự nhiên với các hồ nước xanh màu sữa',
        'Lái xe vùng quê Tuscany: đồi thoai thoải, đường hàng cây bách, cánh đồng hoàng hôn vàng rực',
        'Các quán Trattoria địa phương: mì ống mộc mạc, dầu ô liu, phô mai pecorino và rượu vang',
        'Các ngôi làng trung cổ lân cận: Pitigliano, Sovana, Sorano với đường đá và tầm nhìn đẹp',
        'Thư giãn Spa: ngâm mình trong suối khoáng + chăm sóc sức khỏe để tái tạo năng lượng'
      ],
      tips: [
        'Mang giày đi nước: đá tại các thác nước có thể rất trơn.',
        'Đi sáng sớm hoặc chiều muộn để tránh giờ cao điểm đông đúc.',
        'Mang theo khăn + áo choàng: cơ sở vật chất ở các khu tự nhiên rất tối giản.',
        'Tôn trọng thiên nhiên: giữ vệ sinh chung và tránh mở nhạc to.'
      ],
      photoSpots: [
        'Đỉnh thác để chụp các tầng hồ nước',
        'Toàn cảnh vùng quê vào giờ vàng',
        'Góc nhìn từ làng đá lúc chập tối'
      ],
      itinerary: {
        day1: ['Sáng: Ngâm mình tại Cascate del Mulino', 'Chiều: Ăn trưa tại làng Saturnia', 'Tối: Dừng chân chụp ảnh hoàng hôn vùng quê'],
        day2: ['Sáng: Khám phá Pitigliano', 'Chiều: Thử rượu vang/dầu ô liu', 'Tối: Ngâm mình lần 2 (vắng vẻ hơn!)']
      }
    },

    mumbai: {
      name: 'Mumbai',
      subtitle: 'Thành phố không bao giờ thì thầm—những khu chợ, đường dạo bộ ven biển và năng lượng điện ảnh ở khắp mọi nơi.',
      image: '/images/p-1.jpg',
      bestTime: 'Tháng 11–2 để có thời tiết mát mẻ và bầu trời trong xanh hơn.',
      highlights: [
        'Cổng Ấn Độ & Colaba: di tích biểu tượng + văn hóa cà phê',
        'Marine Drive: "Chiếc vòng cổ của Nữ hoàng" về đêm với gió biển',
        'Phiêu lưu ẩm thực đường phố: vada pav, pav bhaji, bhel puri, trà chai',
        'Dạo bộ nghệ thuật & di sản: kiến trúc thuộc địa, bảo tàng, phòng tranh',
        'Không khí Bollywood: thành phố được xây dựng trên những câu chuyện và tham vọng'
      ],
      tips: [
        'Giao thông rất kinh khủng: hãy trừ hao thời gian và sử dụng tàu địa phương/xe công nghệ thông minh.',
        'Uống nước đóng chai; cẩn thận với đồ ăn cay nếu bạn không quen.',
        'Mang theo tiền lẻ cho chợ và đồ ăn vặt.',
        'Hoàng hôn đẹp nhất: Marine Drive / Bandra Bandstand.'
      ],
      photoSpots: [
        'Cổng Ấn Độ lúc bình minh',
        'Phơi sáng dài tại Marine Drive',
        'Cầu vượt biển Bandra-Worli lúc chạng vạng'
      ],
      itinerary: {
        day1: ['Sáng: Cổng Ấn Độ + Dạo quanh Colaba', 'Chiều: Bảo tàng / khu di sản', 'Tối: Hoàng hôn Marine Drive & ăn vặt'],
        day2: ['Sáng: Đi chợ + món ăn địa phương', 'Chiều: Các quán cà phê Bandra & nghệ thuật đường phố', 'Tối: Ngắm cảnh cầu vượt biển + tráng miệng']
      }
    },

    hamnoy: {
      name: 'Hamnøy (Lofoten)',
      subtitle: 'Những cabin đỏ, đỉnh núi Bắc Cực và làn nước trong vắt như gương—Hamnøy là chất liệu bưu thiếp thuần khiết của Na Uy.',
      image: '/images/Hamnoy-nauy.jpg',
      bestTime: 'Tháng 2–3 để săn cực quang; Tháng 6–8 để ngắm mặt trời lúc nửa đêm và leo núi.',
      highlights: [
        'Những cabin rorbuer đỏ cổ điển bên vịnh hẹp và núi non',
        'Những chuyến leo núi hùng vĩ với tầm nhìn toàn cảnh (tùy thời tiết)',
        'Săn Bắc cực quang vào những đêm mùa đông trời quang',
        'Hải sản và không khí làng chài ấm cúng',
        'Thiên đường nhiếp ảnh: bầu trời kịch tính, sự phản chiếu và không khí trong lành'
      ],
      tips: [
        'Thời tiết thay đổi nhanh: mặc nhiều lớp và mang theo áo khoác chống nước.',
        'Thuê xe tự lái để linh hoạt; giao thông công cộng hạn chế ở các vùng xa.',
        'Vào mùa đông, lái xe cẩn thận—đường có thể đóng băng và nhiều gió.',
        'Chụp ảnh: bình minh/hoàng hôn đẹp siêu thực ngay cả vào mùa hè (giờ vàng kéo dài).'
      ],
      photoSpots: [
        'Điểm ngắm cảnh trên cầu Hamnøy',
        'Toàn cảnh làng Reine gần đó',
        'Sự phản chiếu của vịnh hẹp sau cơn mưa'
      ],
      itinerary: {
        day1: ['Sáng: Các điểm ngắm cảnh Hamnøy', 'Chiều: Làng Reine', 'Tối: Săn cực quang / ăn tối ấm cúng tại cabin'],
        day2: ['Sáng: Leo núi ngắn (kiểm tra thời tiết)', 'Chiều: Dừng chân ăn hải sản', 'Tối: Buổi chụp ảnh hoàng hôn']
      }
    },

    mauritius: {
      name: 'Mauritius',
      subtitle: 'Những đầm phá xanh ngọc, bãi biển êm đềm và văn hóa đảo—hoàn hảo cho du lịch chậm và niềm hạnh phúc giản đơn.',
      image: '/images/Mauri.jpg',
      bestTime: 'Tháng 5–12 cho thời tiết khô ráo; tránh bão vào tháng 1–3.',
      highlights: [
        'Bãi biển đầm phá: nước trong, lặn ống thở và cát mịn',
        'Chamarel: vùng đất 7 màu và các điểm ngắm cảnh',
        'Nhảy đảo: các đảo nhỏ lân cận và rạn san hô',
        'Ẩm thực địa phương: hương vị Creole, hải sản, trái cây nhiệt đới',
        'Du thuyền hoàng hôn: đường chân trời vàng rực và gió biển'
      ],
      tips: [
        'Sử dụng kem chống nắng an toàn cho rạn san hô để bảo vệ sinh vật biển.',
        'Đặt tour lặn/thuyền vào buổi sáng để biển êm hơn.',
        'Thử các chợ ẩm thực đường phố để nếm hương vị đích thực.',
        'Mang theo áo khoác mỏng: buổi tối có thể hơi se lạnh ở bờ biển.'
      ],
      photoSpots: [
        'Góc nhìn đầm phá từ trên cao',
        'Hoàng hôn ở bờ biển phía tây',
        'Các điểm ngắm cảnh Chamarel'
      ],
      itinerary: {
        day1: ['Sáng: Biển + lặn ống thở', 'Chiều: Ăn trưa tại chợ địa phương', 'Tối: Du thuyền ngắm hoàng hôn'],
        day2: ['Sáng: Vòng quanh ngắm cảnh Chamarel', 'Chiều: Dừng chân tại thác nước', 'Tối: Ăn tối hải sản bên bờ biển']
      }
    },

    cappadocia: {
      name: 'Cappadocia',
      subtitle: 'Những ống khói cổ tích, khách sạn hang động và khinh khí cầu lúc bình minh—đây là một trong những cảnh quan mơ mộng nhất thế giới.',
      image: '/images/dia-diem-tho-nhi-ky.jpg',
      bestTime: 'Tháng 4–6 và tháng 9–10 để có thời tiết dễ chịu và cơ hội bay khinh khí cầu cao nhất.',
      highlights: [
        'Khinh khí cầu lúc bình minh (tùy thuộc thời tiết)',
        'Khách sạn hang động: nơi lưu trú độc đáo được đục vào đá',
        'Bảo tàng ngoài trời Göreme: nhà thờ trong đá và các bức bích họa',
        'Thành phố ngầm: kiến trúc ẩn giấu cổ xưa',
        'Leo núi thung lũng: những hình thù siêu thực và tầm nhìn bao la'
      ],
      tips: [
        'Chuyến bay khinh khí cầu phụ thuộc vào gió: hãy giữ lịch trình buổi sáng linh hoạt.',
        'Mặc nhiều lớp: buổi sáng có thể rất lạnh ngay cả khi buổi chiều ấm áp.',
        'Giày tốt = bắt buộc cho những con đường bụi bặm và đường mòn đá.',
        'Đặt trước các khách sạn hang động nổi tiếng nếu đi vào mùa cao điểm.'
      ],
      photoSpots: [
        'Điểm ngắm bình minh trên Göreme',
        'Hoàng hôn tại Thung lũng Tình Yêu / Thung lũng Hoa Hồng',
        'Sân thượng khách sạn hang động với nền là khinh khí cầu'
      ],
      itinerary: {
        day1: ['Sáng: Khinh khí cầu / điểm ngắm bình minh', 'Chiều: Bảo tàng Göreme', 'Tối: Leo núi ngắm hoàng hôn thung lũng'],
        day2: ['Sáng: Thành phố ngầm', 'Chiều: Thăm làng gốm sứ', 'Tối: Bữa tối Thổ Nhĩ Kỳ + trà với view đẹp']
      }
    },

    hallstatt: {
      name: 'Hallstatt',
      subtitle: 'Một ngôi làng nhỏ bên hồ với vẻ đẹp như truyện cổ tích—những ngọn núi, sự phản chiếu và những con ngõ yên tĩnh.',
      image: '/images/Hallstatt.jpg',
      bestTime: 'Tháng 5–6 và tháng 9 để ít đám đông hơn và nhiệt độ dễ chịu.',
      highlights: [
        'Điểm ngắm cảnh hồ: góc bưu thiếp mang tính biểu tượng của ngôi làng',
        'Mỏ muối: lịch sử + chuyến đi đường ray leo núi ngắm cảnh',
        'Dạo bộ ven hồ: yên bình, chậm rãi và ăn ảnh',
        'Nền núi hùng vĩ: cảnh quan kịch tính từ mọi góc độ',
        'Dễ dàng đi trong ngày: kết hợp tốt với các thị trấn Áo lân cận'
      ],
      tips: [
        'Đến sớm: giữa trưa sẽ rất đông khách du lịch.',
        'Tôn trọng cư dân: giữ trật tự tại các con phố hẹp.',
        'Mang áo khoác mỏng: thời tiết ven hồ có thể thay đổi nhanh chóng.',
        'Thử bánh ngọt địa phương và đồ uống ấm bên hồ.'
      ],
      photoSpots: [
        'Nền tảng ngắm cảnh ven hồ cổ điển',
        'Cầu đi bộ trên không tại mỏ muối',
        'Sự phản chiếu bình minh trên mặt hồ'
      ],
      itinerary: {
        day1: ['Sáng: Điểm ngắm cảnh + dạo quanh làng', 'Chiều: Thăm mỏ muối', 'Tối: Đi dạo hoàng hôn ven hồ'],
        day2: ['Sáng: Tuyến đường chụp ảnh yên tĩnh', 'Chiều: Cà phê + mua quà lưu niệm', 'Tối: Thư giãn và tận hưởng phong cảnh']
      }
    },

    pisa: {
      name: 'Pisa',
      subtitle: 'Hơn cả một tháp nghiêng—Pisa là lịch sử, quảng trường và kiến trúc Ý vượt thời gian.',
      image: '/images/thap-nghieng-Pisa.png',
      bestTime: 'Tháng 4–6 và tháng 9–10 để có thời tiết ôn hòa và tham quan dễ dàng hơn.',
      highlights: [
        'Tháp Nghiêng: biểu tượng mà mọi người đều đến để chiêm ngưỡng',
        'Quảng trường Piazza dei Miracoli: nhà thờ + nhà rửa tội + bãi cỏ lớn',
        'Dạo bộ ven sông Arno: quang cảnh yên bình và cuộc sống địa phương',
        'Phố cổ và quán cà phê: những niềm vui giản dị và nét quyến rũ kiểu Ý',
        'Chuyến đi trong ngày dễ dàng: kết hợp tốt với lịch trình Florence/Lucca'
      ],
      tips: [
        'Đặt khung giờ lên tháp trước vào mùa cao điểm.',
        'Đi sáng sớm để ít người hơn và ảnh chụp sạch sẽ hơn.',
        'Đi bộ xa một chút khỏi quảng trường chính để có đồ ăn ngon và rẻ hơn.',
        'Giữ lịch trình linh hoạt nếu kết hợp với các thành phố lân cận.'
      ],
      photoSpots: [
        'Góc rộng từ bãi cỏ',
        'Các góc đối xứng của nhà thờ',
        'Sự phản chiếu giờ vàng trên sông Arno'
      ],
      itinerary: {
        day1: ['Sáng: Tham quan toàn bộ Piazza dei Miracoli', 'Chiều: Dạo ven sông + ăn trưa', 'Tối: Cà phê thư giãn ở phố cổ'],
        day2: ['Sáng: Chuyến đi trong ngày đến thị trấn gần đó', 'Chiều: Mua sắm/quà lưu niệm', 'Tối: Đi dạo và chụp ảnh hoàng hôn']
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
      <h3>Tổng Quan</h3>
      <p>
        ${safe(place.name)} không chỉ là một điểm đến—đó là một cảm xúc trọn vẹn. Nếu bạn yêu những nơi
        mang cảm giác điện ảnh, đa tầng và sống động từng chi tiết, nơi này sẽ chinh phục bạn ngay từ phút đầu tiên.
      </p>
      <p>
        Cách tốt nhất để trải nghiệm là sống chậm lại: đi bộ nhiều hơn dự định, dừng chân thưởng thức những món ăn vặt địa phương,
        và để những ngã rẽ "không định trước" xảy ra.
      </p>
      <p>
        Dưới đây là thông tin chi tiết thực tế để bạn có thể hình dung chuyến đi rõ ràng trước khi đặt vé.
        Hãy cuộn xuống cuối cùng—có một nút <b>Đặt Ngay</b> đang chờ bạn.
      </p>

      <h3>Những Điểm Nổi Bật Nhất</h3>
      <ul>${li(place.highlights)}</ul>

      <h3>Thời Điểm Tốt Nhất Để Ghé Thăm</h3>
      <p><b>Gợi ý:</b> ${safe(place.bestTime)}</p>

      <h3>Lịch Trình Gợi Ý 2 Ngày (dễ thực hiện)</h3>
      <p><b>Ngày 1</b></p>
      <ul>${li(itinerary.day1)}</ul>
      <p><b>Ngày 2</b></p>
      <ul>${li(itinerary.day2)}</ul>

      <h3>Mẹo Thực Tế</h3>
      <ul>${li(place.tips)}</ul>

      <h3>Góc Chụp Ảnh Đẹp Nhất</h3>
      <ul>${li(place.photoSpots)}</ul>

      <h3>Tại sao nơi này đáng để đặt vé?</h3>
      <p>
        Nếu bạn đã sẵn sàng, hãy cuộn thêm một chút và nhấn nút <b>Đặt Ngay</b>.
      </p>
    `;
  }
})();