# Skills del agente de WhatsApp

Raylab utiliza cuatro procesos reutilizables. Son habilidades del **agente comercial**, no extensiones que debas instalar en VS Code o en Codex.

| Habilidad | Se activa para | Acción real disponible |
| --- | --- | --- |
| `informar-servicios` | Presentación, servicios, contacto y condiciones | Responder con información autorizada; no resolver problemas técnicos. |
| `compartir-documentos` | Catálogo o ficha solicitados | Seleccionar un recurso aprobado y enviarlo mediante YCloud si los adjuntos están habilitados. |
| `recoger-consulta` | Cotizar o explicar un proyecto | Preguntar brevemente, resumir lo compartido o indicar la guía de cotización; no crear tickets ni precios. |
| `atencion-humana` | Pedir asesor o persona | Explicar el contacto y respetar la pausa real del canal; no fingir notificaciones o asignaciones. |

## Archivos que mantener

- `skills/<nombre>/SKILL.md`: instrucciones y límites de cada proceso.
- `config/empresa.json`: nombre, información comercial, documentos y habilidades habilitadas.
- `src/worker.mjs`: runtime, selección de habilidades, herramientas y copia incorporada de las instrucciones.

La selección prioriza atención humana, documentos, consulta comercial y finalmente información general. Carga al modelo únicamente la habilidad correspondiente, junto a las reglas comunes y la información del negocio. Los intercambios previos solo se utilizan cuando el canal dispone de su historial existente.

El envío de documentos y la pausa de conversaciones siguen siendo acciones deterministas de la integración existente, no capacidades que un texto pueda inventar. Una respuesta del proveedor indica aceptación, no entrega ni lectura.

## Preparar cambios locales

Después de editar instrucciones o datos del negocio, ejecuta desde la raíz del proyecto:

```powershell
node agentes/whatsapp-api/scripts/node/configurar-empresa.mjs
node --test agentes/whatsapp-api/tests/brand.test.mjs agentes/whatsapp-api/tests/skills.test.mjs agentes/whatsapp-api/tests/worker.test.mjs
```

El primer comando incorpora skills y configuración al Worker, sin publicar ni leer secretos. Para reconstruir solo las instrucciones: `node agentes/whatsapp-api/scripts/node/construir-skills.mjs`.

El artefacto continúa siendo un solo archivo `src/worker.mjs`, compatible con la forma de despliegue existente. No necesita archivos Markdown en Cloudflare ni dependencias nuevas.

## Alcance actual de Raylab

La configuración de Raylab utiliza `mode: "informational"`. Ese modo bloquea la generación personalizada incluso si `CREATIVE_ENABLED` sigue activado en el servidor. Las rutinas antiguas se conservan para instalaciones que expresamente utilicen otro alcance; no se habilitan para Raylab. Los trabajos antiguos pendientes requieren revisión del administrador: este cambio no borra registros ni los vuelve a enviar.

El catálogo general apunta a `documentos/raylab-catalogo.pdf`. Hay fichas PDF de Odoo, web y microapps. Para los demás servicios se puede ofrecer el catálogo general; no se inventan fichas independientes. Antes de publicar el Worker, confirma que la versión actual del ZIP web está desplegada y que esas URL son accesibles públicamente.

La guía de cotización está en `/comercial/cotizacion.html`; abre un mensaje de WhatsApp y no envía por sí sola una cotización ni calcula importes.

## Configuración por negocio

Cada instalación mantiene su propio `id`, `name`, `knowledge`, `guidance`, `resources` y lista `skills`. La identidad y los documentos no se comparten entre negocios. No cambies el ID técnico de una instalación activa solo para renombrar su marca: podría separar sus registros históricos.

Si existe `BUSINESS_CONFIG_JSON` en Cloudflare, esa variable sustituye los datos incorporados: actualízala también con la configuración vigente o elimina el override si no lo necesitas. No copies secretos en el JSON comercial.

El envío requiere las credenciales y banderas ya existentes del canal. La atención humana no tiene una integración nueva de avisos; pausar el bot no asegura que una persona haya leído la solicitud. No hay un CRM ni registro de leads nuevo.

## Validación y publicación

Las pruebas usan respuestas y transporte simulados; no envían mensajes, no llaman a modelos reales ni modifican Cloudflare. La calidad de respuestas libres del modelo se debe revisar además en una conversación de prueba autorizada.

Los cambios locales todavía deben desplegarse en el Worker correspondiente. El ZIP de Cloudflare Pages no actualiza el agente.
