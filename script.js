(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  if (window.lucide) lucide.createIcons();
  $('#year').textContent = new Date().getFullYear();

  // Topbar visual state
  const topbar = $('.topbar');
  const onScroll = () => topbar.classList.toggle('scrolled', window.scrollY > 18);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu without changing the page scroll position.
  const menu = $('#mobileMenu');
  const menuButton = $('.menu-button');
  const menuClose = $('.menu-close');

  function setMenu(open) {
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menuButton.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  }

  menuButton.addEventListener('click', () => setMenu(true));
  menuClose.addEventListener('click', () => setMenu(false));
  menu.addEventListener('wheel', (event) => event.preventDefault(), { passive: false });

  $$('.mobile-nav a').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = link.getAttribute('href');
      if (!target || !target.startsWith('#')) return;
      event.preventDefault();
      setMenu(false);
      requestAnimationFrame(() => $(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.classList.contains('open')) setMenu(false);
  });

  // Reveal on view
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const delay = Number(entry.target.dataset.delay || 0);
      entry.target.style.setProperty('--delay', `${delay}ms`);
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.13, rootMargin: '0px 0px -5% 0px' });
  $$('.reveal').forEach((el) => revealObserver.observe(el));

  // Native, touch-friendly carousels. JS only handles one-card arrows and the dots.
  function setupCarousel(track) {
    const id = track.id;
    const items = [...track.children];
    const dotsHost = document.querySelector(`[data-dots-for="${id}"]`);
    if (!items.length) return;

    const dots = items.map((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Ir para item ${index + 1}`);
      dot.addEventListener('click', () => items[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' }));
      dotsHost?.appendChild(dot);
      return dot;
    });

    function currentIndex() {
      const trackRect = track.getBoundingClientRect();
      let bestIndex = 0;
      let bestDistance = Infinity;
      items.forEach((item, index) => {
        const rect = item.getBoundingClientRect();
        const distance = Math.abs(rect.left - trackRect.left);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      });
      return bestIndex;
    }

    function updateDots() {
      const index = currentIndex();
      dots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === index));
    }

    function move(direction) {
      const index = currentIndex();
      const next = Math.max(0, Math.min(items.length - 1, index + direction));
      items[next].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }

    document.querySelector(`[data-carousel-prev="${id}"]`)?.addEventListener('click', () => move(-1));
    document.querySelector(`[data-carousel-next="${id}"]`)?.addEventListener('click', () => move(1));

    let raf = 0;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateDots);
    }, { passive: true });
    window.addEventListener('resize', updateDots, { passive: true });
    updateDots();
  }

  $$('[data-carousel]').forEach(setupCarousel);

  // 3D tilt only for precise pointers so touch scrolling remains completely native.
  const canTilt = matchMedia('(hover: hover) and (pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (canTilt) {
    $$('.tilt').forEach((card) => {
      const strength = Number(card.dataset.tiltStrength || 5);
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        card.style.transform = `rotateX(${-y * strength}deg) rotateY(${x * strength}deg)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  // Dedicated back-to-top control. The old target was the fixed header, which has no document position to scroll to.
  $('.back-top')?.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  });

  // Smooth internal links while preserving native behavior for external URLs.
  $$('a[href^="#"]:not(.back-top)').forEach((link) => {
    link.addEventListener('click', (event) => {
      const hash = link.getAttribute('href');
      if (!hash || hash === '#') return;
      const target = $(hash);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();
