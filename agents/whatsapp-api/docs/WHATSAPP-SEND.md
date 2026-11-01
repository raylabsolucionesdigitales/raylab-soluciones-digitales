# Envio de prueba por WhatsApp

Estado actualizado al 27/10/2026: el propietario desplegó y confirmó envío manual recibido y respuesta automática directa en WhatsApp con el número de prueba, tras suscribir Raylab al WABA. El agente de programación no envió mensajes externos por su cuenta. Se conserva el número real en la app móvil. No hay memoria ni transferencia humana y no es una activación para clientes reales. Diagnóstico completo: [manual](../../../docs/RAYLAB-MANUAL.md).

1. D1 `raylio-whatsapp-inbox` → Console: ejecutar `database/schema.sql` completo. Es aditivo (`IF NOT EXISTS`), conserva mensajes y crea `outbound_replies`.
2. Worker → Settings → Variables and secrets: agregar `WHATSAPP_ACCESS_TOKEN` como Secret. Copiar privadamente el token de acceso de Meta → Paso 1 Probar (no App Secret, no AI_TEST_TOKEN). Los tokens temporales caducan; renovar si Meta devuelve 190.
3. Agregar `WHATSAPP_TEST_RECIPIENT` como variable: TU numero destinatario autorizado en Meta, con pais y solo digitos, sin + ni espacios. No es el numero emisor de Meta ni el numero empresarial que se incorporara despues.
4. Mantener `WHATSAPP_PHONE_NUMBER_ID` con el ID del numero emisor de prueba original. Mantener bindings AI e INBOX. Subir `src/worker.mjs` completo via Edit code → Latest → Deploy.
5. Agregar `WHATSAPP_REPLIES_ENABLED` como variable con valor `true` para habilitar envios solo al destinatario configurado. Para parar: cambiar a `false` y desplegar.
6. Desde TU WhatsApp escribir un mensaje al numero de prueba de Meta, antes del envio de texto libre (ventana de atencion de 24h). Debe ser el mismo destinatario autorizado. No migrar/eliminar la cuenta de WhatsApp Business.
7. Si llegan eventos entrantes reales, el webhook responde automaticamente solo a textos recientes del destinatario autorizado. Las muestras sinteticas antiguas no disparan respuestas. Si Meta indica que apps no publicadas solo reciben muestras, no esperar que el mensaje real llegue al webhook ni publicar precipitadamente.
8. Para probar el envio sin depender de recepcion real: `powershell -NoProfile -ExecutionPolicy Bypass -File ./agents/whatsapp-api/scripts/powershell/test-whatsapp.ps1`. El script solicita confirmar el mensaje previo, la clave AI_TEST_TOKEN oculta y una consulta. Genera una respuesta de IA y envia al destinatario fijo del servidor. No comunica al servidor un numero arbitrario.

`accepted_by_meta_not_delivery_confirmation` significa aceptacion de la API, no entrega al telefono. D1: `SELECT state, meta_message_id, updated_at FROM outbound_replies;`. Error 131030: verificar destinatario autorizado; 131047: revisar ventana de atencion; 190: token invalido/caducado. No copiar tokens al chat.

## Reintentos y limites

Una clave unica por mensaje entrante impide envios duplicados concurrentes. Fallos anteriores al envio pueden reintentarse por Meta; fallo de red durante envio queda `unknown` y no se reenvia automaticamente. Un proceso interrumpido puede quedar `generating` o `sending` y requiere revision manual: se prioriza no duplicar, no se promete entrega exactamente una vez. Una nueva ejecucion del script manual genera otra clave y ES otro envio: no repetirlo si el resultado fue ambiguo.

Una respuesta aceptada no se reintenta por fallos posteriores de entrega. Los rechazos quedan `rejected` para revision; no hay cola ni cron de reintentos. Conversaciones sin memoria, entrada limitada a 2000 caracteres y salida a 4000; modelos pueden equivocarse. No activar numero real hasta implementar limites comerciales, memoria, pausa humana y coexistencia.

Fuente: [API oficial de mensajes de Meta](https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api).
