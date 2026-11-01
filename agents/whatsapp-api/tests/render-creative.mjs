// Technical renderer check. This fixture is not an AI-generated customer proposal.
import { readFileSync, writeFileSync } from 'node:fs';
import { conceptPdf } from '../src/worker.mjs';
const plan={title:'Café Luna: presencia digital con personalidad',summary:'Prueba técnica del PDF: una web para presentar un restaurante, su menú y sus canales de consulta. La imagen es una fixture de prueba, no una propuesta creada por IA.',features:['Menú organizado por categorías y fotografías aprobadas por el negocio.','Sección de ubicación y contacto para orientar a los visitantes.','Un estilo cálido con colores lila y crema, sujeto a revisión.'],image_prompt:'Unused in technical renderer test.'};
const image=new Uint8Array(readFileSync(new URL('./fixtures/creative-fixture.jpg',import.meta.url)));
writeFileSync(new URL('../../../output/raylab/prueba-render-personalizado.pdf',import.meta.url),conceptPdf(plan,image,'Raylab Soluciones Digitales'));
console.log('PDF técnico renderizado con fixture; no usa IA ni envía mensajes.');
