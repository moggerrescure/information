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

  if (globeCanvas && globeViewport && typeof THREE !== 'undefined') {
    const HUBS = {
      minsk: {
        id: 'minsk',
        name: 'Минск (HQ)',
        flag: '🇧🇾',
        tag: '⭐ Главный офис',
        desc: 'Штаб-квартира KV-web. Центр заказной веб-разработки, UI/UX дизайна и сквозной аналитики. 50+ реализованных проектов.',
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
        flag: '🇦🇪',
        tag: '🌍 Middle East • E-com',
        desc: 'Разработка мультиязычных интернет-магазинов, интеграция платежных шлюзов MENA и презентационные порталы недвижимости.',
        lat: 25.2048,
        lon: 55.2708,
        color: 0xc4f449,
        colorHex: '#C4F449',
        region: 'mena'
      },
      london: {
        id: 'london',
        name: 'Лондон',
        flag: '🇬🇧',
        tag: '🚀 Western Europe • Fintech',
        desc: 'Веб-сервисы, личные кабинеты для финтех-стартапов и B2B SaaS платформ по строгим европейским стандартам.',
        lat: 51.5074,
        lon: -0.1278,
        color: 0x396ceb,
        colorHex: '#396CEB',
        region: 'eu'
      },
      newyork: {
        id: 'newyork',
        name: 'Нью-Йорк',
        flag: '🇺🇸',
        tag: '⚡ USA • B2B Platforms',
        desc: 'Корпоративные порталы, высоконагруженные лендинги и маркетинговые воронки для клиентов на рынке США и Канады.',
        lat: 40.7128,
        lon: -74.0060,
        color: 0x7574ff,
        colorHex: '#7574FF',
        region: 'us'
      },
      astana: {
        id: 'astana',
        name: 'Астана',
        flag: '🇰🇿',
        tag: '🤝 Центральная Азия',
        desc: 'Казахстан и рынки Центральной Азии: корпоративные сайты производственных компаний, каталоги и автоматизация продаж.',
        lat: 51.1694,
        lon: 71.4491,
        color: 0x00b1c9,
        colorHex: '#00B1C9',
        region: 'cis'
      },
      warsaw: {
        id: 'warsaw',
        name: 'Варшава',
        flag: '🇵🇱',
        tag: '🇪🇺 Central Europe • GDPR',
        desc: 'Разработка веб-решений для европейского рынка: соответствие GDPR, мультиязычность и интеграции с CRM системами ЕС.',
        lat: 52.2297,
        lon: 21.0122,
        color: 0x396ceb,
        colorHex: '#396CEB',
        region: 'eu'
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

    // Освещение: мягкий студийный свет со световым контуром
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.82);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xbdd6ff, 1.35);
    sunLight.position.set(5, 4, 6);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x396ceb, 0.8);
    rimLight.position.set(-6, -2, -5);
    scene.add(rimLight);

    // Текстура глобуса
    const textureLoader = new THREE.TextureLoader();
    const texturePath = (window.location.pathname.includes('/landing/') ? '' : 'landing/') + 'img/globe-texture.png';
    const globeTexture = textureLoader.load(texturePath, (t) => {
      t.minFilter = THREE.LinearFilter;
      t.generateMipmaps = true;
    }, undefined, () => {
      // Запасной процедурный градиент, если текстура не найдена
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 256;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#06112d';
      ctx.fillRect(0, 0, 512, 256);
      globeMesh.material.map = new THREE.CanvasTexture(canvas);
      globeMesh.material.needsUpdate = true;
    });

    // Сфера планеты
    const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const globeMat = new THREE.MeshStandardMaterial({
      map: globeTexture,
      roughness: 0.65,
      metalness: 0.12,
      emissive: 0x071536,
      emissiveIntensity: 0.25
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // Атмосферный ореол
    const haloGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.035, 48, 48);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x396ceb,
      transparent: true,
      opacity: 0.16,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    globeGroup.add(haloMesh);

    // Коллекции интерактивных 3D объектов
    const pinMeshes = [];
    const beaconRings = [];
    const arcObjects = [];
    const pulseParticles = [];

    // Создание 3D пинов хабов
    Object.keys(HUBS).forEach(key => {
      const hub = HUBS[key];
      const pos = latLonToVec3(hub.lat, hub.lon, GLOBE_RADIUS);
      const normal = pos.clone().normalize();

      // Центр маркера
      const pinRadius = hub.isHQ ? 0.052 : 0.038;
      const pinGeo = new THREE.SphereGeometry(pinRadius, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({
        color: hub.color,
        transparent: true,
        opacity: 0.95
      });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.copy(pos.clone().add(normal.clone().multiplyScalar(0.02)));
      pinMesh.userData = { hubKey: key, hubData: hub };
      globeGroup.add(pinMesh);
      pinMeshes.push(pinMesh);

      // Пульсирующее кольцо маяка
      const ringGeo = new THREE.RingGeometry(pinRadius * 1.15, pinRadius * 1.7, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: hub.color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos.clone().add(normal.clone().multiplyScalar(0.015)));
      ringMesh.lookAt(pos.clone().add(normal.clone().multiplyScalar(2)));
      globeGroup.add(ringMesh);
      beaconRings.push({ ring: ringMesh, baseScale: 1, baseOpacity: 0.75, offset: Math.random() * Math.PI });
    });

    // Создание 3D дуг сети (от Минска HQ ко всем остальным хабам)
    const minskPos = latLonToVec3(HUBS.minsk.lat, HUBS.minsk.lon, GLOBE_RADIUS);

    Object.keys(HUBS).forEach(key => {
      if (key === 'minsk') return;
      const target = HUBS[key];
      const targetPos = latLonToVec3(target.lat, target.lon, GLOBE_RADIUS);

      const dist = minskPos.distanceTo(targetPos);
      const mid = minskPos.clone().add(targetPos).multiplyScalar(0.5);
      mid.normalize();
      const arcHeight = GLOBE_RADIUS + Math.max(0.24, dist * 0.28);
      mid.multiplyScalar(arcHeight);

      const curve = new THREE.QuadraticBezierCurve3(minskPos, mid, targetPos);
      const points = curve.getPoints(50);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
      const curveMat = new THREE.LineBasicMaterial({
        color: target.color,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending
      });
      const curveLine = new THREE.Line(curveGeo, curveMat);
      curveLine.userData = { hubKey: key, region: target.region };
      globeGroup.add(curveLine);
      arcObjects.push(curveLine);

      // Летящий световой импульс по дуге
      const particleGeo = new THREE.SphereGeometry(0.024, 8, 8);
      const particleMat = new THREE.MeshBasicMaterial({
        color: target.color,
        blending: THREE.AdditiveBlending
      });
      const particleMesh = new THREE.Mesh(particleGeo, particleMat);
      globeGroup.add(particleMesh);
      pulseParticles.push({
        mesh: particleMesh,
        curve,
        speed: 0.0035 + (1 / dist) * 0.003,
        progress: Math.random(),
        hubKey: key
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
    let isTransitioning = true;
    let lastUserActionTime = Date.now();

    globeGroup.rotation.x = targetRotX;
    globeGroup.rotation.y = targetRotY;

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

      // Подсветка соответствующих дуг
      arcObjects.forEach(arc => {
        const isRelated = arc.userData.hubKey === hubKey || hubKey === 'minsk';
        arc.material.opacity = isRelated ? 0.9 : 0.15;
      });

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

    const onPointerMove = (clientX, clientY) => {
      if (!isDragging) return;
      const dx = clientX - lastMouseX;
      const dy = clientY - lastMouseY;
      lastMouseX = clientX;
      lastMouseY = clientY;

      velY = dx * 0.006;
      velX = dy * 0.006;

      globeGroup.rotation.y += velY;
      globeGroup.rotation.x = Math.max(-0.85, Math.min(0.85, globeGroup.rotation.x + velX));
      lastUserActionTime = Date.now();
    };

    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    const onPointerUp = (clientX, clientY) => {
      if (!isDragging) return;
      isDragging = false;

      // Если перемещение было меньше 5px — это клик по пину
      const dist = Math.hypot(clientX - dragStartX, clientY - dragStartY);
      if (dist < 5) {
        const rect = globeCanvas.getBoundingClientRect();
        mouseVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouseVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouseVec, camera);
        const hits = raycaster.intersectObjects(pinMeshes, false);
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
        // Минимизация разницы углов для кратчайшего пути вращения
        let diffY = (targetRotY - globeGroup.rotation.y) % (Math.PI * 2);
        if (diffY < -Math.PI) diffY += Math.PI * 2;
        if (diffY > Math.PI) diffY -= Math.PI * 2;

        globeGroup.rotation.y += diffY * 0.08;
        globeGroup.rotation.x += (targetRotX - globeGroup.rotation.x) * 0.08;

        if (Math.abs(diffY) < 0.002 && Math.abs(targetRotX - globeGroup.rotation.x) < 0.002) {
          isTransitioning = false;
        }
      } else if (!isDragging) {
        // Инерция после броска мышью
        velX *= 0.92;
        velY *= 0.92;
        globeGroup.rotation.y += velY;
        globeGroup.rotation.x = Math.max(-0.85, Math.min(0.85, globeGroup.rotation.x + velX));

        // Фоновое автовращение, если включено и пользователь не трогает 4 сек
        if (autoSpin && (Date.now() - lastUserActionTime > 3500)) {
          globeGroup.rotation.y += 0.0025;
        }
      }

      // Плавный зум камеры
      camera.position.z += (targetZoomZ - camera.position.z) * 0.1;

      // Анимация маяков хабов
      beaconRings.forEach((b, i) => {
        const pulse = (Math.sin(elapsed * 3.5 + b.offset) + 1) * 0.5;
        const scale = 1 + pulse * 1.3;
        b.ring.scale.set(scale, scale, scale);
        b.ring.material.opacity = (1 - pulse) * 0.8;
      });

      // Анимация летящих световых импульсов по дугам
      pulseParticles.forEach(p => {
        p.progress = (p.progress + p.speed) % 1;
        const pt = p.curve.getPoint(p.progress);
        p.mesh.position.copy(pt);
      });

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
