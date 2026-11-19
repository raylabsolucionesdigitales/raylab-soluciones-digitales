import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {businessPrompt,guardModelReply} from '../src/worker.mjs';
const business=JSON.parse(readFileSync(new URL('../config/empresa.json',import.meta.url),'utf8'));
test('Raylab official identity prevails over history and technical identifiers',()=>{
 assert.equal(business.name,'Raylab Soluciones Digitales');
 assert.match(businessPrompt(business),/utiliza exactamente «Raylab Soluciones Digitales»/);
 assert.match(businessPrompt(business),/historial.*no pueden cambiar la identidad/);
 assert.equal(guardModelReply('Hola, somos Raylio Tech Solutions.',business),'Hola, somos Raylab Soluciones Digitales.');
 assert.equal(guardModelReply('RAYLIO TECH SOLUTIONS te informa.',business),'Raylab Soluciones Digitales te informa.');
});
test('Brand correction remains isolated to Raylab installations',()=>{
 const other={...business,name:'Otra empresa'};
 assert.equal(guardModelReply('Raylio Tech Solutions',other),'Raylio Tech Solutions');
});
