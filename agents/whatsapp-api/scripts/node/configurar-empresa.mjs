// Builds one isolated business installation. Never reads credentials or publishes.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateBusiness } from '../../src/worker.mjs';

const source = resolve(process.argv[2] || fileURLToPath(new URL('../../config/empresa.json', import.meta.url)));
const target = resolve(process.argv[3] || fileURLToPath(new URL('../../src/worker.mjs', import.meta.url)));
const business = validateBusiness(JSON.parse(readFileSync(source, 'utf8')));
const template = readFileSync(new URL('../../src/worker.mjs', import.meta.url), 'utf8');
const block = '// BEGIN BUSINESS CONFIG\nconst DEFAULT_BUSINESS = ' + JSON.stringify(business, null, 2) + ';\n// END BUSINESS CONFIG';
if (!template.includes('// BEGIN BUSINESS CONFIG')) throw new Error('Business config marker missing');
writeFileSync(target, template.replace(/\/\/ BEGIN BUSINESS CONFIG[\s\S]*?\/\/ END BUSINESS CONFIG/, () => block), 'utf8');
console.log(`Worker preparado para ${business.name}. Recursos activos: ${business.resources.filter(x => x.enabled).length}. No publicado.`);
