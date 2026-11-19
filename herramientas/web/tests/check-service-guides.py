from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote,parse_qs
import re,json
ROOT=Path(__file__).resolve().parents[3];DIST=ROOT/'web/dist'
class Document(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.resources=[];self.ids=[];self.faq=0
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag=='a':self.links.append(a.get('href',''))
  if tag in ['link','script','img']:self.resources.append(a.get('src',a.get('href','')))
  if tag=='details':self.faq+=1
keys=['odoo','web','whatsapp','microapps','ads','analytics','nfc']
for key in keys:
 path=DIST/f'servicios/servicio-{key}.html';s=path.read_text(encoding='utf-8');doc=Document();doc.feed(s)
 assert doc.faq==4,(key,doc.faq)
 assert 'Ejemplos ilustrativos' in s
 assert 'Cómo puede ayudarte.' in s and 'Cómo trabajamos.' in s and 'Qué ofrecemos.' in s
 assert len(re.findall(r'<article>',re.search(r'<section class="service-detail-block service-examples">.*?</section>',s,re.S).group()))==3
 quote=[href for href in doc.links if href.startswith('comercial/cotizacion.html')]
 assert len(quote)>=3 and all(parse_qs(urlsplit(href).query).get('service')==[key] for href in quote),(key,quote)
 assert len(doc.ids)==len(set(doc.ids))
 for ref in doc.resources:
  u=urlsplit(ref)
  if not u.scheme:assert (DIST/unquote(u.path)).is_file(),ref
 print(key+': content, 3 examples, 4 FAQs, quote links and assets OK')
quote=(DIST/'comercial/cotizacion.html').read_text(encoding='utf-8');doc=Document();doc.feed(quote)
for ref in doc.resources:
 u=urlsplit(ref)
 if not u.scheme:assert (DIST/unquote(u.path)).is_file(),ref
for id in ['quote-service','question-fields','quote-name','quote-company','quote-contact','quote-comments','quote-status','quote-fallback','quote-error-summary']:assert id in doc.ids
assert len(doc.ids)==len(set(doc.ids))
assert 'type="submit" disabled' in quote and 'novalidate' in quote
assert 'contacto.raylab@gmail.com' in quote
for css in ['service-page.css','quotation.css']:
 s=(DIST/'css'/css).read_text(encoding='utf-8');assert s.count('{')==s.count('}')
assert '@media(max-width:760px)' in (DIST/'css/quotation.css').read_text()
source=(DIST/'js/services-data.js').read_text(encoding='utf-8')
services=json.loads(source.split('=',1)[1].strip().rstrip(';'))['services']
assert sorted(s['id'] for s in services if s['published'])==sorted(keys)
core=(DIST/'js/services-core.js').read_text(encoding='utf-8')
assert "link.href='servicios/servicio-'+service.id+'.html'" in (DIST/'js/services.js').read_text(encoding='utf-8')
print('Quotation shell, assets, IDs and responsive CSS OK. Visual browser QA not run: user antivirus restriction.')
