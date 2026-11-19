// Embed business-agent skills in the single-file Worker; no installs or deployment.
import {readFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const names=['informar-servicios','compartir-documentos','recoger-consulta','atencion-humana'];
const skills=names.map(name=>{
 const source=readFileSync(new URL(`../../skills/${name}/SKILL.md`,import.meta.url),'utf8');
 const match=source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
 if(!match || !match[1].includes(`name: ${name}`))throw new Error('Invalid skill: '+name);
 const description=match[1].match(/^description: (.+)$/m)?.[1];
 if(!description || !match[2].trim())throw new Error('Incomplete skill: '+name);
 return {id:name,description,instructions:match[2].trim()};
});
const target=fileURLToPath(new URL('../../src/worker.mjs',import.meta.url));
let worker=readFileSync(target,'utf8');
const block='// BEGIN AGENT SKILLS\nconst AGENT_SKILLS = '+JSON.stringify(skills,null,2)+';\n// END AGENT SKILLS';
if(worker.includes('// BEGIN AGENT SKILLS'))worker=worker.replace(/\/\/ BEGIN AGENT SKILLS[\s\S]*?\/\/ END AGENT SKILLS/,()=>block);
else worker=worker.replace('// END BUSINESS CONFIG','// END BUSINESS CONFIG\n'+block);
writeFileSync(target,worker,'utf8');
console.log(`${skills.length} skills incorporadas al Worker local. No publicado.`);
