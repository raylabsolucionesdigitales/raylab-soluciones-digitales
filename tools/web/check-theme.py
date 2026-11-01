import functools
import http.server
import json
import threading
import time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.service import Service

root = Path(__file__).resolve().parents[2]
out = root / 'output/pruebas-web'
out.mkdir(parents=True, exist_ok=True)
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(root / 'sites/raylab/dist'))
server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
options = webdriver.ChromeOptions()
options.add_argument('--headless=new')
options.add_argument('--disable-gpu')
options.add_argument('--no-first-run')
options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
driver = webdriver.Chrome(options=options)
base = f'http://127.0.0.1:{server.server_port}/'
try:
    driver.set_window_size(1440, 1000)
    driver.execute_cdp_cmd('Emulation.setEmulatedMedia', {'features':[{'name':'prefers-color-scheme','value':'light'}]})
    driver.get(base)
    time.sleep(1)
    assert driver.execute_script('return document.documentElement.dataset.theme') == 'light'
    toggle = driver.find_element('css selector', '.theme-toggle')
    assert toggle.is_displayed()
    toggle.click()
    assert driver.execute_script('return localStorage.getItem("raylab-theme")') == 'dark'
    driver.refresh()
    assert driver.execute_script('return document.documentElement.dataset.theme') == 'dark'
    driver.find_element('css selector','.theme-toggle').click()
    driver.get(base+'privacidad.html')
    assert driver.execute_script('return document.documentElement.dataset.theme') == 'light'
    driver.find_element('css selector','.theme-toggle').click()
    driver.get(base)
    assert driver.execute_script('return document.documentElement.dataset.theme') == 'dark'
    report = []
    shapes = {}
    for width in (1440, 768, 390, 320):
        driver.execute_cdp_cmd('Emulation.setDeviceMetricsOverride', {'width':width,'height':1000,'deviceScaleFactor':1,'mobile':width<=390})
        for theme in ('dark', 'light'):
            if driver.execute_script('return document.documentElement.dataset.theme') != theme:
                driver.find_element('css selector','.theme-toggle').click()
            driver.execute_script('window.scrollTo(0,0)')
            time.sleep(.3)
            metrics = driver.execute_script('''return {width:innerWidth,scroll:document.documentElement.scrollWidth,theme:document.documentElement.dataset.theme,buttons:[...document.querySelectorAll('header>.brand,header>.menu,header>.theme-toggle,header>.compact')].filter(e=>getComputedStyle(e).display!=='none').map(e=>{const r=e.getBoundingClientRect();return {name:e.className,x:r.x,right:r.right,width:r.width}})}''')
            client_width = driver.execute_script('return document.documentElement.clientWidth')
            if metrics['scroll'] > client_width + 1:
                print(driver.execute_script('return [...document.querySelectorAll("body *")].map(e=>({name:e.className,right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width})).filter(e=>e.right>arguments[0]+1).slice(0,30)',client_width))
                print(driver.execute_script('return [...document.querySelectorAll("body *")].filter(e=>e.scrollWidth>e.clientWidth+2 && e.clientWidth>50).map(e=>({name:e.className,id:e.id,scroll:e.scrollWidth,client:e.clientWidth})).slice(0,25)'))
            assert metrics['scroll'] <= client_width + 1, metrics
            buttons = sorted(metrics['buttons'], key=lambda b:b['x'])
            assert all(b['x']>=0 and b['right']<=metrics['width'] for b in buttons), metrics
            assert all(a['right']<=b['x']+1 for a,b in zip(buttons,buttons[1:])), metrics
            report.append(metrics)
            geometry = driver.execute_script('return [...document.querySelectorAll(".hero,.hero h1,.hero .intro,.hero .actions,.stage-window,.code-card,.scene-switcher,#servicios,.personal-services")].map(e=>{const r=e.getBoundingClientRect();return [e.className,r.width,r.height]})')
            if theme == 'dark': shapes[width] = geometry
            else:
                for dark, light in zip(shapes[width],geometry):
                    assert all(abs(a-b)<2 for a,b in zip(dark[1:],light[1:])), {'different_theme_geometry':(dark,light),'width':width}
            if width in (1440,390):
                driver.save_screenshot(str(out / f'raylab-{theme}-{width}.png'))
        if width <= 390:
            driver.find_element('css selector','.menu').click()
            assert driver.find_element('id','navigation').is_displayed()
            driver.find_element('css selector','#navigation a').click()
            assert not driver.find_element('id','navigation').is_displayed()
    # Dynamic content must still switch scenes after theme changes.
    driver.execute_cdp_cmd('Emulation.setDeviceMetricsOverride', {'width':1440,'height':1000,'deviceScaleFactor':1,'mobile':False})
    driver.execute_script('window.scrollTo(0,0)')
    for button in driver.find_elements('css selector','.scene-switcher button'):
        driver.execute_script('arguments[0].scrollIntoView({block:"center",behavior:"instant"})',button)
        button.click()
        assert button.get_attribute('aria-pressed') == 'true'
    # All four illustrations and their phone cards must actually differ.
    for width in (1440,390,320):
        driver.execute_cdp_cmd('Emulation.setDeviceMetricsOverride', {'width':width,'height':1000,'deviceScaleFactor':1,'mobile':width<=390})
        driver.execute_script('window.scrollTo(0,0)')
        for theme in ('light','dark'):
            if driver.execute_script('return document.documentElement.dataset.theme') != theme:
                driver.find_element('css selector','.theme-toggle').click()
            scenes = []
            phones = []
            for index in range(4):
                button = driver.find_elements('css selector','.scene-switcher button')[index]
                driver.execute_script('arguments[0].scrollIntoView({block:"center",behavior:"instant"})',button)
                button.click()
                time.sleep(.5)
                scene = driver.find_element('css selector','.light-overview')
                assert scene.get_attribute('data-preview') == ('board','web','erp','app')[index]
                scenes.append(scene.get_attribute('innerHTML'))
                phones.append(driver.find_element('css selector','.preview-tasks').get_attribute('innerHTML'))
                if not driver.execute_script('return document.documentElement.scrollWidth <= document.documentElement.clientWidth+1'):
                    print(driver.execute_script('return {width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll("body *")].filter(e=>e.scrollWidth>e.clientWidth+2&&e.clientWidth>50).map(e=>({name:e.className,client:e.clientWidth,scroll:e.scrollWidth})).slice(0,20)}'))
                assert driver.execute_script('return document.documentElement.scrollWidth <= document.documentElement.clientWidth+1'), (width,theme,index)
                if width in (1440,390):
                    driver.save_screenshot(str(out/f'raylab-{theme}-service-{index}-{width}.png'))
            assert len(set(scenes)) == 4
            assert len(set(phones)) == 4
    driver.execute_cdp_cmd('Emulation.setDeviceMetricsOverride', {'width':1440,'height':1000,'deviceScaleFactor':1,'mobile':False})
    if driver.execute_script('return document.documentElement.dataset.theme') != 'light':
        driver.find_element('css selector','.theme-toggle').click()
    for anchor in ('servicios','conexion','preguntas','contacto'):
        driver.execute_script('document.getElementById(arguments[0]).scrollIntoView({behavior:"instant"})',anchor)
        time.sleep(.7)
        driver.save_screenshot(str(out / f'raylab-light-{anchor}.png'))
    severe = [item for item in driver.get_log('browser') if item['level']=='SEVERE' and 'fonts.googleapis' not in item['message']]
    assert not severe, severe
    print(json.dumps({'ok':True,'checks':'system preference, persistence, legal pages, 4 widths x 2 themes, mobile menu, 4 distinct scene and phone interfaces in 3 widths x 2 themes, browser errors','layouts':report}, indent=2))
finally:
    driver.quit()
    server.shutdown()
