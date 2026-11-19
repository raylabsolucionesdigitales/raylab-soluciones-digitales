(() => {
  'use strict';
  const api=window.RaylabQuotation, whatsapp=window.RaylabWhatsApp;
  const form=document.getElementById('quotation-form');
  if(!form || !api) return;
  const select=document.getElementById('quote-service'), fields=document.getElementById('question-fields');
  const status=document.getElementById('quote-status'), fallback=document.getElementById('quote-fallback');
  const summary=document.getElementById('quote-error-summary');
  const cache={}; let current='';
  Object.entries(api.services).forEach(([key,s])=>{
    const option=document.createElement('option');option.value=key;option.textContent=s.label;select.append(option);
  });
  const answers=()=>Array.from(fields.querySelectorAll('input,select'),e=>e.value);
  function clearStatus(){status.textContent='';fallback.hidden=true;fallback.removeAttribute('href');summary.hidden=true;summary.textContent='';}
  function render(){
    if(current)cache[current]=answers();
    current=select.value;fields.replaceChildren();clearStatus();
    document.getElementById('service-questions').hidden=!current;
    document.getElementById('service-hint').hidden=!!current;
    document.getElementById('service-error').hidden=true;select.removeAttribute('aria-invalid');
    if(!Object.hasOwn(api.services,current))return;
    api.services[current].questions.forEach((q,i)=>{
      const wrap=document.createElement('div');wrap.className='quote-question';
      const label=document.createElement('label');label.htmlFor='answer-'+i;label.textContent=q.label+' *';
      const control=document.createElement(q.options?'select':'input');control.id='answer-'+i;control.name='answer-'+i;control.required=true;
      control.setAttribute('aria-describedby','answer-'+i+'-error');
      if(q.options){
        const empty=document.createElement('option');empty.value='';empty.textContent='Selecciona una opción';control.append(empty);
        q.options.forEach(value=>{const o=document.createElement('option');o.value=value;o.textContent=value;control.append(o);});
      }else{control.type='text';control.maxLength=450;control.placeholder=q.placeholder;}
      control.value=cache[current]?.[i]||'';
      const error=document.createElement('p');error.id='answer-'+i+'-error';error.className='quote-error';error.hidden=true;
      wrap.append(label,control,error);fields.append(wrap);
    });
  }
  select.addEventListener('change',render);
  const requested=new URLSearchParams(location.search).get('service');
  if(Object.hasOwn(api.services,requested))select.value=requested;
  render();
  form.querySelector('button[type="submit"]').disabled=false;
  const errorFields={service:select,name:document.getElementById('quote-name'),contact:document.getElementById('quote-contact')};
  Object.entries(errorFields).forEach(([key,element])=>element.setAttribute('aria-describedby',key+'-error'));
  form.addEventListener('input',event=>{
    clearStatus();const control=event.target;
    control.removeAttribute('aria-invalid');
    const id=control.getAttribute('aria-describedby');if(id){const error=document.getElementById(id);if(error)error.hidden=true;}
  });
  form.addEventListener('change',clearStatus);
  form.addEventListener('submit',event=>{
    event.preventDefault();clearStatus();
    form.querySelectorAll('[aria-invalid]').forEach(e=>e.removeAttribute('aria-invalid'));
    form.querySelectorAll('.quote-error').forEach(e=>{e.hidden=true;e.textContent='';});
    const data={service:select.value,name:form.elements.name.value,company:form.elements.company.value,contact:form.elements.contact.value,comments:form.elements.comments.value,answers:answers()};
    const errors=api.validate(data);let first=null;
    Object.entries(errors).forEach(([key,message])=>{
      const control=errorFields[key]||document.getElementById(key);
      const error=document.getElementById(key+'-error');
      if(control){control.setAttribute('aria-invalid','true');if(!first)first=control;}
      if(error){error.textContent=message;error.hidden=false;}
    });
    if(Object.keys(errors).length){summary.textContent='Revisa los campos indicados antes de continuar.';summary.hidden=false;first?.focus();return;}
    if(!whatsapp?.phone || !/^\d{7,15}$/.test(whatsapp.phone)){
      summary.textContent='El canal de WhatsApp todavía no está configurado. Escríbenos a contacto.raylab@gmail.com.';summary.hidden=false;return;
    }
    const url=whatsapp.url(api.buildMessage(data));fallback.href=url;fallback.hidden=false;
    status.textContent='Tu solicitud está preparada. Revísala y pulsa Enviar dentro de WhatsApp. Desde esta página no se ha enviado información.';
    window.open(url,'_blank','noopener,noreferrer');
  });
})();
