"""Check mouse direction and reset without sending messages or publishing."""
from pathlib import Path
exec(compile(Path(__file__).with_name('check-theme.py').read_text().split('try:')[0],__file__,'exec'))
try:
    # Headless Chrome has no physical mouse: emulate only that capability.
    driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument',{'source':"const mm=window.matchMedia.bind(window);window.matchMedia=q=>q.includes('pointer:fine')||q.includes('pointer: fine')?{matches:true,addEventListener(){},addListener(){}}:mm(q);"})
    driver.set_window_size(1440,1000)
    driver.get(base)
    time.sleep(1)
    def move(fraction):
        driver.execute_script('const h=document.querySelector(".hero"),r=h.getBoundingClientRect();h.dispatchEvent(new PointerEvent("pointermove",{clientX:r.left+r.width*arguments[0],clientY:r.top+r.height*.5,pointerType:"mouse"}));',fraction)
        time.sleep(.9)
        return driver.execute_script('return [...document.querySelectorAll(".visual>.stage-window,.visual>.code-card")].map(e=>parseFloat(e.style.translate)||0)')
    assert all(x<0 for x in move(.05)), 'Panels must move left'
    assert all(x>0 for x in move(.95)), 'Panels must move right'
    driver.execute_script('document.querySelector(".hero").dispatchEvent(new PointerEvent("pointerleave"))')
    time.sleep(1.2)
    assert driver.execute_script('return [...document.querySelectorAll(".visual>.stage-window,.visual>.code-card")].every(e=>Math.abs(parseFloat(e.style.translate)||0)<.1)')
    driver.execute_cdp_cmd('Emulation.setDeviceMetricsOverride',{'width':390,'height':900,'deviceScaleFactor':1,'mobile':True})
    assert all(abs(x)<.1 for x in move(.95)), 'Phone layout must remain still'
    print('OK: both panels follow mouse direction, reset on leave, and remain still on mobile.')
finally:
    driver.quit()
    server.shutdown()
