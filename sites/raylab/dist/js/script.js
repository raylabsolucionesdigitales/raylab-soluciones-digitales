const menu=document.querySelector('.menu');const nav=document.querySelector('#navigation');menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');nav.classList.toggle('open',open)});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Abrir menú')}));document.querySelectorAll('[data-service]').forEach(a=>a.addEventListener('click',()=>{document.querySelector('#service').value=a.dataset.service}));document.querySelector('#year').textContent=new Date().getFullYear();

document.addEventListener('click',e=>{if(!nav.contains(e.target)&&!menu.contains(e.target)){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Abrir menú')}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Abrir menú')}});
const menuBreakpoint=window.matchMedia('(min-width:761px)');
const closeResponsiveMenu=()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false')};
if(typeof menuBreakpoint.addEventListener==='function')menuBreakpoint.addEventListener('change',closeResponsiveMenu);
else if(typeof menuBreakpoint.addListener==='function')menuBreakpoint.addListener(closeResponsiveMenu);
