/* ==========================================================================
   KV-web — логика лендинга.

   ┌──────────────────────────────────────────────────────────────────────┐
   │ КУДА ПАДАЮТ ЗАЯВКИ — единственное место, которое нужно настроить.    │
   │ Пропишите ENDPOINT ниже, и все 4 формы начнут отправлять данные.     │
   │ Пока он пустой — форма проверяет поля и показывает «спасибо»,        │
   │ а содержимое пишет в консоль браузера (F12).                         │
   └──────────────────────────────────────────────────────────────────────┘

   Варианты:
   1) Telegram-бот (без сервера):
      ENDPOINT = 'https://api.telegram.org/bot<ТОКЕН>/sendMessage'
      MODE     = 'telegram'  +  укажите CHAT_ID
      Минус: токен виден в коде страницы. Для боевого сайта лучше пункт 3.
   2) Почта через сервис форм (formspree / getform / formcarry):
      ENDPOINT = 'https://formspree.io/f/xxxxxxx'
      MODE     = 'json'
   3) Свой обработчик на хостинге (php/node), рекомендуется:
      ENDPOINT = '/send.php'
      MODE     = 'json'
   ========================================================================== */
const FORM_CONFIG = {
  ENDPOINT: '',
  MODE: 'json',      // 'json' | 'telegram'
  CHAT_ID: '',       // только для MODE:'telegram'
  SITE: 'KV-web — лендинг'
};

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- мобильное меню ---------- */
  const burger = document.querySelector('.burger');
  const nav = document.getElementById('mainnav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      burger.setAttribute('aria-label', open ? 'Открыть меню' : 'Закрыть меню');
      nav.classList.toggle('is-open', !open);
    });
    nav.addEventListener('click', e => {
      if (e.target.closest('a')) {
        burger.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      }
    });
  }

  /* ---------- выпадашка «Услуги» ---------- */
  document.querySelectorAll('.subtoggle').forEach(btn => {
    const li = btn.closest('.has-sub');
    btn.addEventListener('click', () => {
      const open = li.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.has-sub')) {
      document.querySelectorAll('.has-sub.is-open').forEach(li => {
        li.classList.remove('is-open');
        li.querySelector('.subtoggle')?.setAttribute('aria-expanded', 'false');
      });
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.has-sub.is-open').forEach(li => li.classList.remove('is-open'));
    if (nav?.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      burger?.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- квиз ---------- */
  const quiz = document.getElementById('quizForm');
  if (quiz) {
    const steps = [...quiz.querySelectorAll('.quiz__step')];
    const fill = document.getElementById('quizFill');
    const count = document.getElementById('quizCount');
    const back = document.getElementById('quizBack');
    const next = document.getElementById('quizNext');
    const send = document.getElementById('quizSend');
    const total = steps.length;
    let cur = 0;

    const render = () => {
      steps.forEach((s, i) => s.classList.toggle('is-active', i === cur));
      fill.style.width = ((cur + 1) / total * 100).toFixed(1) + '%';
      count.textContent = `${cur + 1} из ${total}`;
      back.hidden = cur === 0;
      next.hidden = cur === total - 1;
      send.hidden = cur !== total - 1;
    };

    next.addEventListener('click', () => {
      if (cur < total - 1) { cur++; render(); scrollIntoQuiz(); }
    });
    back.addEventListener('click', () => {
      if (cur > 0) { cur--; render(); scrollIntoQuiz(); }
    });
    const scrollIntoQuiz = () => {
      const top = quiz.getBoundingClientRect().top;
      if (top < 0) quiz.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    render();
    attachSubmit(quiz, 'Квиз: расчёт стоимости');
  }

  /* ---------- фильтр кейсов ---------- */
  const chips = [...document.querySelectorAll('.chip')];
  const cases = [...document.querySelectorAll('.case')];
  const empty = document.querySelector('.cases__empty');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => { c.classList.remove('is-on'); c.setAttribute('aria-selected', 'false'); });
      chip.classList.add('is-on');
      chip.setAttribute('aria-selected', 'true');
      const f = chip.dataset.filter;
      let shown = 0;
      cases.forEach(card => {
        const ok = f === 'all' || (card.dataset.tags || '').split(' ').includes(f);
        card.hidden = !ok;
        if (ok) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
    });
  });

  /* ---------- табы тарифов ---------- */
  const ptabs = [...document.querySelectorAll('.ptab')];
  ptabs.forEach(tab => {
    tab.addEventListener('click', () => {
      ptabs.forEach(t => { t.classList.remove('is-on'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-on');
      tab.setAttribute('aria-selected', 'true');
    });
  });

  /* ---------- видео / текстовые отзывы ---------- */
  const rtabs = [...document.querySelectorAll('.rtab')];
  const revs = [...document.querySelectorAll('.rev')];
  const scroller = document.querySelector('.reviews__scroller');
  rtabs.forEach(tab => {
    tab.addEventListener('click', () => {
      rtabs.forEach(t => { t.classList.remove('is-on'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-on');
      tab.setAttribute('aria-selected', 'true');
      const kind = tab.dataset.rt;
      revs.forEach(r => { r.hidden = r.dataset.kind !== kind; });
      if (scroller) scroller.scrollTo({ left: 0, behavior: 'smooth' });
    });
  });

  /* ---------- FAQ: плавное раскрытие, открыт всегда один ----------
     <details> сам по себе схлопывается рывком, поэтому высоту тела
     анимируем руками. Разметка остаётся семантической: без JS блок
     работает как обычный <details>, просто без плавности.            */
  const accs = [...document.querySelectorAll('.acc')];
  const ACC_MS = 420;
  const ACC_EASE = 'cubic-bezier(.22,1,.36,1)';
  const slowMo = matchMedia('(prefers-reduced-motion: reduce)').matches;

  accs.forEach(acc => {
    const sum = acc.querySelector('summary');
    const body = acc.querySelector('.acc__body');
    if (!sum || !body) return;
    acc._anim = null;

    const stop = () => { if (acc._anim) { acc._anim.cancel(); acc._anim = null; } };

    // нижний отступ гасим вместе с высотой, иначе в конце остаётся «ступенька»
    const padOpen = () => getComputedStyle(body).paddingBottom;

    const expand = () => {
      stop();
      const pad = acc.open ? padOpen() : null;
      acc.open = true;
      acc.classList.add('is-anim');
      const pb = pad || padOpen();
      const h = body.scrollHeight;
      acc._anim = body.animate(
        [{ height: '0px', paddingBottom: '0px', opacity: 0 },
         { height: h + 'px', paddingBottom: pb, opacity: 1 }],
        { duration: ACC_MS, easing: ACC_EASE }
      );
      acc._anim.onfinish = () => { acc.classList.remove('is-anim'); acc._anim = null; };
    };

    const collapse = () => {
      stop();
      acc.classList.add('is-anim');
      const h = body.getBoundingClientRect().height || body.scrollHeight;
      const pb = padOpen();
      acc._anim = body.animate(
        [{ height: h + 'px', paddingBottom: pb, opacity: 1 },
         { height: '0px', paddingBottom: '0px', opacity: 0 }],
        { duration: ACC_MS - 80, easing: ACC_EASE }
      );
      acc._anim.onfinish = () => {
        acc.open = false;
        acc.classList.remove('is-anim');
        acc._anim = null;
      };
    };

    acc._collapse = collapse;

    sum.addEventListener('click', e => {
      e.preventDefault();
      if (slowMo) {                       // уважаем «уменьшить движение»
        const wasOpen = acc.open;
        accs.forEach(o => { if (o !== acc) o.open = false; });
        acc.open = !wasOpen;
        return;
      }
      if (acc.open && !acc.classList.contains('is-closing')) {
        collapse();
      } else {
        accs.forEach(o => { if (o !== acc && o.open) o._collapse(); });
        expand();
      }
    });
  });

  /* ---------- «Показать всё» в блоке о команде ---------- */
  const more = document.getElementById('teamMore');
  const teamText = document.getElementById('teamText');
  if (more && teamText) {
    more.addEventListener('click', () => {
      const clamped = teamText.classList.toggle('is-clamped');
      more.textContent = clamped ? 'Показать всё' : 'Свернуть';
      more.setAttribute('aria-expanded', String(!clamped));
    });
  }

  /* ---------- формы ---------- */
  document.querySelectorAll('form.form').forEach(f => attachSubmit(f, f.dataset.form || 'Заявка'));

  /* ==========================================================================
     3D ИНТЕРАКТИВНЫЙ ГЛОБУС THREE.JS
     ========================================================================== */
  const globeCanvas = document.getElementById('globeCanvas');
  const globeViewport = document.getElementById('globeViewport');
  const globeTooltip = document.getElementById('globeTooltip');
  const gtipFlag = document.getElementById('gtipFlag');
  const gtipCountry = document.getElementById('gtipCountry');
  const gtipCity = document.getElementById('gtipCity');
  const gtipBadge = document.getElementById('gtipBadge');
  const gtipText = document.getElementById('gtipText');

  if (globeCanvas && globeViewport && typeof THREE !== 'undefined') {
    // Каталог активных точек глобальной сети KV-web
    // Каталог активных городов глобальной сети KV-web (реальные координаты, комфортное распределение)
    const HUBS = {
      // --- Главный офис (HQ) ---
      minsk: {
        id: 'minsk',
        name: 'Минск',
        country: 'Беларусь',
        flag: '🇧🇾',
        badge: 'Штаб-квартира',
        tag: '⭐ Главный технологический офис',
        desc: 'Главный технологический центр KV-web. Разработка высоконагруженных веб-сервисов, B2B платформ и SEO-стратегий.',
        caseStudy: '50+ запущенных проектов: интернет-магазины, личные кабинеты, корпоративные порталы с выводом в топ-3.',
        lat: 53.9045, lon: 27.5615,
        color: 0xFF6915, colorHex: '#FF6915',
        region: 'by',
        isHQ: true,
        isPrimary: true
      },

      // --- Западная, Северная и Южная Европа ---
      london: {
        id: 'london',
        name: 'Лондон',
        country: 'Великобритания',
        flag: '🇬🇧',
        badge: 'Fintech & SaaS',
        tag: '🚀 Western Europe',
        desc: 'Финтех-сервисы, SaaS платформы и защищенные клиентские кабинеты по европейским стандартам.',
        caseStudy: 'Личный кабинет финансовой платформы, интерактивный калькулятор доходности и Open Banking API.',
        lat: 51.5074, lon: -0.1278,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'eu',
        isPrimary: true
      },
      paris: {
        id: 'paris',
        name: 'Париж',
        country: 'Франция',
        flag: '🇫🇷',
        badge: 'Luxury & Brands',
        tag: '🎨 France',
        desc: 'Имиджевые сайты, премиальные интерфейсы и промо-страницы для европейских брендов.',
        caseStudy: 'Имиджевый сайт архитектурного бюро с интерактивным 3D-каталогом проектов.',
        lat: 48.8566, lon: 2.3522,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'eu',
        parentHub: 'london'
      },
      berlin: {
        id: 'berlin',
        name: 'Берлин',
        country: 'Германия',
        flag: '🇩🇪',
        badge: 'Tech & Startups',
        tag: '💡 Germany',
        desc: 'Веб-приложения и промо-сайты для европейских технологических стартапов.',
        caseStudy: 'Презентационная платформа стартапа с интерактивным 3D-конфигуратором продукта.',
        lat: 52.5200, lon: 13.4050,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'eu',
        isPrimary: true
      },
      warsaw: {
        id: 'warsaw',
        name: 'Варшава',
        country: 'Польша',
        flag: '🇵🇱',
        badge: 'EU & GDPR',
        tag: '🇪🇺 Central Europe',
        desc: 'Европейские порталы, мультиязычные каталоги и интеграции с CRM системами ЕС.',
        caseStudy: 'Сервис аренды оборудования с автоматическим расчетом стоимости и полным соответствием GDPR.',
        lat: 52.2297, lon: 21.0122,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'eu',
        parentHub: 'berlin'
      },
      stockholm: {
        id: 'stockholm',
        name: 'Стокгольм',
        country: 'Швеция',
        flag: '🇸🇪',
        badge: 'Nordic Highload',
        tag: '❄️ Скандинавия',
        desc: 'Минималистичные высокопроизводительные веб-сервисы для рынка Северной Европы.',
        caseStudy: 'B2B-сервис аналитики с адаптивным интерфейсом под стандарты доступности WCAG.',
        lat: 59.3293, lon: 18.0686,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'eu',
        parentHub: 'berlin'
      },
      milan: {
        id: 'milan',
        name: 'Милан',
        country: 'Италия',
        flag: '🇮🇹',
        badge: 'Fashion & E-Com',
        tag: '🏛️ Южная Европа',
        desc: 'Премиальные интернет-магазины, fashion-каталоги и сервисы бронирования.',
        caseStudy: 'Эксклюзивный интернет-магазин дизайнерской мебели с мультивалютной корзиной.',
        lat: 45.4642, lon: 9.1900,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'eu',
        parentHub: 'paris'
      },
      barcelona: {
        id: 'barcelona',
        name: 'Барселона',
        country: 'Испания',
        flag: '🇪🇸',
        badge: 'Travel & Media',
        tag: '☀️ Пиренеи',
        desc: 'Порталы бронирования, медиа-проекты и мультиязычные платформы юга Европы.',
        caseStudy: 'Платформа бронирования премиальных яхт и апартаментов с онлайн-календарем занятости.',
        lat: 41.3851, lon: 2.1734,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'eu',
        parentHub: 'paris'
      },

      // --- Ближний Восток & Азия (MENA) ---
      dubai: {
        id: 'dubai',
        name: 'Дубай',
        country: 'ОАЭ',
        flag: '🇦🇪',
        badge: 'E-Commerce & Luxury',
        tag: '🌍 Ближний Восток',
        desc: 'Мультиязычные интернет-магазины, порталы элитной недвижимости и сервисы ОАЭ.',
        caseStudy: 'Премиум-магазин парфюмерии со шлюзами Stripe/Tap и каталог элитной недвижимости.',
        lat: 25.2048, lon: 55.2708,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'mena',
        isPrimary: true
      },
      riyadh: {
        id: 'riyadh',
        name: 'Эр-Рияд',
        country: 'Саудовская Аравия',
        flag: '🇸🇦',
        badge: 'B2B Порталы & RTL',
        tag: '🇸🇦 Саудовская Аравия',
        desc: 'Локализация под арабский рынок (RTL) и интеграция с национальными шлюзами Mada / STC Pay.',
        caseStudy: 'Корпоративный сайт производственного холдинга с полной поддержкой арабского языка.',
        lat: 24.7136, lon: 46.6753,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'mena',
        parentHub: 'dubai'
      },
      istanbul: {
        id: 'istanbul',
        name: 'Стамбул',
        country: 'Турция',
        flag: '🇹🇷',
        badge: 'Trade & Logistics',
        tag: '🌉 Трансконтинентальный хаб',
        desc: 'Торговые площадки, оптовые B2B-каталоги и логистические сервисы между Европой и Азией.',
        caseStudy: 'Мультиязычный B2B-каталог фабрики с автоматической выгрузкой коммерческих предложений.',
        lat: 41.0082, lon: 28.9784,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'mena',
        parentHub: 'dubai'
      },
      doha: {
        id: 'doha',
        name: 'Доха',
        country: 'Катар',
        flag: '🇶🇦',
        badge: 'Invest & Events',
        tag: '🇶🇦 Катар',
        desc: 'Сайты инвестиционных фондов и презентационные посадочные страницы мероприятий.',
        caseStudy: 'Лендинг международного инвестиционного саммита с онлайн-регистрацией.',
        lat: 25.2854, lon: 51.5310,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'mena',
        parentHub: 'dubai'
      },
      singapore: {
        id: 'singapore',
        name: 'Сингапур',
        country: 'Сингапур',
        flag: '🇸🇬',
        badge: 'Fintech & Cloud',
        tag: '🌏 Азиатский хаб',
        desc: 'Азиатский технологический хаб: облачные платформы и финансовые сервисы.',
        caseStudy: 'Веб-платформа финтех-сервиса с мультиязычной документацией и API интеграцией.',
        lat: 1.3521, lon: 103.8198,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'mena',
        parentHub: 'dubai'
      },

      // --- СНГ, Кавказ & Центральная Азия ---
      astana: {
        id: 'astana',
        name: 'Астана',
        country: 'Казахстан',
        flag: '🇰🇿',
        badge: 'Корп. порталы & 1С',
        tag: '🤝 Центральная Азия',
        desc: 'Корпоративные сайты холдингов, оптовые каталоги и автоматизация продаж.',
        caseStudy: 'B2B портал холдинга на 15 000 товаров с интеграцией 1С и личным кабинетом дилера.',
        lat: 51.1694, lon: 71.4491,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'cis',
        isPrimary: true
      },
      almaty: {
        id: 'almaty',
        name: 'Алматы',
        country: 'Казахстан',
        flag: '🇰🇿',
        badge: 'E-commerce & Kaspi',
        tag: '🤝 Казахстан',
        desc: 'Интернет-магазины с интеграцией Kaspi Pay и локальной логистикой.',
        caseStudy: 'Онлайн-магазин товаров для дома с синхронизацией Kaspi Магазина.',
        lat: 43.2389, lon: 76.8897,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'cis',
        parentHub: 'astana'
      },
      tashkent: {
        id: 'tashkent',
        name: 'Ташкент',
        country: 'Узбекистан',
        flag: '🇺🇿',
        badge: 'B2B Каталоги & Payme',
        tag: '🤝 Узбекистан',
        desc: 'Сайты производителей, интеграция платежных систем Payme / Click.',
        caseStudy: 'Официальный каталог продукции строительного комбината с онлайн-калькулятором.',
        lat: 41.2995, lon: 69.2401,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'cis',
        parentHub: 'astana'
      },
      tbilisi: {
        id: 'tbilisi',
        name: 'Тбилиси',
        country: 'Грузия',
        flag: '🇬🇪',
        badge: 'IT Services & Expat',
        tag: '🇬🇪 Кавказ',
        desc: 'Сайты для международных IT-компаний, релокационных сервисов и туризма.',
        caseStudy: 'Мультиязычный портал сервиса аренды авто с моментальным подтверждением брони.',
        lat: 41.7151, lon: 44.8271,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'cis',
        parentHub: 'astana'
      },
      baku: {
        id: 'baku',
        name: 'Баку',
        country: 'Азербайджан',
        flag: '🇦🇿',
        badge: 'Logistics & Energy',
        tag: '🇦🇿 Каспийский регион',
        desc: 'Корпоративные порталы логистических и промышленных предприятий региона.',
        caseStudy: 'Портал логистического оператора с личным кабинетом клиента и трекингом грузов.',
        lat: 40.4093, lon: 49.8671,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'cis',
        parentHub: 'astana'
      },
      moscow: {
        id: 'moscow',
        name: 'Москва',
        country: 'Россия',
        flag: '🇷🇺',
        badge: 'E-commerce & Highload',
        tag: '🤝 B2B Сеть',
        desc: 'Высоконагруженные порталы, интеграции 1С и сквозная аналитика.',
        caseStudy: 'Оптовый B2B портал с кабинетом партнера и интеграцией Битрикс24.',
        lat: 55.7558, lon: 37.6173,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'cis',
        parentHub: 'minsk'
      },

      // --- Северная Америка (США & Канада) ---
      newyork: {
        id: 'newyork',
        name: 'Нью-Йорк',
        country: 'США',
        flag: '🇺🇸',
        badge: 'B2B Платформы',
        tag: '⚡ East Coast',
        desc: 'Высоконагруженные лендинги и маркетинговые воронки для клиентов на рынке США.',
        caseStudy: 'Высоконагруженный B2B маркетплейс оптовых поставок с оптимизацией под Google Ads США.',
        lat: 40.7128, lon: -74.0060,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'us',
        isPrimary: true
      },
      sanfrancisco: {
        id: 'sanfrancisco',
        name: 'Сан-Франциско',
        country: 'США',
        flag: '🇺🇸',
        badge: 'Silicon Valley & AI',
        tag: '⚡ Silicon Valley',
        desc: 'Промо-сайты и веб-приложения для AI-стартапов и технологических платформ Калифорнии.',
        caseStudy: 'Презентационный сайт генеративного AI-сервиса с интерактивной демо-песочницей в браузере.',
        lat: 37.7749, lon: -122.4194,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'us',
        isPrimary: true
      },
      chicago: {
        id: 'chicago',
        name: 'Чикаго',
        country: 'США',
        flag: '🇺🇸',
        badge: 'Logistics & Trade',
        tag: '⚡ Midwest',
        desc: 'Корпоративные порталы логистических и производственных компаний.',
        caseStudy: 'Кабинет отслеживания грузов и расчет стоимости логистики в реальном времени.',
        lat: 41.8781, lon: -87.6298,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'us',
        parentHub: 'newyork'
      },
      miami: {
        id: 'miami',
        name: 'Майами',
        country: 'США',
        flag: '🇺🇸',
        badge: 'Luxury Real Estate',
        tag: '⚡ Florida',
        desc: 'Лендинги премиальной недвижимости, яхтенных чартеров и инвестиций во Флориде.',
        caseStudy: 'Презентационный лендинг жилого комплекса в Майами-Бич с интерактивными 3D-планировками.',
        lat: 25.7617, lon: -80.1918,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'us',
        parentHub: 'newyork'
      },
      toronto: {
        id: 'toronto',
        name: 'Торонто',
        country: 'Канада',
        flag: '🇨🇦',
        badge: 'Enterprise & FinTech',
        tag: '🇨🇦 Canada',
        desc: 'Корпоративные сайты и B2B порталы для канадского финансового и ритейл секторов.',
        caseStudy: 'Корпоративный сайт страховой группы с онлайн-калькулятором полисов.',
        lat: 43.6532, lon: -79.3832,
        color: 0x34E07B, colorHex: '#34E07B',
        region: 'us',
        parentHub: 'newyork'
      }
    };

    // Конвертер географических координат в координаты сферы Three.js
    const GLOBE_RADIUS = 2.0;
    const latLonToVec3 = (lat, lon, radius = GLOBE_RADIUS) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.cos(theta) * Math.sin(phi));
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(theta) * Math.sin(phi);
      return new THREE.Vector3(x, y, z);
    };

    // Сцена, камера, рендерер
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, globeViewport.clientWidth / globeViewport.clientHeight, 0.1, 100);
    camera.position.z = 5.3;

    let targetZoomZ = 5.3;

    const renderer = new THREE.WebGLRenderer({
      canvas: globeCanvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(globeViewport.clientWidth, globeViewport.clientHeight);

    // Группа вращения глобуса
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Освещение: мягкий студийный свет
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xe8f0ff, 1.15);
    sunLight.position.set(5, 4, 6);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x396ceb, 0.85);
    rimLight.position.set(-6, -2, -5);
    scene.add(rimLight);

    // Текстура глобуса (натуральная фотореалистичная гео-карта Земли высокой четкости)
    const textureLoader = new THREE.TextureLoader();
    const texturePath = (window.location.pathname.includes('/landing/') ? '' : 'landing/') + 'img/globe-texture.png?v=true_earth_v10';
    const globeTexture = textureLoader.load(texturePath, (t) => {
      t.minFilter = THREE.LinearMipmapLinearFilter;
      t.magFilter = THREE.LinearFilter;
      t.generateMipmaps = true;
      if (renderer) t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      globeMesh.material.needsUpdate = true;
    });

    // Сфера планеты
    const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const globeMat = new THREE.MeshStandardMaterial({
      map: globeTexture,
      roughness: 0.52,
      metalness: 0.08,
      emissive: 0x030a1c,
      emissiveIntensity: 0.18
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // Атмосферный ореол
    const haloGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.035, 48, 48);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x396ceb,
      transparent: true,
      opacity: 0.14,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    globeGroup.add(haloMesh);

    // Тонкая сферическая координатная 3D-сетка (параллели и меридианы)
    const gridGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.002, 36, 18);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x396ceb,
      wireframe: true,
      transparent: true,
      opacity: 0.045
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    globeGroup.add(gridMesh);

    // Коллекции интерактивных 3D объектов
    const hubObjects = {};
    const interactiveHitMeshes = [];
    const beaconRings = [];
    const arcObjects = [];
    const pulseParticles = [];

    // Высота физической булавки над поверхностью глобуса
    const PIN_HEIGHT = 0.052;

    // 1. Создание физических булавок (канцелярские гвоздики с металлическим стержнем и эмалевой шапочкой)
    Object.keys(HUBS).forEach(key => {
      const hub = HUBS[key];
      const basePos = latLonToVec3(hub.lat, hub.lon, GLOBE_RADIUS * 1.001);
      const normal = basePos.clone().normalize();

      // Точка крепления нити (шейка булавки) и вершина (шапочка)
      const headPos = basePos.clone().add(normal.clone().multiplyScalar(PIN_HEIGHT));
      const neckPos = basePos.clone().add(normal.clone().multiplyScalar(PIN_HEIGHT * 0.72));

      // Металлический стержень булавки (серебристая стальная игла)
      const needleGeo = new THREE.CylinderGeometry(0.0035, 0.0022, PIN_HEIGHT, 8);
      const needleMat = new THREE.MeshStandardMaterial({
        color: 0xC4CBD5,
        metalness: 0.88,
        roughness: 0.22
      });
      const needleMesh = new THREE.Mesh(needleGeo, needleMat);
      needleMesh.position.copy(basePos.clone().add(normal.clone().multiplyScalar(PIN_HEIGHT * 0.5)));
      needleMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      globeGroup.add(needleMesh);

      // Шапочка булавки (глянцевая эмалевая головка: оранжевая для Минска HQ, изумрудная для городов)
      const headRadius = hub.isHQ ? 0.038 : (hub.isPrimary ? 0.027 : 0.022);
      const headGeo = new THREE.SphereGeometry(headRadius, 16, 16);
      const headMat = new THREE.MeshStandardMaterial({
        color: hub.isHQ ? 0xFF6915 : 0x22C55E,
        metalness: 0.15,
        roughness: 0.30
      });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.copy(headPos);
      globeGroup.add(headMesh);

      // Маленький мягкий световой ореол вокруг шапочки
      const haloGeo = new THREE.SphereGeometry(headRadius * 1.4, 16, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: hub.isHQ ? 0xFF6915 : 0x22C55E,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.copy(headPos);
      globeGroup.add(haloMesh);

      // Тёмная металлическая шайба в основании у поверхности Земли
      const washerGeo = new THREE.RingGeometry(0.010, headRadius * 1.05, 20);
      const washerMat = new THREE.MeshBasicMaterial({
        color: 0x03081A,
        side: THREE.DoubleSide
      });
      const washerMesh = new THREE.Mesh(washerGeo, washerMat);
      washerMesh.position.copy(basePos.clone().add(normal.clone().multiplyScalar(0.002)));
      washerMesh.lookAt(basePos.clone().add(normal.clone().multiplyScalar(2)));
      globeGroup.add(washerMesh);

      // Тонкая тактильная волна-пульс на поверхности Земли вокруг булавки (.wpin__ripple)
      const ringGeo = new THREE.RingGeometry(headRadius * 0.95, headRadius * 1.30, 32);
      const rings = [];
      for (let i = 0; i < 2; i++) {
        const ringMat = new THREE.MeshBasicMaterial({
          color: hub.isHQ ? 0xFF6915 : 0x38E585,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(basePos.clone().add(normal.clone().multiplyScalar(0.004)));
        ringMesh.lookAt(basePos.clone().add(normal.clone().multiplyScalar(2)));
        globeGroup.add(ringMesh);
        rings.push(ringMesh);
      }

      beaconRings.push({
        rings,
        headMesh,
        haloMesh,
        duration: hub.isHQ ? 2.2 : 3.0,
        offset: Math.random() * 3.0,
        isHQ: hub.isHQ
      });

      // Невидимый увеличенный хитбокс для комфортного клика по булавке
      const hitGeo = new THREE.SphereGeometry(0.085, 8, 8);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.copy(headPos);
      hitMesh.userData = { hubKey: key, hubData: hub, basePos, normal, headPos };
      globeGroup.add(hitMesh);
      interactiveHitMeshes.push(hitMesh);

      hubObjects[key] = {
        data: hub,
        basePos,
        normal,
        headPos,
        neckPos,
        needleMesh,
        coreMesh: headMesh,
        headMesh,
        haloMesh,
        rings
      };
    });

    // Функция построения точной геодезической дуги (Great Circle SLERP) строго между головками булавок
    // 2. Создание градиентных световых вуалей (Style 6: Curtain Arc / Aurora Ribbon)
    // Построение вертикальной шторки от поверхности Земли до высшей точки геодезической траектории
    const createCurtainGeometry = (p1, p2, baseP1, baseP2, numPoints = 32, maxLift = 0.14) => {
      const u = p1.clone().normalize();
      const v = p2.clone().normalize();
      const r1 = p1.length();
      const r2 = p2.length();
      const rBase1 = baseP1.length();
      const rBase2 = baseP2.length();

      const dot = Math.max(-1.0, Math.min(1.0, u.dot(v)));
      const theta = Math.acos(dot);
      const sinTheta = Math.sin(theta);

      // Высота подъема дуги в зените (зависит от расстояния)
      const lift = Math.min(maxLift, Math.max(0.045, theta * 0.095));

      const topPoints = [];
      const vertices = [];
      const uvs = [];
      const indices = [];

      for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        let w;
        if (sinTheta < 0.0001) {
          w = u.clone().lerp(v, t).normalize();
        } else {
          const c1 = Math.sin((1 - t) * theta) / sinTheta;
          const c2 = Math.sin(t * theta) / sinTheta;
          w = u.clone().multiplyScalar(c1).add(v.clone().multiplyScalar(c2)).normalize();
        }

        const topR = (r1 * (1 - t) + r2 * t) + lift * Math.sin(Math.PI * t);
        const botR = (rBase1 * (1 - t) + rBase2 * t);

        const topPt = w.clone().multiplyScalar(topR);
        const botPt = w.clone().multiplyScalar(botR);
        topPoints.push(topPt);

        // vertex 2*i: основание у поверхности планеты
        vertices.push(botPt.x, botPt.y, botPt.z);
        uvs.push(t, 0.0);

        // vertex 2*i + 1: верхний гребень дуги
        vertices.push(topPt.x, topPt.y, topPt.z);
        uvs.push(t, 1.0);
      }

      for (let i = 0; i < numPoints; i++) {
        const b1 = 2 * i;
        const t1 = 2 * i + 1;
        const b2 = 2 * (i + 1);
        const t2 = 2 * (i + 1) + 1;

        indices.push(b1, t1, b2);
        indices.push(t1, t2, b2);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();

      return { geo, topPoints };
    };

    const curtainVertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const curtainFragmentShader = `
      uniform vec3 uColorBottom;
      uniform vec3 uColorTop;
      uniform float uOpacity;
      uniform float uTime;
      varying vec2 vUv;

      void main() {
        // Деликатный градиент высоты: нижние 70% прозрачны, чтобы не заслонять материки и океаны,
        // а к верхнему гребню плавно формируется мягкая золотая световая аура
        float vFade = pow(vUv.y, 3.0);
        // Мягкое угасание у оснований булавок
        float edgeFade = sin(vUv.x * 3.14159265);
        // Медленное органическое дыхание световой волны
        float wave = 0.88 + 0.12 * sin(vUv.x * 10.0 - uTime * 2.2);

        float alpha = vFade * edgeFade * uOpacity * wave;

        // Переход от теплого янтаря к сияющему золоту
        vec3 col = mix(uColorBottom, uColorTop, pow(vUv.y, 1.8));
        gl_FragColor = vec4(col, alpha);
      }
    `;

    const minskHub = hubObjects['minsk'];
    const minskHead = minskHub.headPos;
    const minskBase = minskHub.basePos;

    Object.keys(HUBS).forEach(key => {
      if (key === 'minsk') return;
      const targetHub = hubObjects[key];
      const targetHead = targetHub.headPos;
      const targetBase = targetHub.basePos;

      const { geo: curtainGeo, topPoints } = createCurtainGeometry(minskHead, targetHead, minskBase, targetBase, 32, 0.14);

      const isTrunk = targetHub.data.isPrimary;
      const baseCurtainOpacity = isTrunk ? 0.40 : 0.22;
      const baseCrestOpacity = isTrunk ? 0.75 : 0.50;

      // 1. Полупрозрачная градиентная световая вуаль (Curtain)
      const curtainMat = new THREE.ShaderMaterial({
        vertexShader: curtainVertexShader,
        fragmentShader: curtainFragmentShader,
        uniforms: {
          uColorBottom: { value: new THREE.Color(0xFF8F00) }, // Глубокий тёплый янтарь
          uColorTop: { value: new THREE.Color(0xFFE082) },    // Сияющее светлое золото
          uOpacity: { value: baseCurtainOpacity },
          uTime: { value: 0 }
        },
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const curtainMesh = new THREE.Mesh(curtainGeo, curtainMat);
      globeGroup.add(curtainMesh);

      // 2. Тончайший сияющий гребень вдоль верхней кромки вуали (Crest Filament)
      const crestCurve = new THREE.CatmullRomCurve3(topPoints);
      const crestGeo = new THREE.TubeGeometry(crestCurve, 32, 0.0016, 5, false);
      const crestMat = new THREE.MeshBasicMaterial({
        color: 0xFFD56B,
        transparent: true,
        opacity: baseCrestOpacity,
        blending: THREE.AdditiveBlending
      });
      const crestMesh = new THREE.Mesh(crestGeo, crestMat);
      globeGroup.add(crestMesh);

      arcObjects.push({
        hubKey: key,
        curtainMesh,
        crestMesh,
        baseCurtainOpacity,
        baseCrestOpacity,
        isTrunk
      });
    });

    // UI Элементы управления и карточка
    const hudItems = [...document.querySelectorAll('.globe-hud__item')];
    const wtabs = [...document.querySelectorAll('.wtab')];
    const spinBtn = document.getElementById('globeSpinBtn');
    const zoomInBtn = document.getElementById('globeZoomIn');
    const zoomOutBtn = document.getElementById('globeZoomOut');
    const gcardCity = document.getElementById('gcardCity');
    const gcardFlag = document.getElementById('gcardFlag');
    const gcardTag = document.getElementById('gcardTag');
    const gcardDesc = document.getElementById('gcardDesc');

    // Текущее состояние вращения
    let autoSpin = true;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let velX = 0;
    let velY = 0;
    let targetRotX = (HUBS.minsk.lat * Math.PI / 180) * 0.65;
    let targetRotY = -(HUBS.minsk.lon * Math.PI / 180) - Math.PI / 2;
    let activeHubKey = 'minsk';
    let hoveredHubKey = null;
    let isTransitioning = true;
    let lastUserActionTime = Date.now();

    globeGroup.rotation.x = targetRotX;
    globeGroup.rotation.y = targetRotY;

    // Подсветка активного города и натянутой к нему световой вуали (без изменения высоты/масштаба)
    const highlightActiveCityNetwork = (hubKey) => {
      if (hubKey && hubKey !== 'minsk') {
        arcObjects.forEach(arc => {
          if (arc.hubKey === hubKey) {
            // Выбранная траектория озаряется яркой золотой вуалью
            arc.curtainMesh.material.uniforms.uOpacity.value = 0.95;
            arc.crestMesh.material.opacity = 1.0;
            arc.crestMesh.material.color.setHex(0xFFF2A8);
          } else {
            // Остальные траектории деликатно смягчаются
            arc.curtainMesh.material.uniforms.uOpacity.value = 0.10;
            arc.crestMesh.material.opacity = 0.16;
            arc.crestMesh.material.color.setHex(0xD4AF37);
          }
        });

        // Подсветка активной булавки
        Object.keys(hubObjects).forEach(k => {
          const h = hubObjects[k];
          if (k === hubKey) {
            h.headMesh.scale.set(1.25, 1.25, 1.25);
            h.haloMesh.material.opacity = 0.55;
          } else {
            h.headMesh.scale.set(1.0, 1.0, 1.0);
            h.haloMesh.material.opacity = 0.22;
          }
        });
      } else {
        // Режим по умолчанию (все световые вуали в мягком фоновом свечении)
        arcObjects.forEach(arc => {
          arc.curtainMesh.material.uniforms.uOpacity.value = arc.baseCurtainOpacity;
          arc.crestMesh.material.opacity = arc.baseCrestOpacity;
          arc.crestMesh.material.color.setHex(0xFFE082);
        });
        Object.keys(hubObjects).forEach(k => {
          const h = hubObjects[k];
          h.headMesh.scale.set(1.0, 1.0, 1.0);
          h.haloMesh.material.opacity = 0.22;
        });
      }
    };

    // Обновление карточки и активных пунктов
    const selectHub = (hubKey, smoothFly = true) => {
      const hub = HUBS[hubKey];
      if (!hub) return;
      activeHubKey = hubKey;

      if (gcardCity) gcardCity.textContent = hub.name;
      if (gcardFlag) gcardFlag.textContent = hub.flag;
      if (gcardTag) {
        gcardTag.textContent = hub.tag;
        gcardTag.style.color = hub.colorHex;
        gcardTag.style.borderColor = hub.colorHex + '66';
        gcardTag.style.background = hub.colorHex + '22';
      }
      if (gcardDesc) gcardDesc.textContent = hub.desc;

      hudItems.forEach(item => {
        item.classList.toggle('is-active', item.dataset.hub === hubKey);
      });

      wtabs.forEach(t => {
        const tr = t.dataset.region;
        const on = tr === hub.region || (tr === 'me' && hub.region === 'mena') || (tr === 'na' && hub.region === 'us');
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', String(on));
      });

      highlightActiveCityNetwork(hubKey);

      // Плавный поворот глобуса к выбранной точке
      if (smoothFly) {
        targetRotX = (hub.lat * Math.PI / 180) * 0.65;
        targetRotY = -(hub.lon * Math.PI / 180) - Math.PI / 2;
        isTransitioning = true;
      }
    };

    // Привязка кликов по HUD
    hudItems.forEach(item => {
      item.addEventListener('click', () => {
        const hubKey = item.dataset.hub;
        selectHub(hubKey, true);
        lastUserActionTime = Date.now();
      });
    });

    // Привязка кликов по фильтрам регионов (.wtab)
    wtabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const reg = tab.dataset.region;
        wtabs.forEach(t => {
          const on = t === tab;
          t.classList.toggle('is-on', on);
          t.setAttribute('aria-selected', String(on));
        });

        if (reg === 'all' || reg === 'by') {
          selectHub('minsk', true);
        } else if (reg === 'mena' || reg === 'me') {
          selectHub('dubai', true);
        } else if (reg === 'eu') {
          selectHub('london', true);
        } else if (reg === 'us' || reg === 'na') {
          selectHub('sanfrancisco', true);
        } else if (reg === 'cis') {
          selectHub('astana', true);
        }
        lastUserActionTime = Date.now();
      });
    });

    // Кнопки зума
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        targetZoomZ = Math.max(3.6, targetZoomZ - 0.7);
        lastUserActionTime = Date.now();
      });
    }
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        targetZoomZ = Math.min(6.5, targetZoomZ + 0.7);
        lastUserActionTime = Date.now();
      });
    }

    // Кнопка авто-вращения
    if (spinBtn) {
      spinBtn.classList.add('is-active');
      spinBtn.addEventListener('click', () => {
        autoSpin = !autoSpin;
        spinBtn.classList.toggle('is-active', autoSpin);
        lastUserActionTime = Date.now();
      });
    }

    // Зум колесиком мыши
    globeViewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      targetZoomZ = Math.min(6.5, Math.max(3.6, targetZoomZ + e.deltaY * 0.0035));
      lastUserActionTime = Date.now();
    }, { passive: false });

    // Интерактивное перетаскивание (Mouse & Touch Drag)
    const onPointerDown = (clientX, clientY) => {
      isDragging = true;
      dragStartX = clientX;
      dragStartY = clientY;
      lastMouseX = clientX;
      lastMouseY = clientY;
      velX = 0;
      velY = 0;
      isTransitioning = false;
      lastUserActionTime = Date.now();
    };

    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    const checkHubHover = (clientX, clientY) => {
      const rect = globeCanvas.getBoundingClientRect();
      mouseVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouseVec, camera);

      const hits = raycaster.intersectObjects(interactiveHitMeshes, false);
      if (hits.length > 0 && hits[0].object.userData.hubKey) {
        const hitKey = hits[0].object.userData.hubKey;
        if (hoveredHubKey !== hitKey) {
          hoveredHubKey = hitKey;
          const hub = HUBS[hitKey];

          // Заполняем попап
          if (gtipFlag) gtipFlag.textContent = hub.flag;
          if (gtipCountry) gtipCountry.textContent = hub.country;
          if (gtipCity) gtipCity.textContent = hub.name;
          if (gtipBadge) gtipBadge.textContent = hub.badge;
          if (gtipText) gtipText.textContent = hub.caseStudy;

          // Подсвечиваем активную связь
          highlightActiveCityNetwork(hitKey);
          globeCanvas.style.cursor = 'pointer';
        }
      } else {
        if (hoveredHubKey !== null) {
          hoveredHubKey = null;
          highlightActiveCityNetwork(activeHubKey);
          globeCanvas.style.cursor = isDragging ? 'grabbing' : 'grab';
          if (globeTooltip) globeTooltip.classList.remove('is-visible');
        }
      }
    };

    const onPointerMove = (clientX, clientY) => {
      if (isDragging) {
        const dx = clientX - lastMouseX;
        const dy = clientY - lastMouseY;
        lastMouseX = clientX;
        lastMouseY = clientY;

        velY = dx * 0.006;
        velX = dy * 0.006;

        globeGroup.rotation.y += velY;
        globeGroup.rotation.x = Math.max(-0.85, Math.min(0.85, globeGroup.rotation.x + velX));
        lastUserActionTime = Date.now();
        if (globeTooltip) globeTooltip.classList.remove('is-visible');
      } else {
        checkHubHover(clientX, clientY);
      }
    };

    const onPointerUp = (clientX, clientY) => {
      if (!isDragging) return;
      isDragging = false;

      // Если перемещение было меньше 6px — это клик по пину
      const dist = Math.hypot(clientX - dragStartX, clientY - dragStartY);
      if (dist < 6) {
        const rect = globeCanvas.getBoundingClientRect();
        mouseVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouseVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouseVec, camera);
        const hits = raycaster.intersectObjects(interactiveHitMeshes, false);
        if (hits.length > 0 && hits[0].object.userData.hubKey) {
          selectHub(hits[0].object.userData.hubKey, true);
        }
      }
      lastUserActionTime = Date.now();
    };

    // Мышиные события
    globeCanvas.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', (e) => onPointerUp(e.clientX, e.clientY));
    globeViewport.addEventListener('mouseleave', () => {
      if (globeTooltip) globeTooltip.classList.remove('is-visible');
      hoveredHubKey = null;
      highlightActiveCityNetwork(activeHubKey);
    });

    // Тач события
    globeCanvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (isDragging && e.touches.length === 1) onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('touchend', (e) => {
      if (e.changedTouches.length > 0) onPointerUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    });

    // Ресайз адаптив
    const handleResize = () => {
      const w = globeViewport.clientWidth;
      const h = globeViewport.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', handleResize);

    // Оптимизация: рендерим только когда глобус виден на экране
    let isVisible = true;
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(globeViewport);

    // Главный цикл анимации
    let clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);
      if (!isVisible) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Плавный переход к выбранному хабу (Lerp)
      if (isTransitioning) {
        let diffY = (targetRotY - globeGroup.rotation.y) % (Math.PI * 2);
        if (diffY < -Math.PI) diffY += Math.PI * 2;
        if (diffY > Math.PI) diffY -= Math.PI * 2;

        globeGroup.rotation.y += diffY * 0.08;
        globeGroup.rotation.x += (targetRotX - globeGroup.rotation.x) * 0.08;

        if (Math.abs(diffY) < 0.002 && Math.abs(targetRotX - globeGroup.rotation.x) < 0.002) {
          isTransitioning = false;
        }
      } else if (!isDragging) {
        velX *= 0.92;
        velY *= 0.92;
        globeGroup.rotation.y += velY;
        globeGroup.rotation.x = Math.max(-0.85, Math.min(0.85, globeGroup.rotation.x + velX));

        // Фоновое автовращение (если пользователь не трогает и не наводит на хаб)
        if (autoSpin && !hoveredHubKey && (Date.now() - lastUserActionTime > 3500)) {
          globeGroup.rotation.y += 0.0025;
        }
      }

      // Плавный зум камеры
      camera.position.z += (targetZoomZ - camera.position.z) * 0.1;

      // Анимация расходящихся импульсов от точек (концентрические расширяющиеся волны)
      beaconRings.forEach((b) => {
        b.rings.forEach((ring, idx) => {
          // Вторая волна смещена по фазе на 50%
          const phase = (((elapsed + b.offset + idx * (b.duration * 0.5)) % b.duration) / b.duration);
          // Плавное кубическое расширение волны
          const easedPhase = Math.pow(phase, 0.70);
          const scale = 0.5 + easedPhase * 3.4; // Расходится заметно шире от точки
          ring.scale.set(scale, scale, scale);
          ring.material.opacity = Math.max(0, (1 - easedPhase) * 0.85);
        });

        // Мягкое свечение ореола микро-точки в такт рождению волн
        const pulse = Math.sin(elapsed * 2.8 + b.offset) * 0.12;
        b.haloMesh.scale.set(1 + pulse, 1 + pulse, 1 + pulse);
      });

      // Анимация живого светового мерцания вуалей
      arcObjects.forEach(arc => {
        arc.curtainMesh.material.uniforms.uTime.value = elapsed;
      });



      // Позиционирование 3D попапа при наведении на микро-маяк
      if (hoveredHubKey && globeTooltip && hubObjects[hoveredHubKey]) {
        const hub = hubObjects[hoveredHubKey];
        const worldPos = hub.basePos.clone().applyMatrix4(globeGroup.matrixWorld);

        // Проверка: точка на видимой передней полусфере относительно камеры
        const normalWorld = hub.normal.clone().applyEuler(globeGroup.rotation);
        const toCamera = camera.position.clone().sub(worldPos).normalize();
        const dot = normalWorld.dot(toCamera);

        if (dot > 0.05) {
          const proj = worldPos.clone().project(camera);
          const sx = (proj.x * 0.5 + 0.5) * globeViewport.clientWidth;
          const sy = (-proj.y * 0.5 + 0.5) * globeViewport.clientHeight;

          globeTooltip.style.left = `${Math.round(sx)}px`;
          globeTooltip.style.top = `${Math.round(sy)}px`;
          globeTooltip.classList.add('is-visible');
        } else {
          globeTooltip.classList.remove('is-visible');
        }
      }

      renderer.render(scene, camera);
    };

    animate();
  }


  /* ==================== МОУШН ====================
     Правило: контент виден по умолчанию, анимация — надстройка.
     Элементы «взводятся» (.is-armed) только из JS, поэтому при отключённом
     или упавшем скрипте страница просто показывает всё как есть.
     Плюс подстраховка: через 3 с всё в пределах двух экранов открывается
     принудительно — на случай скрытой вкладки или headless-рендера,
     где IntersectionObserver может не сработать.                         */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch  = matchMedia('(hover: none)').matches;
  const small  = matchMedia('(max-width: 760px)').matches;

  const armed = [...document.querySelectorAll('.reveal, .stagger')];
  let sweep = null;
  const hero  = document.querySelector('[data-hero]');

  const open = el => { el.classList.add('is-in'); el.classList.remove('is-armed'); };

  if (reduce) {
    armed.forEach(open);
    hero?.classList.add('is-in');
  } else {
    // индексы стаггера и строк заголовка — в разметке им не место
    document.querySelectorAll('.stagger').forEach(box => {
      [...box.children].forEach((c, i) => c.style.setProperty('--i', Math.min(i, 6)));
    });
    document.querySelectorAll('.hero__h1 .line > span').forEach((l, i) => l.style.setProperty('--l', i));
    document.querySelectorAll('[data-hero-el]').forEach((el, i) => el.style.setProperty('--l', i + 2));

    armed.forEach(el => el.classList.add('is-armed'));

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { open(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '240px 0px -4% 0px', threshold: 0.01 });   // стартуем заранее:
                                                                // при быстром скролле блок
                                                                // приезжает уже проявленным
    armed.forEach(el => io.observe(el));

    requestAnimationFrame(() => hero?.classList.add('is-in'));

    // Подстраховка на весь документ, а не только на первые экраны: если блок
    // уже на виду, а наблюдатель по какой-то причине молчит (скрытая вкладка,
    // headless-рендер), открываем его принудительно. Дешёво — элементов ~30.
    sweep = () => {
      for (let i = armed.length - 1; i >= 0; i--) {
        const el = armed[i];
        if (!el.classList.contains('is-armed')) { armed.splice(i, 1); continue; }
        // строго то, что уже на экране: элементы ниже сгиба оставляем
        // наблюдателю, иначе они откроются заранее и анимации не будет видно
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) open(el);
      }
    };
    setTimeout(sweep, 2500);
  }

  /* ---------- цена доезжает до значения: взгляд остаётся на цифре ---------- */
  if (!reduce) {
    const nums = [...document.querySelectorAll('[data-count]')];
    const fmt = n => n.toLocaleString('ru-RU').replace(/ /g, ' ');
    const nio = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        nio.unobserve(e.target);
        const el = e.target;
        const to = parseInt(el.dataset.count, 10);
        if (!to) return;
        const t0 = performance.now(), dur = 900;
        const tick = now => {
          const k = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - k, 4);           // ease-out-quart
          el.textContent = `от ${fmt(Math.round(to * eased))} BYN`;
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    nums.forEach(n => nio.observe(n));
  }

  /* ---------- индикатор прочитанного ---------- */
  const bar = document.querySelector('.progress__bar');

  /* ---------- панель действий на телефоне ----------
     Прячем её, когда квиз или нижняя форма и так на экране: дублировать
     призыв поверх той же кнопки — только мешать.                        */
  const abar = document.querySelector('.actionbar');
  let formsVisible = 0;
  if (abar) {
    abar.hidden = false;
    const fio = new IntersectionObserver(entries => {
      entries.forEach(e => { formsVisible += e.isIntersecting ? 1 : -1; });
      formsVisible = Math.max(0, formsVisible);
    }, { threshold: 0.15 });
    ['#quiz', '.cta', '.offer'].forEach(sel => {
      const n = document.querySelector(sel);
      if (n) fio.observe(n);
    });
  }

  /* ---------- один обработчик скролла на всё ----------
     Планируем кадр заново на каждое событие и отменяем предыдущий: так
     применяется всегда последнее состояние, а не то, что успело устареть,
     пока браузер придерживал rAF.                                        */
  let rafId = 0;
  const onScroll = () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const y = scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;

      if (bar && !reduce) bar.style.width = (max > 0 ? (y / max) * 100 : 0).toFixed(2) + '%';

      if (abar) abar.classList.toggle('is-up', y > 700 && formsVisible === 0);

      if (sweep && armed.length) sweep();

    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- параллакс декора: только мышь и большой экран ----------
     На тач-скролле пересчёт transform на каждый кадр даёт рывки,
     поэтому там он не включается вовсе.                                 */
  if (!reduce && !touch && !small) {
    const drifters = [...document.querySelectorAll('.star, .case__shot')];
    drifters.forEach(el => { el.dataset.rot = getComputedStyle(el).transform; });
    let raf = 0;
    const drift = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const vh = innerHeight;
        drifters.forEach((el, i) => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > vh + 200) return;
          const p = (r.top + r.height / 2 - vh / 2) / vh;
          const dir = i % 2 ? -1 : 1;
          const base = el.classList.contains('case__shot') ? 16 : 28;
          const keep = el.dataset.rot === 'none' ? '' : el.dataset.rot;
          el.style.transform = `${keep} translate3d(0, ${(p * base * dir).toFixed(1)}px, 0)`;
        });
      });
    };
    addEventListener('scroll', drift, { passive: true });
    drift();
  }

  /* ================== отправка форм ================== */
  function attachSubmit(form, title) {
    const msg = form.querySelector('.formmsg');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // проверка обязательных полей
      let bad = null;
      form.querySelectorAll('[required]').forEach(inp => {
        const val = inp.value.trim();
        const okPhone = inp.type !== 'tel' || val.replace(/\D/g, '').length >= 9;
        const ok = val !== '' && okPhone;
        inp.classList.toggle('is-bad', !ok);
        if (!ok && !bad) bad = inp;
      });
      if (bad) {
        say(msg, 'Заполните телефон и имя — иначе мы не сможем с вами связаться.', 'is-bad');
        bad.focus();
        return;
      }

      const data = collect(form);
      data['Форма'] = title;
      data['Страница'] = location.href;

      const btn = form.querySelector('button[type="submit"]');
      const label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Отправляем…'; }

      try {
        await deliver(data);
        form.reset();
        form.querySelectorAll('.is-bad').forEach(el => el.classList.remove('is-bad'));
        say(msg, 'Спасибо! Заявка принята — свяжемся с вами в ближайшее время.', 'is-ok');
      } catch (err) {
        console.error(err);
        say(msg, 'Не получилось отправить. Позвоните нам: +375 (29) 000-00-00', 'is-bad');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = label; }
      }
    });
  }

  function collect(form) {
    const out = {};
    new FormData(form).forEach((v, k) => {
      const val = String(v).trim();
      if (!val) return;
      out[k] = out[k] ? out[k] + ', ' + val : val;
    });
    return out;
  }

  function say(node, text, cls) {
    if (!node) return;
    node.textContent = text;
    node.className = 'formmsg ' + cls;
  }

  async function deliver(data) {
    if (!FORM_CONFIG.ENDPOINT) {
      console.info('[KV-web] ENDPOINT не задан. Данные заявки:', data);
      await new Promise(r => setTimeout(r, 500));
      return;
    }
    if (FORM_CONFIG.MODE === 'telegram') {
      const lines = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n');
      const res = await fetch(FORM_CONFIG.ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: FORM_CONFIG.CHAT_ID, text: `🔔 ${FORM_CONFIG.SITE}\n\n${lines}` })
      });
      if (!res.ok) throw new Error('Telegram ' + res.status);
      return;
    }
    const res = await fetch(FORM_CONFIG.ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
  }
});
