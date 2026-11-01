(() => {
 const wa=window.RaylabWhatsApp;if(!wa)return;
 const prepare=(link,message)=>{link.href=wa.url(message);link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label','Hablemos por WhatsApp (abre otra pestaña)')};
 const floating=document.querySelector('.whatsapp-float');if(floating)prepare(floating,wa.inquiry());
 const form=document.querySelector('#project-form');
 if(form)form.addEventListener('submit',event=>{
  event.preventDefault();
  const name=document.querySelector('#name'),message=document.querySelector('#message');
  if(!form.reportValidity())return;
  if(!name.value.trim()){name.focus();return}
  if(!message.value.trim()){message.focus();return}
  window.location.assign(wa.url(wa.project(name.value,document.querySelector('#service').value,message.value)));
 });
})();
