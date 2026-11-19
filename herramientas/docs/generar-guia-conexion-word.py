from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image, ImageDraw, ImageFont
import zipfile

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'entregas/documentacion-raylab'
OUT.mkdir(parents=True, exist_ok=True)
DOC = OUT / 'Raylab-Guia-Web-y-Agente-WhatsApp.docx'
CF = 'https://dash.cloudflare.com/36226dc78991f39c340afd6fd864b3f4'
WORKER = 'https://raylio-whatsapp-agent.rivasbruce563.workers.dev'
WEB = 'https://rayliotechsolutions.pages.dev'
YC = 'https://www.ycloud.com/console/'
doc = Document()
section = doc.sections[0]
section.top_margin = Inches(.65)
section.bottom_margin = Inches(.65)
section.left_margin = section.right_margin = Inches(.75)
normal = doc.styles['Normal']
normal.font.name = 'Calibri'
normal.font.size = Pt(10)
normal.paragraph_format.space_after = Pt(6)
for name in ('Title','Heading 1','Heading 2','Heading 3'):
    doc.styles[name].font.name = 'Calibri'
    doc.styles[name].font.color.rgb = RGBColor.from_string('7136C8')
doc.styles['Heading 1'].font.size = Pt(21)
doc.styles['Heading 2'].font.size = Pt(13)
header = section.header.paragraphs[0]
header.text = 'RAYLAB  /  SOLUCIONES DIGITALES'
header.runs[0].font.color.rgb = RGBColor.from_string('7136C8')
header.runs[0].font.size = Pt(9)
footer = section.footer.paragraphs[0]
footer.text = 'Guía operativa · 01/11/2026                                      Página '
field = OxmlElement('w:fldSimple'); field.set(qn('w:instr'), 'PAGE'); footer._p.append(field)

def p(text): doc.add_paragraph(text)
def h(text): doc.add_heading(text,2)
def page(title): doc.add_page_break(); doc.add_heading(title,1)
def steps(items):
    for x in items: doc.add_paragraph(x,style='List Number')
def bullets(items):
    for x in items: doc.add_paragraph(x,style='List Bullet')
def code(text):
    para=doc.add_paragraph()
    run=para.add_run(text);run.font.name='Consolas';run.font.size=Pt(8)
    shade=OxmlElement('w:shd');shade.set(qn('w:fill'),'F1EBF8');para._p.get_or_add_pPr().append(shade)
def link(label,url):
    para=doc.add_paragraph(); rel=para.part.relate_to(url,'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',is_external=True)
    el=OxmlElement('w:hyperlink');el.set(qn('r:id'),rel);r=OxmlElement('w:r');pr=OxmlElement('w:rPr');color=OxmlElement('w:color');color.set(qn('w:val'),'7136C8');pr.append(color);r.append(pr);t=OxmlElement('w:t');t.text=label+' → '+url;r.append(t);el.append(r);para._p.append(el)
def table(head, rows):
    t=doc.add_table(rows=1, cols=len(head));t.style='Light Shading Accent 1'
    for c,v in zip(t.rows[0].cells,head): c.text=v
    for row in rows:
        for c,v in zip(t.add_row().cells,row): c.text=v
def picture(path,caption,width=6.6):
    if path.exists(): doc.add_picture(str(path),width=Inches(width));doc.add_paragraph(caption,style='Caption')
def diagram(name,title,boxes,sub):
    im=Image.new('RGB',(1500,510),'#F2ECDF');d=ImageDraw.Draw(im)
    font='C:/Windows/Fonts/arial.ttf';bold='C:/Windows/Fonts/arialbd.ttf'
    f=ImageFont.truetype(font,24);b=ImageFont.truetype(bold,28)
    d.text((35,24),title,font=b,fill='#301C48')
    w=(1430-24*(len(boxes)-1))//len(boxes)
    for i,(label,body) in enumerate(boxes):
        x=35+i*(w+24)
        d.rounded_rectangle((x,100,x+w,385),18,fill='#FFFAF1',outline='#8850C9',width=3)
        d.text((x+18,122),str(i+1).zfill(2),font=b,fill='#8850C9')
        y=174
        for line in (label+'\n\n'+body).split('\n'):
            d.text((x+18,y),line,font=f,fill='#301C48');y+=32
        if i<len(boxes)-1: d.text((x+w+2,242),'›',font=b,fill='#8850C9')
    d.text((35,432),sub,font=f,fill='#695775')
    path=OUT/name;im.save(path);return path

flow=diagram('flujo-conexion.png','Cómo llega un cliente desde la web hasta la IA',[
('Web Raylab','Botón o formulario\nAbre WhatsApp'),('WhatsApp','Cliente envía\nsu consulta'),('YCloud','Recibe y envía\nlos mensajes'),('Cloudflare','Worker + D1 + AI\nGenera la respuesta')], 'La respuesta vuelve por YCloud al mismo chat. La web no guarda las claves del agente.')
setup=diagram('configuracion-worker.png','Cloudflare: dos configuraciones que debes completar',[
('Settings','Variables y secrets\nProduction'),('Bindings','AI → Workers AI\nINBOX → D1'),('YCloud','Endpoint activo\n/ycloud-webhook')], 'Esquema orientativo: no es una captura del panel ni muestra valores secretos.')
deploy=diagram('dos-despliegues.png','La web y el agente se publican por separado',[
('Página web','raylab-web-hosting.zip\nCloudflare Pages'),('Agente','src/worker.mjs\nCloudflare Worker'),('Validación','Escribir desde\ndos números distintos')], 'Un push a GitHub no actualiza el hosting manual; subir el ZIP tampoco actualiza el Worker.')

doc.add_heading('RAYLAB',0)
doc.add_heading('Soluciones Digitales',1)
p('Guía paso a paso · Web + agente de WhatsApp')
p('Configuración existente, publicación, nombre raylabsolucionesdigitales, coexistencia con YCloud, pruebas y solución de errores.')
picture(flow,'Diagrama elaborado para esta guía a partir de la implementación del proyecto.')
h('Cómo usar este documento')
p('Si el agente ya responde, conserva esa instalación: revisa primero las páginas 2–5 y luego las pruebas. No recrees cuentas, bases o números que ya funcionan. Los nombres de menús pueden cambiar según idioma y versión del panel.')
p('Esta guía se basa en los archivos locales y en lo confirmado en nuestra conversación. No certifica el estado actual de tus cuentas: no se ha iniciado sesión ni publicado nada para preparar este Word.')
p('Las imágenes incluidas son capturas locales de la web y diagramas identificados como tales. Las capturas históricas de errores compartidas en el chat no estaban disponibles como archivos locales; sus mensajes y soluciones se documentan en texto. No se incluyen contraseñas ni tokens.')

page('1. Qué se conecta y qué nombre usar')
p('Tu página abre un chat mediante wa.me. El agente contesta al mensaje que el visitante realmente envía por WhatsApp. No es un chat incrustado dentro de la página y el botón no envía mensajes automáticamente.')
table(['Elemento','Valor de referencia actual'],[
('Marca pública','Raylab Soluciones Digitales'),('Nombre deseado para la web','raylabsolucionesdigitales'),('WhatsApp empresarial','+51 906 962 740'),('Enlace del chat','https://wa.me/51906962740'),('Web existente',WEB),('Worker existente',WORKER),('Ruta YCloud',WORKER+'/ycloud-webhook'),('Repositorio','https://github.com/raylabsolucionesdigitales/raylab-soluciones-digitales')])
h('Cambiar la marca no obliga a recrear la infraestructura')
p('El nombre interno del Worker y la D1 aún conserva raylio para mantener las conexiones. El archivo empresa.json conserva id="raylio" para los registros existentes. Puedes mostrar Raylab sin renombrar recursos ni borrar datos.')
p('raylabsolucionesdigitales.pages.dev sería un subdominio gratuito de Pages, solo si está disponible y lo creas. raylabsolucionesdigitales.com es un dominio propio distinto: no se asume comprado, disponible ni configurado.')
link('Abrir el WhatsApp empresarial','https://wa.me/51906962740')
link('Abrir Cloudflare',CF+'/workers-and-pages')

page('2. Archivos que necesitas')
table(['Uso','Archivo o carpeta local'],[
('Web actual','web/dist/index.html'),('Número y mensajes del botón','web/dist/js/whatsapp-core.js'),('ZIP público','entregas/raylab/raylab-web-hosting.zip'),('Código final del agente','agentes/whatsapp-api/src/worker.mjs'),('Datos del negocio','agentes/whatsapp-api/config/empresa.json'),('Catálogo comercial','agentes/whatsapp-api/config/catalogo.json'),('Tablas de instalación nueva','agentes/whatsapp-api/database/schema.sql'),('Migraciones existentes','database/migration-multicliente.sql y migration-creativos.sql, dentro del agente'),('Pruebas y pausa','agentes/whatsapp-api/scripts/powershell/'),('Guías técnicas','agentes/whatsapp-api/docs/')])
picture(deploy,'Dos publicaciones independientes. Conserva los secretos fuera del ZIP y del repositorio.')
p('Los cambios de archivos no quedan publicados por guardarlos en VS Code. Tú haces add, commit y push; el asistente no debe hacerlo sin que lo solicites. Para producción, revisa el PR develop → main. No cambies de rama con archivos sin guardar sin decidir antes cómo conservarlos.')

page('3. Publicar tu web en Cloudflare Pages')
steps(['Entra a Cloudflare → Workers & Pages. Abre el proyecto existente de la página (rayliotechsolutions), no el Worker del agente.',
'Pulsa Create deployment / Crear implementación. En el flujo de carga directa, sube entregas/raylab/raylab-web-hosting.zip.',
'Si el panel solicita entorno, usa Production para la actualización pública. Revisa la vista previa y confirma la publicación.',
'Espera el resultado de la implementación y abre la URL pública desde un navegador privado y desde el celular.',
'Comprueba colores, navegación y el botón de WhatsApp. El ZIP tiene index.html en la raíz: no subas la carpeta completa AGENCIA DIGITAL.'])
link('Panel de proyectos',CF+'/workers-and-pages')
link('Cloudflare: carga directa','https://developers.cloudflare.com/pages/get-started/direct-upload/')
h('Si quieres la dirección raylabsolucionesdigitales.pages.dev')
p('Conserva por ahora el proyecto anterior. Puedes crear un proyecto Pages adicional con ese nombre si está libre y cargar el mismo ZIP. Si el flujo muestra Workers, busca Continue to Pages → carga directa. Copia la URL que Cloudflare te entregue: no la des por activa antes de crear y comprobar el proyecto.')
p('No elimines el sitio viejo hasta actualizar y validar todos los enlaces de documentos, privacidad y del agente. Crear otra página no requiere otro número de WhatsApp ni recrear el agente.')
picture(ROOT/'entregas/pruebas-web/raylab-light-1440.png','Captura local de referencia: presentación de la web. La versión publicada depende del ZIP que subas.',6.1)

page('4. Conectar el botón y actualizar la dirección')
steps(['Revisa web/dist/js/whatsapp-core.js. La constante phone ya debe contener 51906962740, sin + ni espacios.',
'Abre la web y pulsa el botón flotante. Debe abrir el número +51 906 962 740. En el formulario, completa nombre, servicio y proyecto; pulsa Continuar por WhatsApp.',
'En WhatsApp revisa el texto y pulsa Enviar. Solo abrir el chat no activa una respuesta.',
'Si cambias archivos web, regenera el ZIP con el comando de abajo y vuelve a publicarlo.'])
code('python herramientas/web/build/package-hosting.py')
h('Si ya publicaste bajo el nombre nuevo')
bullets(['En config/empresa.json actualiza la URL de la web dentro de knowledge con la dirección realmente publicada.',
'Actualiza las URLs de resources a los PDF que existan en la nueva web, por ejemplo /documentos/raylab-servicios.pdf. Comprueba las cinco fichas antes de activarlas.',
'Si el agente tiene BUSINESS_CONFIG_JSON en Cloudflare, esa variable completa tiene prioridad sobre el JSON local: actualízala coherentemente o usa la configuración embebida con un respaldo previo.',
'En Meta actualiza las URLs públicas de privacidad y eliminación de datos si dejaron de utilizarse las anteriores. No pegues una URL que todavía no abre.',
'No cambies el Worker URL ni PUBLIC_WORKER_URL solo por cambiar el dominio de la página. Son servicios independientes.'])
code('node agentes/whatsapp-api/scripts/node/configurar-empresa.mjs\nnode --test agentes/whatsapp-api/tests/worker.test.mjs')
p('Después de ejecutar el generador, publica el worker.mjs resultante para que la información nueva llegue al agente remoto.')
link('Dominio propio en Pages: documentación','https://developers.cloudflare.com/pages/configuration/custom-domains/')

page('5. YCloud y coexistencia del número')
p('Ruta elegida en nuestro caso: WhatsApp Business en el celular + YCloud + nuestro Worker. Si ya está Connected y responde, no vuelvas a registrar el número.')
steps(['Entra a YCloud con la cuenta que administra Raylab. Abre WhatsApp accounts y localiza +51 906 962 740.',
'Para una incorporación nueva, elige Coexistencia de la aplicación WhatsApp Business, no el registro estándar de un número nuevo.',
'Sigue el flujo ofrecido para tu cuenta y autoriza el número desde WhatsApp Business. Si aparece la opción de iniciar sesión con la app, úsala según el asistente. Las pantallas y la elegibilidad dependen de Meta y del proveedor.',
'Selecciona el portafolio correcto de Raylab, proporciona datos reales y una web pública válida. No inventes documentos ni datos legales para verificar.',
'Comprueba el número y el WABA que finalmente muestra YCloud. La referencia histórica es WABA 1119501657673541; si tu canal cambió, usa el ID actual.'])
link('YCloud: panel',YC)
link('YCloud: conectar WhatsApp','https://docs.ycloud.com/en/documentation/quick-start/connect-whatsapp-to-ycloud')
h('Lo que ocurrió con Publicidad Asia')
p('Meta mostraba que el número estaba vinculado a Publicidad Asia en la cuenta anterior. Lo encontramos en Cuentas de mensajes, no en Cuentas de WhatsApp. Retiraste esa vinculación y luego continuaste la conexión a YCloud. Si reaparece un portafolio desconocido, revisa primero su propiedad y acceso; no elimines cuentas de WhatsApp ni su historial para intentar arreglarlo.')
h('Pending y Connected son indicadores distintos')
p('Un número Connected no prueba que todos los envíos estén autorizados. Pending puede requerir revisión del proveedor. Confirma con un envío real y con el código de error; consulta al soporte de YCloud si bloquea operaciones. No hay un plazo de aprobación garantizado.')

page('6. Worker, D1 y Workers AI')
steps(['Cloudflare → Workers & Pages → raylio-whatsapp-agent. Si existe, úsalo; no crees otro innecesariamente.',
'Settings → Bindings → Add binding: Workers AI, nombre exacto AI.',
'En Storage & databases → D1, abre raylio-whatsapp-inbox. Para una instalación nueva ejecuta database/schema.sql. Para la existente revisa las tablas y aplica solo las migraciones pendientes.',
'En el Worker agrega binding D1 llamado INBOX y selecciona esa base.',
'Conserva las variables y bindings al publicar. La plantilla wrangler.jsonc local tiene d1_databases vacío: no la despliegues a ciegas porque no contiene los IDs reales de producción.'])
picture(setup,'Los nombres AI e INBOX deben coincidir exactamente con el código.')
code('SELECT name FROM sqlite_master WHERE type=\'table\' ORDER BY name;')
p('Debes encontrar inbound_messages, outbound_replies, conversation_controls y ai_reservations para el chat multicliente. Las tablas creativas son opcionales. Si ves “No SQL statements detected”, pega las sentencias desde CREATE TABLE, sin las marcas de bloque de código, y vuelve a verificar las tablas.')
link('D1 de tu cuenta',CF+'/workers/d1')
link('Secretos de Workers: documentación','https://developers.cloudflare.com/workers/configuration/secrets/')

page('7. Variables y secretos de producción')
p('Worker → Settings → Variables and secrets → Production → Add variable. En Key escribe el nombre exacto. Si corresponde a un secreto, marca Secret junto a Value. Guarda y despliega. No son variables de Pages.')
table(['Nombre','Tipo','Valor / origen'],[
('YCLOUD_API_KEY','Secret','YCloud → Developers → API key. Clave privada del canal.'),
('YCLOUD_WEBHOOK_SECRET','Secret','Signing secret del endpoint de YCloud, distinto de la API key.'),
('AGENT_ADMIN_TOKEN','Secret','Clave aleatoria propia, para pausar y diagnosticar.'),
('AI_TEST_TOKEN','Secret','Otra clave aleatoria propia, solo para pruebas privadas de IA.'),
('YCLOUD_WHATSAPP_NUMBER','Variable','+51906962740'),
('YCLOUD_WABA_ID','Variable','1119501657673541, si coincide con tu canal actual.'),
('YCLOUD_AUDIENCE','Variable','all, para responder a distintos clientes.'),
('YCLOUD_REPLIES_ENABLED','Variable','true, cuando todo esté preparado para responder.'),
('YCLOUD_MEDIA_ENABLED','Variable opcional','true, para recursos comerciales aprobados y publicados.')])
h('Generar tus claves privadas')
code('node -e "console.log(require(\'node:crypto\').randomBytes(32).toString(\'hex\'))"')
p('Ejecuta el comando una vez por secreto propio y guarda cada resultado en un gestor privado. No pegues esas claves en GitHub, Word, capturas ni chat. No sustituyas la API key de YCloud por una clave inventada.')
link('YCloud: API keys',YC+'#/app/developers/apikey')
link('YCloud: administrar API keys','https://docs.ycloud.com/en/documentation/developer/manage-api-keys')
p('Las variables WHATSAPP_* y META_APP_SECRET pertenecen al camino de Meta directo. Puedes conservarlas si mantienes las pruebas antiguas, pero no reemplazan los secretos YCLOUD_* del número empresarial.')

page('8. Publicar el código y activar el webhook')
steps(['Abre agentes/whatsapp-api/src/worker.mjs en VS Code. Copia TODO su contenido.',
'Cloudflare → raylio-whatsapp-agent → Edit code. Selecciona Latest. Si muestra “Only the latest version of your Worker can be edited” o un candado, estás en una versión antigua.',
'Reemplaza worker.js completo con el contenido copiado y pulsa Deploy. Comprueba que la nueva versión quede activa.',
'En YCloud → Developers → Webhooks crea o edita el endpoint. Introduce exactamente la URL indicada abajo.',
'Suscribe whatsapp.inbound_message.received. Guarda el signing secret de ese endpoint en YCLOUD_WEBHOOK_SECRET y activa el endpoint: debe decir Active, no Inactive.',
'Comprueba Settings → Production, bindings AI e INBOX y las variables. Luego prueba desde otro teléfono.'])
code(WORKER+'/ycloud-webhook')
link('YCloud: Webhooks',YC+'#/app/developers/webhook')
link('YCloud: guía de Webhooks','https://docs.ycloud.com/en/documentation/developer/webhooks')
link('Comprobar salud del Worker',WORKER+'/health')
p('Abrir la raíz del Worker puede devolver Not found: no es la página web. /health confirma que el Worker responde, pero no demuestra por sí solo que IA, YCloud, D1 o los envíos funcionen. El endpoint empresarial es /ycloud-webhook; /webhook corresponde a Meta directo.')

page('9. Darle información y archivos de Raylab')
h('Información aprobada')
p('Edita config/empresa.json: name, knowledge, guidance y resources. El nombre público debe ser Raylab Soluciones Digitales. Define servicios, proceso, horarios si están confirmados, condiciones y contacto. No inventes precios: actualmente se cotiza según alcance.')
steps(['Revisa que knowledge tenga el enlace público correcto y el número empresarial.',
'Cada recurso debe tener título, tipo, URL HTTPS real, palabras clave y enabled=true solo cuando el archivo exista y esté autorizado.',
'Ejecuta configurar-empresa.mjs y las pruebas locales. Copia el Worker resultante y despliega.',
'Publica los PDF comerciales en Pages antes de habilitar YCLOUD_MEDIA_ENABLED=true. Abre cada URL y comprueba que sea un PDF, no la portada de la web.'])
code('node agentes/whatsapp-api/scripts/node/configurar-empresa.mjs\nnode --test agentes/whatsapp-api/tests/worker.test.mjs')
link('Ficha comercial actual',WEB+'/documentos/raylab-servicios.pdf')
p('El catálogo comercial existente explica los servicios de Raylab. Un PDF personalizado sobre cómo se vería el restaurante de un cliente es otra función: necesita la configuración creativa de la sección 13. El bot no debe afirmar que un archivo existe si la generación falló.')
h('Para vender agentes a otros negocios')
p('Esta implementación usa una instalación separada por empresa: Worker, D1, número/canal, secretos y configuración propios. No sobrescribas el JSON de Raylab para atender a un restaurante. No es todavía un panel multiempresa compartido.')

page('10. Prueba completa desde la web')
steps(['Abre la URL pública de Raylab en una ventana privada. Pulsa el botón de WhatsApp y confirma que abre el número de la empresa.',
'Envía “Hola, ¿qué servicios ofrece Raylab?”. Hazlo desde un número distinto al empresarial.',
'Espera la respuesta. Pregunta después por una página web para un restaurante: debe continuar la conversación sin ejecutar comandos en la terminal.',
'Prueba desde el teléfono de tu socio. No debe ser necesario agregar su número a ninguna variable cuando YCLOUD_AUDIENCE=all.',
'En Cloudflare → Observability → Live, envía otra consulta y busca POST /ycloud-webhook. Abre los detalles y revisa el estado HTTP y los marcadores de diagnóstico.',
'En D1 ejecuta la consulta de abajo. Compara la hora con la prueba y verifica que haya más de un sender cuando usaste dos teléfonos.'])
code("SELECT sender, text_body, received_at\nFROM inbound_messages\nWHERE id LIKE 'ycloud:%'\nORDER BY received_at DESC LIMIT 10;")
code("SELECT state, COUNT(*) AS total FROM outbound_replies\nWHERE inbound_id LIKE 'ycloud:%' GROUP BY state;")
p('received_at es una marca temporal del código. Una respuesta aceptada por el proveedor no garantiza entrega al celular. Revisa además WhatsApp y, cuando corresponda, los registros del proveedor. Evita compartir capturas con conversaciones privadas.')
h('Comprobar solo la IA, sin enviar WhatsApp')
code('powershell -NoProfile -ExecutionPolicy Bypass -File "./agentes/whatsapp-api/scripts/powershell/test-ai.ps1"')
p('Introduce AI_TEST_TOKEN, no el token de Meta. Una prueba privada correcta no confirma que el webhook empresarial esté recibiendo mensajes.')

page('11. Errores que encontramos y cómo resolverlos')
table(['Señal observada','Interpretación y acción'],[
('Unauthorized en test-whatsapp / ai-test','Usa AI_TEST_TOKEN de Cloudflare. No uses el identificador de acceso de Meta. Si no lo conservas, cambia ese secreto y actualiza su copia privada.'),
('provider_failure; code=unknown','No basta para identificar la causa. Ejecuta diagnóstico de IA y revisa el detalle. Comprueba binding AI y el modelo llamado por el Worker.'),
('Modelo @cf/meta/inf… deprecado','El error histórico citaba @cf/meta/infine-llama-3.1-8b-instruct. El código actual llama @cf/meta/llama-3.1-8b-instruct-fp8. Confirma el identificador exacto y vuelve a desplegar.'),
('Scripts deshabilitados en PowerShell','Usa -NoProfile -ExecutionPolicy Bypass -File para ejecutar el script concreto, como en la guía. No hace falta cambiar permanentemente la política del equipo.'),
('Texto Â¿ / caracteres dañados','Problema de codificación, no del idioma del modelo. El script actual envía y lee UTF-8.'),
('Test de Meta correcto, D1 sin mensajes reales','La muestra solo prueba el webhook de test. Verifica suscripción de la app al WABA en Meta directo y la ruta correcta. En YCloud revisa endpoint activo y evento entrante.'),
('Solo responde a mi número','Confirma Latest desplegado, YCLOUD_AUDIENCE=all y REPLIES_ENABLED=true. Busca el mensaje del socio en D1 antes de atribuirlo a un filtro.'),
('POST /ycloud-webhook devuelve 400','El log de invocación no muestra la causa completa. Revisa marcadores de payload. El código contempla números con/sin + y los identificadores BSUID.'),
('Not found en la raíz del Worker','Prueba /health. No subas el ZIP de la página al Worker para corregirlo.'),
('No SQL statements detected','Pega SQL desde CREATE TABLE, sin ``` ni solo comentarios. Comprueba las tablas después.')])
p('Estos son errores históricos y criterios de diagnóstico; no significa que todos estén presentes ahora. No borres tablas ni desactives la verificación de firmas para ocultar un error.')

page('12. Si deja de responder: orden de revisión')
steps(['Comprueba que WhatsApp Business siga operativo en el teléfono y que el mensaje se haya enviado al número empresarial correcto.',
'Mira YCloud: canal, estado del endpoint, saldo/condiciones y registros de entrega. No recrees el canal como primer intento.',
'En Observability → Live envía un texto nuevo. Si no hay petición, revisa YCloud antes de cambiar la IA.',
'Si hay petición pero no fila en D1, revisa HTTP, firma, WABA, número destino, binding INBOX y versión desplegada.',
'Si hay fila pero no respuesta, revisa pausa, banderas de envío, cupos/cooldown y el estado de outbound_replies.',
'Si falla la IA, ejecuta test-ai.ps1. Si la IA responde pero YCloud rechaza el envío, revisa la API key y el código de error del proveedor.',
'Para Meta directo, comprueba caducidad y permisos del token. Para el número YCloud no reemplaces la API key por ese token.',
'Tras corregir la causa, prueba con un mensaje nuevo. No reenvíes trabajos inciertos sin revisar primero si ya se entregaron.'])
h('Límites internos actuales del código')
table(['Variable opcional','Predeterminado'],[('YCLOUD_DAILY_REPLY_LIMIT','200 intentos por canal/día UTC'),('YCLOUD_CUSTOMER_DAILY_LIMIT','20 intentos por cliente/día UTC'),('YCLOUD_COOLDOWN_SECONDS','10 segundos por cliente')])
p('No son los límites comerciales de Meta/YCloud ni una cuota ilimitada gratuita. Un mensaje limitado se guarda pero no queda encolado para responder luego. La memoria del chat usa hasta tres pares anteriores aceptados dentro de 24 horas; no incluye automáticamente lo que escribes desde el celular.')
h('Lo que no se pudo concluir sobre la tarde sin respuesta')
p('Sin el error y el estado de ese momento no se puede afirmar si fue el token, una cuota, una pausa o el proveedor. Que una prueba posterior funcione no identifica por sí sola la causa del fallo anterior.')

page('13. PDF e imágenes personalizados: opcional')
p('Activa esta parte después de validar el chat. Existe código local, pero hubo un fallo real de generación que debe diagnosticarse; no se presenta como producción validada.')
steps(['En D1 ejecuta database/migration-creativos.sql y comprueba creative_briefs y creative_jobs.',
'En R2 crea un bucket privado, por ejemplo raylio-generated. Usa Standard si corresponde a tu operación; revisa facturación y franquicias. No habilites acceso público para estos trabajos.',
'Worker → Bindings → R2 bucket → nombre GENERATED_FILES, eligiendo ese bucket.',
'Crea CREATIVE_LINK_SECRET como Secret aleatorio de al menos 32 caracteres. No reutilices otras claves.',
'Agrega PUBLIC_WORKER_URL con la URL HTTPS del Worker, sin ruta de webhook.',
'Publica el Worker completo y agrega Cron Trigger * * * * * para procesar trabajos.',
'Ejecuta test-creative.ps1. La primera parte revisa configuración; si aceptas la prueba real, consume llamadas a modelos, pero no envía un WhatsApp ni valida la escritura R2.',
'Solo tras la prueba agrega CREATIVE_ENABLED=true. Pide una propuesta por WhatsApp y verifica generación, guardado y entrega real.'])
code('PUBLIC_WORKER_URL='+WORKER+'\nCREATIVE_ENABLED=true\nYCLOUD_REPLIES_ENABLED=true\nYCLOUD_AUDIENCE=all')
code('powershell -NoProfile -ExecutionPolicy Bypass -File "./agentes/whatsapp-api/scripts/powershell/test-creative.ps1"')
p('El código usa @cf/black-forest-labs/flux-1-schnell para imágenes y el modelo de texto indicado antes. La disponibilidad y las cuotas de tu cuenta deben verificarse. Los archivos reales se sirven desde /generated/ con firma temporal; no desde una URL inventada /propuestas/2024/...pdf.')
p('Límites por defecto: 10 intentos de generación por día y 2 por cliente, día UTC. El cron procesa una solicitud por ejecución. Los enlaces vencen a las 24 horas; quien tenga el enlace válido puede abrirlo. Configura retención en R2 según el prefijo real usado (esta instalación conserva id raylio).')

page('14. Atención humana y operación diaria')
p('La coexistencia permite usar el celular y el agente, pero no implementa por sí sola la pausa automática del bot al escribir tú. Pausa primero la conversación y después atiéndela.')
code('powershell -NoProfile -ExecutionPolicy Bypass -File "./agentes/whatsapp-api/scripts/powershell/control-chat.ps1" -Action pause -Customer 51953791221\n\npowershell -NoProfile -ExecutionPolicy Bypass -File "./agentes/whatsapp-api/scripts/powershell/control-chat.ps1" -Action status -Customer 51953791221\n\npowershell -NoProfile -ExecutionPolicy Bypass -File "./agentes/whatsapp-api/scripts/powershell/control-chat.ps1" -Action resume -Customer 51953791221')
p('Reemplaza el número del ejemplo por el cliente que atenderás. El script pide AGENT_ADMIN_TOKEN oculto. Si el remitente aparece como bsuid:…, usa ese identificador compatible. No es necesario guardar los números de todos los clientes como variables.')
bullets(['El cliente puede pedir “asesor” o un humano: el código pausa esa conversación. No asigna automáticamente un operador ni garantiza una notificación al equipo.',
'Para detener todos los envíos configura YCLOUD_REPLIES_ENABLED=false y despliega. No borres claves ni la base para pausar.',
'Los trabajos interrumpidos y estados unknown requieren revisión manual. El procesamiento actual no equivale a una plataforma de alta disponibilidad con recuperación completa.',
'Antes de vender a gran escala, define monitoreo, copias, retención, costos, atención humana y pruebas de carga. Un plan de pago no garantiza respuestas instantáneas.',
'Un hosting compartido de la página no ejecuta automáticamente este Worker. Migrar el agente a un VPS exige adaptar runtime, base, almacenamiento, HTTPS y procesos; no es subir el ZIP público.'])

page('15. Meta directo: referencia de la primera prueba')
p('Esta sección conserva el recorrido inicial. Tu número empresarial usa YCloud: no mezcles sus claves y webhooks con esta ruta de prueba.')
steps(['Entra a Meta for Developers → tu aplicación → WhatsApp → Paso 1: Probar.',
'El Phone Number ID identifica el número de Meta; el WABA identifica la cuenta empresarial. El identificador de acceso es el token privado, no un ID.',
'En Cloudflare la ruta /webhook usa WHATSAPP_VERIFY_TOKEN para verificar el desafío y META_APP_SECRET para las firmas. Los envíos directos requieren WHATSAPP_ACCESS_TOKEN.',
'Además de activar el campo messages, la app correcta debe estar suscrita al WABA. En nuestro caso la comprobación mostró una app distinta y RAYLIO_SUSCRITA=False; al suscribir usando el token de la app correcta quedó True y empezó a responder.',
'Si reproduces esa comprobación usa los scripts actuales de la carpeta scripts/powershell. Primero check-subscription.ps1 (lectura). subscribe-raylab.ps1 sí cambia una suscripción: revisa app y WABA antes de ejecutarlo.'])
link('Meta: tus aplicaciones','https://developers.facebook.com/apps/')
link('Aplicación usada en la conversación','https://developers.facebook.com/apps/970093816170921/')
link('Meta Business Suite','https://business.facebook.com/')
p('Los tokens temporales no son una solución de producción permanente. No publiques identificadores de acceso en capturas. El script test-whatsapp.ps1 heredado prueba el envío de Meta; para YCloud la prueba de extremo a extremo es escribir al número empresarial y revisar /ycloud-webhook.')

page('16. Enlaces y lista final de comprobación')
for label,url in [
('Cloudflare: Workers y Pages',CF+'/workers-and-pages'),
('YCloud: cuenta',YC),('YCloud: Webhooks',YC+'#/app/developers/webhook'),
('Guía oficial: Webhooks de YCloud','https://docs.ycloud.com/en/documentation/developer/webhooks'),
('Guía oficial: API keys de YCloud','https://docs.ycloud.com/en/documentation/developer/manage-api-keys'),
('Guía oficial: conectar WhatsApp','https://docs.ycloud.com/en/documentation/quick-start/connect-whatsapp-to-ycloud'),
('Cloudflare: secretos','https://developers.cloudflare.com/workers/configuration/secrets/'),
('Cloudflare: publicar ZIP','https://developers.cloudflare.com/pages/get-started/direct-upload/'),
('Cloudflare: dominio propio','https://developers.cloudflare.com/pages/configuration/custom-domains/'),
('Modelo de texto del código local','https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fp8/'),
('Modelo de imagen del código local','https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/')]: link(label,url)
h('Antes de darlo por terminado')
bullets(['La web pública abre y el botón apunta al +51 906 962 740.',
'El nombre público es Raylab Soluciones Digitales; el subdominio nuevo solo se anuncia cuando exista.',
'El Worker activo contiene el código final; AI e INBOX están vinculados.',
'El endpoint YCloud está activo, firmado y recibe el evento de mensajes.',
'Dos números diferentes reciben respuesta y sus entradas aparecen en D1.',
'Se probaron pausa/reanudación y los PDF comerciales autorizados.',
'No hay secretos en la página, el ZIP, el Word o GitHub.',
'La generación personalizada solo se considera lista tras una entrega real comprobada.'])
p('Fuentes consultadas: documentación oficial enlazada de Cloudflare/YCloud y archivos locales del proyecto, 01/11/2026. Las rutas del panel son accesos de referencia y pueden redirigir al inicio de sesión. Esta guía no comprueba propiedad de dominios ni aprueba verificaciones comerciales.')

doc.core_properties.title='Raylab Soluciones Digitales — Guía web y agente de WhatsApp'
doc.core_properties.subject='Configuración, publicación y diagnóstico de la integración con YCloud y Cloudflare'
doc.core_properties.author='Raylab Soluciones Digitales'
doc.save(DOC)
with zipfile.ZipFile(DOC) as z:
    assert z.testzip() is None
    assert 'word/document.xml' in z.namelist()
    links=z.read('word/_rels/document.xml.rels').decode()
    assert 'ycloud.com' in links and 'wa.me' in links
    assert sum(n.startswith('word/media/') for n in z.namelist())>=4
print(DOC)
print('Validado: Word abre como DOCX, enlaces externos e imágenes incrustadas; sin credenciales reales.')
