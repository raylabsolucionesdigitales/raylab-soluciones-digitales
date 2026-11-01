# Raylab Soluciones Digitales

Web de la agencia, identidad visual y agente de WhatsApp.

Para guardar el proyecto en GitHub, sigue [estos pasos](docs/GITHUB.md). El repositorio general está en esta carpeta raíz.

| Carpeta | Contenido |
| --- | --- |
| `sites/raylab/dist/` | Web, estilos, animaciones, documentos públicos y editor local. |
| `agents/whatsapp-api/` | Agente, configuración comercial, catálogos, migraciones y pruebas. |
| `branding/` | Logo original en alta resolución para redes y otras piezas. |
| `docs/` | Manual, temas de la web y revisión de seguridad. |
| `tools/web/` | Empaquetador, generador del logo completo y comprobación visual. |
| `output/raylab/` | ZIP actual de la web, listo para subir. |

Los nombres internos `raylab` se conservan para no romper rutas ni configuraciones. La marca actual es Raylab.

La web está agrupada por tipo de archivo:

```text
sites/raylab/dist/
  index.html, admin.html, privacidad.html, eliminacion-datos.html, 404.html
  css/          Estilos
  js/           JavaScript y datos de servicios
  img/          Logos e imágenes web
  documentos/   PDF públicos
  _headers      Cabeceras del hosting
```

Para cambiar servicios manualmente, edita `sites/raylab/dist/js/services-data.js`. Los estilos están en `css/`; las imágenes usadas por CSS se resuelven mediante `../img/`. El editor exporta el catálogo como `js/services-data.js`, listo para extraer dentro de `dist`.

## Abrir y editar

Abre [la web local](sites/raylab/dist/index.html). Parte del contenido se genera desde `services-data.js`, `reference.js` y `service-previews.js`; no todo está directamente en el HTML.

El [editor de servicios](sites/raylab/dist/admin.html) guarda borradores en tu navegador. Exporta un respaldo antes de borrar sus datos. Es un editor local, no un administrador remoto.

## Preparar y subir la web

Desde la raíz del proyecto:

```powershell
python tools/web/package-hosting.py
```

Sube [el ZIP](output/raylab/raylab-web-hosting.zip) a Cloudflare Pages o extrae su contenido en la carpeta pública de tu hosting. Incluye solo archivos públicos; excluye el editor y el agente. No subas el proyecto completo ni este ZIP al Worker.

## Agente de WhatsApp

También está ordenado por tipo: `src/` (código), `config/` (JSON), `database/` (SQL), `scripts/node/`, `scripts/python/`, `scripts/powershell/`, `tests/` y `docs/`. El archivo que copias a Cloudflare ahora es `agents/whatsapp-api/src/worker.mjs`. Los scripts PowerShell están en `agents/whatsapp-api/scripts/powershell/`.

Consulta [el backend](agents/whatsapp-api/README.md), [YCloud](agents/whatsapp-api/docs/YCLOUD.md), [el modo multicliente](agents/whatsapp-api/docs/MULTICLIENTE.md) y [las instrucciones comerciales](agents/whatsapp-api/docs/INSTRUCCIONES-AGENTE.md).

El agente se despliega por separado y utiliza Workers AI, D1 y R2 para archivos generados. Sus secretos se configuran en el servidor, nunca en la web pública. Los manuales históricos describen etapas anteriores; no certifican el estado actual del despliegue.

## Herramientas

- `tools/web/check-theme.py`: comprueba temas y tamaños con Selenium/Chrome; genera capturas en `output/pruebas-web/`.
- `tools/web/make-wordmark.py`: genera el logo completo desde `logo.svg`; requiere fontTools y Arial Bold de Windows.
- `node --test agents/whatsapp-api/tests/worker.test.mjs`: pruebas locales del agente.

Se conservan el historial `.git/` y `.openai/hosting.json`, referencia de la publicación antigua. No se incluyen en el ZIP público. Los cambios locales no se publican automáticamente.

Consulta [el manual](docs/RAYLAB-MANUAL.md), [el PDF histórico](docs/RAYLAB-MANUAL.pdf), [los temas](docs/TEMAS-WEB.md) y [la revisión de seguridad](docs/REVISION-SEGURIDAD.md).
