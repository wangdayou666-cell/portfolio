(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const root = document.documentElement;

  /* stained-glass rose window: tap to change the glass, scroll to turn it */
  const rose = $('#rose');
  if (rose) {
    const pals = ['rose', 'sapphire', 'emerald', 'amethyst'];
    const names = [['ROSA', '장미'], ['SAPPHIRUS', '사파이어'], ['SMARAGDUS', '에메랄드'], ['AMETHYSTUS', '자수정']];
    let pi = 0;
    const cap = $('#rose-name');
    const next = () => {
      pi = (pi + 1) % pals.length; rose.dataset.pal = pals[pi];
      if (cap) cap.innerHTML = `${names[pi][0]}<span>${names[pi][1]} · 눌러서 유리 색 바꾸기</span>`;
    };
    rose.addEventListener('click', next);
    rose.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); next(); } });
    if (!reduce) addEventListener('scroll', () => rose.style.setProperty('--rot', (scrollY * 0.12).toFixed(1) + 'deg'), { passive: true });
  }

  /* reliquary cards tilt toward the pointer */
  if (fine && !reduce) $$('.tilt').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 7).toFixed(2)}deg)`;
      el.style.setProperty('--gx', ((x + 0.5) * 100).toFixed(0) + '%');
      el.style.setProperty('--gy', ((y + 0.5) * 100).toFixed(0) + '%');
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  /* gold medals spin when tapped */
  const replay = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  $$('.medal').forEach(m => {
    m.addEventListener('click', () => replay(m, 'spin'));
    m.addEventListener('animationend', () => m.classList.remove('spin'));
  });
  const seal = $('.seal');
  if (seal) {
    seal.addEventListener('click', () => replay(seal, 'press'));
    seal.addEventListener('animationend', () => seal.classList.remove('press'));
  }

  /* copy buttons */
  $$('[data-copy]').forEach(b => b.addEventListener('click', () => {
    const el = document.getElementById(b.dataset.copy), t = el.textContent.trim(), old = b.textContent;
    const done = () => { b.textContent = '복사됨'; setTimeout(() => (b.textContent = old), 1300); };
    const sel = () => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    try { navigator.clipboard.writeText(t).then(done, sel); } catch (_) { sel(); }
  }));

  /* candlelight mode */
  const candle = $('#candle'), dark = $('#dark');
  if (candle && dark) {
    candle.addEventListener('click', () => {
      const on = dark.hidden; dark.hidden = !on;
      candle.setAttribute('aria-pressed', String(on));
      candle.querySelector('.lbl').textContent = on ? '끄기' : '촛불';
    });
    const mv = e => { root.style.setProperty('--mx', e.clientX + 'px'); root.style.setProperty('--my', e.clientY + 'px'); };
    addEventListener('pointermove', mv, { passive: true });
    addEventListener('pointerdown', mv, { passive: true });
  }

  /* drifting gold dust */
  const cv = $('#dust');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d');
    let W, H, dpr, motes = [];
    const size = () => {
      dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(60, Math.round(W * H / 22000));
      motes = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 0.6 + Math.random() * 1.8, v: 0.15 + Math.random() * 0.4, d: Math.random() * 6.28, t: Math.random() * 6.28 }));
    };
    size(); addEventListener('resize', size);
    const tick = () => {
      if (!document.hidden) {
        ctx.clearRect(0, 0, W, H);
        for (const m of motes) {
          m.y -= m.v; m.d += 0.01; m.t += 0.03; m.x += Math.sin(m.d) * 0.3;
          if (m.y < -5) { m.y = H + 5; m.x = Math.random() * W; }
          const a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(m.t));
          ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, 6.283);
          ctx.fillStyle = `rgba(244,226,173,${a.toFixed(2)})`;
          ctx.shadowColor = 'rgba(244,200,120,.8)'; ctx.shadowBlur = 6; ctx.fill();
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
})();
