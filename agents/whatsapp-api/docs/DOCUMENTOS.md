# Asesoría y documentos de Raylab

Actualización: la configuración activa de identidad, conocimiento y recursos ahora es `config/empresa.json`; se genera el Worker con `scripts/node/configurar-empresa.mjs`. `scripts/python/generar-catalogo.py` solo genera las fichas PDF y ya no modifica el Worker. Para multimedia y otros negocios, prevalecen las instrucciones de [NEGOCIOS-Y-ARCHIVOS.md](./NEGOCIOS-Y-ARCHIVOS.md). El catálogo general no sustituye una propuesta visual personalizada.

Implementación local del 29 de octubre de 2026. Falta desplegar en Pages y en el Worker. No cambia las credenciales ni necesita otra migración D1.

## Activación en orden

1. Sube `output/raylab/raylab-web-hosting.zip` a PRODUCCIÓN del proyecto Pages **rayliotechsolutions**. Incluye la web y cinco fichas comerciales públicas.
2. Abre https://rayliotechsolutions.pages.dev/documentos/raylio-servicios.pdf y confirma que descarga el PDF. Verifica también `raylab-odoo.pdf`, `raylab-webs.pdf`, `raylab-sistemas.pdf` y `raylab-microapps.pdf` en la misma carpeta.
3. Copia todo `agents/whatsapp-api/src/worker.mjs` en **raylio-whatsapp-agent → Edit code → Latest → Deploy**.
4. Agrega una variable normal de PRODUCCIÓN `YCLOUD_DOCUMENTS_ENABLED` con valor `true` y despliega. Conserva las variables, AI e INBOX existentes y `YCLOUD_AUDIENCE=all`.
5. Desde otro WhatsApp escribe «Envíame el PDF de Odoo». Debe llegar un documento, no solo texto. Luego prueba «Necesito una web para mi restaurante» y «Pásame el PDF»: usa el contexto reciente de ese cliente. Espera al menos los 10 segundos del cooldown entre mensajes si conservas ese valor.

Para desactivar solo los adjuntos, cambia `YCLOUD_DOCUMENTS_ENABLED=false`. Las respuestas de texto continúan según la configuración existente.

## Qué hace

El asesor responde sobre los servicios reales, recomienda según la necesidad y pide un dato útil por vez. La selección de documentos es determinista: el modelo no decide URLs ni tiene acceso al disco. Solo se adjuntan fichas del catálogo cerrado cuando se menciona PDF, catálogo, ficha, folleto, brochure, archivo o documento. Usa el servicio indicado en la solicitud o, si falta, la última categoría mencionada por el cliente en su historial disponible. Una solicitud general obtiene el catálogo general. No mezcla clientes ni utiliza la respuesta de la IA para decidir la categoría.

El PDF se envía en un único mensaje YCloud de tipo `document` con URL pública, nombre y pie descriptivo, siguiendo https://nndocs.ycloud.com/reference/whatsapp-messaging-examples. Mantiene autenticación del webhook, pausa, cuotas, ventana de atención, restricción de prueba cuando corresponda y deduplicación del envío. El endpoint de prueba manual de Meta sigue enviando texto.

El estado `accepted` confirma aceptación de YCloud, no entrega. Si el proveedor rechaza la descarga, se guarda `rejected` y no se confirma éxito. Si la respuesta de red es incierta se guarda `unknown` y no se reenvía automáticamente. Revisa el error y prueba con un mensaje nuevo después de corregirlo; no borres los registros para forzar reenvíos.

## Editar la información

- `config/catalogo.json`: contenido comercial de las cinco fichas. Solo incluir información autorizada y pública, nunca secretos ni el manual interno.
- `scripts/python/generar-catalogo.py`: genera los cinco PDF y sincroniza el catálogo cerrado del Worker. Ejecuta `python agents/whatsapp-api/scripts/python/generar-catalogo.py` desde la raíz.
- Después ejecuta `python tools/web/package-hosting.py` y vuelve a desplegar los archivos afectados. Mantén los nombres conocidos; agregar otra categoría requiere actualizar selección, empaquetado y pruebas.
- `RAYLAB_PROMPT` en `src/worker.mjs`: información y reglas del asesor. Los textos del PDF y del prompt son fuentes distintas; revisar ambos si cambian los servicios. El generador solo sincroniza nombres de documentos, no entrena la IA.

## Alcance real y comprobación

35 pruebas locales aprobadas con SQLite real en memoria y transporte/IA simulados. Incluyen selección, contexto, bloqueo de documentos privados o cotizaciones automáticas, envío real de payload `document`, BSUID, deduplicación, pausa, cuotas y rechazo del proveedor. Los cinco PDF se verificaron como documentos de una página. Esto no sustituye comprobar la entrega real después de publicar.

No genera cotizaciones, facturas, contratos ni PDF personalizados. Precios y plazos siguen por evaluación. No lee archivos, imágenes ni audios entrantes, no agenda ni cobra, ni notifica automáticamente al equipo. Las instrucciones del modelo reducen respuestas inventadas pero no garantizan que nunca ocurran. La memoria sigue limitada a tres intercambios aceptados de las últimas 24 horas, no es un CRM. Las solicitudes que requieren evaluación o documentos específicos se deben atender por el equipo, usando la pausa por conversación. Sigue pendiente la cola durable y recuperación de trabajos descrita en MULTICLIENTE.md.
