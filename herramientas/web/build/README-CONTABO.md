# Raylab · Despliegue en Contabo Ubuntu 24.04 con Caddy y Docker Compose

Dominio: **https://raylabdigital.com** y **https://www.raylabdigital.com**.

## 1. Qué contiene y qué necesita

```text
raylab-produccion/
  web/
    index.html
    404.html
    servicios/
    comercial/
    legal/
    css/
    js/
    img/
    fonts/
    documentos/
  README-DESPLIEGUE.md
  Caddyfile.propuesto
  VERIFICACION.json
  MANIFIESTO-SHA256.txt
```

La revisión del código confirmó una web HTML, CSS y JavaScript sin React, Vite, rutas de SPA ni compilación pendiente. Se conservaron los nombres originales de los directorios de recursos: moverlos a `assets/` aportaría otra migración de rutas sin necesidad. Las imágenes ya usan WebP/JPEG/SVG y las fuentes WOFF locales. El ZIP se comprime sin modificar sus contenidos.

No se necesitan Node, npm, PHP ni una base de datos para servir la web. El agente de WhatsApp es otro servicio, basado en Cloudflare Workers, Workers AI y D1; no está incluido ni se puede ejecutar como un archivo estático en Caddy. Sus credenciales y su despliegue son independientes.

Los formularios de contacto y cotización usan `wa.me`: preparan un mensaje para que el visitante lo revise y confirme en WhatsApp. No usan un endpoint de este VPS. El correo utiliza `mailto:` y el tema visual se recuerda en el navegador. El editor local de desarrollo no forma parte de la web pública que ya se venía entregando y se mantiene fuera del ZIP.

## 2. Compatibilidad con tu Caddy existente

La configuración que proporcionaste es correcta para las páginas y recursos actuales:

```caddyfile
raylabdigital.com, www.raylabdigital.com {
    root * /srv
    encode zstd gzip
    file_server
}
```

`/srv/raylab/web/` en el VPS se monta en `/srv` del contenedor. Por eso **root debe seguir siendo /srv**, no `/srv/raylab/web` dentro de Caddy. No hay que modificar Compose ni recrear certificados. No hace falta `try_files /index.html`: esa regla convertiría rutas inexistentes en una respuesta incorrecta de página principal.

Los archivos de Cloudflare `_headers` y `_redirects` no se incluyen porque Caddy no los interpreta. Sus cabeceras no son necesarias para ejecutar el frontend. **Caddyfile.propuesto solo agrega las 11 redirecciones de compatibilidad de las direcciones antiguas**. No cambia dominios, root, compresión, certificados ni puertos. Las direcciones nuevas funcionan sin esa propuesta; si necesitas conservar enlaces antiguos como `/cotizacion.html?service=odoo`, integra las redirecciones siguiendo la sección 7. No se instala ni configura Nginx.

## 3. Subir con Termius SFTP y extraer de forma segura

En Termius SFTP, sube **raylab-produccion.zip** a **/srv/raylab/raylab-produccion.zip**. No lo subas a la carpeta pública `web/`.

En la terminal SSH del VPS, abre una sesión de administrador si tu usuario no lo es:

```bash
sudo -i
```

Ejecuta estos pasos en la misma sesión Bash para mantener las variables. No se ejecutan automáticamente desde el ZIP:

```bash
set -euo pipefail
cd /srv/raylab
command -v python3
command -v docker
test -f /srv/raylab/raylab-produccion.zip
test -f /srv/raylab/Caddyfile
test -d /srv/raylab/web
test ! -L /srv/raylab/web
test "$(realpath /srv/raylab/web)" = /srv/raylab/web
test -f /srv/raylab/web/index.html

TEMPORAL=$(mktemp -d /srv/raylab/despliegue.XXXXXXXX)
export TEMPORAL
python3 - <<'PY'
import os, stat
from pathlib import Path, PurePosixPath
from zipfile import ZipFile

destino = Path(os.environ['TEMPORAL']).resolve()
with ZipFile('/srv/raylab/raylab-produccion.zip') as archivo:
    vistos = set()
    for entrada in archivo.infolist():
        ruta = PurePosixPath(entrada.filename)
        if (ruta.is_absolute() or '..' in ruta.parts or '\\' in entrada.filename
                or not ruta.parts or ruta.parts[0] != 'raylab-produccion'
                or stat.S_ISLNK(entrada.external_attr >> 16)
                or entrada.filename in vistos):
            raise SystemExit('ZIP rechazado: ruta, duplicado o enlace no permitido')
        vistos.add(entrada.filename)
        if not (destino / entrada.filename).resolve().is_relative_to(destino):
            raise SystemExit('ZIP rechazado: ruta fuera de la carpeta temporal')
    if archivo.testzip() is not None:
        raise SystemExit('ZIP dañado')
    archivo.extractall(destino)
print(destino / 'raylab-produccion')
PY

PAQUETE="$TEMPORAL/raylab-produccion"
test -f "$PAQUETE/web/index.html"
cd "$PAQUETE"
sha256sum --check MANIFIESTO-SHA256.txt
find "$PAQUETE/web" -maxdepth 2 -type f | sort
sed -n '1,100p' "$PAQUETE/VERIFICACION.json"
cd /srv/raylab
```

Python se utiliza únicamente para extraer y verificar el ZIP, no para ejecutar la página. Si `command -v python3` falla, detente y utiliza una herramienta de extracción disponible que verifique rutas; no continúes con la copia sin revisar el contenido.

Comprueba que solo se publicará `PAQUETE/web/`. El README, el manifiesto y la propuesta de Caddy quedan fuera de la web pública.

## 4. Revisar Docker sin modificarlo

```bash
cd /srv/raylab
docker compose ps
docker compose config --services
read -r -p 'Nombre del servicio de Caddy mostrado arriba: ' SERVICIO_CADDY
test -n "$SERVICIO_CADDY"
ID_CADDY=$(docker compose ps -q "$SERVICIO_CADDY")
test -n "$ID_CADDY"
docker inspect "$ID_CADDY" --format '{{range .Mounts}}{{printf "%s -> %s\n" .Source .Destination}}{{end}}'
```

Antes de seguir, confirma que aparece **/srv/raylab/web -> /srv**. No publiques en `/srv` del host: esa ruta pertenece al interior del contenedor. No cambies los volúmenes de certificados o datos de Caddy.

## 5. Respaldo de la versión actual

```bash
RESPALDO="/srv/raylab/respaldos/$(date -u +%Y%m%dT%H%M%SZ)-$$"
mkdir -p "$RESPALDO"
tar -C /srv/raylab/web -cpf "$RESPALDO/web.tar" .
cp -a /srv/raylab/Caddyfile "$RESPALDO/Caddyfile"
tar -tf "$RESPALDO/web.tar" > "$RESPALDO/contenido-web.txt"
(cd "$RESPALDO" && sha256sum web.tar > web.tar.sha256)
test -s "$RESPALDO/web.tar"
printf '%s\n' "$RESPALDO" > /srv/raylab/ultimo-respaldo-raylab.txt
printf 'Respaldo: %s\n' "$RESPALDO"
```

## 6. Copiar la nueva versión conservando el montaje de Docker

Este paso aparta el contenido anterior y copia la versión nueva. Puede haber un intervalo breve durante la copia; elige un momento de poco tráfico. **No se borra, renombra ni reemplaza el directorio /srv/raylab/web**: se conserva la carpeta que Docker ya tiene montada.

```bash
test -f "$PAQUETE/web/index.html"
test -s "$RESPALDO/web.tar"
test ! -L /srv/raylab/web
test "$(realpath /srv/raylab/web)" = /srv/raylab/web
mkdir "$RESPALDO/web-anterior"
find /srv/raylab/web -mindepth 1 -maxdepth 1 -exec mv --target-directory="$RESPALDO/web-anterior" -- {} +
cp -a "$PAQUETE/web/." /srv/raylab/web/
find /srv/raylab/web -type d -exec chmod 0755 {} +
find /srv/raylab/web -type f -exec chmod 0644 {} +
test -f /srv/raylab/web/index.html
sha256sum "$PAQUETE/web/index.html" /srv/raylab/web/index.html
```

Los dos hashes deben coincidir. No uses permisos 777. Al cambiar solo archivos estáticos no hace falta reiniciar Docker ni Caddy. El montaje del directorio sigue apuntando al mismo lugar.

## 7. Solo si vas a integrar las redirecciones antiguas

La web actual funciona con tu configuración proporcionada. Este apartado conserva las direcciones antiguas que Cloudflare redirigía; no es un paso para reinstalar o reemplazar tu servicio.

```bash
diff -u /srv/raylab/Caddyfile "$PAQUETE/Caddyfile.propuesto" || true
```

Revisa la diferencia. Si tu archivo contiene otros dominios o ajustes, **conserva todo eso** y agrega únicamente las líneas `redir` al bloque de Raylab. Puedes editarlo en sitio con:

```bash
nano /srv/raylab/Caddyfile
```

No uses un reemplazo con `mv`: si el archivo Caddyfile también es un bind mount, cambiar su inode puede dejar al contenedor viendo otro archivo. Mantén el archivo existente y revisa los montajes mostrados en la sección 4.

Anota la ruta del Caddyfile **dentro del contenedor** que muestran esos montajes. No inventamos esa ruta ni el nombre del servicio:

```bash
read -r -p 'Ruta de Caddyfile dentro del contenedor: ' CONFIG_CADDY
test -n "$CONFIG_CADDY"
docker compose exec -T "$SERVICIO_CADDY" caddy validate --config "$CONFIG_CADDY" --adapter caddyfile
```

Solo si la validación termina correctamente:

```bash
docker compose exec -T "$SERVICIO_CADDY" caddy reload --config "$CONFIG_CADDY" --adapter caddyfile
```

No se usa `systemctl reload caddy`: tu Caddy está dentro de Docker. Si la validación falla, no recargues y restaura el archivo en sitio con `cat "$RESPALDO/Caddyfile" > /srv/raylab/Caddyfile`.

## 8. Verificar la web y HTTPS

No uses `-k`: queremos que curl valide el certificado TLS que ya funciona.

```bash
curl -fsSI https://raylabdigital.com/
curl -fsSI https://www.raylabdigital.com/
curl -fsSI https://raylabdigital.com/servicios/servicio-web.html
curl -fsSI 'https://raylabdigital.com/comercial/cotizacion.html?service=odoo'
curl -fsSI https://raylabdigital.com/comercial/catalogo.html
curl -fsSI https://raylabdigital.com/documentos/raylab-catalogo.pdf
curl -fsSI https://raylabdigital.com/legal/privacidad.html
curl -fsSI https://raylabdigital.com/fonts/dm-sans.woff
curl -sS -o /dev/null -w '%{http_code}\n' https://raylabdigital.com/ruta-inexistente-de-comprobacion
curl -fsS 'https://raylabdigital.com/?verificacion=produccion' -o "$TEMPORAL/index-servido.html"
sha256sum "$PAQUETE/web/index.html" "$TEMPORAL/index-servido.html"
docker compose logs --tail=80 "$SERVICIO_CADDY"
```

Las páginas existentes deben devolver 200 y la ruta inexistente 404. Los hashes del index servido y del paquete deben coincidir. Si hay un proxy/CDN con transformaciones delante del VPS, revisa su caché si no coinciden.

Si integraste las redirecciones, comprueba además:

```bash
curl -sSI 'https://raylabdigital.com/cotizacion.html?service=odoo'
```

Debe devolver 301 hacia `/comercial/cotizacion.html?service=odoo`. Sin las reglas propuestas, esa dirección antigua no existe; la dirección nueva sí funciona.

Abre la web en un navegador y revisa móvil/escritorio, menús, tema, animaciones, imágenes, fuentes y catálogo. Completa el formulario con datos ficticios para confirmar que prepara el mensaje de WhatsApp; no es necesario enviarlo. Revisa consola y red. Eso no se ha probado en tu VPS desde este entorno.

## 9. Recuperar la versión anterior

En una nueva sesión SSH como administrador:

```bash
set -euo pipefail
cd /srv/raylab
RESPALDO=$(cat /srv/raylab/ultimo-respaldo-raylab.txt)
case "$RESPALDO" in /srv/raylab/respaldos/*) ;; *) echo 'Ruta de respaldo no válida'; exit 1;; esac
test -d "$RESPALDO"
test -f "$RESPALDO/web.tar"
(cd "$RESPALDO" && sha256sum --check web.tar.sha256)
test ! -L /srv/raylab/web
test "$(realpath /srv/raylab/web)" = /srv/raylab/web
FALLIDA="$RESPALDO/web-fallida-$(date -u +%Y%m%dT%H%M%SZ)-$$"
mkdir "$FALLIDA"
find /srv/raylab/web -mindepth 1 -maxdepth 1 -exec mv --target-directory="$FALLIDA" -- {} +
tar -C /srv/raylab/web -xpf "$RESPALDO/web.tar"
test -f /srv/raylab/web/index.html
curl -fsSI https://raylabdigital.com/
```

Si también cambiaste Caddyfile, restaura su contenido en el mismo archivo:

```bash
cat "$RESPALDO/Caddyfile" > /srv/raylab/Caddyfile
docker compose config --services
read -r -p 'Nombre del servicio de Caddy: ' SERVICIO_CADDY
read -r -p 'Ruta de Caddyfile dentro del contenedor: ' CONFIG_CADDY
docker compose exec -T "$SERVICIO_CADDY" caddy validate --config "$CONFIG_CADDY" --adapter caddyfile
```

Solo si la validación termina correctamente:

```bash
docker compose exec -T "$SERVICIO_CADDY" caddy reload --config "$CONFIG_CADDY" --adapter caddyfile
```

No borres el respaldo ni la versión apartada hasta terminar las comprobaciones. El paquete no cambia tu DNS, certificados, Compose ni configuración activa por su cuenta.

## 10. Pruebas realizadas y pendientes

- Se identificó frontend estático: no hay build React/Vite ni dependencias de servidor para la web.
- Se comprobaron {{FILES}} archivos públicos, {{PAGES}} páginas HTML y {{REFS}} referencias locales sobre el contenido exacto del paquete.
- Se revisaron las rutas de CSS, imágenes y fuentes y se ejecutó comprobación de sintaxis de {{JS}} scripts JavaScript.
- Pasaron las pruebas de las siete fichas, preguntas y validación de cotización, codificación de WhatsApp y controlador de formulario con DOM simulado.
- Se preservaron los bytes de los recursos públicos del proyecto; no se cambiaron diseño, animaciones, textos ni PDF.
- Se verificaron los hashes, ausencia de archivos privados según el manifiesto público y la integridad del ZIP.
- Se comprobó la sintaxis de los bloques Bash de esta guía y del código Python de extracción, sin ejecutar los comandos de despliegue.
- No se ejecutaron pruebas visuales de navegador: se mantiene la restricción previa de no iniciar Chrome automatizado por las alertas del antivirus.
- No se accedió al VPS, no se comprobó el HTTPS remoto y no se validó el Caddyfile con tu binario: estos pasos están descritos arriba.
- El catálogo original conserva un enlace y texto al dominio anterior `raylabsolucionesdigitales.pages.dev`, también usado al generar el PDF. Se dejó intacto para respetar tu contenido original. Conviene actualizar ese dato en una revisión de contenido posterior, sin confundirlo con un requisito para servir la web.

Fuentes técnicas: [archivos estáticos en Caddy](https://caddyserver.com/docs/caddyfile/directives/file_server), [redirecciones](https://caddyserver.com/docs/caddyfile/directives/redir) y [bind mounts de Docker](https://docs.docker.com/engine/storage/bind-mounts/).
