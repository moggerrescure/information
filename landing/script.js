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
