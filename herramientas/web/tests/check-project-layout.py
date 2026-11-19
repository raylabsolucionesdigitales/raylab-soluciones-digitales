"""Check all moved HTML, resources, anchors and hosting aliases without a browser."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin,urlsplit,unquote
import re,json
ROOT=Path(__file__).resolve().parents[3]
DIST=ROOT/'web/dist'
class Document(HTMLParser):
 def __init__(self):super().__init__();self.base=None;self.refs=[];self.ids=set()
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='base':self.base=a.get('href')
  if a.get('id'):self.ids.add(a['id'])
  if tag in ['a','link'] and a.get('href'):self.refs.append(a['href'])
  if tag in ['img','script'] and a.get('src'):self.refs.append(a['src'])
docs={}
for p in DIST.rglob('*.html'):
 d=Document();d.feed(p.read_text(encoding='utf-8'));docs[p.resolve()]=d
count=0
for path,doc in docs.items():
 base=urljoin(path.as_uri(),doc.base or '')
 if path.parent!=DIST:assert doc.base=='../',path
 for ref in doc.refs:
  url=urlsplit(urljoin(base,ref))
  if url.scheme!='file':continue
  target=(DIST/unquote(urlsplit(ref).path).lstrip('/')).resolve() if ref.startswith('/') else Path(unquote(url.path.lstrip('/'))).resolve()
  assert target.is_relative_to(DIST), (path,ref,'outside site')
  if target.is_dir():target=target/'index.html'
  assert target.is_file(),(path,ref,target)
  if url.fragment and target.suffix=='.html':assert unquote(url.fragment) in docs[target].ids,(path,ref,'missing anchor')
  count+=1
for p in (DIST/'css').glob('*.css'):
 text=p.read_text(encoding='utf-8')
 assert text.count('{')==text.count('}'),p
 for raw in re.findall(r'url\(\s*([^)]+?)\s*\)',text):
  ref=raw.strip('"\'')
  if ref.startswith(('data:','http:','https:','var(')):continue
  target=(p.parent/unquote(urlsplit(ref).path)).resolve()
  assert target.is_file(),(p,ref)
redirects=(DIST/'_redirects').read_text().strip().splitlines()
assert len(redirects)==11
for line in redirects:
 old,new,status=line.split();assert status=='301' and (DIST/new.lstrip('/')).is_file()
assert "base-uri 'self'" in (DIST/'_headers').read_text()
for path in (ROOT/'herramientas/web').rglob('*.py'):compile(path.read_text(encoding='utf-8'),str(path),'exec')
assert not list((ROOT/'herramientas/web').glob('*.py'))
settings=json.loads((ROOT/'.vscode/settings.json').read_text())
assert settings['files.exclude']['**/__pycache__']
print(f'Layout OK: {len(docs)} HTML documents, {count} local links/resources, CSS assets, 11 legacy redirects and all Python entrypoints. No browser started.')
