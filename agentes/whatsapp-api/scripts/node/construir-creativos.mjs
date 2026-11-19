import { readFileSync, writeFileSync } from 'node:fs';
const target = new URL('../../src/worker.mjs', import.meta.url);
let source=readFileSync(target,'utf8');
const runtime=readFileSync(new URL('../../src/creativos-runtime.txt',import.meta.url),'utf8').trim();
if(source.includes('// BEGIN CREATIVE RUNTIME'))source=source.replace(/\/\/ BEGIN CREATIVE RUNTIME[\s\S]*?\/\/ END CREATIVE RUNTIME/,()=>runtime);
else source=source.replace('async function aiTest(',runtime+'\nasync function aiTest(');
writeFileSync(target,source,'utf8');
console.log('Worker autocontenido actualizado con generación de propuestas. No publicado.');
