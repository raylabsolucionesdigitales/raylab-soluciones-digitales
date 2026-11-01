# Atencion multicliente de Raylab por YCloud

Fecha: 28/10/2026. Estado: el propietario confirmo recepcion y respuesta de IA desde el numero empresarial via YCloud para su remitente autorizado. Esta ampliacion multicliente esta preparada y probada LOCALMENTE, todavia no desplegada por el agente de programacion. El campo Pending del panel no se declara resuelto; que haya funcionado un envio demuestra esa prueba, no aprobacion general del negocio.

## Instalacion en orden

1. Cloudflare D1 → raylio-whatsapp-inbox → Console: ejecutar todo `database/migration-multicliente.sql`. Crea conversation_controls y ai_reservations e indices; no borra mensajes. El schema.sql completo tambien las incluye para instalaciones nuevas.
2. En Worker → Settings → Variables and secrets crear `AGENT_ADMIN_TOKEN` como Secret: clave aleatoria larga y distinta de AI_TEST_TOKEN, guardada privadamente. Permite pausar y reanudar chats; no compartirla con clientes ni incluirla en comandos.
3. Edit code → Latest: reemplazar worker.js con el worker.mjs local actualizado y Deploy. Mantener AI, INBOX y secretos de YCloud.
4. Agregar variable normal `YCLOUD_AUDIENCE` con valor exacto `all`, guardar y desplegar. Mantener `YCLOUD_REPLIES_ENABLED=true`. Sin all, el codigo sigue en modo de destinatario unico; Meta directo conserva su restriccion de prueba en ambos casos.
5. Probar desde dos numeros diferentes escribiendo al +51906962740. No agregar numeros de clientes a variables. Solo el numero empresarial y el WABA se configuran una vez.
6. Despues probar pausa, reanudacion, limites y memoria con las instrucciones de abajo. No afirmar funcionamiento remoto hasta observarlo.

## Limites predeterminados

| Variable opcional | Valor si no se configura | Significado |
| --- | --- | --- |
| YCLOUD_DAILY_REPLY_LIMIT | 200 | Nuevos intentos reservados en total por canal y dia UTC |
| YCLOUD_CUSTOMER_DAILY_LIMIT | 20 | Nuevos intentos reservados por cliente y dia UTC |
| YCLOUD_COOLDOWN_SECONDS | 10 | Separacion minima entre nuevas reservas del mismo cliente |

No hace falta crear estas tres variables para usar los valores predeterminados. Son limites internos ajustables, no los de Meta ni una promesa de cantidad de clientes. Una reserva consume cupo aunque luego falle o se pause el envio. Los reintentos de generacion del mismo mensaje pueden reutilizar su reserva; los limites no son un presupuesto monetario exacto. El reinicio diario es UTC, no medianoche de Peru. Cada entrada conserva maximo 2000 caracteres al modelo y maximo 300 tokens generados.

Al superar un limite o enviar mensajes seguidos durante el cooldown, el mensaje se guarda pero no genera respuesta ni se encola para despues. Marcador: `ycloud_usage_limit_or_cooldown`; estado saliente `limited`. El cliente puede enviar otro mensaje despues del intervalo o al reabrirse el cupo. No se envia un aviso automatico adicional para no crear bucles ni gastar mas envios. La recuperacion de trabajos y las alertas de gasto siguen pendientes.

## Memoria separada

El modelo recibe hasta tres pares de mensajes/respuestas anteriores aceptadas de LAS ULTIMAS 24 HORAS, del mismo remitente y del mismo numero empresarial de YCloud. Cada texto previo se recorta para acotar el contexto. Se excluyen respuestas rechazadas o inciertas y la consulta actual. Esto no borra registros de D1 ni sincroniza historiales del celular.

No es memoria ilimitada ni garantiza interpretacion perfecta. Las respuestas humanas enviadas desde el celular no se incorporan a esta memoria. No activar otros bots de YCloud sobre el mismo canal sin revisar duplicados.

## Pausa real de una conversacion

El cliente puede pedir un humano, asesor o hablar con una persona/Bruce. El webhook reconoce frases comunes, guarda `paused=1` y trata de enviar una confirmacion breve sin llamar a la IA. La pausa se aplica aunque no pueda enviarse esa confirmacion por limite o rechazo. No asigna un operador ni manda una notificacion interna: revisar la bandeja para atender la consulta.

Mientras el chat esta pausado los mensajes siguen llegando y guardandose, pero no reciben respuestas del bot. No se reanuda automaticamente; lo hace un operador. El equipo tambien puede pausar antes de contestar manualmente.

Desde la raiz del proyecto, reemplazar el numero del ejemplo por EL CLIENTE de la conversacion (pais y digitos, sin espacios):

```powershell
# Pausar antes de intervenir
powershell -NoProfile -ExecutionPolicy Bypass -File ./agents/whatsapp-api/scripts/powershell/control-chat.ps1 -Action pause -Customer 51953791221

# Ver si sigue pausado
powershell -NoProfile -ExecutionPolicy Bypass -File ./agents/whatsapp-api/scripts/powershell/control-chat.ps1 -Action status -Customer 51953791221

# Reanudar al terminar
powershell -NoProfile -ExecutionPolicy Bypass -File ./agents/whatsapp-api/scripts/powershell/control-chat.ps1 -Action resume -Customer 51953791221
```

La terminal pide AGENT_ADMIN_TOKEN oculto. No es el token de Meta, la API key de YCloud ni AI_TEST_TOKEN. La ruta POST `/conversation-control` requiere esa clave y no permite control desde peticiones publicas sin autenticar. `paused:true` confirma la pausa. Escribir pause/resume en el chat del cliente no es un comando administrativo.

NO se promete pausa automatica por responder desde WhatsApp Business. Los ecos de coexistencia de YCloud no se han validado para ese fin y siguen ignorados. La pausa puede impedir una respuesta que aun se este generando; no puede retirar un mensaje ya enviado o una peticion de envio que ya salio a la red. Pausar primero, comprobar el resultado y luego atender.

## Revision operativa

```sql
SELECT sender, paused, reason, updated_at
FROM conversation_controls
WHERE channel='ycloud:+51906962740';

SELECT state, COUNT(*) AS total
FROM outbound_replies
WHERE inbound_id LIKE 'ycloud:%'
GROUP BY state;
```

Para parar todos los envios: YCLOUD_REPLIES_ENABLED=false y Deploy. Para volver a prueba de un destinatario: YCLOUD_AUDIENCE=test y conservar WHATSAPP_TEST_RECIPIENT. No se requiere borrar conversaciones ni API keys para pausar.

## Pruebas y limites de esta entrega

29 pruebas locales pasan: las 22 anteriores y nuevas comprobaciones de dos clientes sin registro manual, limites concurrentes, cooldown, control autenticado, pausa persistente, pausa durante generacion, solicitud de humano y memoria aislada. Usan SQLite real en memoria y transporte/modelo simulados. No son una prueba de carga con 100 clientes ni una garantia de disponibilidad o seguridad absoluta.

Sigue pendiente una cola durable/recuperacion de trabajos. El procesamiento del webhook continua siendo sincrono; el proveedor puede reintentar por timeout. La reclamacion unica evita repetir el mismo intento, pero un estado generating/sending/unknown requiere revision manual. La pausa o limites no corrigen esas limitaciones de recuperacion. Revisar costos de Cloudflare/YCloud/Meta y retencion antes de una apertura comercial amplia.
# Compatibilidad de remitentes (29 de octubre de 2026)

El receptor admite teléfonos con o sin `+`. Cuando YCloud omite el teléfono y proporciona `fromUserId` o `fromParentUserId`, guarda el identificador como `bsuid:...` y responde mediante `recipient`, sin inventar un teléfono. Son formatos documentados en https://nndocs.ycloud.com/reference/webhook-updates-bsuid y https://nndocs.ycloud.com/reference/whatsapp_message-send-directly.

Los controles de pausa admiten ese mismo identificador. La memoria y los límites quedan separados por identificador; un teléfono y un BSUID no se fusionan automáticamente. No requiere otra migración porque `sender` ya es TEXT.

Un HTTP 400 en el registro de invocación confirma rechazo del payload, pero no identifica por sí solo el campo. El Worker actualizado registra motivos específicos (`ycloud_invalid_json`, `ycloud_invalid_message_id`, `ycloud_missing_message_type`, `ycloud_missing_or_invalid_sender`) sin registrar el contenido ni los secretos. Validación local: 32 pruebas aprobadas. Pendiente de confirmar el caso del socio después de copiar el Worker completo a Latest y desplegarlo.

