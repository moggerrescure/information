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
    const HUBS = {
      minsk: {
        id: 'minsk',
        name: 'Минск (HQ)',
        country: 'Беларусь',
        flag: '🇧🇾',
        badge: 'Штаб-квартира',
        tag: '⭐ Главный офис',
        desc: 'Штаб-квартира KV-web. Центр заказной веб-разработки, UI/UX дизайна и сквозной аналитики. 50+ реализованных проектов.',
        caseStudy: 'Разработка 40+ корпоративных сайтов, B2B-порталов и интернет-магазинов. Сквозная аналитика и SEO в топ-3.',
        lat: 53.9045,
        lon: 27.5615,
        color: 0xff6915,
        colorHex: '#FF6915',
        region: 'by',
        isHQ: true
      },
      dubai: {
        id: 'dubai',
        name: 'Дубай',
        country: 'ОАЭ',
        flag: '🇦🇪',
        badge: 'E-Commerce & Luxury',
        tag: '🌍 Middle East • E-com',
        desc: 'Разработка мультиязычных интернет-магазинов, интеграция платежных шлюзов MENA и презентационные порталы недвижимости.',
        caseStudy: 'Премиальный интернет-магазин с шлюзами Stripe/Tap, а также интерактивный каталог элитной недвижимости с 3D-турами.',
        lat: 25.2048,
        lon: 55.2708,
        color: 0xc4f449,
        colorHex: '#C4F449',
        region: 'mena'
      },
      london: {
        id: 'london',
        name: 'Лондон',
        country: 'Великобритания',
        flag: '🇬🇧',
        badge: 'Fintech & SaaS',
        tag: '🚀 Western Europe • Fintech',
        desc: 'Веб-сервисы, личные кабинеты для финтех-стартапов и B2B SaaS платформ по строгим европейским стандартам.',
        caseStudy: 'Личный кабинет финтех-платформы, калькулятор доходности в реальном времени и интеграция Open Banking API.',
        lat: 51.5074,
        lon: -0.1278,
        color: 0x396ceb,
        colorHex: '#396CEB',
        region: 'eu'
      },
      newyork: {
        id: 'newyork',
        name: 'Нью-Йорк',
        country: 'США',
        flag: '🇺🇸',
        badge: 'B2B Платформы',
        tag: '⚡ USA • B2B Platforms',
        desc: 'Корпоративные порталы, высоконагруженные лендинги и маркетинговые воронки для клиентов на рынке США и Канады.',
        caseStudy: 'Высоконагруженный B2B маркетплейс оптовых поставок, оптимизация конверсии воронки и интеграция с CRM (HubSpot, Salesforce).',
        lat: 40.7128,
        lon: -74.0060,
        color: 0x7574ff,
        colorHex: '#7574FF',
        region: 'us'
      },
      astana: {
        id: 'astana',
        name: 'Астана',
        country: 'Казахстан',
        flag: '🇰🇿',
        badge: 'Корп. порталы & 1С',
        tag: '🤝 Центральная Азия',
        desc: 'Казахстан и рынки Центральной Азии: корпоративные сайты производственных компаний, каталоги и автоматизация продаж.',
        caseStudy: 'Официальный портал холдинга, B2B каталог на 15 000 товаров с двусторонней интеграцией 1С и кабинетом дилера.',
        lat: 51.1694,
        lon: 71.4491,
        color: 0x00b1c9,
        colorHex: '#00B1C9',
        region: 'cis'
      },
      warsaw: {
        id: 'warsaw',
        name: 'Варшава',
        country: 'Польша',
        flag: '🇵🇱',
        badge: 'EU Решения & GDPR',
        tag: '🇪🇺 Central Europe • GDPR',
        desc: 'Разработка веб-решений для европейского рынка: соответствие GDPR, мультиязычность и интеграции с CRM системами ЕС.',
        caseStudy: 'Сервис аренды спецтехники с автоматическим расчетом стоимости, мультиязычностью и полным соответствием GDPR.',
        lat: 52.2297,
        lon: 21.0122,
        color: 0x396ceb,
        colorHex: '#396CEB',
        region: 'eu'
      }
    };

    // Золотые границы стран и регионов присутствия
    const REGION_BOUNDARIES = {
      by: [
        [51.2, 23.5], [52.1, 23.2], [53.6, 23.8], [55.8, 26.5], [56.2, 28.2],
        [55.9, 30.9], [54.5, 31.8], [53.4, 32.2], [52.1, 31.6], [51.3, 30.4],
        [51.2, 27.5], [51.2, 23.5]
      ],
      mena: [
        [21.5, 51.5], [24.0, 51.2], [26.2, 56.1], [25.5, 56.8], [24.2, 56.0],
        [23.0, 55.4], [22.0, 54.8], [21.5, 51.5]
      ],
      london: [
        [49.8, -5.5], [50.8, 1.6], [53.2, 0.4], [55.8, -1.8], [58.6, -3.2],
        [58.6, -5.2], [56.2, -5.8], [54.5, -3.2], [51.5, -4.8], [49.8, -5.5]
      ],
      us: [
        [36.5, -76.2], [39.0, -74.8], [40.8, -73.6], [42.4, -70.8], [44.8, -66.9],
        [45.1, -73.5], [43.0, -78.9], [39.8, -79.6], [37.2, -78.8], [36.5, -76.2]
      ],
      cis: [
        [45.2, 50.4], [51.1, 50.8], [54.8, 69.1], [54.2, 76.8], [50.1, 83.2],
        [43.2, 80.2], [42.1, 70.3], [44.8, 55.2], [45.2, 50.4]
      ],
      warsaw: [
        [49.1, 19.0], [49.4, 22.8], [51.5, 23.9], [54.2, 22.9], [54.5, 18.6],
        [54.0, 14.3], [51.0, 15.0], [49.1, 19.0]
      ],
      // Контуры континентов для подсветки при наведении
      europe: [
        [36.0, -9.5], [43.5, -9.3], [48.0, -4.8], [54.0, 8.5], [58.0, 5.0],
        [62.0, 5.0], [70.5, 28.0], [67.0, 42.0], [58.0, 55.0], [45.0, 48.0],
        [42.0, 28.0], [36.0, 28.0], [36.0, -5.5], [36.0, -9.5]
      ],
      north_america: [
        [25.0, -80.5], [30.0, -81.0], [35.0, -75.5], [44.0, -64.0], [52.0, -55.0],
        [58.0, -64.0], [68.0, -125.0], [58.0, -135.0], [48.0, -124.0], [32.0, -117.0],
        [23.0, -110.0], [20.0, -105.0], [18.0, -95.0], [25.0, -97.0], [29.0, -89.0],
        [25.0, -80.5]
      ]
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

    // Освещение: студийный свет со световым контуром
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.88);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xbdd6ff, 1.45);
    sunLight.position.set(5, 4, 6);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x396ceb, 0.85);
    rimLight.position.set(-6, -2, -5);
    scene.add(rimLight);

    // Текстура глобуса
    const textureLoader = new THREE.TextureLoader();
    const texturePath = (window.location.pathname.includes('/landing/') ? '' : 'landing/') + 'img/globe-texture.png';
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
      roughness: 0.55,
      metalness: 0.08,
      emissive: 0x050f28,
      emissiveIntensity: 0.2
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

    // Золотые контуры стран и континентов
    const goldenLines = {};
    const BORDER_RADIUS = GLOBE_RADIUS * 1.005;

    Object.keys(REGION_BOUNDARIES).forEach(regKey => {
      const rawCoords = REGION_BOUNDARIES[regKey];
      const pts = rawCoords.map(([lat, lon]) => latLonToVec3(lat, lon, BORDER_RADIUS));
      const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.25);
      const densePts = curve.getPoints(rawCoords.length * 6);
      const borderGeo = new THREE.BufferGeometry().setFromPoints(densePts);
      const borderMat = new THREE.LineBasicMaterial({
        color: 0xF5BA42,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending
      });
      const borderLine = new THREE.LineLoop(borderGeo, borderMat);
      borderLine.userData = { regionKey: regKey };
      globeGroup.add(borderLine);
      goldenLines[regKey] = borderLine;
    });

    // Коллекции интерактивных 3D объектов
    const hubObjects = {};
    const interactiveHitMeshes = [];
    const beaconRings = [];
    const arcObjects = [];
    const pulseParticles = [];

    // Создание пульсирующих аккуратных точек хабов (точно как в исходном плоском макете .wpin__dot + .wpin__ripple)
    Object.keys(HUBS).forEach(key => {
      const hub = HUBS[key];
      const basePos = latLonToVec3(hub.lat, hub.lon, GLOBE_RADIUS * 1.002);
      const normal = basePos.clone().normalize();

      const dotColor = hub.isHQ ? 0xFF6915 : 0xC4F449; // Фирменный Orange для HQ, Lime для хабов
      const dotRadius = hub.isHQ ? 0.026 : 0.018;

      // 1. Темная контрастная окантовка (как border: 1.5px solid #060e28 в оригинале)
      const borderGeo = new THREE.RingGeometry(dotRadius * 0.85, dotRadius * 1.25, 28);
      const borderMat = new THREE.MeshBasicMaterial({
        color: 0x060E28,
        side: THREE.DoubleSide
      });
      const borderMesh = new THREE.Mesh(borderGeo, borderMat);
      borderMesh.position.copy(basePos.clone().add(normal.clone().multiplyScalar(0.002)));
      borderMesh.lookAt(basePos.clone().add(normal.clone().multiplyScalar(2)));
      globeGroup.add(borderMesh);

      // 2. Светящаяся яркая центральная точка (.wpin__dot)
      const coreGeo = new THREE.SphereGeometry(dotRadius, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({
        color: dotColor
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.position.copy(basePos.clone().add(normal.clone().multiplyScalar(0.003)));
      globeGroup.add(coreMesh);

      // 3. Мягкий световой ореол вокруг точки
      const haloGeo = new THREE.SphereGeometry(dotRadius * 1.9, 16, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: dotColor,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending
      });
      const haloMesh = new THREE.Mesh(haloGeo, haloMat);
      haloMesh.position.copy(basePos.clone().add(normal.clone().multiplyScalar(0.003)));
      globeGroup.add(haloMesh);

      // 4. Пульсирующее расширяющееся кольцо волны (.wpin__ripple: scale 0.5 -> 2.6, opacity 0.95 -> 0)
      const ringGeo = new THREE.RingGeometry(dotRadius * 1.1, dotRadius * 1.28, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: dotColor,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(basePos.clone().add(normal.clone().multiplyScalar(0.004)));
      ringMesh.lookAt(basePos.clone().add(normal.clone().multiplyScalar(2)));
      globeGroup.add(ringMesh);

      beaconRings.push({
        ring: ringMesh,
        coreMesh,
        haloMesh,
        duration: hub.isHQ ? 2.0 : 2.8, // Точные тайминги из оригинального CSS: 2s и 2.8s
        offset: Math.random() * 2.0,
        isHQ: hub.isHQ
      });

      // 5. Невидимый хитбокс для легкого наведения мышью
      const hitGeo = new THREE.SphereGeometry(0.085, 8, 8);
      const hitMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitMesh = new THREE.Mesh(hitGeo, hitMat);
      hitMesh.position.copy(basePos);
      hitMesh.userData = { hubKey: key, hubData: hub, basePos, normal };
      globeGroup.add(hitMesh);
      interactiveHitMeshes.push(hitMesh);

      hubObjects[key] = {
        data: hub,
        basePos,
        normal,
        coreMesh,
        haloMesh,
        ringMesh
      };
    });

    // Создание 3D дуг сети (от Минска HQ ко всем остальным хабам)
    const minskHub = hubObjects['minsk'];
    const minskPos = minskHub.basePos;

    Object.keys(HUBS).forEach(key => {
      if (key === 'minsk') return;
      const targetHub = hubObjects[key];
      const target = targetHub.data;
      const targetPos = targetHub.basePos;

      const dist = minskPos.distanceTo(targetPos);
      const mid = minskPos.clone().add(targetPos).multiplyScalar(0.5);
      mid.normalize();
      const arcHeight = GLOBE_RADIUS + Math.max(0.18, dist * 0.22);
      mid.multiplyScalar(arcHeight);

      const curve = new THREE.QuadraticBezierCurve3(minskPos, mid, targetPos);
      const points = curve.getPoints(50);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
      const curveMat = new THREE.LineBasicMaterial({
        color: 0xC4F449,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending
      });
      const curveLine = new THREE.Line(curveGeo, curveMat);
      curveLine.userData = { hubKey: key, region: target.region, baseColor: 0xC4F449 };
      globeGroup.add(curveLine);
      arcObjects.push(curveLine);

      // Аккуратный микро-импульс данных по дуге
      const particleGeo = new THREE.SphereGeometry(0.015, 8, 8);
      const particleMat = new THREE.MeshBasicMaterial({
        color: 0xC4F449,
        blending: THREE.AdditiveBlending
      });
      const particleMesh = new THREE.Mesh(particleGeo, particleMat);
      globeGroup.add(particleMesh);
      pulseParticles.push({
        mesh: particleMesh,
        curve,
        speed: 0.0035 + (1 / dist) * 0.0026,
        progress: Math.random(),
        hubKey: key,
        baseColor: 0xC4F449
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

    // Подсветка золотых контуров региона
    const highlightGoldenRegion = (hubKey) => {
      // Сброс золотых линий
      Object.keys(goldenLines).forEach(k => {
        goldenLines[k].material.opacity = 0.18;
        goldenLines[k].material.color.setHex(0xF5BA42);
      });

      // Подсветка линии связанной страны / континента
      if (hubKey) {
        const hub = HUBS[hubKey];
        const matchKeys = [];
        if (hubKey === 'minsk') matchKeys.push('by', 'europe');
        else if (hubKey === 'dubai') matchKeys.push('mena');
        else if (hubKey === 'london') matchKeys.push('london', 'europe');
        else if (hubKey === 'newyork') matchKeys.push('us', 'north_america');
        else if (hubKey === 'astana') matchKeys.push('cis');
        else if (hubKey === 'warsaw') matchKeys.push('warsaw', 'europe');

        matchKeys.forEach(mk => {
          if (goldenLines[mk]) {
            goldenLines[mk].material.opacity = 0.95;
            goldenLines[mk].material.color.setHex(0xFFD700); // Яркое чистое золото
          }
        });

        // Подсветка дуги к этому хабу золотым
        arcObjects.forEach(arc => {
          if (arc.userData.hubKey === hubKey) {
            arc.material.color.setHex(0xFFD700);
            arc.material.opacity = 1.0;
          } else {
            arc.material.color.setHex(arc.userData.baseColor);
            arc.material.opacity = (hubKey === 'minsk' || arc.userData.hubKey === activeHubKey) ? 0.8 : 0.15;
          }
        });
      } else {
        arcObjects.forEach(arc => {
          arc.material.color.setHex(arc.userData.baseColor);
          arc.material.opacity = 0.6;
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
        const on = t.dataset.region === hub.region;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', String(on));
      });

      highlightGoldenRegion(hubKey);

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
        } else if (reg === 'mena') {
          selectHub('dubai', true);
        } else if (reg === 'eu') {
          selectHub('london', true);
        } else if (reg === 'us') {
          selectHub('newyork', true);
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

          // Подсвечиваем золотые контуры
          highlightGoldenRegion(hitKey);
          globeCanvas.style.cursor = 'pointer';
        }
      } else {
        if (hoveredHubKey !== null) {
          hoveredHubKey = null;
          highlightGoldenRegion(activeHubKey);
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
      highlightGoldenRegion(activeHubKey);
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

      // Анимация пульсирующих волн радара (точно как @keyframes pinPulse из плоского макета: scale 0.5 -> 2.6, opacity 0.95 -> 0)
      beaconRings.forEach((b) => {
        const phase = ((elapsed + b.offset) % b.duration) / b.duration;
        // Плавное кубическое ускорение волны
        const easedPhase = Math.pow(phase, 0.85);
        const scale = 0.5 + easedPhase * 2.1;
        b.ring.scale.set(scale, scale, scale);
        b.ring.material.opacity = Math.max(0, (1 - easedPhase) * 0.92);

        // Мягкое свечение ореола микро-точки
        const pulse = Math.sin(elapsed * 3.0 + b.offset) * 0.12;
        b.haloMesh.scale.set(1 + pulse, 1 + pulse, 1 + pulse);
      });

      // Анимация летящих световых импульсов по дугам
      pulseParticles.forEach(p => {
        p.progress = (p.progress + p.speed) % 1;
        const pt = p.curve.getPoint(p.progress);
        p.mesh.position.copy(pt);

        // Если дуга подсвечена золотом, частица тоже золотая
        if (hoveredHubKey === p.hubKey || activeHubKey === p.hubKey) {
          p.mesh.material.color.setHex(0xFFD700);
          p.mesh.scale.set(1.3, 1.3, 1.3);
        } else {
          p.mesh.material.color.setHex(p.baseColor);
          p.mesh.scale.set(1, 1, 1);
        }
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
