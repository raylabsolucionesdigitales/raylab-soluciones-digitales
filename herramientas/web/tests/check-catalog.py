"""Exercise the standalone catalogue locally and export its A4 PDF using Chrome."""
from pathlib import Path
import base64
import json
import re
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
from selenium import webdriver
from selenium.webdriver.chrome.service import Service

ROOT = Path(__file__).resolve().parents[3]
DIST = ROOT/'web/dist'
OUT = ROOT/'entregas/raylab/catalogo'
OUT.mkdir(parents=True,exist_ok=True)
options=webdriver.ChromeOptions()
options.binary_location='C:/Program Files/Google/Chrome/Application/chrome.exe'
for arg in ['--headless=new','--disable-gpu','--no-sandbox','--disable-dev-shm-usage','--hide-scrollbars','--window-size=1100,1400']:
    options.add_argument(arg)
options.set_capability('goog:loggingPrefs',{'browser':'ALL'})
driver=webdriver.Chrome(service=Service('C:/Users/Usuario/.cache/selenium/chromedriver/win64/156.0.8078.80/chromedriver.exe'),options=options)
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(DIST)))
threading.Thread(target=server.serve_forever,daemon=True).start()
report={}
try:
    url=f'http://127.0.0.1:{server.server_port}/catalogo.html'
    driver.get(url)
    driver.execute_async_script('const done=arguments[0];Promise.all([document.fonts.ready,...Array.from(document.images,i=>i.decode())]).then(()=>done(true)).catch(e=>done(String(e)))')
    report['images']=driver.execute_script('return Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)')
    assert report['images']
    report['fonts']=driver.execute_script('return [...document.fonts].map(f=>({family:f.family,status:f.status}))')
    report['pages']=driver.execute_script('return document.querySelectorAll(".sheet").length')
    assert report['pages']==12
    report['responsive']=[]
    for width in [320,390,768,1100]:
        driver.execute_cdp_cmd('Emulation.setDeviceMetricsOverride',{'width':width,'height':1000,'deviceScaleFactor':1,'mobile':False})
        result=driver.execute_script('return {width:innerWidth,scroll:document.documentElement.scrollWidth,clipped:[...document.querySelectorAll(".sheet")].filter(p=>p.scrollHeight>p.clientHeight+2).map(p=>p.id)}')
        report['responsive'].append(result)
        assert result['width']==width and result['scroll']<=width and not result['clipped'],result
    driver.execute_cdp_cmd('Emulation.clearDeviceMetricsOverride',{})
    driver.find_element('css selector','.cover').screenshot(str(OUT/'portada.png'))
    driver.execute_script('document.documentElement.style.scrollBehavior="auto";document.getElementById("whatsapp").scrollIntoView({behavior:"instant"})')
    driver.find_element('id','whatsapp').screenshot(str(OUT/'whatsapp.png'))
    report['internal_links']=driver.execute_script('return [...document.querySelectorAll("a[href^=\\"#\\"]")].every(a=>document.getElementById(a.hash.slice(1)))')
    assert report['internal_links']
    driver.execute_script('window.print=()=>window.__printed=true;document.getElementById("print-catalog").click()')
    from selenium.webdriver.support.ui import WebDriverWait
    WebDriverWait(driver,10).until(lambda d:d.execute_script('return !!window.__printed'))
    report['print_button']=True
    driver.execute_cdp_cmd('Emulation.setEmulatedMedia',{'media':'print'})
    report['print_overflow']=driver.execute_script('return [...document.querySelectorAll(".sheet")].map(p=>({id:p.id,overflow:p.scrollHeight-p.clientHeight,collisions:[...p.children].filter(c=>!c.classList.contains("folio")&&c.getBoundingClientRect().bottom>p.querySelector(".folio").getBoundingClientRect().top-8).map(c=>c.className)}))')
    assert all(p['overflow']<=2 and not p['collisions'] for p in report['print_overflow']),report['print_overflow']
    pdf=driver.execute_cdp_cmd('Page.printToPDF',{'printBackground':True,'preferCSSPageSize':True,'displayHeaderFooter':False,'marginTop':0,'marginBottom':0,'marginLeft':0,'marginRight':0,'generateTaggedPDF':True})
    raw=base64.b64decode(pdf['data'])
    report['pdf_pages']=len(re.findall(rb'/Type\s*/Page\b',raw))
    assert report['pdf_pages']==12,report['pdf_pages']
    (DIST/'documentos/raylab-catalogo.pdf').write_bytes(raw)
    (OUT/'raylab-catalogo.pdf').write_bytes(raw)
    report['pdf_bytes']=len(raw)
    dimensions=re.findall(rb'/MediaBox\s*\[0 0 ([\d.]+) ([\d.]+)\]',raw)
    report['pdf_a4']=len(dimensions)==12 and all(abs(float(w)-595.276)<1 and abs(float(h)-841.89)<1 for w,h in dimensions)
    assert report['pdf_a4']
    report['browser_errors']=[e for e in driver.get_log('browser') if e['level']=='SEVERE']
    assert not report['browser_errors'],report['browser_errors']
    driver.get((DIST/'comercial/catalogo.html').as_uri())
    report['local_file_images']=driver.execute_script('return [...document.images].every(i=>i.complete&&i.naturalWidth>0)')
    assert report['local_file_images']
    print(json.dumps(report,ensure_ascii=False,indent=2))
finally:
    (OUT/'validacion.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    driver.quit()
    server.shutdown()
