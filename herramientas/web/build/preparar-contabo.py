"""Production package for Raylab's existing Contabo/Caddy Compose deployment."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
from html.parser import HTMLParser
from urllib.parse import urljoin,urlsplit,unquote
import hashlib,json,re,runpy,subprocess,shutil

ROOT=Path(__file__).resolve().parents[3]
DIST=ROOT/'web/dist'
OUT=ROOT/'entregas/contabo/raylab-produccion'
WEB=OUT/'web'
OUT.mkdir(parents=True,exist_ok=True);WEB.mkdir(exist_ok=True)
# A positive, maintained public-file manifest excludes the editor and all backend code.
runpy.run_path(str(Path(__file__).with_name('package-hosting.py')),run_name='__main__')
source_archive=ROOT/'entregas/raylab/raylab-web-hosting.zip'
files={}
with ZipFile(source_archive) as archive:
 for name in archive.namelist():
  if name in ['_headers','_redirects']:continue
  assert not name.startswith('/') and '..' not in Path(name).parts
  files[name]=archive.read(name)
for name,content in files.items():
 target=WEB/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(content)
assert set(files)=={p.relative_to(WEB).as_posix() for p in WEB.rglob('*') if p.is_file()},'Unexpected files in staging; review before publishing'

class Page(HTMLParser):
 def __init__(self):super().__init__();self.base='';self.refs=[];self.ids=set();self.forms=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='base':self.base=a.get('href','')
  if 'id' in a:self.ids.add(a['id'])
  if tag in ['a','link'] and a.get('href'):self.refs.append(a['href'])
  if tag in ['script','img'] and a.get('src'):self.refs.append(a['src'])
  if tag=='form':self.forms.append(a.get('action',''))
pages={}
origin='https://raylabdigital.com/'
for name,content in files.items():
 if name.endswith('.html'):
  page=Page();page.feed(content.decode('utf-8'));pages[name]=page
checked=0;external=set()
for name,page in pages.items():
 base=urljoin(urljoin(origin,name),page.base)
 for ref in page.refs:
  target=urlsplit(urljoin(base,ref))
  if target.scheme not in ['http','https']:continue
  if target.netloc!='raylabdigital.com':external.add(target.netloc);continue
  relative=unquote(target.path).lstrip('/') or 'index.html'
  if relative.endswith('/'):relative+='index.html'
  assert relative in files,(name,ref,relative)
  if target.fragment and relative in pages:assert unquote(target.fragment) in pages[relative].ids,(name,ref,'missing anchor')
  checked+=1
for name,content in files.items():
 if name.endswith('.css'):
  text=content.decode('utf-8');assert text.count('{')==text.count('}')
  for raw in re.findall(r'url\(\s*([^)]+?)\s*\)',text):
   ref=raw.strip('"\'')
   if ref.startswith(('data:','http:','https:','var(')):continue
   relative=urlsplit(urljoin(urljoin(origin,name),ref)).path.lstrip('/')
   assert unquote(relative) in files,(name,ref)
 if name.endswith(('.html','.css','.js')):
  assert not re.search(r'(?i)(?<![a-z0-9])(?:[a-z]:[\\/]|file:///|https?://(?:localhost|127\.0\.0\.1))',content.decode('utf-8')),('local development path',name)
for name,content in files.items():
 if name.endswith('.js'):
  subprocess.run(['node','--check',str(WEB/name)],check=True,capture_output=True)
  assert not re.search(r'\b(?:fetch\s*\(|XMLHttpRequest|WebSocket|EventSource)',content.decode('utf-8')),name
subprocess.run(['python',str(ROOT/'herramientas/web/tests/check-project-layout.py')],check=True)
subprocess.run(['python',str(ROOT/'herramientas/web/tests/check-service-guides.py')],check=True)
subprocess.run(['node',str(ROOT/'herramientas/web/tests/check-quotation.cjs')],cwd=ROOT,check=True)
subprocess.run(['node',str(ROOT/'herramientas/web/tests/check-quotation-ui.cjs')],cwd=ROOT,check=True)

# Only compatibility redirects: retain the supplied hostname, root, encoding and file_server.
rules=[]
for line in (DIST/'_redirects').read_text().splitlines():
 old,new,status=line.split();assert status=='301'
 assert new.lstrip('/') in files
 rules.append(f'    redir {old} {new}?{{query}} permanent')
proposed='''# Proposal only: do not replace the active Caddyfile automatically.
# Same domain, container root and encoding as the currently working deployment.
raylabdigital.com, www.raylabdigital.com {
    root * /srv
    encode zstd gzip

    # Compatibility with the former Cloudflare Pages URLs; preserve service queries.
'''+ '\n'.join(rules)+'''

    file_server
}
'''
(OUT/'Caddyfile.propuesto').write_text(proposed,encoding='utf-8')
guide_source=Path(__file__).with_name('README-CONTABO.md').read_text(encoding='utf-8')
bash='C:/Program Files/Git/bin/bash.exe' if Path('C:/Program Files/Git/bin/bash.exe').is_file() else shutil.which('bash')
shell_blocks=re.findall(r'```bash\n(.*?)\n```',guide_source,re.S)
if bash:
 for block in shell_blocks:subprocess.run([bash,'--noprofile','--norc','-n'],input=block,text=True,check=True,capture_output=True)
for block in re.findall(r"python3 - <<'PY'\n(.*?)\nPY",guide_source,re.S):compile(block,'safe-unzip-readme','exec')
report={
 'framework':'HTML/CSS/JavaScript sin framework ni compilacion de frontend',
 'public_files':len(files),'html_pages':len(pages),'checked_local_references':checked,
 'javascript_syntax_checks':sum(name.endswith('.js') for name in files),
 'source_bytes_preserved':True,'external_link_hosts':sorted(external),
 'deployment_shell_blocks_checked':len(shell_blocks) if bash else 0,
 'frontend_backend_requests':0,'legacy_redirects':len(rules),
 'backend':'Agente Cloudflare Workers separado, excluido de este ZIP; la web no necesita ejecutarlo',
 'browser_visual_test':False,'vps_test':False,'caddy_binary_validation':False,
 'pending':['Validar Caddyfile en el contenedor si se integran las redirecciones','Probar HTTPS y navegacion real en el VPS','El catalogo original conserva el dominio anterior de Pages; no se reescribio su contenido ni el PDF']
}
(OUT/'VERIFICACION.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
guide=guide_source
guide=guide.replace('{{FILES}}',str(len(files))).replace('{{PAGES}}',str(len(pages))).replace('{{REFS}}',str(checked)).replace('{{JS}}',str(report['javascript_syntax_checks']))
(OUT/'README-DESPLIEGUE.md').write_text(guide,encoding='utf-8')
top={p.relative_to(OUT).as_posix() for p in OUT.rglob('*') if p.is_file()}
expected_paths={'web/'+name for name in files}|{'README-DESPLIEGUE.md','Caddyfile.propuesto','VERIFICACION.json','MANIFIESTO-SHA256.txt'}
assert top-{'MANIFIESTO-SHA256.txt'}==expected_paths-{'MANIFIESTO-SHA256.txt'},'Unexpected staging files'
manifest=[]
for p in sorted(OUT.rglob('*')):
 if p.is_file() and p.name!='MANIFIESTO-SHA256.txt':manifest.append(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.relative_to(OUT).as_posix())
(OUT/'MANIFIESTO-SHA256.txt').write_text('\n'.join(manifest)+'\n',encoding='utf-8')
zip_path=ROOT/'entregas/raylab-produccion.zip'
with ZipFile(zip_path,'w',ZIP_DEFLATED) as archive:
 for p in sorted(OUT.rglob('*')):
  if p.is_file():archive.write(p,'raylab-produccion/'+p.relative_to(OUT).as_posix())
with ZipFile(zip_path) as archive:
 assert archive.testzip() is None
 assert 'raylab-produccion/web/index.html' in archive.namelist()
 for name,content in files.items():assert archive.read('raylab-produccion/web/'+name)==content
 assert not any('/node_modules/' in name or '/.git/' in name or '/.env' in name or '/editor/' in name or 'worker.mjs' in name for name in archive.namelist())
assert all((WEB/name).read_bytes()==content for name,content in files.items())
print(json.dumps(report,ensure_ascii=False,indent=2))
print(f'Production ZIP verified: {zip_path} ({zip_path.stat().st_size} bytes)')
