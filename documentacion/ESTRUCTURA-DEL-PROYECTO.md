# Mapa del proyecto de Raylab

## 1. Web — `web/`

```text
web/dist/
  index.html            Página principal
  servicios/            Siete fichas de servicios
  comercial/            Catálogo y cotización
  legal/                Privacidad y eliminación de datos
  editor/               Editor local de servicios
  css/                  Estilos
  js/                   Comportamiento y datos
  img/                  Recursos visuales
  fonts/                Fuentes
  documentos/           PDF públicos
  _headers              Cabeceras de Cloudflare
  _redirects            Compatibilidad de direcciones
```

## 2. Agente — `agentes/whatsapp-api/`

- `src/worker.mjs`: código del Worker.
- `config/empresa.json`: información y recursos del negocio.
- `docs/`: instrucciones, conexiones y documentación del agente.
- `database/`: esquemas y migraciones.
- `scripts/`: configuración y utilidades del agente.
- `tests/`: pruebas locales.
- `wrangler.jsonc`: configuración de despliegue.

El nombre comercial configurado es **Raylab Soluciones Digitales**. Los identificadores técnicos históricos se conservan para no romper instalaciones existentes.

## 3. Marca — `marca/`

Recursos originales de identidad visual. Las versiones optimizadas que usa la web están en `web/dist/img/`.

## 4. Documentación — `documentacion/`

Mapa del proyecto, manual de Raylab, temas de la web y referencias de seguridad y GitHub. Algunos manuales reflejan etapas anteriores; no certifican el despliegue actual.

## 5. Herramientas — `herramientas/`

- `web/generators/`: catálogo y fichas de servicios.
- `web/assets/`: optimización de marca y fuentes.
- `web/tests/`: comprobaciones de la web y de cotización.
- `web/build/`: empaquetado para hosting.
- `docs/`: generación de documentos.

## 6. Entregas — `entregas/`

- `raylab/raylab-web-hosting.zip`: ZIP actual de Cloudflare Pages.
- `raylab/catalogo/raylab-catalogo.pdf`: catálogo para compartir.
- Capturas y archivos JSON: evidencias de comprobaciones.

Para generar el ZIP: `python herramientas/web/build/package-hosting.py` desde la raíz. El agente se despliega por separado en Cloudflare Workers.

## Archivos antiguos

El material que ya no participa en el proyecto activo está en `archivo/`. La carpeta se oculta en el explorador de VS Code, pero se conserva en disco. No se borró el agente ni se archivó su versión activa: está visible en `agentes/`.

Las cachés también se ocultan mediante `.vscode/settings.json`. No se requiere un espacio de trabajo alternativo.
