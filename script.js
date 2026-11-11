const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/AF7PDFMCYF';
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) root.classList.add('rm');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const safe = fn => { try { fn(); } catch (e) { console.error(e); } };
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const easeIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  // ---------- load ----------
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('ready')));
  setTimeout(() => root.classList.add('ready'), 1200);

  // ---------- header ----------
  safe(() => {
    const bar = $('#bar');
    const f = () => bar.classList.toggle('scrolled', scrollY > 40);
    addEventListener('scroll', f, { passive: true }); f();
  });

  // ---------- magnetic buttons ----------
  safe(() => {
    if (reduce || !matchMedia('(pointer:fine)').matches) return;
    $$('[data-mag]').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * .22, y = (e.clientY - r.top - r.height / 2) * .32;
        b.style.transform = `translate(${x}px,${y}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  });

  // ---------- manifest: words fill in with scroll ----------
  const manifest = $('#manifest');
  let mWords = [];
  safe(() => {
    if (reduce || !manifest) return;
    const words = manifest.textContent.trim().split(/\s+/);
    manifest.innerHTML = words.map(w => `<span class="mw">${w}</span>`).join(' ');
    manifest.setAttribute('aria-label', words.join(' '));
    mWords = $$('.mw', manifest);
    mWords.forEach(w => w.style.opacity = .16);
  });

  // ---------- scroll scenes ----------
  const path = $('#path'), ages = $('#ages');
  const ov = $$('.ov', path || document).map(g => ({
    k: +g.dataset.k, g, d: $$('.d', g), t: $$('text', g)
  }));
  const steps = $$('.pstep'), pbars = $$('#pnav i');
  const progress = el => {
    const r = el.getBoundingClientRect();
    return clamp(-r.top / (r.height - innerHeight));
  };

  const updatePath = () => {
    if (reduce || !path) return;
    const p = progress(path), seg = p * 4;
    const idx = Math.min(3, Math.floor(seg));
    steps.forEach((s, i) => s.classList.toggle('on', i === idx));
    pbars.forEach((b, i) => b.style.setProperty('--f', clamp(seg - i)));
    ov.forEach(o => {
      const t = clamp((seg - o.k) / .75);
      const e = easeIO(t);
      o.d.forEach((d, i) => {
        const stagger = clamp((t * 1.35 - i * .12), 0, 1);
        d.style.strokeDashoffset = 1 - easeIO(stagger);
      });
      o.t.forEach(x => x.style.opacity = clamp((t - .55) / .35));
      const dimStart = o.k === 0 ? 2 : o.k + 1;
      o.g.style.opacity = o.k === 3 ? 1 : 1 - .82 * clamp(seg - dimStart);
    });
  };

  const bands = [
    { from: 25, to: 34, bg: '#f1ddd2', t: 'Кожа и профилактика. Чаще всего разговор о том, что делать не нужно, и о бережном уходе.' },
    { from: 35, to: 44, bg: '#dbe8e2', t: 'Появляется усталый взгляд и первые заломы. Время косметологии и точечных решений.' },
    { from: 45, to: 59, bg: '#e7d3c8', t: 'Овал лица, шея, веки. Обсуждаем, что действительно изменит вид, а что подождёт.' },
    { from: 60, to: 75, bg: '#c7dcd3', t: 'Свежий вид и здоровая кожа без погони за тридцатью годами. Прежде всего здоровье и безопасность.' }
  ];
  const num = $('#agesNum'), says = $('#agesT'), needle = $('#needle'), ticksWrap = $('#ticks');
  let ticks = [], curBand = -1, curAge = -1;
  safe(() => {
    if (!ticksWrap) return;
    for (let a = 25; a <= 75; a++) {
      const i = document.createElement('i');
      if (a % 5 === 0) i.classList.add('maj');
      if (a % 10 === 5) { const b = document.createElement('b'); b.textContent = a; i.appendChild(b); }
      ticksWrap.appendChild(i); ticks.push(i);
    }
    setAge(25, 0);
  });
  function setAge(a, p) {
    if (a !== curAge) {
      curAge = a; num.textContent = a;
      ticks.forEach((t, i) => t.classList.toggle('on', 25 + i <= a));
    }
    needle.style.left = (p * 100) + '%';
    const bi = bands.findIndex(b => a >= b.from && a <= b.to);
    if (bi !== curBand) {
      curBand = bi;
      says.classList.add('sw');
      setTimeout(() => { says.textContent = bands[bi].t; says.classList.remove('sw'); }, curBand === 0 && !says.textContent ? 0 : 250);
      ages.style.setProperty('--ages', bands[bi].bg);
    }
  }
  const updateAges = () => {
    if (reduce || !ages) return;
    const p = progress(ages);
    setAge(25 + Math.round(p * 50), p);
  };
  if (reduce) safe(() => { setAge(25, 0); says.textContent = bands.map(b => b.from + '–' + b.to + ': ' + b.t).join(' '); });

  // nav ticks click -> jump inside the pinned scene
  safe(() => {
    $$('#pnav i').forEach((b, i) => { b.style.cursor = 'pointer'; });
  });

  // ---------- one rAF-driven scroll loop ----------
  let tick = false;
  const frame = () => {
    tick = false;
    if (mWords.length) {
      const r = manifest.getBoundingClientRect();
      const p = clamp((innerHeight * .88 - r.top) / (r.height + innerHeight * .45));
      const n = mWords.length;
      mWords.forEach((w, i) => w.style.opacity = .16 + .84 * clamp(p * (n + 6) - i, 0, 1));
    }
    updatePath(); updateAges();
    const fig = $('.face--hero');
    if (fig && !reduce && scrollY < innerHeight * 1.2) fig.style.transform = `translateY(${scrollY * .07}px)`;
  };
  const onScroll = () => { if (!tick) { tick = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  frame();

  // ---------- reveals ----------
  safe(() => {
    if (reduce) return;
    const sel = '.zones__intro>*, .zones__panel, .srv, .services__note, .faq details, .contact__l>*, .form';
    const els = $$(sel);
    els.forEach(el => {
      const sibs = [...el.parentElement.children].filter(x => els.includes(x));
      el.dataset.r = ''; el.style.setProperty('--d', (Math.max(0, sibs.indexOf(el)) * .07) + 's');
    });
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));
  });

  // ---------- zones (live) ----------
  const ZONES = [
    { id: 'forehead', name: 'Лоб и межбровье', x: 348, y: 212, tx: 470, info: 'Складки на лбу и между бровями, опущенные брови. Косметология и, при необходимости, хирургия.' },
    { id: 'eyes', name: 'Веки и взгляд', x: 366, y: 322, tx: 480, info: 'Тяжесть верхних век, мешки, усталый взгляд. Обсудим и хирургию, и мягкие методики.' },
    { id: 'nose', name: 'Нос', x: 432, y: 392, tx: 500, info: 'Форма, профиль, дыхание. Врач покажет на разметке, что возможно, а что нет.' },
    { id: 'cheeks', name: 'Щёки и скулы', x: 330, y: 428, tx: 440, info: 'Потерянный объём, провисание щёк. Контурная пластика, липофилинг или лифтинг.' },
    { id: 'lips', name: 'Губы и контур рта', x: 404, y: 480, tx: 480, info: 'Объём, форма, носогубные складки, кожа вокруг рта.' },
    { id: 'jaw', name: 'Подбородок и овал', x: 372, y: 548, tx: 460, info: 'Линия челюсти, подбородок, «второй подбородок». Подберём между косметологией и операцией.' },
    { id: 'neck', name: 'Шея', x: 346, y: 650, tx: 430, info: 'Кожа и мышцы шеи, возрастные изменения. Возможны и аппаратные, и хирургические решения.' },
    { id: 'body', name: 'Тело', x: null, info: 'Живот, грудь, контуры. Для этого нужна очная консультация и осмотр.' }
  ];
  const sel = new Set();
  const hot = $('#hot'), chips = $('#chips'), zinfo = $('#zinfo'), zonesField = $('#zonesField'), zsum = $('#zsum');
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs = {}, parent) => { const el = document.createElementNS(NS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); parent && parent.appendChild(el); return el; };
  const hsEls = {}, chipEls = {};
  safe(() => {
    ZONES.forEach(z => {
      if (z.x != null) {
        const g = mk('g', { class: 'hs', tabindex: 0, role: 'button', 'aria-pressed': 'false', 'aria-label': z.name }, hot);
        mk('path', { class: 'lead', pathLength: 1, d: `M${z.x + 12} ${z.y}H${z.tx - 8}` }, g);
        const t = mk('text', { class: 'tag', x: z.tx, y: z.y + 7 }, g); t.textContent = z.name;
        mk('circle', { class: 'halo', cx: z.x, cy: z.y, r: 11 }, g);
        mk('circle', { class: 'ring', cx: z.x, cy: z.y, r: 11 }, g);
        mk('circle', { class: 'hit', cx: z.x, cy: z.y, r: 28 }, g);
        g.addEventListener('click', () => toggle(z.id));
        g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(z.id); } });
        hsEls[z.id] = g;
      }
      const c = document.createElement('button');
      c.type = 'button'; c.className = 'chip'; c.textContent = z.name; c.setAttribute('aria-pressed', 'false');
      c.addEventListener('click', () => toggle(z.id));
      chips.appendChild(c); chipEls[z.id] = c;
    });
    render();
  });
  function toggle(id) { sel.has(id) ? sel.delete(id) : sel.add(id); render(); }
  function render() {
    ZONES.forEach(z => {
      const on = sel.has(z.id);
      chipEls[z.id].setAttribute('aria-pressed', on);
      hsEls[z.id] && hsEls[z.id].setAttribute('aria-pressed', on);
    });
    const chosen = ZONES.filter(z => sel.has(z.id));
    zinfo.innerHTML = chosen.length
      ? chosen.map(z => `<div class="zi"><h3>${z.name}</h3><p>${z.info}</p></div>`).join('')
      : '<p class="zinfo__empty">Нажмите на точку на рисунке или на название зоны. Здесь появится, что обычно обсуждают.</p>';
    const names = chosen.map(z => z.name);
    zonesField.value = names.join(', ');
    if (names.length) { zsum.hidden = false; zsum.textContent = 'В заявку попадёт: ' + names.join(', ').toLowerCase() + '.'; }
    else zsum.hidden = true;
  }

  // ---------- form ----------
  const form = $('#leadForm'), msg = $('#formMsg');
  form && form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]'), orig = btn.textContent;
    const payload = {}; new FormData(form).forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    if (!payload.name || !payload.phone) { msg.textContent = 'Укажите имя и телефон или ник.'; return; }
    payload.comment = [
      payload.via ? 'Удобнее: ' + payload.via : '',
      payload.zones ? 'Зоны: ' + payload.zones : '',
      payload.note ? 'Комментарий: ' + payload.note : ''
    ].filter(Boolean).join('\n');
    btn.disabled = true; btn.textContent = 'Отправляем...'; msg.textContent = '';
    try {
      const r = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      msg.textContent = 'Заявка отправлена. Администратор свяжется с вами.';
      form.reset(); sel.clear(); render();
    } catch (err) { console.error(err); msg.textContent = 'Не получилось отправить. Попробуйте ещё раз.'; }
    finally { btn.disabled = false; btn.textContent = orig; }
  });
})();
