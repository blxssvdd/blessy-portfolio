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


(function starfield(){
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const BASE_COLOR = '127,191,230';
  const MAX_DPR = 1.75;
  const LAYERS = [
    { depth: 0.55, count: 38, size: [0.6, 1.8], amp: [0.6, 1.6], speed: [0.08, 0.18], alpha: 0.35 },
    { depth: 0.82, count: 46, size: [0.4, 1.3], amp: [0.45, 1.4], speed: [0.12, 0.26], alpha: 0.48 },
    { depth: 1.05, count: 54, size: [0.3, 0.9], amp: [0.3, 1.1], speed: [0.18, 0.34], alpha: 0.62 }
  ];
  const LINK_DIST = 90;

  let DPR = 1;
  let starsLayers = [];
  let tick = 0;
  let running = true;
  let linkCap = LINK_DIST;

  const randRange = (min, max) => Math.random() * (max - min) + min;

  function spawnStar(layer){
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: randRange(layer.size[0], layer.size[1]),
      a: Math.random() * Math.PI * 2,
      amp: randRange(layer.amp[0], layer.amp[1]),
      speed: randRange(layer.speed[0], layer.speed[1]),
      phase: Math.random() * Math.PI * 2,
      layer
    };
  }

  function resize(){
    const width = window.innerWidth;
    const height = window.innerHeight;

    DPR = Math.min(MAX_DPR, Math.max(1, window.devicePixelRatio || 1));
    canvas.width  = Math.floor(width  * DPR);
    canvas.height = Math.floor(height * DPR);
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(DPR, DPR);

    const areaFactor = Math.min(1, (width * height) / (1400 * 900));
    const isMobile = width <= 680;

    linkCap = isMobile ? 0 : LINK_DIST;

    starsLayers = LAYERS.map(layer => {
      const adjusted = Math.round(layer.count * (isMobile ? 0.65 : 1) * (0.7 + areaFactor * 0.3));
      const stars = Array.from({ length: adjusted }, () => spawnStar(layer));
      return { ...layer, stars };
    });
  }

  function drawLinks(stars){
    const len = stars.length;
    for (let i = 0; i < len; i++){
      const s1 = stars[i];
      for (let j = i + 1; j < len; j++){
        const s2 = stars[j];
        const dist = Math.hypot(s1.x - s2.x, s1.y - s2.y);
        if (dist < linkCap){
          const alpha = 0.11 * (1 - dist / linkCap);
          ctx.strokeStyle = `rgba(${BASE_COLOR},${alpha})`;
          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.stroke();
        }
      }
    }
  }

  function step(){
    if (!running) {
      requestAnimationFrame(step);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const layerLinks = [];

    for (const { stars, alpha, depth } of starsLayers){
      const parallaxX = (window.scrollX || 0) * 0.01 * (depth - 1);
      const parallaxY = (window.scrollY || 0) * 0.01 * (depth - 1);

      ctx.fillStyle = `rgba(${BASE_COLOR},${alpha})`;

      for (const star of stars){
        const dx = Math.cos(star.a + tick * star.speed * 0.005) * star.amp;
        const dy = Math.sin(star.a + tick * star.speed * 0.004) * star.amp * 0.65;
        const x = star.x + dx + parallaxX;
        const y = star.y + dy + parallaxY;
        const twinkle = 0.55 + Math.sin(tick * 0.015 + star.phase) * 0.35;

        ctx.beginPath();
        ctx.globalAlpha = Math.min(0.95, Math.max(0.1, twinkle * alpha));
        ctx.arc(x, y, star.r * depth, 0, Math.PI * 2);
        ctx.fill();

        star.renderX = x;
        star.renderY = y;
      }

      if (linkCap > 0 && depth < 1){
        layerLinks.push(stars);
      }
    }

    ctx.globalAlpha = 1;

    if (linkCap > 0){
      ctx.lineWidth = 0.45;
      layerLinks.forEach(drawLinks);
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


(function galleryFilters(){
  const buttons = document.querySelectorAll('.filter-btn');
  const items   = document.querySelectorAll('.gallery-item');
  if (!buttons.length || !items.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      card.classList.remove('is-visible');
      card.style.display = 'none';
    });

    toShow.forEach((card, index) => {
      if (card.dataset.hidden === '0') return;
      card.dataset.hidden = '0';
      card.style.display = '';
      if (!prefersReduced) {
        card.style.setProperty('--delay', `${index * 55}ms`);
      }
      requestAnimationFrame(() => {
        card.classList.add('show');
        card.classList.add('is-visible');
      });
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
    requestAnimationFrame(() => lb.classList.add('open'));
  }

  function close(){
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

  btnClose?.addEventListener('click', (e) => {
    e.stopPropagation();
    close();
  });

  lb.addEventListener('click', (e) => {
    if (e.target === lb) close();
  });

  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('visible')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  let startX = 0;
  lb.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, {passive:true});
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (dx > 50) prev();
    if (dx < -50) next();
  }, {passive:true});
})();


(function scrollReveal(){
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = reduceMotionQuery.matches;

  const groups = [
    { selector: '.hero', step: 0 },
    { selector: '.hero > *', step: 70, offset: 1 },
    { selector: '.hero-socials .icon-btn', step: 45, offset: 2 },
    { selector: '.section-head > *', step: 65 },
    { selector: '.section', step: 80 },
    { selector: '.projects-grid .project-card', step: 70 },
    { selector: '.about-grid > *', step: 70 },
    { selector: '.facts li', step: 40 },
    { selector: '.cta-row .btn', step: 60 },
    { selector: '.photos-header > *', step: 70 },
    { selector: '.filters .filter-btn', step: 40 },
    { selector: '.gallery .gallery-item', step: 55 },
    { selector: '.songs-category', step: 85 },
    { selector: '.tracks-grid .track-card', step: 65 },
    { selector: '.track-card .track-btn', step: 35 }
  ];

  const assign = ({ selector, step, offset = 0 }) => {
    document.querySelectorAll(selector).forEach((node, index) => {
      if (!node) return;
      if (!node.hasAttribute('data-animate')) node.setAttribute('data-animate', '');
      if (reduced) return;
      if (!node.style.getPropertyValue('--delay')) {
        node.style.setProperty('--delay', `${(offset + index) * step}ms`);
      }
    });
  };

  groups.forEach(assign);

  const targets = document.querySelectorAll('[data-animate]');
  if (!targets.length) return;

  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const seen = new WeakSet();
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (!seen.has(el)) {
        seen.add(el);
        el.classList.add('is-visible');
      }
      obs.unobserve(el);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -12%' });

  requestAnimationFrame(() => {
    targets.forEach(el => {
      el.classList.add('will-animate');
      observer.observe(el);
    });
  });

  const handlePrefChange = (event) => {
    if (!event.matches) return;
    targets.forEach(el => {
      el.classList.add('is-visible');
      el.classList.remove('will-animate');
    });
    observer.disconnect();
  };

  if (typeof reduceMotionQuery.addEventListener === 'function') {
    reduceMotionQuery.addEventListener('change', handlePrefChange);
  } else if (typeof reduceMotionQuery.addListener === 'function') {
    reduceMotionQuery.addListener(handlePrefChange);
  }
})();


(function heroParallax(){
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointerFineQuery = window.matchMedia('(pointer: fine)');
  if (!pointerFineQuery.matches || reduceMotionQuery.matches) return;

  let rafId = null;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  const damp = 0.12;

  const schedule = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(tick);
  };

  const tick = () => {
    rafId = null;
    currentX += (targetX - currentX) * damp;
    currentY += (targetY - currentY) * damp;

    hero.style.setProperty('--tilt-x', (currentY * -6).toFixed(3));
    hero.style.setProperty('--tilt-y', (currentX * 6).toFixed(3));
    hero.style.setProperty('--tilt-glow-x', `${(currentX * 28).toFixed(2)}px`);
    hero.style.setProperty('--tilt-glow-y', `${(currentY * 22).toFixed(2)}px`);

    if (Math.abs(currentX - targetX) > 0.002 || Math.abs(currentY - targetY) > 0.002) {
      schedule();
    }
  };

  const onPointerMove = (event) => {
    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    targetX = (x - 0.5);
    targetY = (y - 0.5);
    hero.dataset.tiltActive = '1';
    schedule();
  };

  const reset = () => {
    targetX = 0;
    targetY = 0;
    hero.dataset.tiltActive = '0';
    schedule();
  };

  hero.addEventListener('pointermove', onPointerMove);
  hero.addEventListener('pointerleave', reset);
  window.addEventListener('blur', reset);

  const handlePrefChange = (event) => {
    if (!event.matches) return;
    hero.style.removeProperty('--tilt-x');
    hero.style.removeProperty('--tilt-y');
    hero.style.removeProperty('--tilt-glow-x');
    hero.style.removeProperty('--tilt-glow-y');
    hero.dataset.tiltActive = '0';
    targetX = targetY = currentX = currentY = 0;
  };

  if (typeof reduceMotionQuery.addEventListener === 'function') {
    reduceMotionQuery.addEventListener('change', handlePrefChange);
  } else if (typeof reduceMotionQuery.addListener === 'function') {
    reduceMotionQuery.addListener(handlePrefChange);
  }
})();


(function scrollProgress(){
  if (!document.body) return;
  if (document.querySelector('.scroll-progress')) return;

  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.prepend(bar);

  let rafId = null;

  const clamp = (value) => Math.min(1, Math.max(0, value));

  const update = () => {
    rafId = null;
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    bar.style.setProperty('--progress', clamp(ratio));
    if (window.scrollY > 12) {
      document.body.classList.add('scrolled');
    } else {
      document.body.classList.remove('scrolled');
    }
  };

  const request = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(update);
  };

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request, { passive: true });
  update();
})();


(function playlistController(){
  const cards = Array.from(document.querySelectorAll('.track-card'));
  if (!cards.length) return;

  let volume = 0.7;

  const states = cards.map((card, index) => {
    const src = (card.dataset.trackSrc || '').trim();
    const playBtn = card.querySelector('.track-btn.play');
    const prevBtn = card.querySelector('.track-btn.prev');
    const nextBtn = card.querySelector('.track-btn.next');
    const slider = card.querySelector('.track-slider');
    const currentEl = card.querySelector('.track-time .current');
    const durationEl = card.querySelector('.track-time .duration');
    const volumeSlider = card.querySelector('.track-volume-slider');

    if (slider) {
      slider.value = 0;
    }
    if (currentEl) currentEl.textContent = '0:00';
    if (durationEl) durationEl.textContent = '0:00';
    if (volumeSlider) {
      const initial = Number(volumeSlider.value);
      const base = Number.isFinite(initial) ? initial : Math.round(volume * 100);
      volumeSlider.value = String(base);
    }

    return {
      card,
      index,
      src,
      playBtn,
      prevBtn,
      nextBtn,
      slider,
      currentEl,
      durationEl,
      volumeSlider
    };
  });

  let playable = states.filter(state => state.src.length);

  states.forEach(state => {
    if (!state.src.length) {
      state.card.classList.add('is-disabled');
      if (state.playBtn) state.playBtn.setAttribute('disabled', 'true');
      if (state.prevBtn) state.prevBtn.setAttribute('disabled', 'true');
      if (state.nextBtn) state.nextBtn.setAttribute('disabled', 'true');
      if (state.slider) state.slider.setAttribute('disabled', 'true');
      if (state.volumeSlider) state.volumeSlider.setAttribute('disabled', 'true');
    } else {
      state.volumeSlider?.removeAttribute('disabled');
    }
  });

  playable = states.filter(state => state.src.length);
  if (!playable.length) return;

  const audio = document.createElement('audio');
  audio.preload = 'metadata';
  audio.setAttribute('playsinline', '');
  audio.hidden = true;
  document.body.appendChild(audio);

  audio.volume = volume;
  let currentIndex = -1;
  let seeking = false;

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return '0:00';
    const value = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(value / 60);
    const secs = value % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetCard = (state) => {
    if (state.slider) state.slider.value = 0;
    if (state.currentEl) state.currentEl.textContent = '0:00';
    if (state.durationEl) state.durationEl.textContent = '0:00';
  };

  const syncVolumeSliders = (skipEl) => {
    const active = document.activeElement;
    states.forEach(state => {
      if (!state.volumeSlider) return;
      if (skipEl && state.volumeSlider === skipEl) return;
      if (active && state.volumeSlider === active) return;
      state.volumeSlider.value = String(Math.round(volume * 100));
    });
  };

  syncVolumeSliders();

  const updateCardStates = () => {
    states.forEach(state => {
      const isActive = state.index === currentIndex;
      const isPlaying = isActive && !audio.paused && audio.currentTime > 0;
      state.card.classList.toggle('is-active', isActive);
      state.card.classList.toggle('is-playing', isPlaying);
      if (state.playBtn) {
        state.playBtn.setAttribute('aria-label', isPlaying ? 'Пауза' : 'Воспроизвести');
        state.playBtn.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
      }
    });
  };

  const findNextIndex = (fromIndex, direction) => {
    if (!playable.length) return -1;
    const total = states.length;
    let iterations = 0;
    let pointer = fromIndex;

    while (iterations < total) {
      pointer += direction;
      if (pointer >= total) pointer = 0;
      if (pointer < 0) pointer = total - 1;
      iterations++;
      const candidate = states[pointer];
      if (candidate && candidate.src.length) {
        return pointer;
      }
    }
    return -1;
  };

  const updateProgress = () => {
    if (currentIndex < 0) return;
    const state = states[currentIndex];
    if (!state) return;
    const duration = audio.duration;
    const current = audio.currentTime;

    if (state.slider && !seeking) {
      const value = duration ? (current / duration) * 100 : 0;
      state.slider.value = Number.isFinite(value) ? value : 0;
    }

    if (state.currentEl) state.currentEl.textContent = formatTime(current);
    if (state.durationEl && Number.isFinite(duration)) {
      state.durationEl.textContent = formatTime(duration);
    }
  };

  const loadTrack = (index, autoPlay = true) => {
    const state = states[index];
    if (!state || !state.src.length) return;

    if (currentIndex !== index) {
      currentIndex = index;
      audio.pause();
      audio.src = state.src;
      audio.currentTime = 0;
      audio.load();
      resetCard(state);
    }

    updateCardStates();
    if (autoPlay) {
      audio.play().catch(() => {
        // playback might be blocked; keep state consistent
        updateCardStates();
      });
    }
  };

  const stepTrack = (direction, fromIndex = currentIndex) => {
    if (fromIndex === -1) {
      const first = playable[0];
      if (first) loadTrack(first.index, true);
      return;
    }
    const target = findNextIndex(fromIndex, direction);
    if (target !== -1) {
      loadTrack(target, true);
    }
  };

  states.forEach(state => {
    if (!state.src.length) return;

    state.playBtn?.addEventListener('click', () => {
      if (state.index === currentIndex) {
        if (audio.paused) {
          audio.play().catch(() => {});
        } else {
          audio.pause();
        }
      } else {
        loadTrack(state.index, true);
      }
    });

    state.prevBtn?.addEventListener('click', () => {
      stepTrack(-1, state.index);
    });

    state.nextBtn?.addEventListener('click', () => {
      stepTrack(1, state.index);
    });

    if (state.slider) {
      const beginSeek = () => {
        if (state.index === currentIndex) seeking = true;
      };
      const endSeek = () => {
        if (state.index === currentIndex) seeking = false;
      };
      state.slider.addEventListener('pointerdown', beginSeek);
      state.slider.addEventListener('pointerup', endSeek);
      state.slider.addEventListener('touchstart', beginSeek, { passive: true });
      state.slider.addEventListener('touchend', endSeek, { passive: true });

      state.slider.addEventListener('input', () => {
        if (state.index !== currentIndex) return;
        const duration = audio.duration;
        if (!Number.isFinite(duration)) return;
        const time = (state.slider.value / 100) * duration;
        if (state.currentEl) state.currentEl.textContent = formatTime(time);
      });

      state.slider.addEventListener('change', () => {
        if (state.index !== currentIndex) return;
        const duration = audio.duration;
        if (!Number.isFinite(duration)) return;
        const time = (state.slider.value / 100) * duration;
        audio.currentTime = Number.isFinite(time) ? time : 0;
        seeking = false;
      });
    }

    if (state.volumeSlider) {
      const applyVolume = () => {
        const raw = Number(state.volumeSlider.value);
        const clamped = Math.min(100, Math.max(0, Number.isFinite(raw) ? raw : Math.round(volume * 100)));
        volume = clamped / 100;
        audio.volume = volume;
        syncVolumeSliders(state.volumeSlider);
      };
      state.volumeSlider.addEventListener('input', applyVolume);
      state.volumeSlider.addEventListener('change', applyVolume);
    }
  });

  audio.addEventListener('loadedmetadata', () => {
    if (currentIndex < 0) return;
    const state = states[currentIndex];
    if (state?.durationEl) {
      state.durationEl.textContent = formatTime(audio.duration);
    }
  });

  audio.addEventListener('timeupdate', () => {
    if (!seeking) updateProgress();
  });

  audio.addEventListener('volumechange', () => {
    volume = audio.volume;
    syncVolumeSliders();
  });

  audio.addEventListener('play', updateCardStates);
  audio.addEventListener('pause', updateCardStates);

  audio.addEventListener('ended', () => {
    stepTrack(1);
  });

  audio.addEventListener('error', () => {
    stepTrack(1);
  });
})();
