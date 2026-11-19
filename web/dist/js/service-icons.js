(()=>{'use strict';
 const icons={odoo:[['technologies/odoo-icon','Odoo']],web:[['technologies/html5','HTML5'],['technologies/css3','CSS3'],['technologies/javascript','JavaScript']],whatsapp:[['technologies/whatsapp','WhatsApp']],microapps:[['technologies/python','Python'],['technologies/javascript','JavaScript']],ads:[['services/meta','Meta'],['services/google-ads','Google Ads']],analytics:[['services/analytics','Google Analytics']],nfc:[['services/nfc','NFC']]};
 const group=(id)=>{const el=document.createElement('div');el.className='service-brand-icons service-brand-'+id;(icons[id]||[]).forEach(([file,name])=>{const img=document.createElement('img');img.src='img/'+file+'.svg';img.alt=name;img.title=name;img.width=44;img.height=44;el.append(img);});return el;};
 document.querySelectorAll('.custom-service[data-service-id]').forEach(card=>{card.querySelector('.reference-service-icon')?.remove();card.prepend(group(card.dataset.serviceId));});
 const hero=document.querySelector('.service-detail-hero>div');if(hero){const label=hero.querySelector('.eyebrow');const identity=document.createElement('div');identity.className='service-identity';if(label){if(document.body.dataset.service==='odoo')label.textContent='Gestión empresarial';label.before(identity);identity.append(label,group(document.body.dataset.service));}else hero.prepend(group(document.body.dataset.service));}
 // Keep every section readable even when animation APIs are unavailable.
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 const fine=window.matchMedia('(hover: hover) and (pointer: fine)');
 const cards=document.querySelectorAll('.custom-service,.service-deliverables article,.service-scope');
 cards.forEach(card=>{
  card.classList.add('interactive-service-surface');
  let frame=0;
  card.addEventListener('pointermove',e=>{
   if(reduce.matches||!fine.matches||e.pointerType!=='mouse')return;
   cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
    const r=card.getBoundingClientRect(),x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));
    card.style.setProperty('--pointer-x',x*100+'%');card.style.setProperty('--pointer-y',y*100+'%');
    card.style.setProperty('--tilt-x',(0.5-y)*3+'deg');card.style.setProperty('--tilt-y',(x-.5)*3+'deg');
   });
  });
  const reset=()=>{cancelAnimationFrame(frame);card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');};
  card.addEventListener('pointerleave',reset);card.addEventListener('pointercancel',reset);
 });
 const animate=(el,frames,options)=>{if(!reduce.matches&&el?.animate)return el.animate(frames,options);};
 // The home catalogue is generated separately from the service detail pages.
 // Animate the group together so the stagger is visible when entering this section.
 const catalogue=document.querySelector('#servicios .services');
 if(catalogue&&'IntersectionObserver' in window){
  let entered=false;const entrance=new IntersectionObserver(entries=>{
   const visible=entries[0].isIntersecting;
   catalogue.classList.toggle('catalogue-in-view',visible);
   if(!visible)return;if(entered)return;entered=true;
   catalogue.querySelectorAll('.custom-service').forEach((card,i)=>{
    animate(card,[{opacity:.65,translate:'0 12px',scale:'.995'},{opacity:1,translate:'0 0',scale:'1'}],{duration:280,delay:Math.min(i*30,120),fill:'backwards',easing:'cubic-bezier(.16,1,.3,1)'});
   });
  },{threshold:.08});entrance.observe(catalogue);
 }
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)return;observer.unobserve(entry.target);animate(entry.target,[{opacity:.65,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,easing:'cubic-bezier(.2,.7,.2,1)',delay:Number(entry.target.dataset.entranceDelay)||0});}),{threshold:.12});
  document.querySelectorAll('.service-detail-hero>div,.service-scope,.service-detail-heading,.service-deliverables article,.service-preparation>*,.service-detail-faq>*,.service-detail-cta,.service-related').forEach(el=>observer.observe(el));
  document.querySelectorAll('.service-deliverables article').forEach((el,i)=>el.dataset.entranceDelay=String(i*30));
 }
 document.querySelectorAll('.service-detail-faq details').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)animate(detail.querySelector('p'),[{opacity:0,transform:'translateY(-5px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'ease-out'});}));
 document.querySelectorAll('.custom-service,.service-deliverables article').forEach(card=>{
  const respond=()=>card.querySelectorAll('.service-brand-icons img,.service-step').forEach((icon,i)=>animate(icon,[{transform:'translateY(0)'},{transform:'translateY(-4px)'},{transform:'translateY(0)'}],{duration:420,delay:i*45,easing:'ease-out'}));
  card.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')respond();});card.addEventListener('focusin',respond);
  card.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')respond();});
 });
 document.querySelectorAll('.service-detail-page .button,.custom-service>a,.service-related a').forEach(button=>button.addEventListener('pointerdown',e=>{
  if(reduce.matches)return;const r=button.getBoundingClientRect(),ripple=document.createElement('span');ripple.className='service-touch-ripple';ripple.setAttribute('aria-hidden','true');ripple.style.left=(e.clientX-r.left)+'px';ripple.style.top=(e.clientY-r.top)+'px';button.append(ripple);
  const motion=ripple.animate([{transform:'translate(-50%,-50%) scale(0)',opacity:.25},{transform:'translate(-50%,-50%) scale(1)',opacity:0}],{duration:500,easing:'ease-out'});motion.onfinish=()=>ripple.remove();
 }));
 document.querySelectorAll('.service-detail-page a[href="#consulta"]').forEach(link=>link.addEventListener('click',e=>{
  const target=document.querySelector('#consulta');if(!target)return;e.preventDefault();
  target.scrollIntoView({behavior:reduce.matches?'instant':'smooth',block:'center'});
  const heading=target.querySelector('h2');heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});
  animate(heading,[{opacity:.55},{opacity:1}],{duration:650,easing:'ease-out'});
 }));
})();


