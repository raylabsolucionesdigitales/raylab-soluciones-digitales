const solutionTabs=[...document.querySelectorAll('.solution-tabs [role="tab"]')];
const solutionIcons=[
 '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><path d="M14 6h4v4M6 14v4h4"/>',
 '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M9 9v11M6 6.5h.01"/>',
 '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>'
];
const exampleIcons=[solutionIcons[0],solutionIcons[2],'<path d="M20 11a8 8 0 0 1-8 8H5l-3 3 1-6a8 8 0 1 1 17-5Z"/><path d="M8 9c1 3 3 5 6 6"/>','<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/>','<path d="M3 10h5l12-6v16l-12-6H3Zm4 4 2 7h4l-2-6"/>','<path d="M4 20V12h4v8m3 0V7h4v13m3 0V3h4v17"/>','<rect x="2" y="6" width="15" height="13" rx="2"/><path d="M19 7q6 5 0 11M3 10h13"/>'];
solutionTabs.forEach((tab,index)=>{const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');icon.setAttribute('focusable','false');icon.innerHTML=exampleIcons[{ads:4,whatsapp:2,odoo:0}[tab.dataset.exampleIcon]??index]||solutionIcons[0];tab.prepend(icon)});
function activateSolution(tab,focus=false){solutionTabs.forEach(item=>{const selected=item===tab;item.setAttribute('aria-selected',String(selected));item.tabIndex=selected?0:-1;document.getElementById(item.getAttribute('aria-controls')).hidden=!selected});if(focus)tab.focus();document.dispatchEvent(new CustomEvent('raylab:solution-change',{detail:{panel:document.getElementById(tab.getAttribute('aria-controls'))}}))}
document.querySelectorAll('[data-solution-service]').forEach(link=>link.addEventListener('click',()=>{const service=window.RAYLAB_SERVICES?.services.find(item=>item.id===link.dataset.solutionService);const select=document.getElementById('service');if(service&&select)select.value=service.title}));
solutionTabs.forEach((tab,index)=>{tab.addEventListener('click',()=>activateSolution(tab));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%solutionTabs.length;if(event.key==='ArrowLeft')next=(index+solutionTabs.length-1)%solutionTabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=solutionTabs.length-1;if(next!==undefined){event.preventDefault();activateSolution(solutionTabs[next],true)}})});

// Animate only the active example while it is visible; never cycle the reader's tab.
(() => {
 const panels=[...document.querySelectorAll('.solution-panel')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let running=[];
 function stop(){running.forEach(animation=>animation.cancel());running=[]}
 function play(panel){
  stop();
  if(!panel||panel.hidden||document.hidden||reduced.matches)return;
  const bounds=panel.getBoundingClientRect();
  if(bounds.bottom<=0||bounds.top>=innerHeight)return;
  function animate(element,frames,options){if(element?.animate)running.push(element.animate(frames,options))}
  const ease='cubic-bezier(.2,.7,.2,1)';
  panel.querySelectorAll('.deal,.example-chat p,.example-field,.demo-web-cards>span,.nfc-demo-card').forEach((item,index)=>{
   animate(item,[{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:550,delay:index*160,easing:ease,fill:'backwards'});
  });
  panel.querySelectorAll('.flow-pills>span').forEach((step,index)=>{
   animate(step,[{boxShadow:'0 0 0 0 #9855ff00'},{boxShadow:'0 0 14px 1px #9855ff55',offset:.35},{boxShadow:'0 0 0 0 #9855ff00',offset:.7},{boxShadow:'0 0 0 0 #9855ff00'}],{duration:3600,delay:index*700,iterations:Infinity});
  });
  panel.querySelectorAll('.deal-dot,.example-result,.example-status').forEach((item,index)=>{
   animate(item,[{opacity:.65},{opacity:1},{opacity:.65}],{duration:3000,delay:index*300,iterations:Infinity,easing:'ease-in-out'});
  });
  const card=panel.querySelector('.nfc-demo-card');
  animate(card,[{transform:'translateY(0) rotate(-2deg)'},{transform:'translateY(-7px) rotate(1deg)'},{transform:'translateY(0) rotate(-2deg)'}],{duration:5000,iterations:Infinity,easing:'ease-in-out',delay:800});
 }
 const current=()=>panels.find(panel=>!panel.hidden);
 document.addEventListener('raylab:solution-change',event=>play(event.detail.panel));
 if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.target===current()){if(entry.isIntersecting)play(entry.target);else stop()}})},{threshold:.08});panels.forEach(panel=>observer.observe(panel))}
 else play(current());
 document.addEventListener('visibilitychange',()=>document.hidden?stop():play(current()));
 reduced.addEventListener?.('change',()=>play(current()));
})();
