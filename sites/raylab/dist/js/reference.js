/* One shared composition for both themes. Theme changes only alter colors. */
/* Cursor parallax uses individual transforms, preserving each panel's design. */
(() => {
  const hero=document.querySelector('.hero'), visual=hero?.querySelector('.visual');
  if (!hero || !visual) return;
  const fine=matchMedia('(hover:hover) and (pointer:fine)');
  const layers=[...visual.querySelectorAll(':scope > .stage-window, :scope > .code-card')];
  let frame=0, x=0, y=0, targetX=0, targetY=0;
  const allowed=()=>fine.matches && innerWidth>760 && !document.hidden;
  function draw(){
    frame=0;
    x+=(targetX-x)*.12; y+=(targetY-y)*.12;
    const settled=Math.abs(targetX-x)+Math.abs(targetY-y)<.002;
    if(settled){x=targetX;y=targetY;}
    layers.forEach((layer,index)=>{
      const strength=index===0?13:20;
      layer.style.translate=`${(x*strength).toFixed(3)}px ${(y*strength*.65).toFixed(3)}px`;
      const angle=Math.hypot(x,y)*2.5;
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
      <div class="app-brand"><img src="img/logo.svg?v=approved-hd-r-20261031" alt=""><span>RAYLAB<small>SOLUCIONES DIGITALES</small></span></div>
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
  hero.querySelector('.intro').textContent = 'Odoo, páginas web, sistemas a medida y microapps para hacer crecer tu negocio.';
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
  const strip = document.querySelector('.capability-strip');
  if (strip) services.after(strip);
  services.querySelector('.eyebrow').textContent = 'NUESTROS SERVICIOS';
  services.querySelector('h2').innerHTML = 'Soluciones que hacen <em>avanzar tu negocio</em>';
  services.querySelector('.section-heading > p').textContent = 'Tecnología práctica y a la medida de tus objetivos, con un equipo que te acompaña en cada paso.';
  const paths = [
    '<g fill="none" stroke-width="3.6"><circle cx="9" cy="19" r="7" stroke="#a34587"/><path d="M32 3v16a7 7 0 1 1-7-7c3.9 0 7 3.1 7 7" stroke="#9995b6"/><circle cx="43" cy="19" r="7" stroke="#9995b6"/><circle cx="61" cy="19" r="7" stroke="#9995b6"/></g>',
    '<circle cx="16" cy="16" r="12"/><ellipse cx="16" cy="16" rx="5" ry="12"/><path d="M4 16h24M7 9h18M7 23h18"/>',
    '<rect x="3" y="4" width="26" height="19" rx="2"/><path d="M16 23v5m-7 0h14"/>',
    '<rect x="8" y="2" width="16" height="28" rx="3"/><path d="M13 6h6m-4 20h2"/>'
  ];
  const names = ['Odoo','Páginas web','Sistemas a medida','Microapps'];
  const descriptions = ['Implementación, personalización y soporte de Odoo para optimizar tu empresa.','Sitios web modernos, rápidos y enfocados en generar resultados.','Desarrollamos soluciones personalizadas para tus procesos.','Pequeñas aplicaciones que resuelven grandes problemas de tu día a día.'];
  document.querySelector('header #navigation a[href="#por-donde-empezar"]')?.remove();
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
    card.prepend(icon);
    card.querySelector('h3').textContent = names[index] || card.querySelector('h3').textContent;
    card.querySelector(':scope > p').textContent = descriptions[index] || card.querySelector(':scope > p').textContent;
    const features = card.querySelector('ul');
    if (features) {
      const details = document.createElement('details');
      details.className = 'service-details';
      const summary = document.createElement('summary');
      summary.textContent = 'Ver detalles';
      features.before(details);
      details.append(summary,features);
    }
    card.querySelector(':scope > a').firstChild.textContent = 'Conocer más ';
  });
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
