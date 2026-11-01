(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const body = document.body;
  const header = document.querySelector('header');
  const activeAnimations = new Set();
  // Retire the old switch preference: there is no longer a visible switch.
  // Do not clear other site data or the service editor's saved drafts.
  try { localStorage.removeItem('raylio-motion-choice'); } catch {}
  const enabled = () => true;
  function listenPreference(query, listener) {
    if (typeof query.addEventListener === 'function') query.addEventListener('change', listener);
    else if (typeof query.addListener === 'function') query.addListener(listener);
  }
  window.RaylabMotion = { listenPreference, enabled };
  function syncPreference() {
    body.classList.toggle('motion-override', enabled());
    body.classList.toggle('motion-paused', !enabled());
    document.dispatchEvent(new Event('raylab:motion-change'));
  }
  syncPreference();
  listenPreference(preference, syncPreference);
  function enter(element, delay = 0, distance = 20) {
    if (!enabled() || typeof element.animate !== 'function') return;
    const animation = element.animate([
      { opacity: 0, transform: `translateY(${distance}px)` },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 650, delay, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' });
    activeAnimations.add(animation);
    animation.onfinish = animation.oncancel = () => activeAnimations.delete(animation);
  }
  // Content stays visible when JavaScript, observers or animation APIs are unavailable.
  document.querySelectorAll('.hero-copy > *').forEach((element, index) => enter(element, index * 75, 16));
  const revealTargets = document.querySelectorAll('.section-heading, .service, .entry-offer, .company-intro > div, .purpose-grid article, .company-values > div, .solution-tabs, .solution-panel:not([hidden]), .collaboration-grid article, .connection-art, .connection > div:last-child, #proceso > h2, .steps article, .faq-intro, .faq-list details, .contact > div, #project-form');
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      visible.forEach((entry, index) => {
        enter(entry.target, Math.min(index * 65, 195));
        reveal.unobserve(entry.target);
      });
    }, { threshold: .08 });
    revealTargets.forEach(element => reveal.observe(element));
    const visibility = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('motion-in-view', entry.isIntersecting));
    }, { threshold: .05 });
    document.querySelectorAll('.visual, .connection-art').forEach(element => visibility.observe(element));
  } else {
    document.querySelectorAll('.visual, .connection-art').forEach(element => element.classList.add('motion-in-view'));
  }
  document.addEventListener('raylab:solution-change', event => enter(event.detail.panel, 0, 12));
  window.addEventListener('pageshow', syncPreference);
  let scrollFrame = 0;
  function updateScroll() {
    scrollFrame = 0;
    header?.classList.toggle('is-scrolled', window.scrollY > 20);
  }
  const queueScroll = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll); };
  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', queueScroll, { passive: true });
  updateScroll();
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.service').forEach(card => {
      let frame = 0;
      let x = 0, y = 0;
      card.addEventListener('pointermove', event => {
        if (!enabled()) return;
        const bounds = card.getBoundingClientRect();
        x = event.clientX - bounds.left;
        y = event.clientY - bounds.top;
        if (!frame) frame = requestAnimationFrame(() => {
          card.style.setProperty('--pointer-x', `${x}px`);
          card.style.setProperty('--pointer-y', `${y}px`);
          frame = 0;
        });
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        card.style.removeProperty('--pointer-x');
        card.style.removeProperty('--pointer-y');
      });
    });
  }
})();
