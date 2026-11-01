# Propuestas personalizadas en PDF o imagen

## Corrección del 30 de octubre: falsa finalización y enlace inexistente

Una prueba real mostró un texto del modelo que afirmaba que la referencia estaba lista y añadía una URL de Pages `/propuestas/2024/...pdf`, seguido del aviso real de fallo. Ese enlace no lo construye el generador: los archivos reales usan el Worker `/generated/{empresa}/{id}.pdf` con firma temporal. No existe evidencia todavía para atribuir el fallo real de generación a un modelo, cuota o bucket concreto.

Se agregó estado determinista consultado en D1 para preguntas como «me avisas cuando termines», filtro de URLs no aprobadas y falsas afirmaciones de adjuntos en respuestas del modelo, tolerancia a JSON de planificación con texto adicional y plan de respaldo personalizado al brief si solo falla su formato. El respaldo no sustituye el modelo de imagen ni oculta un error de ese proveedor. La web incluye `404.html` con rutas de assets absolutas para desactivar el fallback a la portada en rutas de archivos inexistentes.

Para aplicar: copiar el Worker completo actualizado y desplegar, y publicar el ZIP actualizado en Pages. No se agregaron tablas ni se requiere cambiar credenciales por esta corrección.

Después, desde la raíz del proyecto:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ./agents/whatsapp-api/scripts/powershell/test-creative.ps1
```

Solicita AGENT_ADMIN_TOKEN de forma oculta. Primero comprueba configuración sin llamar a modelos. Si el operador escribe SI, ejecuta una prueba real con texto e imagen: consume esas llamadas en Cloudflare, no guarda el archivo ni envía WhatsApp. Muestra stage, reason, code y detalle del error con secretos redactados; compartir solo el resultado, no la clave. Esta prueba es administrativa y no consume los límites diarios de generación de clientes. No es una prueba de la escritura R2 o entrega YCloud.

El endpoint privado es POST `/creative-diagnostic`, autenticado con AGENT_ADMIN_TOKEN. Los fallos de trabajos nuevos también registran `creative-job` con stage, reason, code y job_id, sin el brief ni claves. Etapas: plan_model, image_model, image_validation, pdf_render, storage o delivery. Validación local actual: 55 pruebas aprobadas. Sigue pendiente identificar el fallo concreto observado en la cuenta real.

Implementación local del 29 de octubre de 2026. No está publicada ni activada en Cloudflare. Las pruebas locales usan modelos y transporte simulados; no se ha llamado al modelo de imágenes real con tu cuenta.

## Resultado

El cliente pide una imagen o PDF personalizado, o cómo se vería su negocio. El agente pregunta el nombre y rubro; después el objetivo, estilo y colores; y el formato si aún no se indicó. Guarda la solicitud para procesarla en segundo plano. Puede usarse con cualquier rubro definido por el propietario en `empresa.json → creative.instructions`.

Para Raylab se configuró el alcance de propuestas conceptuales de webs, interfaces de sistemas y microapps. Para un restaurante, tienda u otro negocio se debe definir su alcance propio; no se arrastran los servicios de Raylab al cliente. La plantilla de restaurante incluye un ejemplo que hay que completar antes de publicar.

El procesador crea un plan con Workers AI y una imagen mediante `@cf/black-forest-labs/flux-1-schnell`, según su [API oficial](https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/). El PDF es de dos páginas: imagen conceptual y resumen personalizado, seguido de ideas propuestas. Se genera directamente en JavaScript, sin instalar un navegador ni otra API de PDF. La opción imagen entrega un JPEG. No produce una web funcional ni un diseño final y puede requerir correcciones, especialmente en textos generados dentro de la imagen.

## Activar en Raylab, en este orden

1. **D1 → raylio-whatsapp-inbox → Console:** ejecuta todo `database/migration-creativos.sql`. Son tablas nuevas; no borra mensajes. Si el editor dice «No SQL statements detected», pega desde `CREATE TABLE` y comprueba con `/tables` que existen `creative_briefs` y `creative_jobs`.
2. **Cloudflare → Storage & databases → R2:** crea un bucket privado, por ejemplo `raylio-generated`. No habilites acceso público. Configura una regla de ciclo de vida para borrar objetos del prefijo `raylab/` después de 7 días; para otros clientes usa su propio bucket y prefijo. R2 puede exigir activar su servicio de facturación aunque tenga una franquicia de uso. Revisa las condiciones de tu cuenta; no se promete generación ilimitada gratuita.
3. **Worker raylio-whatsapp-agent → Settings → Bindings → Add binding:** tipo R2 bucket, nombre exacto `GENERATED_FILES`, bucket creado. Conserva `INBOX` y `AI`.
4. Agrega un **Secret** `CREATIVE_LINK_SECRET`: una clave aleatoria nueva de al menos 32 caracteres. Guárdala privadamente y no la envíes por el chat. Cambiarla invalida los enlaces ya emitidos. No es el token de Meta, YCloud ni AI_TEST_TOKEN.
5. Agrega la variable normal `PUBLIC_WORKER_URL=https://raylio-whatsapp-agent.rivasbruce563.workers.dev`.
6. Copia TODO el `src/worker.mjs` actualizado en Edit code → Latest → Deploy. No subas la carpeta de pruebas al editor.
7. **Settings → Trigger events → Cron Triggers:** agrega `* * * * *`. El manejador `scheduled` procesa como máximo una solicitud por ejecución. Los cambios de cron pueden tardar en propagarse; no hay un plazo de entrega garantizado.
8. Agrega la variable normal `CREATIVE_ENABLED=true` y despliega. Mantén `YCLOUD_REPLIES_ENABLED=true` y, para clientes generales, `YCLOUD_AUDIENCE=all`. La generación usa su propia bandera y no depende de YCLOUD_MEDIA_ENABLED; esa otra bandera controla los archivos comerciales existentes.
9. Publica el ZIP actualizado de la web en Pages **rayliotechsolutions** para reflejar el tratamiento de los datos de propuestas y archivos en la política de privacidad.
10. Desde otro WhatsApp escribe «Crea una propuesta en PDF de cómo se vería mi negocio» y responde a las preguntas. Revisa el cron y la entrega real. Después prueba la opción imagen. La disponibilidad, licencia, cuota y costo del modelo en tu cuenta deben comprobarse en esta prueba real.

No es necesario un nuevo dominio ni otra página para servir estos archivos. El Worker entrega los archivos privados por URLs firmadas que expiran en 24 horas. Cualquiera que reciba un enlace válido podrá abrirlo durante ese plazo; no es una autenticación por destinatario. No se coloca el teléfono en el nombre del archivo. Las copias descargadas o enviadas a WhatsApp sobreviven a la expiración del enlace.

## Límites y privacidad

- Por defecto: 10 solicitudes de generación al día por instalación y 2 por cliente. Se cuentan los intentos registrados, incluso los fallidos. Límites por día UTC.
- Opcionales: `CREATIVE_DAILY_LIMIT` (1–100), `CREATIVE_CUSTOMER_DAILY_LIMIT` (1–10). No son topes exactos de facturación; cada trabajo hace una llamada de planificación y una de imagen, y los mensajes consumen las cuotas normales del chat.
- Las respuestas al brief pueden enviarse inmediatamente sin el cooldown ordinario, conservando el límite diario del chat. Los adjuntos finales respetan las cuotas y pausa del chat.
- Cada trabajo se limita a un formato y un archivo. Para cambiar formato o pedir otra versión, se hace otra solicitud; no se edita automáticamente el archivo previo.
- «cancelar» cancela un brief en preparación. Una solicitud ya encolada puede detenerse pausando la conversación antes de procesarla. No cancela una llamada de IA que ya empezó; la pausa sí se revisa antes del envío.
- El brief de preparación caduca a las 24 horas; el cron elimina los briefs antiguos. Los trabajos expiran si ya no hay una ventana de atención válida. Los registros de solicitudes y mensajes no se borran automáticamente por antigüedad; los archivos R2 se eliminan mediante la regla de ciclo de vida indicada arriba.
- Una solicitud manual de eliminación debe abarcar `creative_briefs`, `creative_jobs` y sus `asset_key` en R2, además del procedimiento de mensajes existente. Borrar solo la fila no revoca una URL si el objeto sigue existiendo. No borrar filas mientras un trabajo esté procesándose: pausar y revisar primero.
- Solo se usa texto del brief. No se leen logotipos, fotos ni otros adjuntos entrantes. La imagen no garantiza fidelidad de marca, exactitud textual ni viabilidad de todas las ideas propuestas. Revisar antes de usarla comercialmente.

## Revisar qué ocurrió

En D1, sin imprimir conversaciones ni claves:

```sql
SELECT id,format,state,asset_key,created_at,updated_at
FROM creative_jobs
ORDER BY created_at DESC LIMIT 10;
```

Estados: `queued` pendiente; `processing` reclamado para generar; `ready` archivo preparado y entrega pospuesta por pausa; `accepted` aceptado por YCloud; `unknown` envío de resultado incierto; `limited` bloqueado por límites de respuesta; `failed` error; `expired` fuera de plazo. `accepted` no equivale a confirmación de entrega.

En Observability, `creative-job` muestra solo resultado, sin brief ni enlaces firmados. El cron requiere D1 y R2 correctos. Si el modelo falla, el trabajo queda fallido y se intenta enviar un aviso sincero al cliente; no se envía una ficha general como sustituto. Ese aviso también puede quedar bloqueado por pausa, cuotas o proveedor.

No hay reintentos automáticos de generación: evitan duplicar cargos o archivos. Si un proceso se interrumpe y queda `processing`, requiere revisión manual. Si un envío queda `unknown`, revisa YCloud y WhatsApp antes de repetirlo. Un estado `limited` también requiere revisión; no es una promesa de entrega posterior. Para más volumen conviene un consumidor de cola con recuperación y seguimiento de entrega; el procesador actual es una base limitada a una solicitud por ejecución programada.

## Modificar y construir

`src/creativos-runtime.txt` contiene las funciones de generación y descarga. Después de editarlo:

```powershell
node agents/whatsapp-api/scripts/node/construir-creativos.mjs
node agents/whatsapp-api/scripts/node/configurar-empresa.mjs
node --test agents/whatsapp-api/tests/worker.test.mjs
```

El Worker final sigue siendo autocontenido y se puede copiar al editor. La plantilla `wrangler.jsonc` no contiene los IDs de tu D1 ni R2: no usar wrangler deploy sin sincronizar antes esas vinculaciones y secretos desde el entorno correcto. Para otra empresa genera un Worker separado con su JSON, D1, R2, número, cron y secretos; no sobrescribas Raylab.

## Verificación local

51 pruebas aprobadas. Cubren brief separado por cliente, límites, cancelación, PDF con JPEG real y dos páginas, generación programada, imagen, deduplicación concurrente, pausa, expiración, enlaces firmados, aislamiento por empresa y fallos del modelo. Se verificó el PDF con un lector independiente y se inspeccionó su render. La imagen usada en esa comprobación es una fixture técnica, no una imagen realmente generada por IA. Falta la prueba real con Cloudflare Workers AI, R2 y YCloud después de configurar tu cuenta.
