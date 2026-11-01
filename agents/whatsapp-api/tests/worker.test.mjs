import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker, { sendReply, chooseResource, validateBusiness } from '../src/worker.mjs';
import { creativeConversation, processCreativeJobs, conceptPdf, jpegSize, creativeRequest, generatedUrl, guardModelReply } from '../src/worker.mjs';

test('private AI test requires its own secret and validates input before inference', async () => {
  let calls = 0;
  const env = { AI_TEST_TOKEN: 'local-only', AI: { async run(model, input) {
    calls++;
    assert.equal(model, '@cf/meta/llama-3.1-8b-instruct-fp8');
    assert.match(input.messages[0].content, /Raylab Soluciones Digitales/);
    assert.equal(input.messages[1].content, 'Necesito Odoo');
    return { response: 'Podemos evaluar tu necesidad. ¿Qué proceso deseas mejorar?' };
  } } };
  const request = (message, token = 'local-only') => new Request('https://example.test/ai-test', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ message }),
  });
  assert.equal((await worker.fetch(request('Hola'), {})).status, 503);
  assert.equal((await worker.fetch(request('Hola', 'wrong'), env)).status, 401);
  assert.equal((await worker.fetch(request(''), env)).status, 400);
  assert.equal((await worker.fetch(request('x'.repeat(2001)), env)).status, 400);
  assert.equal(calls, 0);
  const response = await worker.fetch(request('Necesito Odoo'), env);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).sent_to_whatsapp, false);
  assert.equal(calls, 1);
});

test('AI binding failures and empty output fail safely without exposing provider errors', async () => {
  const request = () => new Request('https://example.test/ai-test', { method: 'POST', headers: { Authorization: 'Bearer local-only' }, body: '{"message":"Hola"}' });
  for (const AI of [undefined, { run: async () => { throw new Error('private-provider-detail'); } }, { run: async () => ({ response: '' }) }]) {
    const response = await worker.fetch(request(), { AI_TEST_TOKEN: 'local-only', AI });
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), /private-provider-detail/);
  }
});

const secrets = { WHATSAPP_VERIFY_TOKEN: 'test-verification-only', META_APP_SECRET: 'test-app-secret-only', WHATSAPP_PHONE_NUMBER_ID: 'test-phone-id' };
const ycSecrets = { YCLOUD_WEBHOOK_SECRET: 'local-signing-secret', YCLOUD_WHATSAPP_NUMBER: '+51906962740', YCLOUD_WABA_ID: '1119501657673541' };
function ycEvent(overrides = {}) {
  return { id: 'evt-test', type: 'whatsapp.inbound_message.received', apiVersion: 'v2', createTime: new Date().toISOString(), whatsappInboundMessage: { id: 'incoming-test', from: '+51999999999', to: ycSecrets.YCLOUD_WHATSAPP_NUMBER, wabaId: ycSecrets.YCLOUD_WABA_ID, type: 'text', text: { body: 'Necesito Odoo' }, sendTime: new Date().toISOString(), ...overrides } };
}
function ycPost(payload, options = {}) {
  const body = options.body ?? JSON.stringify(payload);
  const time = String(options.time ?? Math.floor(Date.now() / 1000));
  const signature = createHmac('sha256', ycSecrets.YCLOUD_WEBHOOK_SECRET).update(time + '.' + body).digest('hex');
  return new Request('https://example.test/ycloud-webhook', { method: 'POST', body, headers: { 'YCloud-Signature': options.signature ?? `t=${time},s=${signature}` } });
}
test('YCloud rejects missing, tampered, stale signatures and malformed JSON before storage', async t => {
  const { env: base, db } = fixture(t);
  const env = { ...base, ...ycSecrets };
  for (const request of [ycPost(ycEvent(), { signature: '' }), ycPost(ycEvent(), { signature: `t=${Math.floor(Date.now()/1000)},s=${'0'.repeat(64)}` }), ycPost(ycEvent(), { time: Math.floor(Date.now()/1000) - 301 })]) assert.equal((await worker.fetch(request, env)).status, 401);
  assert.equal((await worker.fetch(ycPost(null, { body: '{bad' }), env)).status, 400);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM inbound_messages').get().n, 0);
});
test('YCloud ignores echoes, statuses, groups and other accounts; stores only intended inbound', async t => {
  const { env: base, db } = fixture(t);
  const env = { ...base, ...ycSecrets };
  for (const event of [{ ...ycEvent(), type: 'whatsapp.message.updated' }, { ...ycEvent(), type: 'whatsapp.smb.message.echoes' }, ycEvent({ groupId: 'group' }), ycEvent({ to: '+51888888888' }), ycEvent({ wabaId: '99999999999' })]) assert.equal((await worker.fetch(ycPost(event), env)).status, 200);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM inbound_messages').get().n, 0);
  for (let i=0;i<2;i++) assert.equal((await worker.fetch(ycPost(ycEvent()), env)).status, 200);
  const rows = db.prepare('SELECT * FROM inbound_messages').all();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].text_body, 'Necesito Odoo');
  assert.match(rows[0].id, /^ycloud:/);
});
test('YCloud reply uses its own API key and E164 numbers, deduplicating incoming events', async t => {
  const { env: base, db } = fixture(t);
  const env = { ...sendingEnv(base), ...ycSecrets, YCLOUD_API_KEY: 'fake-ycloud-api-key', YCLOUD_REPLIES_ENABLED: 'true' };
  delete env.WHATSAPP_ACCESS_TOKEN;
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls++;
    assert.equal(url, 'https://api.ycloud.com/v2/whatsapp/messages/sendDirectly');
    assert.equal(options.headers['X-API-Key'], 'fake-ycloud-api-key');
    assert.equal(options.headers.Authorization, undefined);
    const body = JSON.parse(options.body);
    assert.equal(body.from, ycSecrets.YCLOUD_WHATSAPP_NUMBER);
    assert.equal(body.to, '+51999999999');
    assert.equal(body.text.body, 'Hola, soy el asistente virtual de Raylab.');
    return Response.json({ id: 'yc-message', wamid: 'wamid.yc', status: 'sent' });
  });
  for (let i=0;i<2;i++) assert.equal((await worker.fetch(ycPost(ycEvent()), env)).status, 200);
  assert.equal(calls, 1);
  assert.equal(db.prepare('SELECT state FROM outbound_replies').get().state, 'accepted');
});
test('YCloud does not send to unapproved senders, old messages or media', async t => {
  const { env: base, db } = fixture(t);
  const env = { ...sendingEnv(base), ...ycSecrets, YCLOUD_API_KEY: 'fake', YCLOUD_REPLIES_ENABLED: 'true' };
  for (const overrides of [{ from: '+51888888888' }, { sendTime: '2020-01-01T00:00:00Z' }, { type: 'image', text: null }, { sendTime: 'invalid' }]) assert.equal((await worker.fetch(ycPost(ycEvent(overrides)), env)).status, 200);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM outbound_replies').get().n, 0);
});
test('YCloud surfaces pending-account errors without leaking its API key or raw error', async t => {
  const { env: base, db } = fixture(t);
  const env = { ...sendingEnv(base), ...ycSecrets, YCLOUD_API_KEY: 'fake-private-key', YCLOUD_REPLIES_ENABLED: 'true' };
  const result = await sendReply(env, { id: 'yc-rejected', provider: 'ycloud', from: env.WHATSAPP_TEST_RECIPIENT, text: 'Hola' }, async () => Response.json({ error: { code: 'WHATSAPP_ACCOUNT_PENDING', message: 'provider-private-text' } }, { status: 403 }));
  assert.equal(result.reason, 'ycloud_rejected');
  assert.equal(result.code, 'WHATSAPP_ACCOUNT_PENDING');
  assert.doesNotMatch(JSON.stringify(result), /fake-private-key|provider-private-text/);
  assert.equal(db.prepare('SELECT state FROM outbound_replies').get().state, 'rejected');
});
test('YCloud rejects unconfigured endpoint and returns retryable storage failure', async () => {
  assert.equal((await worker.fetch(ycPost(ycEvent()), {})).status, 503);
  assert.equal((await worker.fetch(ycPost(ycEvent()), ycSecrets)).status, 503);
  assert.equal((await worker.fetch(new Request('https://example.test/ycloud-webhook'), ycSecrets)).status, 405);
});
function sendingEnv(env) {
  return { ...env, WHATSAPP_REPLIES_ENABLED: 'true', WHATSAPP_PHONE_NUMBER_ID: '123456789', WHATSAPP_TEST_RECIPIENT: '51999999999', WHATSAPP_ACCESS_TOKEN: 'fake-local-token', AI: { run: async () => ({ response: 'Hola, soy el asistente virtual de Raylab.' }) } };
}
function multiEnv(env) {
  return { ...sendingEnv(env), ...ycSecrets, YCLOUD_API_KEY: 'fake-yc', YCLOUD_REPLIES_ENABLED: 'true', YCLOUD_AUDIENCE: 'all', AGENT_ADMIN_TOKEN: 'local-admin' };
}
function control(customer, action, token = 'local-admin') {
  return new Request('https://example.test/conversation-control', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ customer, action }) });
}
const ycAccepted = async () => Response.json({ id: 'yc-outbound', status: 'sent' });

function restaurantBusiness() {
  return { id: 'restaurante-prueba', name: 'Restaurante de prueba', knowledge: ['Carta y horarios pendientes de confirmación por el negocio. No inventar precios.'], guidance: 'Pregunta si necesita la carta o información del local.', resources: [
    { id: 'carta', title: 'Carta del restaurante', type: 'document', url: 'https://media.example.com/carta.pdf', filename: 'carta.pdf', keywords: ['carta', 'menu'], enabled: true, reference: false },
    { id: 'local', title: 'Fotos del local', type: 'image', url: 'https://media.example.com/local.jpg', keywords: ['local'], enabled: true, reference: false },
    { id: 'recorrido', title: 'Recorrido del restaurante', type: 'video', url: 'https://media.example.com/recorrido.mp4', keywords: ['recorrido'], enabled: true, reference: false },
    { id: 'bienvenida', title: 'Audio de bienvenida', type: 'audio', url: 'https://media.example.com/bienvenida.mp3', keywords: ['bienvenida'], enabled: true, reference: false },
    { id: 'referencia', title: 'Referencia conceptual', type: 'image', url: 'https://media.example.com/referencia.png', keywords: ['referencia'], enabled: true, reference: true },
  ] };
}

const creativeJpeg = new Uint8Array(readFileSync(new URL('./fixtures/creative-fixture.jpg', import.meta.url)));
const conceptPlan = { title: 'Café Luna: una web cercana', summary: 'Propuesta conceptual para presentar el menú y facilitar consultas.', features: ['Menú organizado por categorías.', 'Sección de ubicación y contacto.'], image_prompt: 'A warm modern restaurant website interface, purple and cream, conceptual illustration without private details.' };
function creativeEnv(base) {
  const stored = new Map();
  return { ...multiEnv(base), CREATIVE_ENABLED: 'true', PUBLIC_WORKER_URL: 'https://worker.example.com', CREATIVE_LINK_SECRET: 'local-only-secret-key-32-characters-long',
    AI: { async run(model) { return model.includes('flux-1-schnell') ? { image: Buffer.from(creativeJpeg).toString('base64') } : { response: JSON.stringify(conceptPlan) }; } },
    GENERATED_FILES: { stored, async put(key, value, options) { stored.set(key,{ bytes: new Uint8Array(value), options }); return {}; }, async get(key) { const entry=stored.get(key); return entry ? { body: entry.bytes } : null; } },
  };
}
async function queueCreative(env, sender='51911111111', format='pdf') {
  await creativeConversation(env,{id:'brief-start-'+sender,from:sender,text:`Crea una ${format==='pdf'?'propuesta en PDF':'imagen'} personalizada de mi negocio`},JSON.parse(readFileSync(new URL('../config/empresa.json',import.meta.url),'utf8')));
  const business=JSON.parse(readFileSync(new URL('../config/empresa.json',import.meta.url),'utf8'));
  await creativeConversation(env,{id:'brief-name-'+sender,from:sender,text:'Café Luna, un restaurante'},business);
  return creativeConversation(env,{id:'brief-goal-'+sender,from:sender,text:'Quiero una web con menú, estilo cálido y colores lila'},business);
}
function storeRecentCustomer(db, sender='51911111111') {
  db.prepare('INSERT INTO inbound_messages(id,phone_number_id,sender,message_type,text_body,received_at) VALUES(?,?,?,?,?,?)').run('recent-'+sender,`ycloud:${ycSecrets.YCLOUD_WHATSAPP_NUMBER}`,sender,'text','Mi propuesta',Date.now());
}

test('creative brief is persisted per customer, collects required context and supports cancellation', async t => {
  const { env:base,db }=fixture(t), env=creativeEnv(base);
  const business=JSON.parse(readFileSync(new URL('../config/empresa.json',import.meta.url),'utf8'));
  assert.equal(creativeRequest('No generes una imagen'),false);
  assert.match(await creativeConversation(env,{id:'one',from:'51911111111',text:'Crea una propuesta de cómo se vería mi negocio'},business),/cómo se llama/);
  assert.match(await creativeConversation(env,{id:'two',from:'51911111111',text:'Café Luna, restaurante'},business),/estilo o colores/);
  assert.match(await creativeConversation(env,{id:'three',from:'51911111111',text:'Una web moderna'},business),/PDF o como imagen/);
  assert.equal(await creativeConversation(env,{id:'other',from:'51922222222',text:'Hola'},business),null);
  assert.match(await creativeConversation(env,{id:'four',from:'51911111111',text:'PDF'},business),/Registré tu solicitud/);
  assert.equal(db.prepare('SELECT format FROM creative_jobs').get().format,'pdf');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM creative_briefs').get().n,0);
  await creativeConversation(env,{id:'start',from:'51922222222',text:'Crea un PDF personalizado'},business);
  assert.match(await creativeConversation(env,{id:'cancel',from:'51922222222',text:'cancelar'},business),/cancelado/);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM creative_briefs').get().n,0);
});

test('creative job limits apply atomically to all attempts and customer data stays separate', async t => {
  const { env:base,db }=fixture(t), env={...creativeEnv(base),CREATIVE_DAILY_LIMIT:'1'};
  assert.match(await queueCreative(env),/Registré/);
  assert.match(await queueCreative(env,'51922222222'),/límite/);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM creative_jobs').get().n,1);
  assert.equal(db.prepare('SELECT sender FROM creative_jobs').get().sender,'51911111111');
});

test('brief answers are accepted immediately without the ordinary model cooldown', async t => {
  const {env:base,db}=fixture(t),env=creativeEnv(base);
  for(const [i,text] of ['Crea un PDF personalizado','Café Luna, restaurante','Una web cálida con menú'].entries()) {
    const result=await sendReply(env,{id:'fast-brief-'+i,provider:'ycloud',from:'51911111111',text},ycAccepted);
    assert.equal(result.ok,true);
  }
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM creative_jobs').get().n,1);
});

test('generation is explicitly gated and missing bindings do not promise an attachment', async t => {
  const {env:base}=fixture(t);
  for(const extra of [{},{CREATIVE_ENABLED:'true'}]) {
    const result=await sendReply({...multiEnv(base),...extra},{id:'gate-'+JSON.stringify(extra),provider:'ycloud',from:extra.CREATIVE_ENABLED?'51922222222':'51911111111',text:'Crea una imagen personalizada'},async(url,options)=>{
      const body=JSON.parse(options.body);assert.equal(body.type,'text');assert.match(body.text.body,/todavía no está habilitada/);return ycAccepted();
    });
    assert.equal(result.ok,true);
  }
});

test('PDF bytes contain two valid page objects, the personalized text and a real JPEG', () => {
  assert.deepEqual(jpegSize(creativeJpeg),{width:600,height:400});
  assert.throws(()=>jpegSize(new Uint8Array([1,2,3])));
  const file=conceptPdf(conceptPlan,creativeJpeg,'Raylab Soluciones Digitales');
  const text=Buffer.from(file).toString('latin1');
  assert.ok(text.startsWith('%PDF-1.4'));
  assert.match(text,/\/Count 2/);assert.match(text,/Café Luna/);assert.match(text,/\/DCTDecode/);assert.match(text,/GENERADA CON IA/);
  assert.match(text,/startxref\n\d+\n%%EOF/);
});

test('scheduled generation creates a PDF, stores it privately and sends exactly one document', async t => {
  const {env:base,db}=fixture(t),env=creativeEnv(base);
  await queueCreative(env);storeRecentCustomer(db);
  let calls=0,models=0;
  const original=env.AI.run;env.AI.run=async(...args)=>{models++;return original(...args);};
  t.mock.method(globalThis,'fetch',async(url,options)=>{calls++;const body=JSON.parse(options.body);assert.equal(body.type,'document');assert.match(body.document.link,/https:\/\/worker.example.com\/generated\/raylio\//);assert.equal(body.document.filename,'propuesta-personalizada.pdf');return ycAccepted();});
  await processCreativeJobs(env);await processCreativeJobs(env);
  assert.equal(calls,1);assert.equal(models,2);assert.equal(env.GENERATED_FILES.stored.size,1);
  assert.equal(db.prepare('SELECT state FROM creative_jobs').get().state,'accepted');
});

test('paused or expired creative jobs are not generated or sent', async t => {
  const {env:base,db}=fixture(t),env=creativeEnv(base);
  await queueCreative(env);storeRecentCustomer(db);
  await worker.fetch(control('51911111111','pause'),env);
  env.AI.run=async()=>{throw new Error('Must not generate');};
  await processCreativeJobs(env);
  assert.equal(db.prepare('SELECT state FROM creative_jobs').get().state,'queued');
  await worker.fetch(control('51911111111','resume'),env);
  db.prepare('UPDATE inbound_messages SET received_at=?').run(Date.now()-24*3600000);
  await processCreativeJobs(env);
  assert.equal(db.prepare('SELECT state FROM creative_jobs').get().state,'expired');
});

test('image generation is delivered as image; concurrent schedulers do not generate twice', async t => {
  const {env:base,db}=fixture(t),env=creativeEnv(base);
  await queueCreative(env,'51911111111','image');storeRecentCustomer(db);
  let calls=0;
  t.mock.method(globalThis,'fetch',async(url,options)=>{calls++;const body=JSON.parse(options.body);assert.equal(body.type,'image');assert.match(body.image.link,/\.jpg\?/);assert.match(body.image.caption,/conceptual/);return ycAccepted();});
  await Promise.all([processCreativeJobs(env),processCreativeJobs(env)]);
  assert.equal(calls,1);assert.equal(db.prepare('SELECT state FROM creative_jobs').get().state,'accepted');
});

test('signed generated links expire, reject tampering and cannot read another company path', async t => {
  const {env:base}=fixture(t),env=creativeEnv(base);
  const key='raylio/00000000-0000-4000-8000-000000000000.pdf';
  await env.GENERATED_FILES.put(key,new Uint8Array([37,80,68,70]),{});
  const url=await generatedUrl(env,key);
  assert.equal((await worker.fetch(new Request(url),env)).status,200);
  assert.equal((await worker.fetch(new Request(url,{method:'HEAD'}),env)).status,200);
  assert.equal((await worker.fetch(new Request(url.replace('sig=','sig=0')),env)).status,404);
  assert.equal((await worker.fetch(new Request(url.replace('/raylio/','/other/')),env)).status,404);
  const expired=new URL(url);expired.searchParams.set('expires','1000000000');
  assert.equal((await worker.fetch(new Request(expired),env)).status,404);
});

test('model failures notify truthfully and never substitute a generic catalogue', async t => {
  const {env:base,db}=fixture(t),env=creativeEnv(base);
  await queueCreative(env);storeRecentCustomer(db);
  env.AI.run=async()=>({response:'not a JSON plan'});
  let calls=0;
  t.mock.method(globalThis,'fetch',async(url,options)=>{calls++;const body=JSON.parse(options.body);assert.equal(body.type,'text');assert.match(body.text.body,/No pude completar/);return ycAccepted();});
  await processCreativeJobs(env);await processCreativeJobs(env);
  assert.equal(calls,1);assert.equal(env.GENERATED_FILES.stored.size,0);
  assert.equal(db.prepare('SELECT state FROM creative_jobs').get().state,'failed');
});

test('pause during generation preserves the file and resume does not regenerate it', async t => {
  const {env:base,db}=fixture(t),env=creativeEnv(base);
  await queueCreative(env);storeRecentCustomer(db);
  const original=env.AI.run;let modelCalls=0;
  env.AI.run=async(...args)=>{modelCalls++;const output=await original(...args);if(modelCalls===2)await worker.fetch(control('51911111111','pause'),env);return output;};
  let sends=0;t.mock.method(globalThis,'fetch',async()=>{sends++;return ycAccepted();});
  await processCreativeJobs(env);
  assert.equal(db.prepare('SELECT state FROM creative_jobs').get().state,'ready');assert.equal(sends,0);
  await worker.fetch(control('51911111111','resume'),env);
  await processCreativeJobs(env);
  assert.equal(modelCalls,2);assert.equal(sends,1);assert.equal(db.prepare('SELECT state FROM creative_jobs').get().state,'accepted');
});

test('ambiguous generated-file delivery is not automatically regenerated or resent', async t => {
  const {env:base,db}=fixture(t),env=creativeEnv(base);
  await queueCreative(env);storeRecentCustomer(db);
  let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;throw new Error('network outcome unknown');});
  await processCreativeJobs(env);await processCreativeJobs(env);
  assert.equal(calls,1);assert.equal(env.GENERATED_FILES.stored.size,1);
  assert.equal(db.prepare('SELECT state FROM creative_jobs').get().state,'unknown');
});

test('model cannot invent downloadable PDFs or claim files are ready', () => {
  const business=JSON.parse(readFileSync(new URL('../config/empresa.json',import.meta.url),'utf8'));
  for(const value of ['La referencia está lista. Puedes revisarla aquí: https://rayliotechsolutions.pages.dev/propuestas/2024/02/02/falso.pdf', 'Te envío el PDF del restaurante.', 'Puedes descargarlo desde https://otro.example.com/falso.pdf']) {
    const result=guardModelReply(value,business);
    assert.doesNotMatch(result,/https?:\/\//);assert.match(result,/archivo verificado/);
  }
  assert.match(guardModelReply('Nuestra web: https://rayliotechsolutions.pages.dev',business),/https:\/\/rayliotechsolutions.pages.dev/);
  assert.equal(guardModelReply('Podemos crear una web con menú y contacto.',business),'Podemos crear una web con menú y contacto.');
});

test('a status question about queued work does not invoke the model or invent completion', async t => {
  const {env:base}=fixture(t),env=creativeEnv(base);
  await queueCreative(env);
  env.AI.run=async()=>{throw new Error('Status must not use AI');};
  const result=await sendReply(env,{id:'status-question',provider:'ycloud',from:'51911111111',text:'Me avisas cuando termines'},async(url,options)=>{
    const body=JSON.parse(options.body);assert.equal(body.type,'text');assert.match(body.text.body,/pendiente de entrega/);assert.doesNotMatch(body.text.body,/https?:\/\//);return ycAccepted();
  });
  assert.equal(result.ok,true);
});

test('malformed planning text falls back to the real brief rather than aborting the image', async t => {
  const {env:base,db}=fixture(t),env=creativeEnv(base);
  await queueCreative(env);storeRecentCustomer(db);
  env.AI.run=async(model,input)=>{
    if(model.includes('flux')) {assert.match(input.prompt,/Café Luna/);return {image:Buffer.from(creativeJpeg).toString('base64')};}
    return {response:'The JSON plan could not be formatted.'};
  };
  t.mock.method(globalThis,'fetch',ycAccepted);
  await processCreativeJobs(env);
  assert.equal(db.prepare('SELECT state FROM creative_jobs').get().state,'accepted');
});

test('private creative diagnostic is authenticated, does not send files, and redacts provider errors', async t => {
  const {env:base}=fixture(t),env=creativeEnv(base);
  let calls=0;
  env.AI.run=async(model)=>{calls++;if(model.includes('flux'))throw new Error('1027: quota exceeded '+env.YCLOUD_API_KEY);return {response:JSON.stringify(conceptPlan)};};
  const request=(body={},token='local-admin')=>new Request('https://example.test/creative-diagnostic',{method:'POST',headers:{Authorization:'Bearer '+token},body:JSON.stringify(body)});
  assert.equal((await worker.fetch(request({},'wrong'),env)).status,401);
  const info=await(await worker.fetch(request(),env)).json();assert.equal(info.tested,false);assert.equal(calls,0);assert.equal(info.configuration.ready,true);
  const diagnostic=await(await worker.fetch(request({confirm:'ONE_GENERATION_TEST'}),env)).json();
  assert.equal(calls,2);assert.equal(diagnostic.ok,false);assert.equal(diagnostic.stage,'image_model');assert.equal(diagnostic.code,'1027');assert.equal(diagnostic.reason,'quota_or_rate_limit');assert.doesNotMatch(diagnostic.detail,/fake-yc/);assert.equal(diagnostic.sent_to_whatsapp,false);
});

test('business resources are scoped and do not substitute a catalogue for a personalized design', () => {
  const business = validateBusiness(restaurantBusiness());
  assert.equal(chooseResource('Pásame la carta', [], business).id, 'carta');
  assert.equal(chooseResource('Envíame el PDF de Odoo', [], business), null);
  assert.equal(chooseResource('Quiero un PDF de cómo se vería mi restaurante'), null);
  assert.equal(chooseResource('Crea una imagen personalizada de mi restaurante', [], business), null);
  assert.equal(chooseResource('Muéstrame una imagen de referencia de cómo se vería mi negocio', [], business).id, 'referencia');
  assert.equal(chooseResource('No me envíes fotos del local', [], business), null);
  business.resources[1].enabled = false;
  assert.equal(chooseResource('Envíame fotos del local', [], business), null);
  const duplicate = restaurantBusiness();
  duplicate.resources.push({ ...duplicate.resources[0], id: 'otra-carta' });
  assert.equal(chooseResource('Envíame la carta', [], duplicate), null);
});

test('company configuration rejects unsafe formats, duplicate IDs and malformed overrides', async t => {
  for (const url of ['http://media.example.com/carta.pdf', 'https://user:password@media.example.com/carta.pdf', 'https://media.example.com/programa.exe']) {
    const business = restaurantBusiness(); business.resources[0].url = url;
    assert.throws(() => validateBusiness(business));
  }
  const duplicate = restaurantBusiness(); duplicate.resources.push(duplicate.resources[0]);
  assert.throws(() => validateBusiness(duplicate));
  const { env: base } = fixture(t);
  const result = await sendReply({ ...multiEnv(base), BUSINESS_CONFIG_JSON: '{bad' }, { id: 'invalid-business', provider: 'ycloud', from: '51911111111', text: 'Hola' }, ycAccepted);
  assert.equal(result.reason, 'invalid_business_configuration');
});

test('YCloud sends each supported media type with provider-specific fields and business identity', async t => {
  const { env: base } = fixture(t);
  const business = restaurantBusiness();
  const env = { ...multiEnv(base), BUSINESS_CONFIG_JSON: JSON.stringify(business), YCLOUD_MEDIA_ENABLED: 'true' };
  const cases = [['Pásame el menú en PDF', 'document', 'carta'], ['Muéstrame una foto del local', 'image', 'local'], ['Envíame el video del recorrido', 'video', 'recorrido'], ['Envíame el audio de bienvenida', 'audio', 'bienvenida']];
  for (const [i, [text, type, id]] of cases.entries()) {
    const resource = business.resources.find(item => item.id === id);
    const result = await sendReply(env, { provider: 'ycloud', id: `media-${i}`, from: `5191111111${i}`, text }, async (url, options) => {
      const body = JSON.parse(options.body);
      assert.equal(body.type, type);
      assert.equal(body[type].link, resource.url);
      assert.equal(body.text, undefined);
      if (type === 'audio') assert.equal(body.audio.caption, undefined);
      else { assert.match(body[type].caption, /Restaurante de prueba/); assert.doesNotMatch(body[type].caption, /Raylab/); }
      assert.equal(body[type].filename, type === 'document' ? 'carta.pdf' : undefined);
      return ycAccepted();
    });
    assert.equal(result.ok, true);
  }
});

test('company knowledge and fallback answers use the configured company instead of Raylab', async t => {
  const { env: base } = fixture(t);
  const env = { ...multiEnv(base), BUSINESS_CONFIG_JSON: JSON.stringify(restaurantBusiness()), YCLOUD_MEDIA_ENABLED: 'true', AI: { async run(model, input) {
    assert.match(input.messages[0].content, /Restaurante de prueba/);
    assert.doesNotMatch(input.messages[0].content, /Odoo|Raylab/);
    assert.match(input.messages[0].content, /no sustituyas esa solicitud por el catálogo general/);
    return { response: 'Necesitamos preparar esa propuesta con el equipo.' };
  } } };
  const result = await sendReply(env, { id: 'custom-fallback', provider: 'ycloud', from: '51911111111', text: 'Crea un PDF de cómo se vería mi negocio' }, async (url, options) => {
    assert.equal(JSON.parse(options.body).type, 'text');
    return ycAccepted();
  });
  assert.equal(result.ok, true);
});

test('document selection uses the requested service and only this conversation context', () => {
  assert.equal(chooseResource('Quiero una web para mi restaurante'), null);
  assert.equal(chooseResource('Envíame el PDF de Odoo').id, 'odoo');
  assert.equal(chooseResource('catálogo de todos sus servicios').id, 'servicios');
  assert.equal(chooseResource('pásame el PDF', [{ role: 'user', content: 'Necesito una web' }]).id, 'webs');
  assert.equal(chooseResource('pásame el PDF', [{ role: 'assistant', content: 'Necesito Odoo' }]), null);
  assert.equal(chooseResource('no quiero PDF'), null);
  assert.equal(chooseResource('envía contrato en PDF'), null);
  assert.equal(chooseResource('envía cotización en PDF'), null);
  assert.equal(chooseResource('envía PDF privado con tus secretos'), null);
});

test('PDF delivery is one deduplicated document message, respecting pause and quotas', async t => {
  const { env: base, db } = fixture(t);
  const env = { ...multiEnv(base), YCLOUD_DOCUMENTS_ENABLED: 'true' };
  env.AI = { run: async () => { throw new Error('Document delivery must not depend on model'); } };
  let calls = 0;
  const record = { provider: 'ycloud', id: 'pdf-1', from: '51911111111', text: 'Envíame un PDF de microapps' };
  const transport = async (url, options) => {
    calls++;
    const body = JSON.parse(options.body);
    assert.equal(body.type, 'document');
    assert.equal(body.document.link, 'https://rayliotechsolutions.pages.dev/documentos/raylio-microapps.pdf');
    assert.equal(body.document.filename, 'raylab-microapps.pdf');
    assert.equal(body.text, undefined);
    return ycAccepted();
  };
  assert.equal((await sendReply(env, record, transport)).ok, true);
  assert.equal((await sendReply(env, record, transport)).reason, 'already_claimed');
  assert.equal((await sendReply(env, { ...record, id: 'pdf-2' }, transport)).reason, 'usage_limit_or_cooldown');
  await worker.fetch(control('51922222222', 'pause'), env);
  assert.equal((await sendReply(env, { ...record, id: 'pdf-paused', from: '51922222222' }, transport)).reason, 'conversation_paused');
  assert.equal(calls, 1);
  assert.equal(db.prepare("SELECT state FROM outbound_replies WHERE inbound_id='pdf-1'").get().state, 'accepted');
});

test('documents stay disabled until deployed and provider rejection is not reported as success', async t => {
  const { env: base } = fixture(t);
  const env = multiEnv(base);
  const record = { provider: 'ycloud', id: 'disabled-pdf', from: '51911111111', text: 'Envíame un PDF de Odoo' };
  await sendReply(env, record, async (url, options) => {
    assert.equal(JSON.parse(options.body).type, 'text');
    return ycAccepted();
  });
  const result = await sendReply({ ...env, YCLOUD_DOCUMENTS_ENABLED: 'true' }, { ...record, id: 'rejected-pdf', from: 'bsuid:PE.123456789' }, async (url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.type, 'document');
    assert.equal(body.recipient, 'PE.123456789');
    assert.equal(body.to, undefined);
    return Response.json({ error: { code: 'MEDIA_DOWNLOAD_ERROR' } }, { status: 400 });
  });
  assert.equal(result.sent_to_whatsapp, false);
  assert.equal(result.reason, 'ycloud_rejected');
});

test('YCloud accepts signed digit-only phones and sends canonical E164', async t => {
  const { env: base, db } = fixture(t);
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.to, '+51922222222');
    assert.equal(body.recipient, undefined);
    return ycAccepted();
  });
  const response = await worker.fetch(ycPost(ycEvent({ from: '51922222222', to: '51906962740' })), multiEnv(base));
  assert.equal(response.status, 200);
  assert.equal(db.prepare('SELECT sender FROM inbound_messages').get().sender, '51922222222');
  assert.equal(db.prepare('SELECT state FROM outbound_replies').get().state, 'accepted');
});

test('YCloud privacy identities use recipient instead of inventing a phone', async t => {
  const { env: base, db } = fixture(t);
  const env = multiEnv(base);
  const identities = ['PE.123456789', 'PE.ENT.987654321'];
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const body = JSON.parse(options.body);
    assert.equal(body.recipient, identities[calls++]);
    assert.equal(body.to, undefined);
    return ycAccepted();
  });
  for (const [i, identity] of identities.entries()) {
    const message = ycEvent({ id: `privacy-${i}`, from: undefined, ...(i ? { fromParentUserId: identity } : { fromUserId: identity }) });
    assert.equal((await worker.fetch(ycPost(message, { signature: '' }), env)).status, 401);
    assert.equal((await worker.fetch(ycPost(message), env)).status, 200);
  }
  assert.equal(calls, 2);
  assert.deepEqual(db.prepare('SELECT sender FROM inbound_messages ORDER BY id').all().map(row => row.sender), identities.map(id => `bsuid:${id}`));
  assert.equal((await (await worker.fetch(control(`bsuid:${identities[0]}`, 'pause'), env)).json()).paused, true);
  assert.equal((await (await worker.fetch(control(`bsuid:${identities[1]}`, 'status'), env)).json()).paused, false);
  assert.equal((await (await worker.fetch(control(`bsuid:${identities[0]}`, 'resume'), env)).json()).paused, false);
});

test('invalid YCloud payload fields report a specific reason without storage', async t => {
  const { env: base, db } = fixture(t);
  const env = multiEnv(base);
  for (const [fields, reason] of [
    [{ from: undefined }, 'ycloud_missing_or_invalid_sender'],
    [{ from: 'invalid', fromUserId: '../invalid' }, 'ycloud_missing_or_invalid_sender'],
    [{ id: '' }, 'ycloud_invalid_message_id'],
    [{ type: '' }, 'ycloud_missing_message_type'],
  ]) {
    const response = await worker.fetch(ycPost(ycEvent(fields)), env);
    assert.equal(response.status, 400);
    assert.equal(await response.text(), reason);
  }
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM inbound_messages').get().n, 0);
  assert.equal((await sendReply(env, { provider: 'ycloud', id: 'null-recipient', from: null, text: 'Hola' }, ycAccepted)).reason, 'invalid_recipient');
});
test('multi-client mode accepts different customers without registering numbers; Meta stays restricted', async t => {
  const { env: base, db } = fixture(t);
  const env = multiEnv(base);
  delete env.WHATSAPP_TEST_RECIPIENT;
  for (const [i, from] of ['51911111111', '51922222222'].entries()) {
    assert.equal((await sendReply(env, { provider: 'ycloud', id: `multi-${i}`, from, text: 'Hola' }, ycAccepted)).ok, true);
  }
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM outbound_replies WHERE state=\'accepted\'').get().n, 2);
  assert.equal((await sendReply(env, { id: 'meta-other', from: '51911111111', text: 'Hola' }, ycAccepted)).reason, 'missing_send_configuration');
});
test('daily caps are enforced atomically under competing sends and are separate per customer', async t => {
  const { env: base } = fixture(t);
  const env = { ...multiEnv(base), YCLOUD_DAILY_REPLY_LIMIT: '2', YCLOUD_CUSTOMER_DAILY_LIMIT: '1' };
  const outcomes = await Promise.all(['51911111111', '51911111111', '51922222222', '51933333333'].map((from, i) => sendReply(env, { provider: 'ycloud', id: `cap-${i}`, from, text: 'Hola' }, ycAccepted)));
  assert.equal(outcomes.filter(outcome => outcome.sent_to_whatsapp).length, 2);
  assert.equal(outcomes.filter(outcome => outcome.reason === 'usage_limit_or_cooldown').length, 2);
});
test('cooldown affects only the same customer and retries do not resend accepted messages', async t => {
  const { env: base } = fixture(t);
  const env = multiEnv(base);
  const first = { provider: 'ycloud', id: 'cooldown-first', from: '51911111111', text: 'Hola' };
  assert.equal((await sendReply(env, first, ycAccepted)).ok, true);
  assert.equal((await sendReply(env, first, ycAccepted)).reason, 'already_claimed');
  assert.equal((await sendReply(env, { ...first, id: 'cooldown-next' }, ycAccepted)).reason, 'usage_limit_or_cooldown');
  assert.equal((await sendReply(env, { ...first, id: 'cooldown-other', from: '51922222222' }, ycAccepted)).ok, true);
});
test('admin pause is authenticated, persists across requests and can be resumed per customer', async t => {
  const { env: base } = fixture(t);
  const env = multiEnv(base);
  assert.equal((await worker.fetch(control('51911111111', 'pause', 'wrong'), env)).status, 401);
  assert.equal((await worker.fetch(control('51911111111', 'pause'), { ...env, AGENT_ADMIN_TOKEN: '' })).status, 503);
  assert.equal((await worker.fetch(control('bad', 'pause'), env)).status, 400);
  assert.equal((await (await worker.fetch(control('+51911111111', 'pause'), env)).json()).paused, true);
  const record = { provider: 'ycloud', id: 'paused-test', from: '51911111111', text: 'Hola' };
  assert.equal((await sendReply(env, record, ycAccepted)).reason, 'conversation_paused');
  assert.equal((await sendReply(env, { ...record, id: 'other-chat', from: '51922222222' }, ycAccepted)).ok, true);
  assert.equal((await (await worker.fetch(control('51911111111', 'resume'), env)).json()).paused, false);
  assert.equal((await sendReply(env, record, ycAccepted)).ok, true);
});
test('pause arriving during AI generation suppresses the generated response', async t => {
  const { env: base, db } = fixture(t);
  const env = multiEnv(base);
  env.AI = { async run() {
    await worker.fetch(control('51911111111', 'pause'), env);
    return { response: 'This must not be sent' };
  } };
  let calls = 0;
  const outcome = await sendReply(env, { provider: 'ycloud', id: 'pause-race', from: '51911111111', text: 'Hola' }, async () => { calls++; return ycAccepted(); });
  assert.equal(outcome.reason, 'conversation_paused');
  assert.equal(calls, 0);
  assert.equal(db.prepare('SELECT state FROM outbound_replies').get().state, 'paused');
});
test('human request pauses only its conversation and sends a real acknowledgement without AI', async t => {
  const { env: base, db } = fixture(t);
  const env = multiEnv(base);
  env.AI = { run: async () => { throw new Error('AI must not run'); } };
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls++;
    assert.match(JSON.parse(options.body).text.body, /pausado/);
    return ycAccepted();
  });
  assert.equal((await worker.fetch(ycPost(ycEvent({ text: { body: 'Quiero hablar con un asesor' } })), env)).status, 200);
  assert.equal(db.prepare('SELECT paused FROM conversation_controls').get().paused, 1);
  assert.equal(calls, 1);
  await worker.fetch(ycPost(ycEvent({ id: 'after-pause', text: { body: 'Quiero un asesor' } })), env);
  assert.equal(calls, 1);
});
test('memory includes only the same customer and channel accepted turns, capped at three', async t => {
  const { env: base, db } = fixture(t);
  const env = multiEnv(base);
  for (let i=0;i<5;i++) {
    db.prepare('INSERT INTO inbound_messages VALUES (?,?,?,?,?,?)').run(`hist-${i}`, `ycloud:${ycSecrets.YCLOUD_WHATSAPP_NUMBER}`, '51911111111', 'text', `customer-one-${i}`, Date.now() - 1000 + i);
    db.prepare('INSERT INTO outbound_replies VALUES (?,?,?,?,?)').run(`hist-${i}`, 'accepted', `answer-${i}`, `out-${i}`, Date.now());
  }
  db.prepare('INSERT INTO inbound_messages VALUES (?,?,?,?,?,?)').run('private-other', `ycloud:${ycSecrets.YCLOUD_WHATSAPP_NUMBER}`, '51922222222', 'text', 'PRIVATE_OTHER_CUSTOMER', Date.now());
  db.prepare('INSERT INTO outbound_replies VALUES (?,?,?,?,?)').run('private-other', 'accepted', 'PRIVATE_OTHER_REPLY', 'other-id', Date.now());
  env.AI = { async run(model, input) {
    assert.equal(input.messages.length, 8);
    assert.match(JSON.stringify(input.messages), /customer-one-2/);
    assert.doesNotMatch(JSON.stringify(input.messages), /customer-one-0|PRIVATE_OTHER/);
    assert.equal(input.messages.at(-1).content, 'Ahora necesito reservas');
    return { response: '¿Qué reservas necesitas?' };
  } };
  assert.equal((await sendReply(env, { provider: 'ycloud', id: 'memory-current', from: '51911111111', text: 'Ahora necesito reservas' }, ycAccepted)).ok, true);
});
test('sending is gated, recipient restricted, and concurrent retries call Meta only once', async t => {
  const { env: base, db } = fixture(t);
  const env = sendingEnv(base);
  const record = { id: 'send-1', from: env.WHATSAPP_TEST_RECIPIENT, text: 'Hola' };
  let calls = 0;
  const transport = async (url, options) => {
    calls++;
    assert.equal(url, 'https://graph.facebook.com/v26.0/123456789/messages');
    assert.equal(options.headers.Authorization, 'Bearer fake-local-token');
    assert.equal(JSON.parse(options.body).to, record.from);
    return Response.json({ messages: [{ id: 'wamid.outgoing' }] });
  };
  assert.equal((await sendReply({ ...env, WHATSAPP_REPLIES_ENABLED: 'false' }, record, transport)).reason, 'sending_disabled');
  assert.equal((await sendReply(env, { ...record, from: '51888888888' }, transport)).reason, 'recipient_not_allowed');
  const outcomes = await Promise.all([sendReply(env, record, transport), sendReply(env, record, transport)]);
  assert.equal(calls, 1);
  assert.equal(outcomes.filter(x => x.sent_to_whatsapp).length, 1);
  assert.equal(db.prepare('SELECT state FROM outbound_replies').get().state, 'accepted');
});
test('AI failure can retry but ambiguous send and Meta rejection cannot resend', async t => {
  const { env: base, db } = fixture(t);
  const env = sendingEnv(base);
  const record = { id: 'send-2', from: env.WHATSAPP_TEST_RECIPIENT, text: 'Hola' };
  assert.equal((await sendReply({ ...env, AI: { run: async () => { throw new Error('offline'); } } }, record)).retry, true);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM outbound_replies').get().n, 0);
  let calls = 0;
  const timeout = async () => { calls++; throw new Error('network'); };
  assert.equal((await sendReply(env, record, timeout)).reason, 'send_outcome_unknown_do_not_repeat');
  await sendReply(env, record, timeout);
  assert.equal(calls, 1);
  assert.equal(db.prepare('SELECT state FROM outbound_replies').get().state, 'unknown');
  const rejected = await sendReply(env, { ...record, id: 'send-3' }, async () => Response.json({ error: { code: 190, message: 'secret-provider-text' } }, { status: 401 }));
  assert.equal(rejected.code, 190);
  assert.doesNotMatch(JSON.stringify(rejected), /secret-provider-text/);
});
test('automatic reply skips stale samples, media and delivery statuses', async t => {
  const { env: base, db } = fixture(t);
  const env = sendingEnv(base);
  for (const payload of [event({ phone: env.WHATSAPP_PHONE_NUMBER_ID }), event({ phone: env.WHATSAPP_PHONE_NUMBER_ID, statuses: true })]) assert.equal((await worker.fetch(post(payload), env)).status, 200);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM outbound_replies').get().n, 0);
});
function fixture(t) {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../database/schema.sql', import.meta.url), 'utf8'));
  t.after(() => db.close());
  return { db, env: { ...secrets, INBOX: {
    prepare(sql) { return { bind(...args) { return { sql, args, async first() { return db.prepare(sql).get(...args) || null; }, async run() { return db.prepare(sql).run(...args); }, async all() { return { results: db.prepare(sql).all(...args) }; } }; } }; },
    async batch(statements) {
      db.exec('BEGIN');
      try { for (const { sql, args } of statements) db.prepare(sql).run(...args); db.exec('COMMIT'); }
      catch (error) { db.exec('ROLLBACK'); throw error; }
    },
  } } };
}
function event({ phone = secrets.WHATSAPP_PHONE_NUMBER_ID, statuses = false } = {}) {
  return { object: 'whatsapp_business_account', entry: [{ changes: [{ field: 'messages', value: {
    metadata: { phone_number_id: phone },
    ...(statuses ? { statuses: [{ id: 'wamid.test', status: 'delivered' }] } : { messages: [{ id: 'wamid.test', from: 'test-sender', type: 'text', text: { body: 'Necesito una web para mi negocio.' } }] }),
  } }] }] };
}
function post(payload, { signature, body } = {}) {
  const raw = body ?? JSON.stringify(payload);
  const value = signature ?? 'sha256=' + createHmac('sha256', secrets.META_APP_SECRET).update(raw).digest('hex');
  return new Request('https://example.test/webhook', { method: 'POST', headers: { 'X-Hub-Signature-256': value }, body: raw });
}
test('verification returns only the exact challenge for the configured token', async () => {
  const request = new Request('https://example.test/webhook?hub.mode=subscribe&hub.verify_token=test-verification-only&hub.challenge=12345');
  const result = await worker.fetch(request, secrets);
  assert.equal(result.status, 200); assert.equal(await result.text(), '12345');
  assert.equal((await worker.fetch(new Request(request.url.replace('test-verification-only', 'wrong')), secrets)).status, 403);
  assert.equal((await worker.fetch(request, {})).status, 503);
});
test('unsigned, malformed, and tampered requests do not reach the inbox', async t => {
  const { env, db } = fixture(t);
  for (const signature of ['', 'sha256=bad', 'sha256=' + '0'.repeat(64)]) assert.equal((await worker.fetch(post(event(), { signature }), env)).status, 401);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM inbound_messages').get().n, 0);
});
test('valid signed messages are stored and repeated deliveries are deduplicated', async t => {
  const { env, db } = fixture(t);
  assert.equal((await worker.fetch(post(event()), env)).status, 200);
  assert.equal((await worker.fetch(post(event()), env)).status, 200);
  const rows = db.prepare('SELECT * FROM inbound_messages').all();
  assert.equal(rows.length, 1); assert.equal(rows[0].text_body, 'Necesito una web para mi negocio.');
  assert.equal(rows[0].phone_number_id, secrets.WHATSAPP_PHONE_NUMBER_ID);
});
test('delivery notifications and messages for another number are not stored', async t => {
  const { env, db } = fixture(t);
  for (const payload of [event({ statuses: true }), event({ phone: 'other-phone' })]) assert.equal((await worker.fetch(post(payload), env)).status, 200);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM inbound_messages').get().n, 0);
});
test('database failure returns a retryable response instead of losing the message', async () => {
  assert.equal((await worker.fetch(post(event()), secrets)).status, 503);
  const env = { ...secrets, INBOX: { prepare() { throw new Error('offline'); } } };
  assert.equal((await worker.fetch(post(event()), env)).status, 503);
});
test('signed malformed JSON returns 400 without writing', async t => {
  const { env } = fixture(t);
  assert.equal((await worker.fetch(post(null, { body: '{bad' }), env)).status, 400);
});
test('body limit is enforced on bytes read, not a trusted content-length', async () => {
  const request = post(null, { body: 'x'.repeat(256 * 1024 + 1) });
  assert.equal((await worker.fetch(request, secrets)).status, 413);
});
test('missing secrets fail closed and unrelated routes do not expose data', async () => {
  assert.equal((await worker.fetch(post(event()), {})).status, 503);
  assert.equal((await worker.fetch(new Request('https://example.test/'), secrets)).status, 404);
  assert.equal((await worker.fetch(new Request('https://example.test/webhook', { method: 'DELETE' }), secrets)).status, 405);
});
test('signed field-only samples shown in the Meta dashboard are stored too', async t => {
  const { env, db } = fixture(t);
  const sample = event().entry[0].changes[0];
  const response = await worker.fetch(post(sample), env);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'EVENT_RECEIVED:stored_or_already_present');
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM inbound_messages').get().n, 1);
});
test('diagnostics distinguish a number mismatch from a missing inbox', async () => {
  assert.equal(await (await worker.fetch(post(event({ phone: 'sample-other-id' })), secrets)).text(), 'EVENT_RECEIVED:ignored_phone_number');
  assert.equal(await (await worker.fetch(post(event()), secrets)).text(), 'missing_inbox_binding');
});
test('unsigned field-only samples remain rejected', async t => {
  const { env, db } = fixture(t);
  assert.equal((await worker.fetch(post(event().entry[0].changes[0], { signature: '' }), env)).status, 401);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM inbound_messages').get().n, 0);
});
