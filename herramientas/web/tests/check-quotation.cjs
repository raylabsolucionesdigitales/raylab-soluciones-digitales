const assert=require('node:assert/strict');
const api=require('../../../web/dist/js/quotation-core.js');
const wa=require('../../../web/dist/js/whatsapp-core.js');
assert.equal(Object.keys(api.services).length,7);
for(const [service,definition] of Object.entries(api.services)){
 assert.equal(definition.questions.length,4);
 const data={service,name:'Cliente de prueba',company:'Empresa ficticia',contact:'prueba@example.com',comments:'Consulta ficticia: diseño & medición, ¿cómo empezamos?',answers:definition.questions.map(q=>q.options?q.options[0]:'Necesito orientación')};
 assert.deepEqual(api.validate(data),{});
 const message=api.buildMessage(data),url=new URL(wa.url(message));
 assert.equal(url.origin,'https://wa.me');assert.equal(url.pathname,'/'+wa.phone);
 assert.equal(url.searchParams.get('text'),message);
 assert(message.includes(definition.label));assert(message.includes(data.comments));
 definition.questions.forEach(q=>assert(message.includes(q.label)));
 assert(!api.validate({...data,answers:[]})['service']);
 assert.equal(Object.keys(api.validate({...data,answers:[]})).length,4);
 assert(api.validate({...data,name:'   '}).name);
 assert(api.validate({...data,contact:'hola'}).contact);
 assert(api.validate({...data,service:'__proto__'}).service);
 assert(!api.buildMessage({...data,company:'',comments:''}).includes('Empresa:'));
 console.log(service+': questions, validation and WhatsApp encoding OK');
}
for(const contact of ['+51 999 999 999','999999999','prueba@example.com'])assert(api.validContact(contact));
for(const contact of ['','@','a@b','123','hola','1234567890123456','<script>'])assert(!api.validContact(contact));
assert.throws(()=>api.buildMessage({service:'web'}));
console.log('No requests sent. No browser process started.');
