# Agente por negocio: información y archivos

Actualización posterior: la generación personalizada ya está implementada localmente como flujo separado y requiere activación. Para esa capacidad prevalece [GENERACION-PERSONALIZADA.md](./GENERACION-PERSONALIZADA.md). Las indicaciones de abajo sobre generación pendiente describen la etapa anterior.

Base local de Raylab Soluciones Digitales. Implementado y probado localmente; no se publica por ejecutar estos scripts.

## Dos capacidades distintas

1. Responder con información aprobada de la empresa y adjuntar sus archivos existentes. Implementado para documentos, imágenes, videos y audios de formatos compatibles con WhatsApp.
2. Crear una imagen o un PDF personalizado de cómo se vería el negocio del cliente. NO implementado. Necesita recopilar un brief, generar el contenido/diseño, renderizar el archivo, almacenarlo con permisos adecuados y comprobarlo antes de enviarlo. Un catálogo general no satisface esa solicitud. El agente ahora recibe esa distinción explícitamente y el selector no sustituye la solicitud por una ficha genérica.

Las imágenes de referencia son opcionales: tienen sentido si ayudan a entender una solución o producto. Deben existir, estar aprobadas y describirse como referencias. No se generan imágenes automáticamente ni se presentan ejemplos como un trabajo real del cliente.

## Configuración de Raylab

La fuente activa es `config/empresa.json`: identidad, información aprobada, orientación y recursos. No contiene credenciales. `config/catalogo.json` solo describe el contenido de las cinco fichas PDF comerciales existentes; no es una base de conocimiento para todos los negocios.

Después de editar `config/empresa.json`, ejecuta desde la raíz:

```powershell
node agents/whatsapp-api/scripts/node/configurar-empresa.mjs
node --test agents/whatsapp-api/tests/worker.test.mjs
```

El primer comando valida y embebe la configuración en `src/worker.mjs`. Copia TODO ese Worker a Cloudflare → raylio-whatsapp-agent → Edit code → Latest → Deploy. Es autocontenido: no hace falta subir JSON ni módulos al editor.

Para adjuntos, agrega una variable normal de PRODUCCIÓN `YCLOUD_MEDIA_ENABLED=true` y despliega. `YCLOUD_DOCUMENTS_ENABLED=true` sigue permitiendo solo documentos por compatibilidad. Los adjuntos deben estar publicados y descargarse por HTTPS antes de activarlos. Para los PDF existentes, primero publica el ZIP de Pages según DOCUMENTOS.md. No hace falta regenerar los PDF ni el ZIP por este cambio de código del agente.

También se admite `BUSINESS_CONFIG_JSON` como variable normal con la misma estructura completa. Si existe, prevalece sobre la configuración embebida; una variable inválida bloquea la respuesta en lugar de usar otra empresa por accidente. Es una alternativa avanzada: usar el archivo y el generador evita repartir la configuración en varios sitios. No colocar claves ni información privada en esa variable.

## Otro negocio

Usar una instalación independiente por negocio: otro Worker, otra D1, su número conectado, sus credenciales y su endpoint de YCloud. No basta con copiar `config/empresa.json` sobre el Worker productivo de Raylab, porque cambiaría la identidad del agente de Raylab. Esta entrega no incluye una plataforma compartida con panel de múltiples empresas.

1. Copia `config/empresa-restaurante.ejemplo.json` a un archivo propio del negocio. Es una plantilla, con recursos desactivados y enlaces que NO son archivos reales.
2. Reemplaza nombre, conocimiento, condiciones, horarios y recursos con datos aprobados del dueño. Si aún no se conoce un precio o disponibilidad, dejarlo explícito en la información del negocio.
3. Sube los archivos comerciales a un hosting HTTPS del negocio. Reemplaza las URLs y comprueba descarga, formato, tamaño y permisos. Solo publica recursos comerciales: no facturas personales ni información confidencial.
4. Activa los recursos reales con `enabled=true`.
5. Genera un Worker separado sin sobrescribir Raylab:

```powershell
node agents/whatsapp-api/scripts/node/configurar-empresa.mjs ruta/empresa-cliente.json ruta/worker-cliente.mjs
```

6. En el Worker nuevo configura su propia D1 con schema.sql, binding INBOX, binding AI, número, WABA y secretos del canal de ese negocio. Sigue las reglas de firma y coexistencia documentadas en YCLOUD.md. Usa su propio webhook, no el de Raylab.
7. Prueba desde otro número: consultas, catálogo, fotos, pausa y límites. Activa YCLOUD_MEDIA_ENABLED solo cuando esos recursos ya estén disponibles.

No cobra, agenda ni confirma stock/pedidos/reservas automáticamente. Eso requiere integrar el sistema de cada negocio y validar el resultado. La misma lógica no supone que todos los rubros compartan esas operaciones.

## Recursos

Cada recurso tiene `id`, `title`, `type`, `url`, `keywords`, `enabled` y `reference`. Los documentos requieren además `filename`.

| type | Formatos habilitados por esta implementación | Uso |
|---|---|---|
| document | PDF, TXT, DOC/DOCX, XLS/XLSX, PPT/PPTX | Cartas, catálogos, fichas y guías aprobadas |
| image | JPG/JPEG, PNG | Productos, local o referencias |
| video | MP4, 3GP | Recorridos y demostraciones |
| audio | MP3, M4A, AAC, AMR, OGG | Audios pregrabados, no voz generada |

No significa cualquier extensión o tamaño: verificar las restricciones vigentes de WhatsApp y los códecs. OGG requiere un códec compatible. La extensión no garantiza que el contenido o tamaño sean correctos; la revisión de descarga/formato es operativa y el proveedor puede rechazar un archivo. Esta implementación no descarga archivos para inspeccionarlos ni genera audio nuevo. Ver ejemplos oficiales: https://nndocs.ycloud.com/reference/whatsapp-messaging-examples.

El selector acepta una solicitud de archivo o una petición como «Pásame la carta», filtra el tipo pedido y busca palabras clave de los recursos activos de ESA empresa. Si falta el tema, usa el contexto reciente de ese mismo cliente. Si hay empate o falta un recurso compatible, responde con texto para aclarar. No envía varios archivos por una sola consulta ni descarga URLs que indique el visitante. El modelo no elige la URL ni tiene acceso al disco.

Un recurso con `reference=true` se etiqueta «Referencia ilustrativa, no un diseño personalizado». Si piden un diseño personalizado, solo se puede enviar una referencia ya existente si también solicitan un ejemplo o referencia y coincide un recurso. No se confirma haber creado un diseño.

## Comprobación y límites

39 pruebas locales aprobadas, con SQLite real en memoria y proveedor/IA simulados. Cubren los cuatro tipos de envío, campos específicos (el audio no lleva caption), configuración independiente, rechazo de formatos inválidos, selección, no sustitución de diseños personalizados, deduplicación, límites, pausa y aislamiento de contexto. Falta la comprobación real en Cloudflare/YCloud después de publicar.

El resultado accepted es aceptación del proveedor, no confirmación de entrega. Mantiene la pausa manual por conversación, los límites existentes y la ventana de atención. No hay aún cola durable, panel para el dueño, lector de adjuntos entrantes, generación personalizada ni CRM. Las conversaciones y recursos no deben mezclarse entre empresas. La memoria sigue siendo limitada y los datos aprobados se actualizan manualmente.
