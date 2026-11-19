import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {selectSkill,businessPrompt,validateBusiness,chooseResource} from '../src/worker.mjs';
const business=JSON.parse(readFileSync(new URL('../config/empresa.json',import.meta.url),'utf8'));
test('four business processes route to separate enabled skills',()=>{
 const cases=[['¿Qué servicios ofrecen?','informar-servicios'],['Mándame el catálogo','compartir-documentos'],['Quiero cotizar una web','recoger-consulta'],['Quiero hablar con un asesor, también el catálogo','atencion-humana']];
 for(const [text,id] of cases)assert.equal(selectSkill(text,[],business).id,id);
 assert.equal(selectSkill('Sí',[{role:'user',content:'Quiero cotizar una web'}],business).id,'recoger-consulta');
});
test('skills remain scoped to the configured business and enabled processes',()=>{
 const other={...business,name:'Negocio de prueba',skills:['informar-servicios']};
 assert.equal(selectSkill('Manda el catálogo',[],other),null);
 assert.equal(chooseResource('Manda el catálogo',[],other),null);
 assert.match(businessPrompt(other,'hola'),/Negocio de prueba/);
 assert.doesNotMatch(businessPrompt(other,'hola'),/\{\{businessName\}\}/);
 for(const skills of [[],['inventada'],['informar-servicios','informar-servicios']])assert.throws(()=>validateBusiness({...business,skills}));
 assert.throws(()=>validateBusiness({...business,mode:'autonomo'}));
});
test('current catalog is chosen explicitly; specific documents beat the general catalog',()=>{
 assert.equal(chooseResource('Mándame el catálogo',[],business).filename,'raylab-catalogo.pdf');
 assert.equal(chooseResource('Quiero el catálogo de Odoo',[],business).id,'odoo');
 assert.equal(chooseResource('Mándamelo',[{role:'user',content:'Me interesa Odoo'}],business).id,'odoo');
 assert.equal(chooseResource('No me envíes archivos',[],business),null);
 assert.equal(chooseResource('Envíame contratos y facturas',[],business),null);
 assert.equal(chooseResource('Crea un PDF personalizado de mi negocio',[],business),null);
 assert.equal(chooseResource('Hola',[],business),null);
});
test('Raylab is informational and loads only the relevant skill, with official identity',()=>{
 assert.equal(business.mode,'informational');
 const prompt=businessPrompt(business,'Necesito cotizar mi página');
 assert.match(prompt,/Habilidad activa: recoger-consulta/);
 assert.match(prompt,/ALCANCE INFORMATIVO/);
 assert.match(prompt,/Raylab Soluciones Digitales/);
 assert.doesNotMatch(prompt,/Habilidad activa: compartir-documentos/);
 assert(business.knowledge.some(s=>s.includes('contacto.raylab@gmail.com')));
 assert(business.resources.every(r=>new URL(r.url).hostname==='raylabsolucionesdigitales.pages.dev'));
});
test('each configured Raylab document exists in the local website delivery',()=>{
 for(const resource of business.resources){
  const asset=new URL('../../../web/dist'+new URL(resource.url).pathname,import.meta.url);
  assert(existsSync(asset),resource.filename);
  assert.equal(readFileSync(asset).subarray(0,5).toString(),'%PDF-');
 }
});
