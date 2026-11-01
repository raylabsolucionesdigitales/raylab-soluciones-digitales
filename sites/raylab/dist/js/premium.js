(() => {
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 const enabled=()=>window.RaylabMotion.enabled();
 const hero=document.querySelector('.hero');if(!hero)return;
 const visual=document.querySelector('.visual');
 const strip=document.querySelector('.capability-strip');
 if(strip){
  const items=[...strip.children];
  const paths=['M4 17v-4h3v4M10 17V9h3v8M16 17V4h3v13','m5 16 9-9 3 3-9 9H5v-3Zm7-7 3 3M4 4h4M6 2v4','M8 7h8M8 17h8M7 8v8M17 8v8M4 4h6v6H4zM14 14h6v6h-6z','m13 2-8 12h6l-1 8 9-13h-6l1-7Z'];
  items.forEach((item,index)=>{const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');icon.innerHTML=`<path d="${paths[index%paths.length]}"/>`;item.prepend(icon)});
  strip.replaceChildren();strip.classList.add('is-marquee');
  const track=document.createElement('div');track.className='marquee-track';strip.append(track);
  function fillStrip(){
   const group=document.createElement('div');group.className='marquee-group';
   items.forEach(item=>group.append(item));track.replaceChildren(group);
   // One complete group always spans the viewport, even on ultrawide screens.
   const minimum=strip.clientWidth+240;let copies=0;
   while(group.getBoundingClientRect().width<minimum&&copies++<30){items.forEach(item=>{const copy=item.cloneNode(true);copy.setAttribute('aria-hidden','true');group.append(copy)})}
   const width=group.getBoundingClientRect().width;
   const duplicate=group.cloneNode(true);duplicate.setAttribute('aria-hidden','true');track.append(duplicate);
   track.style.setProperty('--marquee-duration',`${Math.max(24,width/42)}s`);
  }
  fillStrip();let resizeFrame;
  const refresh=()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(fillStrip)};
  if('ResizeObserver'in window)new ResizeObserver(refresh).observe(strip);else window.addEventListener('resize',refresh);
  document.fonts?.ready.then(refresh);
 }
 if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('motion-in-view',entry.isIntersecting)),{threshold:.05});[hero,strip].filter(Boolean).forEach(el=>observer.observe(el))}
 else [hero,strip].filter(Boolean).forEach(el=>el.classList.add('motion-in-view'));
 const canvas=document.createElement('canvas');canvas.className='network-canvas';canvas.setAttribute('aria-hidden','true');hero.prepend(canvas);const ctx=canvas.getContext('2d');
 const pointer={x:-1000,y:-1000};let nodes=[],width=0,height=0,frame=0,inView=true,last=0;
 const mobile=matchMedia('(max-width:760px)').matches;
 function resize(){const b=hero.getBoundingClientRect();width=b.width;height=b.height;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx?.setTransform(ratio,0,0,ratio,0,0);nodes=Array.from({length:mobile?17:32},()=>({x:Math.random()*width,y:Math.random()*height,vx:(Math.random()-.5)*.22,vy:(Math.random()-.5)*.22}))}
 function draw(time){frame=0;if(!ctx||!enabled()||!inView||document.hidden)return;const step=Math.min((time-last)/16.67||1,2);last=time;const light=document.documentElement.dataset.theme==='light';ctx.lineWidth=light?1.2:1;ctx.clearRect(0,0,width,height);for(let i=0;i<nodes.length;i++){const n=nodes[i];n.x+=n.vx*step;n.y+=n.vy*step;if(n.x<0||n.x>width)n.vx*=-1;if(n.y<0||n.y>height)n.vy*=-1;ctx.fillStyle=light?'#8755c499':'#c4b5fd77';ctx.beginPath();ctx.arc(n.x,n.y,1.5,0,Math.PI*2);ctx.fill();for(let j=i+1;j<nodes.length;j++){const q=nodes[j],d=Math.hypot(n.x-q.x,n.y-q.y);if(d<135){ctx.strokeStyle=`rgba(${light?'125,78,180':'167,139,250'},${(1-d/135)*(light?.32:.2)})`;ctx.beginPath();ctx.moveTo(n.x,n.y);ctx.lineTo(q.x,q.y);ctx.stroke()}}const p=Math.hypot(n.x-pointer.x,n.y-pointer.y);if(p<190){ctx.strokeStyle=`rgba(${light?'119,66,178':'196,181,253'},${(1-p/190)*(light?.58:.35)})`;ctx.beginPath();ctx.moveTo(n.x,n.y);ctx.lineTo(pointer.x,pointer.y);ctx.stroke()}}frame=requestAnimationFrame(draw)}
 function sync(){if(frame)cancelAnimationFrame(frame);frame=0;if(ctx&&enabled()&&inView&&!document.hidden){last=performance.now();frame=requestAnimationFrame(draw)}else ctx?.clearRect(0,0,width,height);if(!enabled())visual?.style.removeProperty('--scene-angle')}
 document.addEventListener('raylab:motion-change',sync);
 if(ctx){resize();if('ResizeObserver'in window)new ResizeObserver(resize).observe(hero);else window.addEventListener('resize',resize);if('IntersectionObserver'in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync()}).observe(hero);document.addEventListener('visibilitychange',sync);window.RaylabMotion.listenPreference(media,sync);window.addEventListener('pageshow',()=>{resize();sync()});new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});sync()}
 hero.addEventListener('pointermove',event=>{if(!enabled()||mobile)return;const b=hero.getBoundingClientRect();pointer.x=event.clientX-b.left;pointer.y=event.clientY-b.top;visual?.style.setProperty('--scene-angle',`${(pointer.x/width-.5)*7}deg`)},{passive:true});hero.addEventListener('pointerleave',()=>{pointer.x=pointer.y=-1000;visual?.style.removeProperty('--scene-angle')});
 if(matchMedia('(hover:hover) and (pointer:fine)').matches)document.querySelectorAll('.custom-service').forEach(card=>{let raf=0,x=0,y=0;card.addEventListener('pointermove',e=>{if(!enabled())return;const b=card.getBoundingClientRect();x=(e.clientX-b.left)/b.width-.5;y=(e.clientY-b.top)/b.height-.5;if(!raf)raf=requestAnimationFrame(()=>{card.style.setProperty('--tilt-x',`${-y*5}deg`);card.style.setProperty('--tilt-y',`${x*5}deg`);raf=0})},{passive:true});card.addEventListener('pointerleave',()=>{if(raf)cancelAnimationFrame(raf);raf=0;card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y')})});
})();
