"""Losslessly compress the existing font tables into WOFF containers."""
from pathlib import Path
from fontTools.ttLib import TTFont
root=Path(__file__).resolve().parents[3]/'web/dist/fonts'
for name in ('dm-sans','space-grotesk'):
 source=root/f'{name}.ttf';font=TTFont(source,recalcTimestamp=False)
 outlines=font['glyf'].compile(font)
 metrics=dict(font['hmtx'].metrics)
 font.flavor='woff';target=root/f'{name}.woff';font.save(target)
 check=TTFont(target,recalcTimestamp=False)
 assert check['glyf'].compile(check)==outlines and check['hmtx'].metrics==metrics
 print(name,source.stat().st_size,'->',target.stat().st_size)
