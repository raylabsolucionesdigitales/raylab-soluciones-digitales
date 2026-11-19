# Raylab Soluciones Digitales

Proyecto de la agencia: página web, agente de WhatsApp, identidad visual, herramientas y entregas. Abre esta carpeta directamente en VS Code.

| Carpeta | Qué contiene |
| --- | --- |
| **web/** | Sitio de Raylab. Abre `dist/index.html`. |
| **agentes/** | Agente de WhatsApp: `whatsapp-api/`. |
| **marca/** | Logo original y recursos de identidad. |
| **documentacion/** | Mapa del proyecto, manuales y referencias. |
| **herramientas/** | Generadores, optimización, pruebas y empaquetado. |
| **entregas/** | ZIP para Cloudflare, catálogo PDF y evidencias. |

## Archivos principales

- [Página web](web/dist/index.html)
- [Formulario de cotización](web/dist/comercial/cotizacion.html)
- [Catálogo](web/dist/comercial/catalogo.html)
- [Código del agente](agentes/whatsapp-api/src/worker.mjs)
- [Configuración del agente](agentes/whatsapp-api/config/empresa.json)
- [Manual del agente](agentes/whatsapp-api/README.md)
- [Mapa de carpetas](documentacion/ESTRUCTURA-DEL-PROYECTO.md)

## Preparar la web para Cloudflare Pages

Ejecuta desde la raíz:

```powershell
python herramientas/web/build/package-hosting.py
```

Entrega: `entregas/raylab/raylab-web-hosting.zip`. Incluye solamente la web pública. El agente se publica por separado en Cloudflare Workers: no se incluye en ese ZIP.

## Comprobar el proyecto sin abrir un navegador

```powershell
python herramientas/web/tests/check-project-layout.py
python herramientas/web/tests/check-service-guides.py
node herramientas/web/tests/check-quotation.cjs
node herramientas/web/tests/check-quotation-ui.cjs
node --test agentes/whatsapp-api/tests/brand.test.mjs agentes/whatsapp-api/tests/worker.test.mjs
```

Estas pruebas no envían mensajes reales. Los scripts visuales con Selenium se conservan separados y no se ejecutan automáticamente.

## Lo archivado

Para actualizar el VPS desde GitHub, sigue [Desplegar desde GitHub](documentacion/DESPLEGAR-DESDE-GITHUB.md). El publicador conserva la carpeta montada y no modifica Caddy ni Compose.

`archivo/` conserva experimentos, Browser Use, copias antiguas y diseños descartados. `entregas/archivo/` conserva scripts históricos y metadatos. Ambos quedan fuera del trabajo diario y del ZIP público. **El agente actual está en agentes/, no en el archivo.**

Los secretos se mantienen fuera de Git y nunca se incorporan a la web pública. Reorganizar los archivos locales no publica cambios en Cloudflare.
