"""Package only Raylab's static website for an Ubuntu VPS running Caddy."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import runpy,json,hashlib,re

ROOT=Path(__file__).resolve().parents[3]
runpy.run_path(str(Path(__file__).with_name('package-hosting.py')),run_name='__main__')
destination=ROOT/'entregas/ubuntu-caddy-raylab'
public=destination/'public';configuration=destination/'caddy'
public.mkdir(parents=True,exist_ok=True);configuration.mkdir(parents=True,exist_ok=True)
manifest=[]
with ZipFile(ROOT/'entregas/raylab/raylab-web-hosting.zip') as archive:
 for entry in archive.infolist():
  if entry.filename in ['_headers','_redirects']:continue
  target=(public/entry.filename).resolve()
  assert target.is_relative_to(public.resolve()) and not entry.is_dir()
  content=archive.read(entry)
  target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(content)
  manifest.append({'path':entry.filename,'sha256':hashlib.sha256(content).hexdigest()})
assert {p.relative_to(public).as_posix() for p in public.rglob('*') if p.is_file()}=={item['path'] for item in manifest}
assert (public/'index.html').is_file()
assert not any('worker.mjs' in item['path'] or 'admin.html' in item['path'] for item in manifest)
header_lines=[]
for line in (ROOT/'web/dist/_headers').read_text(encoding='utf-8').splitlines():
 match=re.match(r'  ([A-Za-z-]+): (.+)',line)
 if match and match[1] not in ['Cache-Control','Strict-Transport-Security']:
  header_lines.append(f'        {match[1]} '+json.dumps(match[2]))
redirects=[]
for line in (ROOT/'web/dist/_redirects').read_text().splitlines():
 old,new,status=line.split();assert status=='301'
 redirects.append(f'    redir {old} {new}?{{query}} permanent')
config='''# Raylab: standalone HTTP example for testing by IP.
# Replace :80 with your real domain for a domain-based site.
# If Caddy already has a block for your domain, merge these directives into it.
# Do not replace the entire existing /etc/caddy/Caddyfile.
:80 {
    root * /var/www/raylab/public
    encode gzip

    header {
        -Server
        Cache-Control "no-cache"
'''+ '\n'.join(header_lines)+'''
    }

    # Preserve old URLs and service query parameters.
'''+ '\n'.join(redirects)+'''

    file_server

    handle_errors {
        @customError file /{err.status_code}.html
        handle @customError {
            rewrite * {file_match.relative}
            file_server
        }
        handle {
            respond "{err.status_code} {err.status_text}" {err.status_code}
        }
    }
}
'''
(configuration/'Caddyfile').write_text(config,encoding='utf-8')
guide='''# Raylab · Ubuntu con Caddy

## Qué subir

Sube **el contenido de public/** a la carpeta que Caddy sirve para tu web.
La configuración de ejemplo usa **/var/www/raylab/public/**; si tu sitio ya tiene otra ruta, puedes conservarla y ajustar `root`.

Debe quedar `/var/www/raylab/public/index.html`, sin otra carpeta `public` por dentro.

```text
public/
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
```

La web es estática. No requiere instalar Node, Python, PHP ni una base de datos en el VPS.
El agente de WhatsApp no está incluido.

## Configurar Caddy

`caddy/Caddyfile` es un ejemplo para este sitio, no un reemplazo de toda la configuración de tu VPS.

1. Sube los archivos de `public/` mediante SFTP, SSH o el panel que utilizas.
2. Revisa el archivo de configuración que Caddy realmente usa. En instalaciones de servicio suele ser `/etc/caddy/Caddyfile`; si utilizas Docker o un panel, puede ser otra ruta.
3. Si ya existe un bloque para tu dominio, conserva ese bloque y sus ajustes de HTTPS. Integra el `root`, las cabeceras, las redirecciones y `file_server` del ejemplo donde corresponda. No añadas un segundo bloque con el mismo dominio.
4. Para un sitio nuevo, sustituye `:80` por tu dominio real y añade el bloque a la configuración existente. `:80` solo sirve como ejemplo HTTP para comprobar por IP. No inventamos tu dominio.
5. Asegúrate de que el proceso de Caddy pueda leer los archivos y acceder a los directorios. No uses permisos 777.
6. Valida la configuración completa antes de recargarla.

En una instalación normal con systemd y la ruta habitual:

```bash
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
```

Solo si la validación termina correctamente:

```bash
sudo systemctl reload caddy
```

Si Caddy corre en Docker o lo administra un panel, usa su mecanismo de validación y recarga, conservando sus volúmenes y su ruta pública existente.

## Dominio y HTTPS

Con un dominio real y la conectividad necesaria, Caddy puede gestionar HTTPS automáticamente. El dominio debe apuntar al VPS y los puertos requeridos deben estar accesibles. No se configuró tu DNS ni se emitieron certificados desde este proyecto.

## Redirecciones y recursos

El Caddyfile conserva las 11 direcciones antiguas y los parámetros de consulta, por ejemplo el servicio preseleccionado de cotización. Incluye las cabeceras del sitio, compresión gzip y la página de error disponible.

No subas `_headers` ni `_redirects`: pertenecen a Cloudflare Pages y aquí ya se tradujeron a directivas de Caddy. No hay configuración de Nginx en esta entrega.

`caddy/`, `LEEME.md` y `manifest.json` no van dentro del directorio público.

## Comprobación final en tu VPS

Prueba la página principal, las siete fichas, el formulario con servicio seleccionado, el catálogo PDF y las páginas legales. Las rutas inexistentes deben responder como error 404, no como la página principal.

Se verificaron archivos, hashes y ZIP localmente. No se accedió a tu VPS; el binario de Caddy no está disponible en este entorno para validar su configuración. La validación definitiva corresponde a tu Caddy instalado.

Regenerar desde la raíz: `python herramientas/web/build/preparar-caddy.py`.

Referencias oficiales:
- https://caddyserver.com/docs/caddyfile/directives/file_server
- https://caddyserver.com/docs/caddyfile/directives/redir
- https://caddyserver.com/docs/caddyfile/directives/header
- https://caddyserver.com/docs/caddyfile/directives/handle_errors
- https://caddyserver.com/docs/automatic-https
'''
(destination/'LEEME.md').write_text(guide,encoding='utf-8')
(destination/'manifest.json').write_text(json.dumps({'server':'caddy','public_files':manifest,'redirects':len(redirects),'server_root':'/var/www/raylab/public','remote_deployment':False,'caddy_binary_validation':False},indent=2),encoding='utf-8')
zip_path=ROOT/'entregas/raylab-web-ubuntu-caddy.zip'
with ZipFile(zip_path,'w',ZIP_DEFLATED) as archive:
 for file in sorted(destination.rglob('*')):
  if file.is_file():archive.write(file,file.relative_to(destination))
with ZipFile(zip_path) as archive:
 assert archive.testzip() is None
 names=archive.namelist()
 assert 'public/index.html' in names and 'caddy/Caddyfile' in names
 assert not any('nginx' in name.lower() for name in names)
 assert len([name for name in names if name.startswith('public/')])==len(manifest)
 for entry in manifest:assert hashlib.sha256(archive.read('public/'+entry['path'])).hexdigest()==entry['sha256']
assert len(redirects)==11
assert config.count('{')==config.count('}')
print(f'Caddy delivery verified: {len(manifest)} public files, 11 redirects, no agent or Nginx. {zip_path}')
