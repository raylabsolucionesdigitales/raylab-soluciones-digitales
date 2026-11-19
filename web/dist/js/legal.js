/* Anchor spacing follows the actual header, including mobile wrapping and zoom. */
(() => {
  const header = document.querySelector('.legal-header');
  if (!header) return;
  const update = () => document.body.style.setProperty(
    '--legal-header-height', `${Math.ceil(header.getBoundingClientRect().height)}px`
  );
  update();
  if ('ResizeObserver' in window) new ResizeObserver(update).observe(header);
  else window.addEventListener('resize', update);
})();
