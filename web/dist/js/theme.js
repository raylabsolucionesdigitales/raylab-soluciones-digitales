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
    if (meta) meta.content = theme === 'light' ? '#F0EADE' : '#100B20';
    document.querySelectorAll('.appearance-switch').forEach(button=>{
      button.setAttribute('aria-label','Elegir tema. Actual: '+(theme==='dark'?'oscuro':'claro'));
      button.title='Elegir tema';
    });
    document.querySelectorAll('.theme-mode-switch').forEach(button=>{
      button.setAttribute('aria-checked',String(theme==='dark'));
      button.title=theme==='dark'?'Activar modo claro':'Activar modo oscuro';
    });
    document.querySelectorAll('.theme-toggle').forEach(button => {
      const dark = theme === 'dark';
      button.removeAttribute('aria-pressed');
      button.setAttribute('aria-label', 'Elegir apariencia');
      button.title = 'Elegir apariencia';
    });
  }
  apply(saved || (preference.matches ? 'dark' : 'light'));
  document.addEventListener('DOMContentLoaded', () => {
    const sun='<circle cx="12" cy="12" r="4"/><path d="M12 2v1.5M12 20.5V22M2 12h1.5M20.5 12H22M4.9 4.9 6 6M18 18l1.1 1.1M4.9 19.1 6 18M18 6l1.1-1.1"/>';
    const moon='<path d="M19.8 15.2A8.2 8.2 0 0 1 8.8 4.2a8.3 8.3 0 1 0 11 11Z"/><path d="M17 3v4M15 5h4"/>';
    document.querySelectorAll('.theme-sun').forEach(icon=>{icon.innerHTML=sun;icon.setAttribute('focusable','false')});
    document.querySelectorAll('.theme-moon').forEach(icon=>{icon.innerHTML=moon;icon.setAttribute('focusable','false')});
    const phone=document.querySelector('.footer-navigation a[href="#contacto"]');
    if(phone){phone.replaceChildren(document.createTextNode('Conversemos '));const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');icon.setAttribute('focusable','false');icon.classList.add('ui-action-icon');icon.innerHTML='<path d="m7 3 3 5-2.5 2a15 15 0 0 0 6.5 6.5l2-2.5 5 3v3a2 2 0 0 1-2 2C9.6 21.4 2.6 14.4 2 5a2 2 0 0 1 2-2h3Z"/>';phone.append(icon)}
    document.querySelectorAll('.back-to-top').forEach(button=>{const icon=button.querySelector('svg');if(icon){icon.innerHTML='<path d="m6 13 6-6 6 6M12 7v12"/>';icon.setAttribute('focusable','false')}if(!button.querySelector('.back-top-label')){const label=document.createElement('span');label.className='back-top-label';label.textContent='Volver arriba';button.prepend(label)}});
    document.querySelectorAll('.theme-toggle').forEach(button => {
      button.hidden = false;
      button.className='appearance-switch';
      button.removeAttribute('hidden');
      button.removeAttribute('role');
      button.removeAttribute('aria-checked');
      button.setAttribute('aria-expanded','false');
      button.innerHTML='<span>Tema</span>';
      button.style.display='none';
      document.body.append(button);
      const panel=document.createElement('div');
      panel.className='theme-mode-control';panel.hidden=false;
      panel.setAttribute('role','group');panel.setAttribute('aria-label','Tema de la página');
      panel.innerHTML='<button type="button" data-theme-choice="light"><span class="theme-swatch theme-swatch-light" aria-hidden="true"></span>Claro<span class="theme-selected" aria-hidden="true">✓</span></button><button type="button" data-theme-choice="dark"><span class="theme-swatch theme-swatch-dark" aria-hidden="true"></span>Oscuro<span class="theme-selected" aria-hidden="true">✓</span></button>';
      document.body.append(panel);
      panel.innerHTML='<button type="button" class="theme-mode-switch" role="switch" aria-label="Modo oscuro"><svg class="theme-control-icon service-theme-icon service-theme-sun" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+sun+'</svg><svg class="theme-control-icon service-theme-icon service-theme-moon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+moon+'</svg></button>';
      panel.addEventListener('click',()=>{saved=root.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem(key,saved)}catch(_){}apply(saved)});
      const align=()=>{const header=document.querySelector('body>header');if(header){if(panel.parentElement!==header)header.append(panel);panel.style.removeProperty('top');}};
      align();window.addEventListener('resize',align);requestAnimationFrame(align);
      const header=document.querySelector('body>header');
      const nav=header?.querySelector('#navigation');
      const action=header?.querySelector('.compact');
      if(nav&&action&&!nav.querySelector('.service-mobile-contact')){
        const contact=action.cloneNode(true);contact.className='service-mobile-contact';contact.textContent='Hablemos de tu proyecto';
        contact.addEventListener('click',()=>{nav.classList.remove('open');header.querySelector('.menu')?.setAttribute('aria-expanded','false');});
        nav.append(contact);
      }
      button.addEventListener('click',()=>{
        panel.hidden=!panel.hidden;
        button.setAttribute('aria-expanded',String(!panel.hidden));
        panel.style.top=(button.getBoundingClientRect().bottom+9)+'px';
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

