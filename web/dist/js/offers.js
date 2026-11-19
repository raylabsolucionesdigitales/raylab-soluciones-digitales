(() => {
 const select=document.querySelector('#service'),message=document.querySelector('#message');
 document.querySelectorAll('[data-entry-offer]').forEach(link=>link.addEventListener('click',()=>{
  const id=link.dataset.offerService;
  const service=window.RAYLAB_SERVICES?.services?.find(item=>item.id===id&&item.published!==false);
  if(select){const value=service?.title||'Quiero orientación';select.value=[...select.options].some(option=>option.value===value)?value:'Quiero orientación'}
  if(message&&!message.value.trim())message.value=link.dataset.entryOffer;
 }));
})();
