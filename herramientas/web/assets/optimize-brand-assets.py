"""Re-encode the embedded approved logo losslessly; do not resize or redraw it."""
from pathlib import Path
from io import BytesIO
import base64,re,json
from xml.etree import ElementTree as ET
from urllib.parse import quote
from PIL import Image

root=Path(__file__).resolve().parents[3]
image_dir=root/'web/dist/img'
source=image_dir/'logo.svg'
svg=source.read_text(encoding='utf-8')
match=re.search(r'data:image/(?:png|webp);base64,([^\"]+)',svg)
if not match:raise RuntimeError('No embedded approved logo found')
original=Image.open(BytesIO(base64.b64decode(match[1]))).convert('RGBA')
buffer=BytesIO();original.save(buffer,format='WEBP',lossless=True,method=6,exact=True)
decoded=Image.open(BytesIO(buffer.getvalue())).convert('RGBA')
assert original.size==decoded.size and original.tobytes()==decoded.tobytes(),'Pixel values changed'
replacement='data:image/webp;base64,'+base64.b64encode(buffer.getvalue()).decode('ascii')
sizes={}
for p in (source,image_dir/'raylab-wordmark-light.svg',image_dir/'raylab-wordmark-dark.svg'):
 text=p.read_text(encoding='utf-8');before=p.stat().st_size
 text=re.sub(r'data:image/(?:png|webp);base64,[^\"]+',lambda _:replacement,text)
 p.write_text(text,encoding='utf-8')
 sizes[p.name]={'before':before,'after':p.stat().st_size}
out=root/'entregas/qa-fixes-2026-11-15';out.mkdir(parents=True,exist_ok=True)
old_report=out/'logo-optimization.json'
if old_report.exists():
 previous=json.loads(old_report.read_text(encoding='utf-8'))
 for name,values in sizes.items():values['before']=previous.get('assets',{}).get(name,values)['before']
ET.register_namespace('','http://www.w3.org/2000/svg')
lettering=ET.parse(image_dir/'raylab-wordmark-light.svg').getroot()
for child in list(lettering):
 if child.tag.split('}')[-1]=='g':lettering.remove(child)
lettering.set('aria-label','Raylab Soluciones Digitales')
lettering_svg=ET.tostring(lettering,encoding='unicode')
(image_dir/'raylab-lettering.svg').write_text(lettering_svg,encoding='utf-8')
# A file:// page cannot fetch an external SVG as a CSS mask (opaque origin).
# Embed only the small vector lettering in CSS so the same branding works locally.
css_path=root/'web/dist/css/client-experience.css'
css=css_path.read_text(encoding='utf-8')
css=re.sub(r':root\{--raylab-lettering:url\("data:image/svg\+xml,[^\"]*"\);\}\n?','',css)
css=css.replace("url('../img/raylab-lettering.svg')",'var(--raylab-lettering)')
css=':root{--raylab-lettering:url("data:image/svg+xml,'+quote(lettering_svg,safe='')+'");}\n'+css
css_path.write_text(css,encoding='utf-8')
(out/'logo-optimization.json').write_text(json.dumps({'pixels_identical':True,'dimensions':original.size,'assets':sizes},indent=2),encoding='utf-8')
print(json.dumps(sizes))
