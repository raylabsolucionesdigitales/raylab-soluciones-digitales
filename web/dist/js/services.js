(() => {
 if(!window.RAYLAB_SERVICES||!window.RaylabServices)return;
 let data;try{data=RaylabServices.validate(window.RAYLAB_SERVICES)}catch{return}
 const section=document.querySelector('#servicios');const grid=section?.querySelector('.services');if(!grid)return;
 const title=section.querySelector('h2'),description=section.querySelector('.section-heading > p');
 if(title)title.textContent=data.heading;if(description)description.textContent=data.description;
 const add=(tag,className,text)=>{const el=document.createElement(tag);el.className=className;if(text!==undefined)el.textContent=text;return el};
 grid.replaceChildren();grid.classList.add('personal-services');
 const select=document.querySelector('#service');if(select){select.replaceChildren();const help=document.createElement('option');help.textContent='Quiero orientación';select.append(help);data.services.filter(s=>s.published).forEach(s=>{const opt=document.createElement('option');opt.textContent=s.title;select.append(opt)})}
 const requestedId=new URL(location.href).searchParams.get('service');
 const requestedService=data.services.find(service=>service.published&&service.id===requestedId);
 if(select&&requestedService)select.value=requestedService.title;
 data.services.filter(s=>s.published).forEach((service,index)=>{
  const card=add('article','service custom-service');card.id='servicio-'+service.id;
  if(service.image){const img=add('img','service-photo');img.src=service.image;img.alt=service.title;img.loading='lazy';img.width=800;img.height=450;card.append(img)}
  const top=add('div','service-topline');top.append(add('span','service-category',service.category||'SOLUCIÓN DIGITAL'),add('span','service-index',String(index+1).padStart(2,'0')));card.append(top);
  card.append(add('h3','',service.title),add('p','',service.description));
  if(service.features.length){const list=add('ul','');service.features.forEach(feature=>list.append(add('li','',feature)));card.append(list)}
  if(service.price)card.append(add('div','service-price',service.price));
  const link=add('a','','Conocer el servicio');link.href='servicios/servicio-'+service.id+'.html';
  const explore=document.createElementNS('http://www.w3.org/2000/svg','svg');explore.setAttribute('viewBox','0 0 24 24');explore.setAttribute('aria-hidden','true');explore.setAttribute('focusable','false');explore.classList.add('service-link-icon','service-explore-icon');explore.innerHTML='<rect x="3" y="7" width="6" height="6" rx="1"/><rect class="explore-tile" x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="17" width="6" height="6" rx="1"/><rect x="13" y="17" width="6" height="6" rx="1"/>';link.append(explore);
  link.addEventListener('click',()=>{if(select)select.value=service.title});card.append(link);grid.append(card);
 });
 // Footer links open the relevant service before native anchor navigation.
 function openService(id,focus=false){
  const card=document.getElementById(id);if(!card?.classList.contains('custom-service'))return;
  const details=card.querySelector('details');if(details)details.open=true;
  if(focus){const heading=card.querySelector('h3');heading?.setAttribute('tabindex','-1');heading?.focus({preventScroll:true})}
 }
 document.addEventListener('click',event=>{const link=event.target.closest('[data-service-target]');if(link)openService(link.dataset.serviceTarget,true)});
 window.addEventListener('hashchange',()=>openService(location.hash.slice(1)));
 window.addEventListener('load',()=>openService(location.hash.slice(1)));
 // Existing example links keep their service selection after personalizing the catalog.
 const aliases={'Desarrollo Odoo':'odoo','Diseño web':'web','Software a medida':'microapps'};
 document.addEventListener('click',event=>{const link=event.target.closest('[data-service]');if(!link)return;const match=data.services.find(s=>s.published&&s.id===aliases[link.dataset.service]);if(select)select.value=match?match.title:'Quiero orientación'});
})();
