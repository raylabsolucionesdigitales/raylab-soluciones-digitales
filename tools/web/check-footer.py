from pathlib import Path
exec(compile(Path(__file__).with_name('check-theme.py').read_text().split('try:')[0],__file__,'exec'))
try:
    for width in (1440,390,320):
        driver.execute_cdp_cmd('Emulation.setDeviceMetricsOverride', {'width':width,'height':1000,'deviceScaleFactor':1,'mobile':width<400})
        driver.get(base)
        driver.execute_script('document.querySelector("footer").scrollIntoView({block:"end",behavior:"instant"})')
        time.sleep(.5)
        print(width,driver.execute_script('return {brand:getComputedStyle(document.querySelector("header .brand")).width, viewport:innerWidth,scroll:document.documentElement.scrollWidth,css:[...document.styleSheets].map(s=>[s.href,s.cssRules.length])}'))
        driver.save_screenshot(str(out/f'footer-{width}.png'))
finally:
    driver.quit()
    server.shutdown()
