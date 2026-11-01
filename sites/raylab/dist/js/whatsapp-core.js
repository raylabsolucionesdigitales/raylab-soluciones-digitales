(function(root){
 'use strict';
 const phone='51906962740';
 const url=message=>'https://wa.me/'+phone+'?text='+encodeURIComponent(message);
 const label=value=>String(value).trim().replace(/\.+$/,'');
 const inquiry=service=>service?'Hola, Raylab. Me interesa el servicio: '+label(service)+'. ¿Podemos conversar sobre mi proyecto?':'Hola, Raylab. Vi tu página y me gustaría conversar sobre un proyecto.';
 const project=(name,service,message)=>`Hola, Raylab. Soy ${String(name).trim()}.\n\nMe interesa: ${label(service)}.\n\nMi proyecto:\n${String(message).trim()}`;
 const api=Object.freeze({phone,url,inquiry,project});root.RaylabWhatsApp=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
