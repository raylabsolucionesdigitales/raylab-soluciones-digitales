# Actualizar Raylab desde GitHub en el VPS

Repositorio: https://github.com/raylabsolucionesdigitales/raylab-soluciones-digitales.git
Rama de trabajo actual: **develop**.

## Primero: publicar los cambios locales

Los cambios de tu PC no llegan al VPS hasta que los confirmes y subas a GitHub. En VS Code, abre Control de código fuente (`Ctrl + Shift + G`), revisa y prepara los cambios del proyecto, escribe un mensaje, confirma y pulsa **Sincronizar cambios**. No añadas secretos ni archivos de entorno; las reglas de exclusión del proyecto se conservan.

Esta tarea preparó archivos locales, no ejecutó un push ni accedió a tu VPS.

## Primera vez en el VPS

En la terminal SSH de Termius:

```bash
cd /srv/raylab
git clone --branch develop https://github.com/raylabsolucionesdigitales/raylab-soluciones-digitales.git repositorio
cd /srv/raylab/repositorio
python3 herramientas/web/build/publicar-vps.py --dry-run
sudo python3 herramientas/web/build/publicar-vps.py --apply
```

Si `repositorio/` ya existe, no repitas el clone: revisa `git remote -v` y utiliza el apartado de actualizaciones. Si el repositorio es privado, Git debe estar autorizado en el VPS; utiliza una clave SSH de lectura o un mecanismo de credenciales adecuado, no un token incrustado en la URL ni en el código. Si falla la autenticación o no existe la rama remota, detente y completa primero la publicación en GitHub.

Comprueba previamente que existen `git` y `python3` (`git --version`, `python3 --version`). La página no necesita Node ni npm en el servidor; Python solo prepara y copia los archivos.

## Siguientes actualizaciones

Después de confirmar y subir tus cambios desde la PC:

```bash
cd /srv/raylab/repositorio
git pull --ff-only
python3 herramientas/web/build/publicar-vps.py --dry-run
sudo python3 herramientas/web/build/publicar-vps.py --apply
curl -fsSI https://raylabdigital.com/
```

Ejecuta cada comando solo si el anterior terminó correctamente. Si hay conflictos o cambios locales en el VPS, revísalos; no uses reset forzado para descartarlos automáticamente.

## Qué hace la publicación

- Prepara el mismo manifiesto público utilizado por la entrega web.
- Excluye agente, documentación, editor privado, secretos y metadatos de Cloudflare.
- Aparta la web anterior en `/srv/raylab/respaldos/<fecha>/web-anterior/`.
- Copia y verifica la nueva versión en `/srv/raylab/web/`.
- Conserva el directorio montado por Docker: no lo elimina, renombra ni recrea.
- No modifica Caddyfile, Compose, certificados ni el agente.
- Si la copia falla, intenta restaurar inmediatamente el contenido apartado.

Hay un intervalo breve durante la copia; realiza la publicación en un momento de poco tráfico. No publiques dos versiones al mismo tiempo. El script se detiene si encuentra enlaces simbólicos en la carpeta publicada que requieren revisión.

La configuración existente de Caddy sirve las direcciones actuales. Las redirecciones de direcciones antiguas siguen siendo una configuración separada; consulta el README de la entrega Contabo si necesitas incorporarlas.

## Recuperar la web anterior

```bash
cd /srv/raylab/repositorio
sudo python3 herramientas/web/build/publicar-vps.py --restore-latest
curl -fsSI https://raylabdigital.com/
```

La recuperación deja la versión retirada dentro de la carpeta de respaldo. No cambia el commit del repositorio ni restaura una configuración de Caddy, porque el publicador no la modifica.

## Estructura del VPS

```text
/srv/raylab/
  repositorio/     Código de GitHub; no se publica completo
  web/             Archivos estáticos que Caddy ve en /srv
  respaldos/       Versiones anteriores
  Caddyfile        Configuración actual conservada
  ...              Tu Docker Compose y otros archivos existentes
```

Esta guía y el script se probaron localmente. La conexión SSH, los permisos de GitHub y el funcionamiento en el VPS todavía deben comprobarse allí.
