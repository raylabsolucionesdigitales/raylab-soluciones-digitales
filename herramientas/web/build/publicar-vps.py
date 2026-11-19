"""Publish static Raylab files into the existing Docker bind directory, on VPS only."""
from pathlib import Path
from datetime import datetime,timezone
from zipfile import ZipFile
import argparse,hashlib,json,os,runpy,shutil,sys,tempfile,uuid

REPOSITORY=Path(__file__).resolve().parents[3]
SERVER=Path('/srv/raylab')

def reject_links(directory):
    if directory.is_symlink() or any(p.is_symlink() for p in directory.rglob('*')):
        raise RuntimeError('Se encontraron enlaces simbólicos; revisa la carpeta antes de publicar.')

def move_contents(source,destination):
    entries=list(source.iterdir())
    if any(item.is_symlink() or item.is_mount() for item in entries):raise RuntimeError('No se moverá un enlace o un montaje anidado.')
    destination.mkdir(parents=True,exist_ok=False)
    moved=[]
    try:
        for item in entries:item.rename(destination/item.name);moved.append(item.name)
    except Exception:
        for name in reversed(moved):(destination/name).rename(source/name)
        raise

def install_payload(live,payload,backup):
    """Keep the mounted directory inode; preserve all old contents for recovery."""
    reject_links(live);reject_links(payload)
    if not (payload/'index.html').is_file():raise RuntimeError('La entrega no contiene index.html.')
    original_inode=live.stat().st_ino
    previous=backup/'web-anterior'
    move_contents(live,previous)
    try:
        shutil.copytree(payload,live,dirs_exist_ok=True)
        for item in live.rglob('*'):item.chmod(0o755 if item.is_dir() else 0o644)
        for source in payload.rglob('*'):
            if source.is_file():
                target=live/source.relative_to(payload)
                if hashlib.sha256(source.read_bytes()).digest()!=hashlib.sha256(target.read_bytes()).digest():raise RuntimeError('La copia no coincide con la entrega.')
        if live.stat().st_ino!=original_inode:raise RuntimeError('La carpeta publicada cambió inesperadamente.')
    except Exception:
        move_contents(live,backup/'web-copia-fallida')
        for item in previous.iterdir():item.rename(live/item.name)
        raise

def checked_live():
    live=SERVER/'web'
    if sys.platform!='linux' or os.geteuid()!=0:raise RuntimeError('Ejecuta con sudo en el VPS Ubuntu; no se publicó nada.')
    if not live.is_dir() or live.is_symlink() or live.resolve()!=live:raise RuntimeError('No existe la carpeta física /srv/raylab/web; no se creará ni reemplazará el montaje.')
    if not (SERVER/'Caddyfile').is_file():raise RuntimeError('No se encontró el Caddyfile existente; revisa la ruta del proyecto.')
    reject_links(live)
    return live

def restore():
    live=checked_live()
    backup=Path((SERVER/'ultimo-respaldo-raylab.txt').read_text().strip()).resolve()
    if not backup.is_relative_to((SERVER/'respaldos').resolve()):raise RuntimeError('Ruta de respaldo inválida.')
    previous=backup/'web-anterior';reject_links(previous)
    if not (previous/'index.html').is_file():raise RuntimeError('El respaldo no contiene index.html o ya se restauró.')
    failed=backup/('web-retirada-'+uuid.uuid4().hex[:8])
    move_contents(live,failed)
    for item in list(previous.iterdir()):item.rename(live/item.name)
    print('Web anterior restaurada. Caddyfile y Docker Compose no se modificaron.')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    group=parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--dry-run',action='store_true',help='Preparar y verificar sin publicar')
    group.add_argument('--apply',action='store_true',help='Publicar en /srv/raylab/web conservando el montaje')
    group.add_argument('--restore-latest',action='store_true',help='Restaurar el contenido apartado en la última publicación')
    args=parser.parse_args()
    if args.restore_latest:restore();return
    live=checked_live() if args.apply else None
    runpy.run_path(str(Path(__file__).with_name('package-hosting.py')),run_name='__main__')
    archive=REPOSITORY/'entregas/raylab/raylab-web-hosting.zip'
    with tempfile.TemporaryDirectory(prefix='raylab-publicacion-') as temporary:
        payload=Path(temporary)/'web';payload.mkdir()
        with ZipFile(archive) as package:
            if package.testzip():raise RuntimeError('El ZIP no pasó la verificación de integridad.')
            for entry in package.infolist():
                if entry.filename in ['_headers','_redirects']:continue
                target=(payload/entry.filename).resolve()
                if not target.is_relative_to(payload) or entry.is_dir():raise RuntimeError('Ruta inválida en la entrega.')
                target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(package.read(entry))
        count=sum(p.is_file() for p in payload.rglob('*'))
        if not (payload/'index.html').is_file():raise RuntimeError('Falta index.html.')
        if args.dry_run:print(f'Entrega verificada: {count} archivos. No se modificó el VPS.');return
        backup=SERVER/'respaldos'/(datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'-'+uuid.uuid4().hex[:8])
        backup.mkdir(parents=True,exist_ok=False)
        print(f'Respaldo: {backup}')
        install_payload(live,payload,backup)
        (SERVER/'ultimo-respaldo-raylab.txt').write_text(str(backup)+'\n')
        (backup/'publicacion.json').write_text(json.dumps({'repository':str(REPOSITORY),'files':count,'published':True},indent=2))
        print(f'Publicados y verificados {count} archivos en {live}. No se reinició Caddy ni se alteró Compose.')
        print('Comprueba https://raylabdigital.com desde tu navegador.')

if __name__=='__main__':
    try:main()
    except Exception as error:raise SystemExit('Publicación detenida: '+str(error))
