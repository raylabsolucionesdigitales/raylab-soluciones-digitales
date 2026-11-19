"""Check service pages and homepage destinations without sending messages."""
from pathlib import Path
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
root=Path(__file__).resolve().parents[3]
options=webdriver.ChromeOptions()
options.add_argument('--headless=new')
options.add_argument('--allow-file-access-from-files')
options.set_capability('goog:loggingPrefs', {'browser':'ALL'})
drivers=list((Path.home()/'.cache/selenium/chromedriver/win64').glob('*/chromedriver.exe'))
driver=webdriver.Chrome(service=Service(str(sorted(drivers)[-1])),options=options)
try:
 for width in (1440,390):
  driver.set_window_size(width,950)
  for theme in ('dark','light'):
   for name in ('odoo','web','whatsapp','microapps','ads','analytics','nfc'):
    driver.get((root/f'web/dist/servicios/servicio-{name}.html').as_uri())
    driver.execute_script('document.documentElement.dataset.theme=arguments[0]',theme)
    assert driver.execute_script('return document.documentElement.scrollWidth<=innerWidth'),(name,width,theme)
    assert driver.find_element('tag name','h1').text
    driver.execute_script('document.querySelector(".service-artwork").scrollIntoView()')
    time.sleep(.3)
    assert driver.execute_script('return [...document.querySelectorAll(".service-artwork img")].every(i=>i.complete && i.naturalWidth>0)'),(name,width,theme,'artwork')
    assert 'text=' in driver.find_element('css selector','.service-whatsapp').get_attribute('href')
    assert not [x for x in driver.get_log('browser') if x['level']=='SEVERE']
 driver.get((root/'web/dist/index.html').as_uri());time.sleep(1)
 links=driver.find_elements('css selector','.custom-service > a')
 assert len(links)==7,len(links)
 assert all('servicios/servicio-' in x.get_attribute('href') for x in links)
 assert not driver.find_elements('css selector','.service-details')
 assert len(driver.find_elements('css selector','.company-tile'))==6
 driver.execute_script('document.querySelector("#experiencia").scrollIntoView({behavior:"instant"})')
 time.sleep(1)
 assert driver.execute_script('return [...document.querySelectorAll(".company-tile img")].every(i=>i.complete && i.naturalWidth>0)')
 assert driver.execute_script('return document.documentElement.scrollWidth<=innerWidth')
 driver.execute_cdp_cmd('Emulation.setEmulatedMedia',{'features':[{'name':'prefers-reduced-motion','value':'no-preference'}]})
 driver.execute_script('document.querySelector("#servicios .services").scrollIntoView({behavior:"instant",block:"start"})')
 time.sleep(.15)
 assert driver.execute_script('return [...document.querySelectorAll(".custom-service")].some(e=>e.getAnimations().length>0)'), 'Catalogue entrance must run'
 print('OK: seven service pages, both themes, desktop/mobile; homepage destinations verified.')
finally:
 driver.quit()
