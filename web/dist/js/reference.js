/* One shared composition for both themes. Theme changes only alter colors. */
/* Cursor parallax uses individual transforms, preserving each panel's design. */
(() => {
  const hero=document.querySelector('.hero'), visual=hero?.querySelector('.visual');
  if (!hero || !visual) return;
  // Scale the devices together instead of stacking the phone below the laptop.
  const sizeDevices=()=>{if(innerWidth<=760)visual.style.setProperty('--device-scale',String(visual.clientWidth/650));else visual.style.removeProperty('--device-scale');};
  sizeDevices();
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(sizeDevices).observe(visual);
  window.addEventListener('resize',sizeDevices,{passive:true});
  const fine=matchMedia('(hover:hover) and (pointer:fine)');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const layers=[...visual.querySelectorAll(':scope > .stage-window, :scope > .code-card')];
  let frame=0, x=0, y=0, targetX=0, targetY=0;
  const allowed=()=>fine.matches && !reduced.matches && innerWidth>760 && !document.hidden;
  function draw(){
    frame=0;
    x+=(targetX-x)*.22; y+=(targetY-y)*.22;
    const settled=Math.abs(targetX-x)+Math.abs(targetY-y)<.002;
    if(settled){x=targetX;y=targetY;}
    layers.forEach((layer,index)=>{
      const strength=index===0?5:8;
      layer.style.translate=`${(x*strength).toFixed(3)}px ${(y*strength*.65).toFixed(3)}px`;
      const angle=Math.hypot(x,y)*1;
      layer.style.rotate=angle>.001?`${-y} ${x} 0 ${angle}deg`:'none';
      layer.style.willChange=settled?'':'translate, rotate';
    });
    if(!settled) frame=requestAnimationFrame(draw);
  }
  function schedule(){if(!frame) frame=requestAnimationFrame(draw);}
  function reset(){targetX=targetY=0;schedule();}
  hero.addEventListener('pointermove',event=>{
    if(!allowed() || event.pointerType==='touch') return;
    const rect=hero.getBoundingClientRect();
    targetX=Math.max(-1,Math.min(1,(event.clientX-rect.left)/rect.width*2-1));
    targetY=Math.max(-1,Math.min(1,(event.clientY-rect.top)/rect.height*2-1));
    schedule();
  },{passive:true});
  hero.addEventListener('pointerleave',reset);
  window.addEventListener('blur',reset);
  window.addEventListener('resize',()=>{if(!allowed())reset();},{passive:true});
  fine.addEventListener?.('change',reset);
  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden)return;
    if(frame)cancelAnimationFrame(frame);
    frame=0;x=y=targetX=targetY=0;
    layers.forEach(layer=>{layer.style.translate='none';layer.style.rotate='none';layer.style.willChange='';});
  });
})();
(() => {
  window.RaylabDashboard = scene => window.RaylabServicePreview?.(scene) || `
    <aside class="overview-sidebar">
      <div class="app-brand"><img src="img/logo.svg?v=optimized-brand-20261115" alt=""><span>RAYLAB<small>SOLUCIONES DIGITALES</small></span></div>
      <span class="overview-active">⌂ &nbsp; Inicio</span><span>▧ &nbsp; Proyectos</span><span>♧ &nbsp; Clientes</span><span>☷ &nbsp; Tareas</span><span>▥ &nbsp; Reportes</span><span>⚙ &nbsp; Configuración</span>
    </aside>
    <div class="overview-main">
      <div class="overview-heading"><strong>¡Hola, equipo!</strong><small>Aquí tienes un resumen de tu negocio.</small><span class="app-avatar" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3"/></svg></span></div>
      <div class="overview-stats"><div><small>Proyectos activos</small><strong>12</strong><span>↗ +20%</span></div><div><small>Clientes</small><strong>28</strong><span>↗ +12%</span></div><div><small>Ingresos (S/.)</small><strong>S/ 48,750</strong><span>↗ +18%</span></div></div>
      <div class="overview-analysis">
        <div class="overview-chart"><div><strong>Crecimiento</strong><b class="growth-badge">↗ +18%<small>este mes</small></b></div><div class="overview-bars" aria-hidden="true"><i style="--bar:23%"></i><i style="--bar:38%"></i><i style="--bar:34%"></i><i style="--bar:52%"></i><i style="--bar:48%"></i><i style="--bar:67%"></i><i style="--bar:75%"></i><i style="--bar:94%"></i></div><div class="overview-months" aria-hidden="true"><span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span></div></div>
        <div class="overview-highlights"><div><span class="highlight-symbol">▧</span><small>Proyecto en marcha</small><strong>Sistema de gestión</strong><div class="highlight-progress"><i></i></div><span class="highlight-percent">70%</span></div><div><span class="highlight-symbol">♧</span><small>Nuevos clientes</small><strong class="highlight-number">+6</strong><small>este mes</small></div></div>
      </div>
      <p class="overview-demo-note">INTERFAZ ILUSTRATIVA · DATOS DE EJEMPLO</p>
    </div>`;
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const eyebrow = hero.querySelector('.eyebrow');
  eyebrow.textContent = 'IDEAS + SOFTWARE + RESULTADOS';
  hero.querySelector('h1').innerHTML = 'Tecnología que<br> impulsa <em>tu empresa.</em>';
  hero.querySelector('.intro').textContent = 'Desarrollamos tu web, conectamos Odoo y automatizamos la atención por WhatsApp. Soluciones a medida para que tu negocio trabaje mejor.';
  const servicesLink=hero.querySelector('.actions .text-link');
  if(servicesLink){servicesLink.textContent='Ver nuestros servicios';servicesLink.href='#servicios';}
  const benefitIcon = paths => '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+paths+'</svg>';
  hero.querySelector('.hero-tags').innerHTML =
    '<span><b aria-hidden="true">'+benefitIcon('<rect x="3" y="13" width="4" height="8" rx="1"/><rect x="10" y="8" width="4" height="13" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/>')+'</b>Más eficiencia<br>en tus procesos</span>'+
    '<span><b aria-hidden="true">'+benefitIcon('<circle cx="9" cy="7" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2H3ZM16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v2h-3"/>')+'</b>Soluciones<br>a la medida</span>'+
    '<span><b aria-hidden="true">'+benefitIcon('<path d="m13 2-8 12h6l-1 8 9-13h-6l1-7Z"/>')+'</b>Acompañamiento<br>real y cercano</span>';
  const terminal = hero.querySelector('.code-card');
  hero.querySelector('.stage-toolbar>span:nth-child(2)').textContent = 'raylab / tu próxima solución';
  const tasks = document.createElement('div');
  tasks.className = 'preview-tasks';
  tasks.innerHTML = '<strong>Mis tareas</strong><span><i></i>Diseño de propuesta</span><span><i></i>Desarrollo del sistema</span><span><i></i>Reunión con cliente</span><span><i></i>Lanzamiento</span>';
  terminal.append(tasks);
  window.dispatchEvent(new Event('raylab:reference-ready'));
  const services = document.getElementById('servicios');
  hero.after(services);
  services.querySelector('.eyebrow').textContent = 'NUESTROS SERVICIOS';
  services.querySelector('h2').innerHTML = 'Soluciones que hacen <em>avanzar tu negocio</em>';
  services.querySelector('.section-heading > p').textContent = 'Conectamos tus procesos. Creamos tu próxima solución digital.';
  const paths = [
    '<g fill="none" stroke-width="3.6"><circle cx="9" cy="19" r="7" stroke="#a34587"/><path d="M32 3v16a7 7 0 1 1-7-7c3.9 0 7 3.1 7 7" stroke="#9995b6"/><circle cx="43" cy="19" r="7" stroke="#9995b6"/><circle cx="61" cy="19" r="7" stroke="#9995b6"/></g>',
    '<circle cx="16" cy="16" r="12"/><ellipse cx="16" cy="16" rx="5" ry="12"/><path d="M4 16h24M7 9h18M7 23h18"/>',
    '<path d="M27 15a11 11 0 0 1-11 11H7l-5 4 2-8A11 11 0 1 1 27 15Z"/><circle cx="10" cy="15" r="1"/><circle cx="16" cy="15" r="1"/><circle cx="22" cy="15" r="1"/>',
    '<rect x="8" y="2" width="16" height="28" rx="3"/><path d="M13 6h6m-4 20h2"/>'
  ];
  paths.push('<path d="M5 13h7L26 6v20l-14-7H5Zm4 6 3 10h5l-3-9M29 12v8"/>','<rect x="4" y="20" width="5" height="9" rx="1"/><rect x="13" y="12" width="5" height="17" rx="1"/><rect x="22" y="3" width="5" height="26" rx="1"/>','<rect x="2" y="8" width="21" height="17" rx="3"/><path d="M2 13h21M6 20h4M26 10q5 6 0 12M29 7q7 9 0 18"/>');
  const names = ['Odoo','Páginas web','Agentes de WhatsApp','Microapps','Meta Ads y Google Ads','Analítica y medición','Soluciones NFC'];
  document.querySelector('header #navigation a[href="#por-donde-empezar"]')?.remove();
  paths[2]='<g transform="scale(1.3333)"><path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.5L2 21l1.9-5.7a8.5 8.5 0 1 1 16.6-3.7Z"/><path d="m8.2 7.2 1.4 2.6-1 1.1c.7 1.5 1.9 2.7 3.4 3.4l1.1-1 2.6 1.4c-.3 1.8-1.3 2.5-2.8 2.1-3.3-.9-6.1-3.7-7-7-.4-1.5.3-2.5 2.3-2.6Z"/></g>';
  const tabPaths = ['<rect x="3" y="3" width="10" height="10" rx="2"/><rect x="19" y="3" width="10" height="10" rx="2"/><rect x="3" y="19" width="10" height="10" rx="2"/><rect x="19" y="19" width="10" height="10" rx="2"/>',paths[1],paths[2],'<path d="m16 3 12 7v13l-12 7-12-7V10Zm0 13L4 10m12 6 12-6m-12 6v14"/>'];
  hero.querySelectorAll('.scene-switcher button').forEach((button,index) => {
    const label=button.textContent;
    button.innerHTML='<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8">'+tabPaths[index]+'</svg><span>'+label+'</span>';
  });
  services.querySelectorAll('.custom-service').forEach((card, index) => {
    if (index === 0) card.classList.add('service-odoo');
    const icon = document.createElementNS('http://www.w3.org/2000/svg','svg');
    icon.setAttribute('viewBox', index === 0 ? '0 0 72 32' : '0 0 32 32');
    icon.setAttribute('aria-hidden','true');
    icon.setAttribute('fill','none');
    icon.setAttribute('stroke','currentColor');
    icon.setAttribute('stroke-width','1.8');
    icon.classList.add('reference-service-icon');
    icon.innerHTML = paths[index] || paths[2];
    card.dataset.serviceId = window.RAYLAB_SERVICES.services.filter(item=>item.published)[index].id;
    card.prepend(icon);
    card.querySelector('h3').textContent = names[index] || card.querySelector('h3').textContent;
    const features = card.querySelector('ul');
    if (features) features.remove();
    const contact = card.querySelector(':scope > a');
    if(contact){contact.href='servicios/servicio-'+card.dataset.serviceId+'.html';contact.replaceChildren(document.createTextNode('Conocer el servicio'));contact.setAttribute('aria-label','Conocer el servicio: '+card.querySelector('h3').textContent);}
  });
})();

// Mark the section being read without intercepting normal anchor navigation.
(() => {
  if (!('IntersectionObserver' in window)) return;
  const links = [...document.querySelectorAll('#navigation a[href^="#"]')];
  const sections = links.map(link => document.getElementById(link.hash.slice(1))).filter(Boolean);
  if (!sections.length) return;
  const visible = new Set();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
    const current = sections.filter(section => visible.has(section))
      .sort((a,b) => Math.abs(a.getBoundingClientRect().top-100)-Math.abs(b.getBoundingClientRect().top-100))[0];
    links.forEach(link => {
      if (current && link.hash === '#'+current.id) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
  }, {rootMargin:'-90px 0px -35% 0px',threshold:0});
  sections.forEach(section => observer.observe(section));
})();

// Anchor each connector to its actual cards instead of fixed rotated percentages.
(() => {
  const art = document.querySelector('.connection-art');
  if (!art) return;
  const center = art.querySelector('.connection-center');
  if (!art.querySelector('.node-apps')) {
    const node=document.createElement('div');
    node.className='node node-apps';
    node.innerHTML='▱<span>Microapps</span>';
    const line=document.createElement('div');
    line.className='connection-line line-d';
    art.append(node,line);
  }
  const pairs = [['.line-a','.node-web'],['.line-b','.node-odoo'],['.line-c','.node-data'],['.line-d','.node-apps']];
  const point = el => ({x:el.offsetLeft+el.offsetWidth/2,y:el.offsetTop+el.offsetHeight/2});
  const align = () => {
    const end = {x:art.clientWidth/2,y:art.clientHeight/2};
    pairs.forEach(([selector,nodeSelector]) => {
      const line=art.querySelector(selector), node=art.querySelector(nodeSelector);
      if (!line || !node) return;
      const start=point(node), dx=end.x-start.x, dy=end.y-start.y;
      Object.assign(line.style,{left:start.x+'px',top:start.y+'px',width:Math.hypot(dx,dy)+'px',transformOrigin:'0 50%',transform:'rotate('+Math.atan2(dy,dx)+'rad)'});
    });
  };
  align();
  if ('ResizeObserver' in window) {
    const observer=new ResizeObserver(align);
    [art,center,...art.querySelectorAll('.node')].forEach(el=>observer.observe(el));
  } else window.addEventListener('resize',align);
})();
// SVG symbols stay crisp and never become platform emoji on iOS.
(() => {
 const shapes={
  explore:'<rect x="3" y="7" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="17" width="6" height="6" rx="1"/><rect x="13" y="17" width="6" height="6" rx="1"/>',
  chat:'<path d="M20 11a8 8 0 0 1-8 8H5l-4 3 2-6a8 8 0 1 1 17-5Z"/><path d="M7 10h8M7 14h5"/>',
  down:'<path d="M12 4v16m-6-6 6 6 6-6"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  growth:'<path d="M4 19V13h4v6M10 19V9h4v10M16 19V4h4v15"/>'
 };
 const svg=kind=>{const el=document.createElementNS('http://www.w3.org/2000/svg','svg');el.setAttribute('viewBox','0 0 24 24');el.setAttribute('aria-hidden','true');el.setAttribute('focusable','false');el.classList.add('ui-action-icon');el.innerHTML=shapes[kind];return el};
 function updateIcons(){
  // Remove decorative arrows throughout the page, including generated previews.
  document.querySelectorAll('.arrow-icon,.back-to-top svg').forEach(icon=>icon.remove());
  const arrowWalker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const arrowNodes=[];
  while(arrowWalker.nextNode()){
   const node=arrowWalker.currentNode;
   if(!node.parentElement.closest('script,style,svg')&&/[↗↘↖↙↑↓→←]/.test(node.data))arrowNodes.push(node);
  }
  arrowNodes.forEach(node=>{node.data=node.data.replace(/[↗↘↖↙↑↓→←]/g,'')});
  document.querySelectorAll('.company-chip.chip-connect').forEach(chip=>{
   chip.innerHTML='<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="8" height="8" rx="2"/><path d="M12 3v5m0 8v5M3 12h5m8 0h5"/><circle cx="12" cy="3" r="1"/><circle cx="12" cy="21" r="1"/><circle cx="3" cy="12" r="1"/><circle cx="21" cy="12" r="1"/></svg>';
  });
  document.querySelectorAll('.company-chip.chip-code').forEach(chip=>{
   chip.innerHTML='<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="3"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3M19 9h3m-3 6h3"/></svg>';
  });
  document.querySelectorAll('a,button,.purpose-icon,.chip-connect').forEach(el=>{
   const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())if(/[↗↓◎]/.test(walker.currentNode.data)&&!walker.currentNode.parentElement.closest('svg'))nodes.push(walker.currentNode);
   for(const node of nodes){const parts=node.data.split(/([↗↓◎])/);const fragment=document.createDocumentFragment();for(const part of parts){if(!/[↗↓◎]/.test(part)){fragment.append(document.createTextNode(part));continue}let kind=part==='↓'?'down':part==='◎'?'target':'explore';if(el.matches('.purpose-icon,.chip-connect')&&part==='↗')kind='growth';else if(el.closest('.actions')&&el.matches('.button'))kind='chat';fragment.append(svg(kind))}node.replaceWith(fragment)}
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',updateIcons,{once:true});else updateIcons();
})();
// Gentle pointer depth for the brand illustration; no interaction required on touch.
(() => {
 const visual=document.querySelector('.tech-core-visual');
 if(!visual)return;
 const pointer=matchMedia('(hover: hover) and (pointer: fine)');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 visual.addEventListener('pointermove',event=>{
  if(!pointer.matches||reduced.matches)return;
  const box=visual.getBoundingClientRect();
  const x=(event.clientX-box.left)/box.width-.5;
  const y=(event.clientY-box.top)/box.height-.5;
  visual.style.setProperty('--core-x',`${x*14}px`);
  visual.style.setProperty('--core-y',`${y*14}px`);
  visual.style.setProperty('--node-x',`${x*-10}px`);
  visual.style.setProperty('--node-y',`${y*-10}px`);
 });
 visual.addEventListener('pointerleave',()=>{
  ['--core-x','--core-y','--node-x','--node-y'].forEach(key=>visual.style.removeProperty(key));
 });
})();
