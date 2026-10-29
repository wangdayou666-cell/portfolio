(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const TAU = Math.PI * 2;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= lace drawn in code ================= */
  let noise;
  function noisePattern(c) {
    if (!noise) {
      noise = document.createElement('canvas'); noise.width = noise.height = 96;
      const n = noise.getContext('2d'), d = n.createImageData(96, 96);
      for (let i = 0; i < d.data.length; i += 4) {
        const v = Math.random() * 255;
        d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 26;
      }
      n.putImageData(d, 0, 0);
    }
    return c.createPattern(noise, 'repeat');
  }
  function rectPts(x0, y0, x1, y1, step) {
    const sides = [[x0, y0, x1, y0, 0, -1], [x1, y0, x1, y1, 1, 0], [x1, y1, x0, y1, 0, 1], [x0, y1, x0, y0, -1, 0]];
    const pts = [];
    sides.forEach(([ax, ay, bx, by, nx, ny], k) => {
      const len = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(len / step));
      for (let i = 0; i < n; i++) {
        const t = i / n; let mx = nx, my = ny;
        if (i === 0) { const pv = sides[(k + 3) % 4]; mx = (nx + pv[4]) * Math.SQRT1_2; my = (ny + pv[5]) * Math.SQRT1_2; }
        pts.push({ x: ax + (bx - ax) * t, y: ay + (by - ay) * t, nx: mx, ny: my, tx: (bx - ax) / len, ty: (by - ay) / len });
      }
    });
    return pts;
  }
  function rrPath(p, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    p.moveTo(x + r, y); p.lineTo(x + w - r, y); p.arcTo(x + w, y, x + w, y + r, r);
    p.lineTo(x + w, y + h - r); p.arcTo(x + w, y + h, x + w - r, y + h, r);
    p.lineTo(x + r, y + h); p.arcTo(x, y + h, x, y + h - r, r);
    p.lineTo(x, y + r); p.arcTo(x, y, x + r, y, r); p.closePath();
  }
  function winPath(p, w, g) {
    if (w.shape === 'ellipse') { p.moveTo(w.x + w.w + g, w.y + w.h / 2); p.ellipse(w.x + w.w / 2, w.y + w.h / 2, w.w / 2 + g, w.h / 2 + g, 0, 0, TAU); }
    else rrPath(p, w.x - g, w.y - g, w.w + 2 * g, w.h + 2 * g, w.r + g);
  }
  function winPts(w, g, step) {
    const pts = [];
    if (w.shape === 'ellipse') {
      const a = w.w / 2 + g, b = w.h / 2 + g, cx = w.x + w.w / 2, cy = w.y + w.h / 2;
      const P = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
      const n = Math.round(P / step);
      for (let i = 0; i < n; i++) {
        const t = i / n * TAU, nx = Math.cos(t) / a, ny = Math.sin(t) / b, l = Math.hypot(nx, ny);
        pts.push({ x: cx + a * Math.cos(t), y: cy + b * Math.sin(t), nx: nx / l, ny: ny / l, tx: -ny / l, ty: nx / l });
      }
      return pts;
    }
    const x = w.x - g, y = w.y - g, W = w.w + 2 * g, H = w.h + 2 * g, r = Math.min(w.r + g, W / 2, H / 2);
    const line = (ax, ay, bx, by, nx, ny) => {
      const L = Math.hypot(bx - ax, by - ay), n = Math.round(L / step);
      for (let i = 0; i < n; i++) { const t = i / n; pts.push({ x: ax + (bx - ax) * t, y: ay + (by - ay) * t, nx, ny, tx: (bx - ax) / L, ty: (by - ay) / L }); }
    };
    const arc = (cx, cy, a0) => {
      const n = Math.max(1, Math.round(r * Math.PI / 2 / step));
      for (let i = 0; i < n; i++) { const a = a0 + i / n * Math.PI / 2; pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), nx: Math.cos(a), ny: Math.sin(a), tx: -Math.sin(a), ty: Math.cos(a) }); }
    };
    line(x + r, y, x + W - r, y, 0, -1); arc(x + W - r, y + r, -Math.PI / 2);
    line(x + W, y + r, x + W, y + H - r, 1, 0); arc(x + W - r, y + H - r, 0);
    line(x + W - r, y + H, x + r, y + H, 0, 1); arc(x + r, y + H - r, Math.PI / 2);
    line(x, y + H - r, x, y + r, -1, 0); arc(x + r, y + r, Math.PI);
    return pts;
  }
  const circ = (p, x, y, r) => { p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU); };
  const oval = (p, x, y, rx, ry, rot) => { p.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)); p.ellipse(x, y, rx, ry, rot, 0, TAU); };

  function drawLace(host) {
    const cv = host.querySelector(':scope > .lace-cv'); if (!cv) return;
    const out = parseFloat(host.dataset.out || 0);
    const hw = host.clientWidth, hh = host.clientHeight; if (!hw || !hh) return;
    const W = hw + 2 * out, H = hh + 2 * out;
    const band = out > 0 ? out : Math.round(Math.min(hw, hh) * parseFloat(host.dataset.band || 0.16));
    if (!out) host.style.setProperty('--b', band + 'px');
    const dpr = Math.min(2, devicePixelRatio || 1);
    Object.assign(cv.style, { left: -out + 'px', top: -out + 'px', width: W + 'px', height: H + 'px' });
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const g = document.createElement('canvas'); g.width = cv.width; g.height = cv.height;
    const c = g.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);

    const win = { x: band, y: band, w: W - 2 * band, h: H - 2 * band, shape: host.dataset.shape || 'rect', r: parseFloat(host.dataset.r || 6) };
    const sc = Math.max(7, Math.min(15, band * 0.22));
    const thick = band - sc;

    /* body + scallops + picots */
    c.fillStyle = '#ece5d4';
    c.fillRect(sc, sc, W - 2 * sc, H - 2 * sc);
    const outer = rectPts(sc, sc, W - sc, H - sc, sc * 1.6);
    c.beginPath(); outer.forEach(p => circ(c, p.x, p.y, sc)); c.fill();
    c.beginPath(); outer.forEach(p => circ(c, p.x + p.nx * (sc + 1.6), p.y + p.ny * (sc + 1.6), Math.max(1.6, sc * 0.17))); c.fill();

    const holes = new Path2D();
    outer.forEach(p => circ(holes, p.x, p.y, sc * 0.36));

    /* rows of eyelets */
    const hr = Math.max(2.1, sc * 0.26);
    const a1 = sc + Math.max(7, sc * 0.95);
    let lastRow = sc + 2;
    if (thick > 18) {
      rectPts(a1, a1, W - a1, H - a1, hr * 3.3).forEach(p => circ(holes, p.x, p.y, hr));
      lastRow = a1 + hr;
    }
    const a2 = a1 + Math.max(9, sc * 1.25);
    if (thick > 36) {
      rectPts(a2, a2, W - a2, H - a2, hr * 4.4).forEach(p => oval(holes, p.x, p.y, hr * 1.6, hr * 0.75, Math.atan2(p.ty, p.tx)));
      lastRow = a2 + hr;
    }

    /* window ring */
    winPts(win, 7, 8.5).forEach(p => circ(holes, p.x, p.y, 2.3));
    winPath(holes, win, 0);

    /* corner rosettes */
    const roses = [];
    const cx = win.x + win.w / 2, cy = win.y + win.h / 2;
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
      const p0x = sx < 0 ? lastRow + 6 : W - lastRow - 6, p0y = sy < 0 ? lastRow + 6 : H - lastRow - 6;
      let wx, wy;
      if (win.shape === 'ellipse') { wx = cx + sx * (win.w / 2 + 12) * Math.SQRT1_2; wy = cy + sy * (win.h / 2 + 12) * Math.SQRT1_2; }
      else { const r = win.r + 12; wx = (sx < 0 ? win.x - 12 + r : win.x + win.w + 12 - r) + sx * r * Math.SQRT1_2; wy = (sy < 0 ? win.y - 12 + r : win.y + win.h + 12 - r) + sy * r * Math.SQRT1_2; }
      const R = Math.hypot(wx - p0x, wy - p0y) * 0.42;
      if (R >= 15) roses.push({ x: (p0x + wx) / 2, y: (p0y + wy) / 2, R });
    });
    roses.forEach(({ x, y, R }) => {
      circ(holes, x, y, R * 0.15);
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * TAU;
        oval(holes, x + Math.cos(a) * R * 0.5, y + Math.sin(a) * R * 0.5, R * 0.24, R * 0.1, a);
        const b = a + TAU / 16; circ(holes, x + Math.cos(b) * R * 0.55, y + Math.sin(b) * R * 0.55, R * 0.045);
      }
      for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; circ(holes, x + Math.cos(a) * R * 0.88, y + Math.sin(a) * R * 0.88, R * 0.065); }
    });

    /* mesh net between rows and window */
    const mesh = new Path2D(), clip = new Path2D();
    const m = lastRow + 7;
    clip.rect(m, m, W - 2 * m, H - 2 * m); winPath(clip, win, 13);
    roses.forEach(r => circ(clip, r.x, r.y, r.R + 4));
    const s = Math.max(6, sc * 0.62);
    for (let yy = m, row = 0; yy < H - m + s; yy += s * 0.87, row++)
      for (let xx = m + (row % 2 ? s / 2 : 0); xx < W - m + s; xx += s) circ(mesh, xx, yy, s * 0.31);

    c.globalCompositeOperation = 'destination-out';
    c.fill(holes);
    c.save(); c.clip(clip, 'evenodd'); c.fill(mesh); c.restore();

    /* picots inside the window edge */
    c.globalCompositeOperation = 'source-over';
    c.beginPath(); winPts(win, 0, 9).forEach(p => circ(c, p.x, p.y, 2.6)); c.fill();

    /* embossed thread edges, texture, light */
    c.globalCompositeOperation = 'source-atop';
    c.strokeStyle = 'rgba(105,90,70,.55)'; c.lineWidth = 1.1;
    c.stroke(holes);
    c.save(); c.clip(clip, 'evenodd'); c.stroke(mesh); c.restore();
    c.fillStyle = noisePattern(c); c.fillRect(0, 0, W, H);
    const lg = c.createLinearGradient(0, 0, W, H);
    lg.addColorStop(0, 'rgba(255,255,255,.14)'); lg.addColorStop(1, 'rgba(60,45,25,.18)');
    c.fillStyle = lg; c.fillRect(0, 0, W, H);

    const ctx = cv.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 10 * dpr; ctx.shadowOffsetY = 4 * dpr;
    ctx.drawImage(g, 0, 0);
  }

  const hosts = $$('.lace');
  hosts.forEach(h => { if (!h.querySelector(':scope > .lace-cv')) { const cv = document.createElement('canvas'); cv.className = 'lace-cv'; cv.setAttribute('aria-hidden', 'true'); h.prepend(cv); } });
  const sizes = new WeakMap();
  const redraw = h => {
    const k = h.clientWidth + 'x' + h.clientHeight;
    if (sizes.get(h) === k) return; sizes.set(h, k); drawLace(h);
  };
  hosts.forEach(redraw);
  if ('ResizeObserver' in window) {
    let raf; const ro = new ResizeObserver(entries => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => entries.forEach(e => redraw(e.target))); });
    hosts.forEach(h => ro.observe(h));
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => hosts.forEach(redraw));

  /* ================= interactions ================= */
  const candle = $('.candle-art');
  if (candle) candle.addEventListener('click', () => {
    const out = candle.classList.toggle('out');
    candle.setAttribute('aria-pressed', String(!out));
    const cap = $('#candle-cap'); if (cap) cap.textContent = out ? '촛불이 꺼졌어요 · 다시 눌러 켜기' : '촛불을 눌러 끄고 켜보세요 · Click the candle';
  });

  const replay = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  $$('.card').forEach(card => {
    card.addEventListener('click', () => { if (!reduce) replay(card, 'swing'); });
    card.addEventListener('animationend', e => { if (e.animationName === 'swing') card.classList.remove('swing'); });
  });

  $$('.badge').forEach(b => b.addEventListener('click', () => {
    const on = b.classList.toggle('on'); b.setAttribute('aria-pressed', String(on));
  }));

  $$('[data-copy]').forEach(b => b.addEventListener('click', () => {
    const el = document.getElementById(b.dataset.copy), t = el.textContent.trim(), old = b.textContent;
    const done = () => { b.textContent = 'COPIED'; setTimeout(() => (b.textContent = old), 1300); };
    const sel = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    try { navigator.clipboard.writeText(t).then(done, sel); } catch (_) { sel(); }
  }));
})();
