# Prueba privada de Workers AI

Estado al 27/10/2026: el propietario confirmó inferencia real con fp8 y después conversación automática de prueba en WhatsApp. `scripts/powershell/test-ai.ps1` usa `POST /ai-test` sin envío; `scripts/powershell/test-whatsapp.ps1` solicita explícitamente el envío al destinatario fijo. No hay memoria ni transferencia humana. Las pruebas locales usan un sustituto y no certifican la calidad comercial del modelo. El modelo sin sufijo se retiró y produjo error 5028; se corrigió con `@cf/meta/llama-3.1-8b-instruct-fp8`.

## Configurar en el panel

1. Worker `raylio-whatsapp-agent` → Settings → Bindings → Add binding → Workers AI. Nombre de variable: `AI`. Guardar y desplegar. No es una variable de texto.
2. En Variables and secrets, agregar `AI_TEST_TOKEN` como Secret: una cadena aleatoria larga, distinta del token de verificación de Meta. No compartirla por chat.
3. Edit code → versión Latest → reemplazar `worker.js` con todo `src/worker.mjs` → Deploy. Este archivo es autónomo; no subir el ZIP de la web.
4. Ejecutar desde la raíz del proyecto: `powershell -NoProfile -File agents/whatsapp-api/scripts/powershell/test-ai.ps1`. Introducir el secreto en el indicador oculto y una consulta ficticia. No colocar secretos en el comando.

Modelo: `@cf/meta/llama-3.1-8b-instruct-fp8`. Máximo 300 tokens de salida, entrada hasta 2000 caracteres. La ruta privada consume cuota de IA con cada solicitud autorizada; no es un chat público. Al finalizar las pruebas puede deshabilitarse eliminando `AI_TEST_TOKEN`.

Probar servicios, consulta de precios, integración Odoo, solicitud de humano e intento de obtener instrucciones internas. El modelo puede equivocarse: revisar sus respuestas antes de activar clientes reales. La inferencia real fue ejecutada y confirmada por el propietario desde su terminal, no desde las pruebas locales automatizadas.

## Después de validar

El envío por Graph API con token privado ya funciona en la prueba. Pendientes: recuperación durable de trabajos interrumpidos, memoria aislada por conversación, límites de uso y pausa humana. El número empresarial permanece en la aplicación móvil; no migrarlo ni eliminarlo para esta prueba.

La configuración local de D1 sigue pendiente de su ID real: no ejecutar `wrangler deploy` con `d1_databases: []`, pues no reproduce los bindings del panel. Usar la edición manual indicada arriba hasta sincronizar la configuración.

Fuentes: [binding oficial](https://developers.cloudflare.com/workers-ai/configuration/bindings/), [modelo](https://developers.cloudflare.com/workers-ai/models/llama-3.1-8b-instruct-fp8/).
