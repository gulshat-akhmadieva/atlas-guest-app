/**
 * АТЛАС ГОСТЯ — мобильный консьерж гостя
 * Переключение вкладок и интерактив без внешних библиотек
 */

(function () {
  'use strict';

  const screens = document.querySelectorAll('.screen');
  const navItems = document.querySelectorAll('.nav-item');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalContent = document.getElementById('modal-content');
  const toast = document.getElementById('toast');
  const todayPlanList = document.getElementById('today-plan-list');

  let currentTab = 'today';
  let toastTimer = null;
  const addedPlans = new Set();

  // --- Навигация ---

  function switchTab(tabId) {
    if (tabId === currentTab) return;

    const prevScreen = document.querySelector(`.screen[data-screen="${currentTab}"]`);
    const nextScreen = document.querySelector(`.screen[data-screen="${tabId}"]`);

    if (!nextScreen) return;

    if (prevScreen) {
      prevScreen.classList.add('leaving');
      prevScreen.classList.remove('active');

      setTimeout(() => {
        prevScreen.classList.remove('leaving');
      }, 300);
    }

    nextScreen.classList.add('active');

    navItems.forEach((item) => {
      const isActive = item.dataset.tab === tabId;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-current', isActive ? 'page' : null);
    });

    currentTab = tabId;
  }

  navItems.forEach((item) => {
    item.addEventListener('click', () => switchTab(item.dataset.tab));
  });

  // --- Модальные окна ---

  function openModal(html) {
    modalContent.innerHTML = html;
    modalOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    bindModalEvents();
  }

  function closeModal() {
    modalOverlay.hidden = true;
    modalContent.innerHTML = '';
    document.body.style.overflow = '';
  }

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  function bindModalEvents() {
    const closeBtn = modalContent.querySelector('[data-close]');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    const timeSlots = modalContent.querySelectorAll('.time-slot');
    timeSlots.forEach((slot) => {
      slot.addEventListener('click', () => {
        timeSlots.forEach((s) => s.classList.remove('selected'));
        slot.classList.add('selected');
      });
    });

    const requestBtn = modalContent.querySelector('[data-request]');
    if (requestBtn) {
      requestBtn.addEventListener('click', () => {
        closeModal();
        showToast('Запрос на ужин отправлен');
      });
    }

    const transferBtn = modalContent.querySelector('[data-transfer-request]');
    if (transferBtn) {
      transferBtn.addEventListener('click', () => {
        const selected = modalContent.querySelector('.time-slot.selected');
        if (!selected) {
          showToast('Выберите время трансфера');
          return;
        }
        closeModal();
        showToast('Запрос на трансфер отправлен');
      });
    }

    const addPlanBtn = modalContent.querySelector('[data-add-plan]');
    if (addPlanBtn) {
      addPlanBtn.addEventListener('click', () => {
        const title = addPlanBtn.dataset.title || 'Маршрут';
        const duration = addPlanBtn.dataset.duration || '';
        addToTodayPlan(title, duration);
        closeModal();
        switchTab('today');
        showToast(`«${title}» добавлен в план`);
      });
    }

    const sendMessageBtn = modalContent.querySelector('[data-send-message]');
    if (sendMessageBtn) {
      sendMessageBtn.addEventListener('click', () => {
        const textarea = modalContent.querySelector('.message-textarea');
        const text = textarea ? textarea.value.trim() : '';
        if (!text) {
          showToast('Напишите сообщение для администратора');
          return;
        }
        closeModal();
        showToast('Сообщение отправлено администратору');
      });
    }

    modalContent.querySelectorAll('[data-hotel-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.hotelAction;
        switch (action) {
          case 'close':
            closeModal();
            break;
          case 'copy-wifi':
            copyText('aurea2026', 'Пароль Wi-Fi скопирован');
            break;
          case 'request-spa':
            closeModal();
            showToast('Запрос на SPA отправлен');
            break;
          case 'message':
            closeModal();
            openModal(messageModal);
            break;
          case 'request-late-checkout':
            closeModal();
            showToast('Запрос на поздний выезд отправлен');
            break;
          case 'call-reception':
            closeModal();
            window.location.href = 'tel:+74950000000';
            break;
          case 'request-menu':
            closeModal();
            break;
        }
      });
    });
  }

  function copyText(text, successMessage) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        closeModal();
        showToast(successMessage);
      }).catch(() => {
        closeModal();
        showToast(successMessage);
      });
    } else {
      closeModal();
      showToast(successMessage);
    }
  }

  // --- Добавление в план «Сегодня» ---

  function addToTodayPlan(title, duration) {
    if (addedPlans.has(title)) return;

    addedPlans.add(title);

    const item = document.createElement('li');
    item.className = 'today-item plan-added';
    item.dataset.planTitle = title;
    const durationText = duration ? ` · ${duration}` : '';
    item.innerHTML = `
      <span class="today-icon">◈</span>
      <span>${title}${durationText}</span>
    `;

    todayPlanList.appendChild(item);
    todayPlanList.hidden = false;
  }

  // --- Toast ---

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add('visible');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => { toast.hidden = true; }, 300);
    }, 2800);
  }

  // --- Консьерж: шаблоны модалок ---

  const dinnerModal = `
    <div class="modal-handle"></div>
    <h2 class="modal-title">Ужин на террасе</h2>
    <p class="modal-subtitle">Сет от шефа · выберите время</p>
    <div class="time-slots">
      <button type="button" class="time-slot">19:30</button>
      <button type="button" class="time-slot selected">20:00</button>
      <button type="button" class="time-slot">20:30</button>
    </div>
    <button type="button" class="btn btn-gold" data-request>Запросить бронь</button>
    <button type="button" class="btn btn-ghost" data-close>Отмена</button>
  `;

  const checkoutModal = `
    <div class="modal-handle"></div>
    <div class="modal-success">
      <div class="modal-success-icon">✓</div>
      <h2 class="modal-title">Запрос отправлен администратору</h2>
      <p class="modal-subtitle">Мы свяжемся с вами в ближайшее время по поводу позднего выезда</p>
    </div>
    <button type="button" class="btn btn-primary" data-close>Закрыть</button>
  `;

  const transferModal = `
    <div class="modal-handle"></div>
    <h2 class="modal-title">Трансфер</h2>
    <p class="modal-subtitle">Выберите удобное время подачи</p>
    <div class="time-slots">
      <button type="button" class="time-slot">09:00</button>
      <button type="button" class="time-slot">11:30</button>
      <button type="button" class="time-slot">14:00</button>
      <button type="button" class="time-slot">17:00</button>
    </div>
    <button type="button" class="btn btn-gold" data-transfer-request>Запросить трансфер</button>
    <button type="button" class="btn btn-ghost" data-close>Отмена</button>
  `;

  const messageModal = `
    <div class="modal-handle"></div>
    <h2 class="modal-title">Написать администратору</h2>
    <p class="modal-subtitle">Опишите ваш запрос — мы ответим в ближайшее время</p>
    <div class="message-form">
      <textarea class="message-textarea" placeholder="Например: нужен дополнительный комплект полотенец в номер"></textarea>
      <button type="button" class="btn btn-gold" data-send-message>Отправить</button>
      <button type="button" class="btn btn-ghost" data-close>Отмена</button>
    </div>
  `;

  document.querySelectorAll('[data-action]').forEach((card) => {
    card.addEventListener('click', () => {
      const action = card.dataset.action;
      switch (action) {
        case 'dinner':
          openModal(dinnerModal);
          break;
        case 'checkout':
          openModal(checkoutModal);
          showToast('Запрос на поздний выезд отправлен');
          break;
        case 'transfer':
          openModal(transferModal);
          break;
        case 'message':
          openModal(messageModal);
          break;
      }
    });
  });

  // --- Карта гостя ---

  document.getElementById('btn-show-admin').addEventListener('click', () => {
    showToast('Покажите экран администратору на ресепшене');
  });

  // --- Гид: маршруты ---

  const guideData = {
    viewpoint: {
      title: 'Видовая точка',
      duration: '15 минут',
      description: 'Короткий подъём к смотровой площадке с панорамой долины. Лучшее время — утро или закат.',
      image: 'assets/guide-viewpoint.jpg',
      routeSvg: '<path d="M30 90 Q60 70 90 50 Q110 35 130 30" stroke="#c4b08a" stroke-width="2.5" fill="none" stroke-dasharray="6 4" stroke-linecap="round"/>',
    },
    lake: {
      title: 'Прогулка к озеру',
      duration: '40 минут',
      description: 'Тихая лесная тропа ведёт к озеру. Возьмите лёгкую куртку — у воды прохладнее.',
      image: 'assets/guide-lake.jpg',
      routeSvg: '<path d="M25 85 Q50 60 70 55 T120 25" stroke="#c4b08a" stroke-width="2.5" fill="none" stroke-dasharray="6 4" stroke-linecap="round"/>',
    },
    terrace: {
      title: 'Вечерняя терраса',
      duration: 'вечер',
      description: 'Закрытая терраса с видом на закат. Коктейли и лёгкие закуски — по привилегии гостя клуба.',
      image: 'assets/guide-terrace.jpg',
      routeSvg: '<path d="M35 80 L55 65 L75 55 L105 40" stroke="#c4b08a" stroke-width="2.5" fill="none" stroke-dasharray="6 4" stroke-linecap="round"/>',
    },
  };

  function openGuideModal(id) {
    const data = guideData[id];
    if (!data) return;

    const html = `
      <div class="modal-photo photo-muted">
        <img src="${data.image}" alt="${data.title}" width="800" height="400">
      </div>
      <div class="modal-handle"></div>
      <h2 class="modal-title">${data.title}</h2>
      <p class="route-info">${data.duration}</p>
      <p class="modal-subtitle">${data.description}</p>
      <div class="route-map">
        <div class="route-line">
          <svg viewBox="0 0 150 100" preserveAspectRatio="none">
            ${data.routeSvg}
          </svg>
        </div>
        <span class="route-point start"></span>
        <span class="route-point end"></span>
      </div>
      <button type="button" class="btn btn-gold" data-add-plan data-title="${data.title}" data-duration="${data.duration}">Добавить в план</button>
      <button type="button" class="btn btn-ghost" data-close>Закрыть</button>
    `;
    openModal(html);
  }

  document.querySelectorAll('[data-guide]').forEach((card) => {
    card.addEventListener('click', () => openGuideModal(card.dataset.guide));
  });

  // --- Отель: справочная информация ---

  const hotelData = {
    wifi: {
      title: 'Wi-Fi',
      rows: [
        { label: 'Сеть', value: 'VILLA_AUREA_GUEST' },
        { label: 'Пароль', value: 'aurea2026' },
      ],
      buttons: [
        { label: 'Скопировать пароль', action: 'copy-wifi', primary: true },
      ],
    },
    breakfast: {
      title: 'Завтрак',
      text: 'Завтрак проходит с 08:00 до 11:00 на террасе и в ресторане первого этажа.',
      buttons: [
        { label: 'Понятно', action: 'close', primary: true },
      ],
    },
    spa: {
      title: 'SPA',
      text: 'SPA работает с 10:00 до 22:00. Для гостей клуба доступны ранние слоты по запросу.',
      buttons: [
        { label: 'Запросить SPA', action: 'request-spa', primary: true },
      ],
    },
    parking: {
      title: 'Парковка',
      text: 'Для гостей доступна закрытая парковка у главного входа. Сообщите номер автомобиля администратору.',
      buttons: [
        { label: 'Написать администратору', action: 'message', primary: true },
      ],
    },
    checkout: {
      title: 'Выезд',
      text: 'Стандартный выезд — до 12:00. Поздний выезд до 14:00 возможен по запросу.',
      buttons: [
        { label: 'Запросить поздний выезд', action: 'request-late-checkout', primary: true },
      ],
    },
    reception: {
      title: 'Ресепшн',
      text: 'Мы рядом 24/7.',
      buttons: [
        { label: 'Написать администратору', action: 'message', primary: true },
        { label: 'Позвонить', action: 'call-reception', ghost: true },
      ],
    },
    rules: {
      title: 'Правила',
      text: 'Тихие часы: 23:00–08:00. Курение в номерах запрещено. Домашние животные — по предварительному согласованию.',
      buttons: [
        { label: 'Понятно', action: 'close', primary: true },
      ],
    },
    roomservice: {
      title: 'Room service',
      text: 'Заказ в номер доступен с 08:00 до 23:00.',
      buttons: [
        { label: 'Запросить меню', action: 'request-menu', primary: true },
      ],
    },
  };

  function buildHotelButtons(buttons) {
    return buttons.map((btn, i) => {
      let cls = 'btn btn-primary';
      if (btn.primary) cls = 'btn btn-gold';
      if (btn.ghost) cls = 'btn btn-ghost';
      const marginTop = i === 0 ? '16px' : '8px';
      return `<button type="button" class="${cls}" data-hotel-action="${btn.action}" style="margin-top:${marginTop}">${btn.label}</button>`;
    }).join('');
  }

  function openHotelModal(id) {
    const data = hotelData[id];
    if (!data) return;

    let body = '';
    if (data.rows) {
      body = data.rows.map((row) => `
        <div class="modal-detail-row">
          <span class="modal-detail-label">${row.label}</span>
          <span class="modal-detail-value">${row.value}</span>
        </div>
      `).join('');
    }
    if (data.text) {
      body += `<p class="modal-detail-text">${data.text}</p>`;
    }

    const buttons = data.buttons ? buildHotelButtons(data.buttons) : '<button type="button" class="btn btn-primary" data-close style="margin-top:16px">Закрыть</button>';

    const html = `
      <div class="modal-handle"></div>
      <h2 class="modal-title">${data.title}</h2>
      ${body}
      ${buttons}
    `;
    openModal(html);
  }

  document.querySelectorAll('[data-hotel]').forEach((card) => {
    card.addEventListener('click', () => openHotelModal(card.dataset.hotel));
  });

})();
