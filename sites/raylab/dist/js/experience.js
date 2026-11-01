(() => {
 const $=selector=>document.querySelector(selector),make=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls||'';if(text!==undefined)el.textContent=text;return el};
 const media=matchMedia('(prefers-reduced-motion: reduce)'),enabled=()=>window.RaylabMotion.enabled();
 const hero=$('.hero'),visual=$('.visual');
 const scenes=[
 {name:'Odoo',title:'Un proceso que avanza.',label:'Módulos e integraciones',code:'const oportunidad = web.recibir();\nodoo.crm.crear(oportunidad);\n// Tu equipo sigue el proceso.',type:'ODOO',body:'board'},
 {name:'Webs',title:'Una presencia que conecta.',label:'Diseño web adaptable',code:'const web = crearExperiencia({\n  marca: "tu identidad",\n  objetivo: "conectar"\n});',type:'DISEÑO WEB',body:'web'},
 {name:'Sistemas',title:'Lo esencial. En un sistema.',label:'Gestión adaptada a tu negocio',code:'const gestion = {\n  ventas: true,\n  inventario: true,\n  reportes: "a tu medida"\n};',type:'A MEDIDA',body:'erp'},
 {name:'Microapps',title:'Pequeña app. Gran utilidad.',label:'Herramientas enfocadas en tu negocio',code:'const microapp = construir({\n  problema: "uno concreto",\n  interfaz: "simple",\n  uso: "todos los días"\n});',type:'MICROAPPS',body:'app'}
 ];
 let timer=0,typing=0,current=0,visible=true,keyboardFocus=false;
 function animate(el,distance=12){if(enabled()&&el.animate)el.animate([{opacity:0,transform:`translateY(${distance}px)`},{opacity:1,transform:'translateY(0)'}],{duration:420,easing:'cubic-bezier(.2,.7,.2,1)'})}
 if(hero&&visual){
  hero.classList.add('experience-hero');
  const stage=make('div','stage-window');stage.innerHTML='<div class="stage-toolbar"><span class="stage-lights" aria-hidden="true">● ● ●</span><span>raylab / tu próxima solución</span><span class="stage-type"></span></div><div class="stage-screen"></div><div class="scene-caption"></div>';
  visual.append(stage);const switcher=make('div','scene-switcher');switcher.setAttribute('role','group');switcher.setAttribute('aria-label','Explorar soluciones Raylab');
  const terminal=visual.querySelector('.code-card');terminal?.querySelector('code')?.remove();const code=make('pre','live-terminal');terminal?.append(code);
  scenes.forEach((scene,index)=>{const button=make('button','',scene.name);button.type='button';button.setAttribute('aria-pressed',String(index===0));button.addEventListener('click',()=>renderScene(index));switcher.append(button)});visual.append(switcher);
  // Changing the service is functional content, independent of decorative motion.
  // Reduced motion uses immediate swaps, without typing or entrance effects.
  function schedule(){clearTimeout(timer);timer=0;if(visible&&!document.hidden&&!(keyboardFocus&&visual.contains(document.activeElement)))timer=setTimeout(()=>renderScene((current+1)%scenes.length),5800)}
  function terminalText(text){clearTimeout(typing);let cursor=0;if(!enabled()||!visible||document.hidden){code.textContent=text;return}code.textContent='';const tick=()=>{if(!enabled()||!visible||document.hidden){code.textContent=text;return}cursor+=3;code.textContent=text.slice(0,cursor);if(cursor<text.length)typing=setTimeout(tick,32)};tick()}
  function renderScene(index){current=index;const scene=scenes[index];visual.dataset.preview=scene.body;stage.querySelector('.stage-type').textContent=scene.type;stage.querySelector('.scene-caption').textContent=scene.label;const screen=stage.querySelector('.stage-screen');screen.dataset.scene=scene.body;screen.replaceChildren();screen.append(make('div','stage-kicker','INTERFAZ ILUSTRATIVA'),make('h3','',scene.title));
   if(scene.body==='board'){const board=make('div','scene-board');[['Nueva consulta','Tu próxima web','Formulario recibido'],['En desarrollo','Módulo personalizado','Proceso definido'],['Por revisar','Integración Odoo','Revisión contigo']].forEach(([label,title,note])=>{const lane=make('div','scene-lane');lane.append(make('span','',label));const ticket=make('div','scene-ticket',title);ticket.append(make('small','',note));lane.append(ticket);board.append(lane)});screen.append(board)}
   if(scene.body==='web'){const web=make('div','scene-web');web.append(make('small','','TU MARCA / TU ESENCIA'),make('strong','','Una web a tu altura.'),make('span','','Conoce lo que hacemos ↗'));screen.append(web)}
   if(scene.body==='erp'){const table=make('table','scene-table');table.innerHTML='<thead><tr><th>PRODUCTO DEMO</th><th>ESTADO</th><th>UBICACIÓN</th></tr></thead><tbody><tr><td>Producto A</td><td>Disponible</td><td>Almacén principal</td></tr><tr><td>Producto B</td><td>Por reponer</td><td>Sucursal</td></tr><tr><td>Producto C</td><td>Disponible</td><td>Almacén principal</td></tr></tbody>';screen.append(table)}
   if(scene.body==='app'){const app=make('div','scene-app');[['Una tarea','Una solución'],['Un equipo','Todo conectado']].forEach(([label,value])=>{const block=make('div','');block.append(make('small','',label),make('strong','',value));app.append(block)});app.append(make('div','scene-app-note','Cotizadores · Reservas · Herramientas internas'));screen.append(app)}
   {
    const overview=make('div','light-overview');
    overview.dataset.preview=scene.body;
    overview.setAttribute('aria-label',`Ejemplo ilustrativo de ${scene.name}, no son resultados reales`);
    overview.innerHTML='<aside class="overview-sidebar"><b>RAYLAB</b><span class="overview-active">Vista general</span><span>Proyectos</span><span>Clientes</span><span>Reportes</span></aside><div class="overview-main"><div class="overview-heading"><strong>Tu negocio, conectado.</strong><small>Así podría verse tu operación</small></div><div class="overview-stats"><div><small>Proyectos demo</small><strong>12</strong><span>En un solo lugar</span></div><div><small>Clientes demo</small><strong>28</strong><span>Información organizada</span></div><div><small>Procesos</small><strong>3</strong><span>Conectados</span></div></div><div class="overview-chart"><div><strong>Vista de actividad</strong><span>DATOS ILUSTRATIVOS</span></div><div class="overview-bars" aria-hidden="true"><i style="--bar:28%"></i><i style="--bar:42%"></i><i style="--bar:36%"></i><i style="--bar:60%"></i><i style="--bar:52%"></i><i style="--bar:76%"></i><i style="--bar:68%"></i><i style="--bar:94%"></i></div><div class="overview-months" aria-hidden="true"><span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span></div></div></div>';
    if(window.RaylabDashboard)overview.innerHTML=window.RaylabDashboard(scene);
    overview.querySelector('.overview-heading strong').textContent=scene.body==='board'?'¡Hola, equipo!':scene.title;
    overview.querySelector('.overview-heading>small').textContent=scene.body==='board'?'Aquí tienes un resumen de tu negocio.':scene.label;
    screen.append(overview);
   }
   [...switcher.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));animate(screen);terminalText(scene.code);schedule();
  }
  window.addEventListener('raylab:reference-ready',()=>renderScene(current));
  document.addEventListener('keydown',event=>{if(event.key==='Tab'){keyboardFocus=true;schedule()}});
  visual.addEventListener('pointerdown',()=>{keyboardFocus=false;schedule()},{passive:true});
  visual.addEventListener('pointerup',()=>{keyboardFocus=false;schedule()},{passive:true});
  visual.addEventListener('pointercancel',schedule,{passive:true});
  document.addEventListener('focusin',schedule);
  visual.addEventListener('focusout',()=>setTimeout(schedule,0));
  visual.addEventListener('blur',()=>setTimeout(schedule,0),true);
  const sync=()=>{clearTimeout(typing);code.textContent=scenes[current].code;schedule()};new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});window.RaylabMotion.listenPreference(media,sync);document.addEventListener('visibilitychange',sync);
  window.addEventListener('pageshow',sync);
  document.addEventListener('raylab:motion-change',sync);
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()},{threshold:.01}).observe(visual);renderScene(0);
 }
 const grid=$('.personal-services');if(grid){const cards=[...grid.children],filters=make('div','service-filters');filters.setAttribute('role','group');filters.setAttribute('aria-label','Filtrar servicios');const categories=[...new Set(cards.map(card=>card.querySelector('.service-category')?.textContent).filter(Boolean))];['Todos',...categories].forEach((category,index)=>{const button=make('button','',category);button.type='button';button.setAttribute('aria-pressed',String(index===0));button.addEventListener('click',()=>{[...filters.children].forEach(b=>b.setAttribute('aria-pressed',String(b===button)));cards.forEach(card=>{card.hidden=category!=='Todos'&&card.querySelector('.service-category')?.textContent!==category;if(!card.hidden)animate(card)});});filters.append(button)});grid.before(filters)}
 if(matchMedia('(hover:hover) and (pointer:fine)').matches){const glow=make('div','cursor-glow');glow.setAttribute('aria-hidden','true');document.body.append(glow);let raf=0,x=0,y=0;document.addEventListener('pointermove',event=>{if(!enabled()){glow.style.display='none';return}glow.style.display='';x=event.clientX-225;y=event.clientY-225;if(!raf)raf=requestAnimationFrame(()=>{glow.style.setProperty('--cursor-x',`${x}px`);glow.style.setProperty('--cursor-y',`${y}px`);raf=0})},{passive:true})}
})();
