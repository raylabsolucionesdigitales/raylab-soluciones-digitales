"""Check local HTML asset links without opening a browser."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote

root = Path(__file__).resolve().parents[2] / 'sites/raylab/dist'
missing = set()
class Links(HTMLParser):
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key not in ('src','href') or not value: continue
            url = urlsplit(value)
            if url.scheme or url.netloc or not url.path or url.path.startswith('/'): continue
            if not (root / unquote(url.path)).exists(): missing.add(url.path)
for page in root.glob('*.html'):
    Links().feed(page.read_text(encoding='utf-8'))
assert not missing, sorted(missing)
print('OK: local HTML assets and page links exist.')
