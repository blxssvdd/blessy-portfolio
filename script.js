// === Навигация (бургер) ===
(function navBurger() {
  const burger = document.querySelector('.burger');
  const linksWrap = document.querySelector('.nav-links');
  if (!burger || !linksWrap) return;

  const toggle = () => {
    burger.classList.toggle('active');
    linksWrap.classList.toggle('open');
  };

  burger.addEventListener('click', toggle);
  linksWrap.addEventListener('click', (e) => {
    const a = e.target.closest('a.nav-link');
    if (!a) return;
    burger.classList.remove('active');
    linksWrap.classList.remove('open');
  });

  const onResize = () => {
    if (window.innerWidth > 800) {
      burger.classList.remove('active');
      linksWrap.classList.remove('open');
    }
  };
  window.addEventListener('resize', onResize, { passive: true });
})();


// === Анимированный фон (звёзды) ===
(function starfield(){
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, DPR, stars = [], tick = 0;
  const COUNT = 110;
  const LINK_DIST = 110;
  const BASE_COLOR = '127,191,230';
  let running = true;

  function resize(){
    DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    W = canvas.width  = Math.floor(window.innerWidth  * DPR);
    H = canvas.height = Math.floor(window.innerHeight * DPR);
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(DPR, DPR);

    stars = [];
    for (let i = 0; i < COUNT; i++){
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      const r = Math.random() * 1.6 + 0.4;
      const a = Math.random() * Math.PI * 2;
      const amp = Math.random() * 1.5 + 0.5;
      const speed = 0.2 + Math.random() * 0.35;
      stars.push({x, y, r, a, amp, speed});
    }
  }

  function step(){
    if (!running) {
      requestAnimationFrame(step);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `rgba(${BASE_COLOR}, 0.85)`;

    for (const s of stars){
      const dx = Math.cos(s.a + tick * s.speed * 0.005) * s.amp;
      const dy = Math.sin(s.a + tick * s.speed * 0.005) * s.amp * 0.6;
      const x = s.x + dx;
      const y = s.y + dy;

      ctx.beginPath();
      ctx.globalAlpha = 0.6 + Math.sin((tick * 0.01) + s.a) * 0.35;
      ctx.arc(x, y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.lineWidth = 0.5;
    for (let i = 0; i < stars.length; i++){
      for (let j = i + 1; j < stars.length; j++){
        const dx = stars[i].x - stars[j].x;
        const dy = stars[i].y - stars[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < LINK_DIST){
          const alpha = 0.13 * (1 - dist / LINK_DIST);
          ctx.strokeStyle = `rgba(${BASE_COLOR},${alpha})`;
          ctx.beginPath();
          ctx.moveTo(stars[i].x, stars[i].y);
          ctx.lineTo(stars[j].x, stars[j].y);
          ctx.stroke();
        }
      }
    }

    tick++;
    requestAnimationFrame(step);
  }

  document.addEventListener('visibilitychange', () => {
    running = document.visibilityState === 'visible';
  });

  window.addEventListener('resize', resize, {passive:true});
  resize();
  step();
})();


// === Галерея и фильтры (без дерганий) ===
(function galleryFilters(){
  const buttons = document.querySelectorAll('.filter-btn');
  const items   = document.querySelectorAll('.gallery-item');
  if (!buttons.length || !items.length) return;

  items.forEach((card) => {
    card.dataset.hidden = '0';
    card.style.display = '';
    requestAnimationFrame(() => card.classList.add('show'));
  });

  function applyFilter(filter) {
    const toShow = [], toHide = [];
    items.forEach(card => {
      const show = (filter === 'all') || (card.dataset.category === filter);
      if (show) toShow.push(card);
      else toHide.push(card);
    });

    toHide.forEach(card => {
      if (card.dataset.hidden === '1') return;
      card.dataset.hidden = '1';
      card.classList.remove('show');
      card.style.display = 'none';
    });

    toShow.forEach(card => {
      if (card.dataset.hidden === '0') return;
      card.dataset.hidden = '0';
      card.style.display = '';
      requestAnimationFrame(() => card.classList.add('show'));
    });
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(btn.dataset.filter);
    });
  });
})();


// === Лайтбокс (фикс кнопки закрытия + плавное появление) ===
(function lightboxInit(){
  const lb = document.getElementById('lightbox');
  if (!lb) return;

  const imgEl = lb.querySelector('.lb-img');
  const capEl = lb.querySelector('.lb-caption');
  const btnClose = lb.querySelector('.lb-close');
  const figuresAll = Array.from(document.querySelectorAll('.gallery-item'));

  function visibleFigures(){
    return figuresAll.filter(f => getComputedStyle(f).display !== 'none');
  }

  let index = 0;

  function openAt(i){
    const figs = visibleFigures();
    if (!figs.length) return;
    index = ((i % figs.length) + figs.length) % figs.length;
    const fig = figs[index];
    const img = fig.querySelector('img');
    const cap = fig.querySelector('figcaption');
    imgEl.src = img.src;
    imgEl.alt = img.alt || '';
    capEl.textContent = cap ? cap.textContent : '';
    lb.classList.add('visible');
    // небольшой таймаут нужен для срабатывания transition
    requestAnimationFrame(() => lb.classList.add('open'));
  }

  function close(){
    // предотвращаем множественные нажатия
    if (lb.classList.contains('closing')) return;
    lb.classList.remove('open');
    lb.classList.add('closing');
    setTimeout(() => {
      lb.classList.remove('visible', 'closing');
    }, 250);
  }

  function next(){ openAt(index + 1); }
  function prev(){ openAt(index - 1); }

  figuresAll.forEach(f => {
    f.addEventListener('click', () => {
      const figs = visibleFigures();
      const i = figs.indexOf(f);
      if (i !== -1) openAt(i);
    });
  });

  // 💫 теперь крестик всегда работает
  btnClose?.addEventListener('click', (e) => {
    e.stopPropagation();
    close();
  });

  // закрытие по клику вне фото
  lb.addEventListener('click', (e) => {
    if (e.target === lb) close();
  });

  // клавиши
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('visible')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  // свайпы
  let startX = 0;
  lb.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, {passive:true});
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (dx > 50) prev();
    if (dx < -50) next();
  }, {passive:true});
})();



