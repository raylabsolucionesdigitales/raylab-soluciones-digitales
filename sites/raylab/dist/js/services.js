(() => {
 if(!window.RAYLAB_SERVICES||!window.RaylabServices)return;
 let data;try{data=RaylabServices.validate(window.RAYLAB_SERVICES)}catch{return}
 const section=document.querySelector('#servicios');const grid=section?.querySelector('.services');if(!grid)return;
 const title=section.querySelector('h2'),description=section.querySelector('.section-heading > p');
 if(title)title.textContent=data.heading;if(description)description.textContent=data.description;
 const add=(tag,className,text)=>{const el=document.createElement(tag);el.className=className;if(text!==undefined)el.textContent=text;return el};
 grid.replaceChildren();grid.classList.add('personal-services');
 const select=document.querySelector('#service');if(select){select.replaceChildren();data.services.filter(s=>s.published).forEach(s=>{const opt=document.createElement('option');opt.textContent=s.title;select.append(opt)});const help=document.createElement('option');help.textContent='Quiero orientación';select.append(help)}
 data.services.filter(s=>s.published).forEach((service,index)=>{
  const card=add('article','service custom-service');
  if(service.image){const img=add('img','service-photo');img.src=service.image;img.alt=service.title;img.loading='lazy';img.width=800;img.height=450;card.append(img)}
  const top=add('div','service-topline');top.append(add('span','service-category',service.category||'SOLUCIÓN DIGITAL'),add('span','service-index',String(index+1).padStart(2,'0')));card.append(top);
  card.append(add('h3','',service.title),add('p','',service.description));
  if(service.features.length){const list=add('ul','');service.features.forEach(feature=>list.append(add('li','',feature)));card.append(list)}
  if(service.price)card.append(add('div','service-price',service.price));
  const link=add('a','','Hablemos de este servicio');link.href='#contacto';link.append(add('span','','↗'));link.addEventListener('click',()=>{if(select)select.value=service.title});card.append(link);grid.append(card);
 });
 // Existing example links keep their service selection after personalizing the catalog.
 const aliases={'Desarrollo Odoo':'odoo','Diseño web':'web','Software a medida':'microapps'};
 document.addEventListener('click',event=>{const link=event.target.closest('[data-service]');if(!link)return;const match=data.services.find(s=>s.published&&s.id===aliases[link.dataset.service]);if(select)select.value=match?match.title:'Quiero orientación'});
})();
