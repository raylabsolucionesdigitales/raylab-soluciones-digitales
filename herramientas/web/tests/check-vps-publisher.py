from pathlib import Path
import importlib.util,tempfile
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('publisher',ROOT/'herramientas/web/build/publicar-vps.py')
publisher=importlib.util.module_from_spec(spec);spec.loader.exec_module(publisher)
with tempfile.TemporaryDirectory(dir=ROOT/'entregas',prefix='prueba-publicador-') as temp:
 root=Path(temp);live=root/'web';live.mkdir();payload=root/'payload';payload.mkdir();backup=root/'backup';backup.mkdir()
 (live/'index.html').write_text('anterior');(live/'antiguo.txt').write_text('conservar en respaldo');(payload/'index.html').write_text('nuevo')
 config=root/'Caddyfile';config.write_text('configuracion intacta')
 inode=live.stat().st_ino
 publisher.install_payload(live,payload,backup)
 assert (live/'index.html').read_text()=='nuevo'
 assert not (live/'antiguo.txt').exists()
 assert (backup/'web-anterior/index.html').read_text()=='anterior'
 assert live.stat().st_ino==inode and config.read_text()=='configuracion intacta'
 backup2=root/'backup2';backup2.mkdir()
 def failing_copy(source,target,**kwargs):
  (target/'parcial.txt').write_text('copia interrumpida')
  raise OSError('fallo simulado')
 with patch.object(publisher.shutil,'copytree',failing_copy):
  try:publisher.install_payload(live,payload,backup2)
  except OSError:pass
  else:raise AssertionError('Missing failure')
 assert (live/'index.html').read_text()=='nuevo' and not (live/'parcial.txt').exists()
 assert (backup2/'web-copia-fallida/parcial.txt').is_file()
 assert live.stat().st_ino==inode
print('Publisher verified: public copy, preserved directory inode, previous-version backup and automatic recovery after simulated copy failure. No VPS accessed.')
