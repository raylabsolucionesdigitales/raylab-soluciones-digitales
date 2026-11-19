/* Controller integration checks with a minimal DOM; no browser or network. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const api=require('../../../web/dist/js/quotation-core.js');
const wa=require('../../../web/dist/js/whatsapp-core.js');
const elements=new Map();
class Element{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.listeners={};this.attrs={};this.value='';this.hidden=false;this.textContent='';this.disabled=true;}
 set id(value){this._id=value;elements.set(value,this)}get id(){return this._id}
 append(...children){this.children.push(...children)}
 replaceChildren(...children){this.children=children}
 setAttribute(k,v){this.attrs[k]=v}getAttribute(k){return this.attrs[k]||null}removeAttribute(k){delete this.attrs[k]}
 addEventListener(type,handler){(this.listeners[type]??=[]).push(handler)}
 emit(type,target=this){for(const f of this.listeners[type]||[])f({target,preventDefault(){}})}
 focus(){this.focused=true}
 all(){return this.children.flatMap(c=>[c,...c.all()])}
 querySelectorAll(selector){return this.all().filter(e=>selector==='input,select'?['input','select'].includes(e.tagName):selector==='[aria-invalid]'?!!e.attrs['aria-invalid']:selector==='.quote-error'?e.className==='quote-error':false)}
 querySelector(selector){return this.all().find(e=>e.tagName==='button')}
}
const form=new Element('form');form.id='quotation-form';
const mapping={'quote-service':'select','question-fields':'div','quote-status':'p','quote-fallback':'a','quote-error-summary':'div','service-questions':'fieldset','service-hint':'p','service-error':'p','name-error':'p','contact-error':'p','quote-name':'input','quote-company':'input','quote-contact':'input','quote-comments':'textarea'};
for(const [id,tag] of Object.entries(mapping)){const e=new Element(tag);e.id=id;form.append(e)}
const submit=new Element('button');form.append(submit);
form.elements={name:elements.get('quote-name'),company:elements.get('quote-company'),contact:elements.get('quote-contact'),comments:elements.get('quote-comments')};
const opened=[];
const context={window:{RaylabQuotation:api,RaylabWhatsApp:{...wa},open:(...args)=>opened.push(args)},document:{getElementById:id=>elements.get(id),createElement:tag=>new Element(tag)},location:{search:'?service=web'},URLSearchParams};
vm.runInNewContext(fs.readFileSync('web/dist/js/quotation.js','utf8'),context);
assert.equal(elements.get('quote-service').value,'web');assert.equal(submit.disabled,false);
const select=elements.get('quote-service'),fields=elements.get('question-fields');
assert.equal(fields.querySelectorAll('input,select').length,4);
form.emit('submit');assert.equal(opened.length,0);assert.equal(elements.get('quote-name').attrs['aria-invalid'],'true');
form.elements.name.value='Prueba ficticia';form.elements.contact.value='prueba@example.com';
for(const [key,service] of Object.entries(api.services)){
 select.value=key;select.emit('change');
 const controls=fields.querySelectorAll('input,select');assert.equal(controls.length,4);
 controls.forEach((c,i)=>c.value=service.questions[i].options?.[0]||'Necesito orientación');
 form.emit('submit');
 const url=new URL(opened.at(-1)[0]);assert(url.searchParams.get('text').includes(service.label));
 assert.equal(elements.get('quote-fallback').hidden,false);
 assert(elements.get('quote-status').textContent.includes('no se ha enviado'));
}
assert.equal(opened.length,7);
select.value='web';select.emit('change');
assert.equal(fields.querySelectorAll('input,select')[1].value,'Necesito orientación');
form.elements.contact.value='incorrecto';form.emit('submit');assert.equal(opened.length,7);
form.elements.contact.value='prueba@example.com';context.window.RaylabWhatsApp.phone='';form.emit('submit');assert.equal(opened.length,7);assert(elements.get('quote-error-summary').textContent.includes('no está configurado'));
console.log('Controller OK: preselection, 7 dynamic question sets, required validation, cached answers, fallback and missing-configuration handling. No browser or network used.');
