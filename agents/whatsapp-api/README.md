# Raylab — receptor de WhatsApp Cloud API

## Organización actual de archivos

```text
src/                 worker.mjs y runtime de generación
config/              empresa.json, catálogo y ejemplo de restaurante
database/            schema.sql y migraciones D1
scripts/node/        generadores y configuración del negocio
scripts/python/      generador de catálogos PDF
scripts/powershell/  pruebas y administración manual
tests/               pruebas del Worker y sus fixtures
docs/                instrucciones y documentación por función
wrangler.jsonc       configuración del despliegue; main = src/worker.mjs
```

Para copiar el código al editor de Cloudflare, usa **`src/worker.mjs`**. Para modificar los datos del negocio, usa **`config/empresa.json`**. Para ejecutar comandos desde la raíz del proyecto:

```powershell
node --test agents/whatsapp-api/tests/worker.test.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File "./agents/whatsapp-api/scripts/powershell/test-ai.ps1"
```

El ejemplo `.dev.vars.example`, `.gitignore` y `wrangler.jsonc` permanecen en la raíz del agente porque las herramientas los esperan ahí. No se movieron credenciales del servidor ni se publicó ningún cambio.

Las secciones siguientes conservan el historial de configuración y pruebas.

Estado al 27 de octubre de 2026: el propietario desplegó el Worker y confirmó la conversación automática directa en WhatsApp con el número de prueba de Meta. Funcionan recepción → D1 → Workers AI → Graph API. Fue necesario suscribir la app Raylab al WABA además del campo `messages`. El envío está limitado al destinatario autorizado; el número real, la memoria y la atención humana siguen pendientes. Consulta el [manual completo](../../docs/RAYLAB-MANUAL.md), [envío](./docs/WHATSAPP-SEND.md) y [prueba IA](./docs/WORKERS-AI.md). La web de Pages y su ZIP no contienen estos archivos.

## Qué hace

Ampliación multicliente preparada localmente el 28/10/2026: [MULTICLIENTE.md](./docs/MULTICLIENTE.md). Incluye apertura explícita a remitentes de YCloud, límites, memoria breve y pausa por conversación autenticada. Requiere ejecutar la migración D1 y desplegar; no se activa solo por cambiar archivos locales. El propietario confirmó antes el envío empresarial con su destinatario de prueba.

Actualización 28/10/2026: el adaptador YCloud está preparado y probado localmente; falta desplegarlo y validar la recepción/envío reales del número empresarial. Sigue [YCLOUD.md](./docs/YCLOUD.md). La ruta nueva es `/ycloud-webhook`, conserva `/webhook` de Meta y usa secretos propios. El estado Pending de la cuenta no se ha resuelto ni se da por aprobado.

- `GET /webhook`: devuelve el desafío de Meta únicamente con el token de verificación correcto.
- `POST /webhook`: comprueba la firma HMAC-SHA256 usando el secreto de la aplicación, antes de interpretar el mensaje.
- Acepta mensajes únicamente del Phone Number ID configurado.
- Guarda mensajes entrantes en D1; los reenvíos de Meta no crean duplicados.
- Ignora los estados de entrega/lectura y no los convierte en mensajes del usuario.
- Devuelve 503 si falta la bandeja o falla el guardado, para permitir el reintento de Meta.
- No registra secretos ni contenido de conversaciones en la consola.

## Datos para configurar privadamente

- `WHATSAPP_VERIFY_TOKEN`: una cadena aleatoria creada para verificar este webhook. No es el token de acceso de Graph API.
- `META_APP_SECRET`: secreto de la app de Meta. Se usa para verificar la firma de las notificaciones entrantes.
- `WHATSAPP_PHONE_NUMBER_ID`: ID del número de prueba que muestra Meta; no es el número de teléfono ni el ID de la app.
- Binding D1 `INBOX`, con las tablas de `database/schema.sql`.

No pegues secretos en un chat ni en archivos públicos. En Cloudflare se guardan como secretos del Worker. En local se utiliza `.dev.vars`, excluido del control de versiones. Para enviar se requiere `WHATSAPP_ACCESS_TOKEN` (Secret), `WHATSAPP_TEST_RECIPIENT` y `WHATSAPP_REPLIES_ENABLED=true`. La IA usa el binding `AI`. La ruta privada usa `AI_TEST_TOKEN`. Ver la tabla completa de configuración en el manual.

## Preparación en Cloudflare

1. Crear una base D1 llamada `raylio-whatsapp-inbox` y ejecutar `database/schema.sql`.
2. Incorporar su ID real en `wrangler.jsonc` mediante el binding `INBOX` (hay un ejemplo comentado).
3. Autenticar Wrangler con la cuenta de Cloudflare y cargar los tres secretos. No hay credenciales incluidas en este proyecto.
4. Desplegar el Worker y obtener su URL HTTPS. La URL efectiva solo existe después del despliegue.
5. En la configuración de webhooks de la app de Meta, colocar la URL `https://HOST_REAL_DEL_WORKER/webhook` y el mismo `WHATSAPP_VERIFY_TOKEN`.
6. Verificar y guardar; suscribirse al campo `messages` de WhatsApp Business Account y comprobar la suscripción de la app a la cuenta de prueba.
7. Responder desde el teléfono al número de prueba y comprobar el registro en D1.

La vinculación de la app y los eventos debe hacerse sobre la cuenta de prueba. El número real de Raylab permanece en WhatsApp Business hasta preparar y validar coexistencia.

## Comprobación local

Desde esta carpeta, con Node.js 22 o posterior:

```powershell
node --test tests/worker.test.mjs
```

El despliegue realizado fue manual en el editor de Cloudflare. No ejecutar `wrangler deploy` hasta sincronizar los bindings e ID real de D1: el archivo local conserva `d1_databases: []`. Los cambios locales no se suben automáticamente.

## Pendiente antes de atender clientes

- Mantener vigente el modelo de Workers AI y preparar credenciales duraderas de Meta.
- Añadir memoria por conversación y recuperación durable de trabajos. El envío por Graph API ya existe con reclamación única por mensaje; los resultados ambiguos no se reenvían automáticamente.
- Configurar y probar derivación humana y pausa por conversación; no se promete que una respuesta desde el celular pause automáticamente la IA.
- Limitar acceso a D1, fijar retención y eliminación de datos de prueba y revisar avisos de privacidad antes de recibir datos de clientes.
- Configurar credenciales duraderas, revisar costos y validar el flujo de coexistencia con el número empresarial.

Fuentes: [verificación de webhooks de Meta](https://whatsapp.github.io/WhatsApp-Nodejs-SDK/api-reference/webhooks/start/), [Web Crypto de Workers](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/).
# Actualización: asesoría y PDF comerciales

El Worker local incluye selección y envío de cinco fichas públicas de Raylab mediante YCloud. Para publicar y activar esta función sigue [DOCUMENTOS.md](./docs/DOCUMENTOS.md), primero Pages y después el Worker. No está activada por defecto. Validación actual: 35 pruebas locales aprobadas.

# Configuración por negocio y archivos multimedia

La versión local actual usa `config/empresa.json` y el generador `scripts/node/configurar-empresa.mjs`. Admite recursos aprobados de tipo documento, imagen, video y audio mediante YCloud; la generación de diseños o PDF personalizados sigue pendiente. Consulta [NEGOCIOS-Y-ARCHIVOS.md](./docs/NEGOCIOS-Y-ARCHIVOS.md) para configuración, separación de negocios y despliegue. Comprobación actual: 39 pruebas locales aprobadas. Las secciones siguientes documentan entregas anteriores.

# Generación personalizada: actualización actual

Marca actual del agente: **Raylab Soluciones Digitales**, definida en `config/empresa.json` y embebida en el Worker. Se conserva el identificador interno `raylab`, los nombres de recursos y las direcciones existentes para mantener las conversaciones y los archivos. Si existe `BUSINESS_CONFIG_JSON` en Cloudflare, su campo `name` debe actualizarse también porque tiene prioridad sobre la configuración embebida. Los PDF comerciales se regeneraron con Raylab; publicar el ZIP de Pages para aplicarlos. Cambiar el nombre visible del perfil de WhatsApp Business es un ajuste independiente en la app/proveedor.

Corrección del 30/10: estados de propuesta desde D1, bloqueo de enlaces ficticios del modelo, diagnósticos privados y 404 de Pages. 55 pruebas locales aprobadas. El fallo de generación real necesita comprobarse con `scripts/powershell/test-creative.ps1`; no se da por resuelto solo con las pruebas locales. Instrucciones en GENERACION-PERSONALIZADA.md.

El Worker local incluye briefs y trabajos en D1, generación de imagen con Workers AI, PDF de dos páginas y entrega privada desde R2 mediante enlaces temporales. No está activado en Cloudflare. Sigue [GENERACION-PERSONALIZADA.md](./docs/GENERACION-PERSONALIZADA.md) para migración, bucket, secreto, cron, límites y prueba real. Validación actual: 51 pruebas locales aprobadas. Los textos inferiores reflejan etapas anteriores.

