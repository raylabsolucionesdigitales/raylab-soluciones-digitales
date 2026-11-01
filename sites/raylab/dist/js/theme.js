/* Run before styles load: keep the saved theme without a dark/light flash. */
(() => {
  const root = document.documentElement;
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  const key = 'raylab-theme';
  let saved = null;
  try { saved = localStorage.getItem(key); } catch (_) { /* Private storage may be unavailable. */ }
  if (saved !== 'light' && saved !== 'dark') saved = null;
  function apply(theme) {
    root.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'light' ? '#FAF8FF' : '#100B20';
    document.querySelectorAll('.theme-toggle').forEach(button => {
      const dark = theme === 'dark';
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? 'Activar modo claro' : 'Activar modo oscuro');
      button.title = dark ? 'Activar modo claro' : 'Activar modo oscuro';
    });
  }
  apply(saved || (preference.matches ? 'dark' : 'light'));
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.theme-toggle').forEach(button => {
      button.hidden = false;
      button.addEventListener('click', () => {
        saved = root.dataset.theme === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(key, saved); } catch (_) { /* Still works for this visit. */ }
        apply(saved);
      });
    });
    apply(root.dataset.theme);
  });
  const syncSystem = () => { if (!saved) apply(preference.matches ? 'dark' : 'light'); };
  if (preference.addEventListener) preference.addEventListener('change', syncSystem);
  else if (preference.addListener) preference.addListener(syncSystem);
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    saved = event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : null;
    apply(saved || (preference.matches ? 'dark' : 'light'));
  });
})();
