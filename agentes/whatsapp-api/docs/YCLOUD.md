# YCloud: coexistencia con el numero empresarial

Actualizacion: el propietario YA confirmo un mensaje real guardado en D1 y respuestas recibidas desde el numero empresarial para su remitente autorizado. Para pasar a varios clientes ver [MULTICLIENTE.md](./MULTICLIENTE.md), con migracion, limites y pausa. Lo que sigue describe la configuracion inicial de prueba; las limitaciones de memoria/pausa se actualizan en esa guia y solo cambian al desplegar la ampliacion.

Estado 28/10/2026: propietario vinculo WhatsApp Business +51906962740 en coexistencia. YCloud muestra numero Connected y cuenta Pending; no se confirma habilitacion de envios. WABA mostrado: 1119501657673541. El propietario guardo YCLOUD_API_KEY como Secret en Cloudflare. El codigo local incorpora ahora el adaptador; NO esta desplegado ni probado con un evento real de YCloud por el agente de programacion.

## Configuracion

1. En el Worker existente mantener AI, INBOX y variables de Meta. Agregar variable `YCLOUD_WHATSAPP_NUMBER` = `+51906962740` y `YCLOUD_WABA_ID` = `1119501657673541`. No sustituir WHATSAPP_PHONE_NUMBER_ID por un telefono.
2. Copiar el nuevo worker.mjs completo a Edit code → Latest → worker.js → Deploy.
3. YCloud → Developers → Webhooks → Add endpoint. URL: `https://raylio-whatsapp-agent.rivasbruce563.workers.dev/ycloud-webhook`. Suscribirse a `whatsapp.inbound_message.received`. No hace falta recibir estados ni ecos para esta prueba. No usar la ruta `/webhook` de Meta.
4. Obtener el signing secret de ESE endpoint (no la API key). Guardarlo en Cloudflare como Secret `YCLOUD_WEBHOOK_SECRET`. Mantener firma habilitada en YCloud. Si no aparece, revisar los detalles del endpoint; la API oficial permite recuperarlo privadamente. Hasta configurar el secreto el Worker devuelve 503: no desactivar su verificacion para probar.
5. Con envios aun desactivados, enviar un texto desde OTRO numero al empresarial. Revisar D1 y Observability. Marcadores `ycloud_...`. La muestra de test del proveedor puede contener numeros ficticios y ser descartada intencionalmente.
6. Verificar `WHATSAPP_TEST_RECIPIENT`: numero del telefono desde el que se hara la consulta, solo digitos y pais, sin +. No debe ser el numero empresarial emisor. Se reutiliza la restriccion de pruebas anterior; no se responde a todos los clientes.
7. Agregar variable normal `YCLOUD_REPLIES_ENABLED` = `true`, guardar y desplegar. Es independiente de WHATSAPP_REPLIES_ENABLED (Meta). Para pausar YCloud usar `false`.
8. Enviar una pregunta nueva desde el destinatario autorizado al empresarial y revisar respuesta. Si el proveedor rechaza por Pending, no recrear el canal: informar su codigo a soporte. No puede prometerse aprobacion ni plazo por la captura.

## Codigo y seguridad

Firma `YCloud-Signature: t=...,s=...`, HMAC-SHA256 sobre timestamp + punto + cuerpo original. Tolerancia temporal de cinco minutos, cuerpo limitado a 256 KiB. Filtra telefono destino, WABA, grupos y eventos. Solamente `whatsapp.inbound_message.received` puede generar una consulta; no interpreta ecos ni estados como clientes.

Envios mediante `POST https://api.ycloud.com/v2/whatsapp/messages/sendDirectly`, X-API-Key y telefonos E.164. La reclamacion del intento se conserva en outbound_replies; id entrante con prefijo `ycloud:WABA:mensaje` para no mezclarlo con Meta. El campo phone_number_id en inbound_messages contiene `ycloud:+telefono` en esta ruta: es un identificador interno del canal, no un Phone Number ID de Meta.

No se necesitan tablas nuevas respecto a schema.sql actual. Mantener archivadas las filas de ambas integraciones; las consultas de eliminacion deben considerar ambos canales.

Limitaciones heredadas: sin memoria ni pausa humana por conversacion, sin cola/cron de recuperacion, procesamiento sincrono del webhook durante la respuesta de IA; el proveedor puede reintentar por timeout y la reclamacion evita duplicar el intento. Un trabajo interrumpido o un estado unknown requiere revision manual. Pendiente pasar a recepcion rapida con procesamiento durable antes de ampliar a clientes. La coexistencia por si sola NO implementa que el bot se calle cuando alguien responde desde el celular.

El script test-whatsapp.ps1 y /ai-test con envio siguen usando Meta: no usarlo para probar la ruta empresarial de YCloud. La prueba real de esta etapa consiste en escribir desde el otro telefono al numero conectado y observar el evento en /ycloud-webhook.

## Fuentes

- https://nndocs.ycloud.com/reference/configure-webhooks
- https://nndocs.ycloud.com/reference/webhook-events-payloads
- https://nndocs.ycloud.com/reference/whatsapp_message-send-directly

Las pruebas locales usan firmas generadas con un secreto ficticio y transporte simulado. No prueban elegibilidad, saldo, entrega real ni aprobacion de la cuenta.
