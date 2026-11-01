from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[2]
source = root / 'sites/raylab/dist'
target = root / 'output/raylab/raylab-web-hosting.zip'
target.parent.mkdir(parents=True, exist_ok=True)
public_names = {
    'img/raylab-wordmark-dark.svg', 'img/raylab-wordmark-light.svg',
    'privacidad.html', 'eliminacion-datos.html', 'css/legal.css', '404.html',
    'css/service-previews.css', 'js/service-previews.js', 'css/reference.css', 'js/reference.js', 'css/theme.css', 'js/theme.js', 'index.html', 'img/logo.svg', 'css/style.css', 'css/brand.css', 'css/extras.css',
    'css/motion.css', 'css/premium.css', 'css/experience.css', 'css/whatsapp.css',
    'js/script.js', 'js/extras.js', 'js/motion.js', 'js/premium.js', 'js/experience.js',
    'js/services-data.js', 'js/services-core.js', 'js/services.js',
    'js/whatsapp-core.js', 'js/whatsapp.js', '_headers', 'css/founder.css', 'js/offers.js', 'css/responsive.css',
    'documentos/raylab-servicios.pdf', 'documentos/raylab-odoo.pdf',
    'documentos/raylab-webs.pdf', 'documentos/raylab-sistemas.pdf', 'documentos/raylab-microapps.pdf',
}
files = sorted(source / name for name in public_names)
legacy_pdf_aliases = {name.replace('raylab-', 'raylio-'): name for name in public_names if name.startswith('documentos/raylab-')}
assert all(p.is_file() and not p.is_symlink() for p in files), 'Missing or linked public file'
assert sum(p.stat().st_size for p in files) <= 5 * 1024 * 1024, 'Public site exceeds the 5 MB packaging budget'
with ZipFile(target, 'w', ZIP_DEFLATED) as archive:
    for file in files:
        archive.writestr(file.relative_to(source).as_posix(), file.read_bytes())
    # Keep existing public PDF links working without retaining duplicate source files.
    for legacy, current in legacy_pdf_aliases.items():
        archive.writestr(legacy, (source / current).read_bytes())
with ZipFile(target) as archive:
    assert archive.testzip() is None
    assert 'index.html' in archive.namelist()
    assert 'js/extras.js' in archive.namelist()
    assert 'js/services-data.js' in archive.namelist()
    assert 'js/premium.js' in archive.namelist()
    assert '_headers' in archive.namelist()
    assert set(archive.namelist()) == public_names | set(legacy_pdf_aliases)
    assert not any(name.startswith('admin.') for name in archive.namelist())
    assert len(archive.namelist()) == len(files) + len(legacy_pdf_aliases)
print(f'ZIP verified: {len(files)} files + {len(legacy_pdf_aliases)} compatible PDF aliases, index.html at archive root, {target.stat().st_size} bytes.')
