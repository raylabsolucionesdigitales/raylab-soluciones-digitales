(()=>{
 'use strict';
 const menu=document.querySelector('.menu'),nav=document.querySelector('#navigation');
 const close=()=>{nav?.classList.remove('open');menu?.setAttribute('aria-expanded','false');menu?.setAttribute('aria-label','Abrir menú');};
 menu?.addEventListener('click',()=>{
  const open=menu.getAttribute('aria-expanded')!=='true';
  menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');nav?.classList.toggle('open',open);
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){const open=menu?.getAttribute('aria-expanded')==='true';close();if(open)menu.focus();}});
 nav?.addEventListener('click',event=>{if(event.target.closest('a'))close();});
 document.addEventListener('click',e=>{if(!e.target.closest('header'))close();});
 const breakpoint=matchMedia('(min-width:1101px)');breakpoint.addEventListener?.('change',close);
 const year=document.querySelector('#year');if(year)year.textContent=new Date().getFullYear();
 const category=document.querySelector('.service-detail-hero .eyebrow')?.textContent;
 document.querySelectorAll('header>.compact,.footer-quote').forEach(link=>{
  const destination=new URL('comercial/cotizacion.html',document.baseURI);if(document.body.dataset.service)destination.searchParams.set('service',document.body.dataset.service);link.href=destination.href;
 });
 document.querySelectorAll('.service-whatsapp').forEach(a=>{const destination=new URL('comercial/cotizacion.html',document.baseURI);if(document.body.dataset.service)destination.searchParams.set('service',document.body.dataset.service);a.href=destination.href;a.removeAttribute('target');a.removeAttribute('rel');});
})();
(()=>{
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const targets=document.querySelectorAll('.service-artwork');
 if(!reduced.matches && 'IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(entry.isIntersecting){
    entry.target.animate([{opacity:.65,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'cubic-bezier(.22,1,.36,1)'});
    observer.unobserve(entry.target);
   }
  }),{threshold:.12});
  targets.forEach(el=>observer.observe(el));
 }
 if(matchMedia('(hover: hover) and (pointer: fine)').matches){
  document.querySelectorAll('.service-artwork-scene').forEach(scene=>{
   let frame=0;
   scene.addEventListener('pointermove',event=>{
    if(reduced.matches)return;
    const rect=scene.getBoundingClientRect();
    const x=(event.clientX-rect.left)/rect.width-.5;
    const y=(event.clientY-rect.top)/rect.height-.5;
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
     scene.style.setProperty('--art-x',`${x*10}px`);
     scene.style.setProperty('--art-y',`${y*8}px`);
    });
   });
   scene.addEventListener('pointerleave',()=>{
    cancelAnimationFrame(frame);
    scene.style.setProperty('--art-x','0px');scene.style.setProperty('--art-y','0px');
   });
  });
 }
})();

// Compact, consistent controls for service pages on phones.
document.addEventListener('DOMContentLoaded',()=>{
 const nav=document.getElementById('navigation');
 const action=document.querySelector('header>.compact');
 if(nav&&action&&!nav.querySelector('.service-mobile-contact')){
  const contact=action.cloneNode(true);
  contact.className='service-mobile-contact';
  contact.textContent='Hablemos de tu proyecto';
  nav.append(contact);
 }
 const toggle=document.querySelector('.theme-mode-switch');
 if(toggle&&!toggle.querySelector('.service-theme-icon')){
  const make=(name,markup)=>{
   const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');
   icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');
   icon.classList.add('service-theme-icon','service-theme-'+name);
   icon.innerHTML=markup;toggle.append(icon);
  };
  make('sun','<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>');
  make('moon','<path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z"/>');
 }
});
