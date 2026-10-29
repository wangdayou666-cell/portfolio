(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;

  /* torn paper edges */
  function tear(el) {
    const pts = [];
    for (let x = 0; x <= 100; x += 4) pts.push(`${x}% ${rnd(0, 6).toFixed(1)}px`);
    for (let x = 100; x >= 0; x -= 4) pts.push(`${x}% calc(100% - ${rnd(0, 6).toFixed(1)}px)`);
    el.style.clipPath = `polygon(${pts.join(',')})`;
  }
  $$('.torn').forEach(tear);

  /* tap a paper piece to straighten and lift it */
  $$('.piece').forEach(p => p.addEventListener('click', e => {
    if (e.target.closest('a,button,.drag,.l')) return;
    const on = !p.classList.contains('lift');
    $$('.piece.lift').forEach(q => q.classList.remove('lift'));
    if (on) p.classList.add('lift');
  }));

  /* ransom-note name: tap a letter to swap its cut-out */
  const STY = 7;
  const restyle = (l, n) => {
    l.className = l.className.replace(/\bs\d\b/, 's' + n);
    l.style.setProperty('--r', rnd(-8, 8).toFixed(1) + 'deg');
  };
  $$('.ransom .l').forEach(l => l.addEventListener('click', () => {
    const cur = +((l.className.match(/\bs(\d)\b/) || [0, 1])[1]);
    restyle(l, cur % STY + 1);
  }));

  /* copy buttons */
  $$('[data-copy]').forEach(b => b.addEventListener('click', () => {
    const el = document.getElementById(b.dataset.copy), t = el.textContent.trim(), old = b.textContent;
    const done = () => { b.textContent = '복사됨!'; setTimeout(() => (b.textContent = old), 1300); };
    const sel = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    try { navigator.clipboard.writeText(t).then(done, sel); } catch (_) { sel(); }
  }));

  /* drag collage stickers (mouse / trackpad) */
  if (fine) $$('.drag').forEach(el => {
    let sx, sy, ox = 0, oy = 0, down = false;
    el.addEventListener('pointerdown', e => { down = true; el.setPointerCapture(e.pointerId); sx = e.clientX - ox; sy = e.clientY - oy; el.classList.add('grab'); });
    el.addEventListener('pointermove', e => { if (!down) return; ox = e.clientX - sx; oy = e.clientY - sy; el.style.translate = `${ox}px ${oy}px`; });
    const up = () => { down = false; el.classList.remove('grab'); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  });

  /* sticker tray */
  const TYPES = {
    heart: { cls: 'g', txt: '♥', c: 'var(--hot)' },
    wow: { cls: 'burst', txt: 'WOW!', c: 'var(--lemon)', fg: 'var(--cherry)' },
    like: { cls: 'circle', txt: '좋아요', c: 'var(--mint)' },
    best: { cls: 'circle', txt: '最棒!', c: 'var(--lilac)' },
    nw: { cls: 'pill', txt: 'NEW', c: 'var(--ink)', fg: '#fff' },
    ok: { cls: 'burst', txt: 'OK!', c: 'var(--hot)', fg: '#fff' },
    flower: { cls: 'g', txt: '✿', c: 'var(--cherry)' },
    hanzh: { cls: 'circle', txt: '한⇄中', c: 'var(--sky)' },
    pick: { cls: 'burst', txt: '채용!', c: 'var(--blush)', fg: 'var(--cherry)' }
  };
  const make = t => {
    const d = TYPES[t], el = document.createElement('div');
    el.className = 'st st-' + d.cls; el.dataset.t = t;
    el.style.setProperty('--c', d.c); if (d.fg) el.style.setProperty('--fg', d.fg);
    const s = document.createElement('span'); s.className = 'in'; s.textContent = d.txt; el.appendChild(s);
    return el;
  };

  const fab = $('#fab'), tray = $('#tray'), picks = $('#picks');
  if (!fab) return;
  const layer = document.createElement('div'); layer.id = 'layer'; document.body.appendChild(layer);
  const KEY = 'xxy-stickers:' + location.pathname;
  const clampX = x => Math.max(0, Math.min(x, layer.clientWidth - 84));
  const clampY = y => Math.max(0, Math.min(y, layer.clientHeight - 84));

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify($$('.placed', layer).map(s => ({
        t: s.dataset.t, x: parseFloat(s.style.left) / Math.max(1, layer.clientWidth), y: parseFloat(s.style.top), r: s.style.getPropertyValue('--r')
      }))));
    } catch (_) {}
  }
  function bind(s) {
    let sx, sy, x0, y0, down = false, moved = false, last = 0;
    s.addEventListener('pointerdown', e => {
      down = true; moved = false; s.setPointerCapture(e.pointerId);
      sx = e.clientX; sy = e.clientY; x0 = parseFloat(s.style.left); y0 = parseFloat(s.style.top);
      s.classList.add('grab'); e.preventDefault();
    });
    s.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      s.style.left = clampX(x0 + dx) + 'px'; s.style.top = clampY(y0 + dy) + 'px';
    });
    s.addEventListener('pointerup', () => {
      down = false; s.classList.remove('grab');
      if (!moved) { const now = Date.now(); if (now - last < 420) { s.remove(); save(); return; } last = now; }
      save();
    });
    s.addEventListener('pointercancel', () => { down = false; s.classList.remove('grab'); });
  }
  function place(t, x, y, r, anim) {
    const s = make(t); s.classList.add('placed'); if (anim) s.classList.add('pop');
    s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.setProperty('--r', r);
    layer.appendChild(s); bind(s); return s;
  }

  Object.keys(TYPES).forEach(t => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pick'; b.dataset.t = t;
    b.setAttribute('aria-label', TYPES[t].txt + ' 스티커 붙이기');
    b.appendChild(make(t)); picks.appendChild(b);
    b.addEventListener('click', () => {
      const r = layer.getBoundingClientRect();
      const x = clampX(rnd(20, innerWidth - 120) - r.left);
      const y = clampY(rnd(innerHeight * 0.18, innerHeight * 0.5) - r.top);
      place(t, x, y, rnd(-18, 18).toFixed(0) + 'deg', !reduce); save();
    });
  });

  const load = () => {
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (_) {}
    saved.forEach(o => TYPES[o.t] && place(o.t, clampX(o.x * layer.clientWidth), clampY(o.y), o.r || '0deg'));
  };
  if (document.readyState === 'complete') load(); else addEventListener('load', load);

  fab.addEventListener('click', () => {
    const open = tray.hidden; tray.hidden = !open;
    fab.setAttribute('aria-expanded', String(open));
    fab.innerHTML = open ? '닫기<br>✕' : '♥<br>스티커';
  });
  $('#shuffle').addEventListener('click', () => {
    $$('.piece, .labels .label, .sk').forEach(p => p.style.setProperty('--r', rnd(-6, 6).toFixed(1) + 'deg'));
    $$('.ransom .l').forEach(l => restyle(l, 1 + Math.floor(Math.random() * STY)));
    $$('.torn').forEach(tear);
  });
  $('#clear').addEventListener('click', () => { layer.innerHTML = ''; save(); });
})();
