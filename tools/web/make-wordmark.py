from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from xml.etree import ElementTree as ET

root = Path(__file__).resolve().parents[2] / 'sites/raylab/dist'
font = TTFont('C:/Windows/Fonts/arialbd.ttf')
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
units = font['head'].unitsPerEm
def lettering(text, size, x, baseline, spacing, color):
    result = []
    scale = size / units
    for char in text:
        name = cmap[ord(char)]
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(pen)
        result.append(f'<path fill="{color}" transform="translate({x:.3f} {baseline}) scale({scale} {-scale})" d="{pen.getCommands()}"/>')
        x += glyphs[name].width * scale + spacing
    return ''.join(result)
source = ET.parse(root / 'img/logo.svg').getroot()
symbol = ''.join(ET.tostring(child, encoding='unicode') for child in source if child.tag.split('}')[-1] in ('defs','path','image'))
for theme, color, subtitle in [('dark','#f8f7ff','#ffffff'),('light','#20132f','#000000')]:
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 65" role="img" aria-label="Raylab Soluciones Digitales">'
    svg += f'<g transform="translate(0 11) scale(.071)">{symbol}</g>'
    svg += lettering('RAYLAB',28,55,39,1,color)
    svg += lettering('SOLUCIONES DIGITALES',6,56,57,2.15,subtitle)
    (root / 'img' / f'raylab-wordmark-{theme}.svg').write_text(svg+'</svg>', encoding='utf-8')
