"""Compatibility entrypoint: the Ubuntu VPS uses Caddy."""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('preparar-caddy.py')),run_name='__main__')
