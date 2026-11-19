from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[3]
source = root / 'web/dist'
target = root / 'entregas/raylab/raylab-web-hosting.zip'
target.parent.mkdir(parents=True, exist_ok=True)
public_names = {
    'css/contrast.css', '_redirects',
    'img/raylab-wordmark-dark.svg', 'img/raylab-wordmark-light.svg',
    'legal/privacidad.html', 'legal/eliminacion-datos.html', 'css/legal.css', '404.html',
    'css/service-previews.css', 'js/service-previews.js', 'css/reference.css', 'js/reference.js', 'css/theme.css', 'js/theme.js', 'index.html', 'img/logo.svg', 'css/style.css', 'css/brand.css', 'css/extras.css',
    'css/motion.css', 'css/premium.css', 'css/experience.css', 'css/whatsapp.css',
    'js/script.js', 'js/extras.js', 'js/motion.js', 'js/premium.js', 'js/experience.js',
    'js/services-data.js', 'js/services-core.js', 'js/services.js',
    'js/whatsapp-core.js', 'js/whatsapp.js', '_headers', 'css/founder.css', 'js/offers.js', 'css/responsive.css',
    'documentos/raylab-servicios.pdf', 'documentos/raylab-odoo.pdf',
    'documentos/raylab-webs.pdf', 'documentos/raylab-sistemas.pdf', 'documentos/raylab-microapps.pdf',
}
public_names.update(f'img/technologies/{name}.svg' for name in ('odoo', 'odoo-icon', 'python', 'postgresql', 'html5', 'css3', 'javascript', 'whatsapp', 'cloudflare'))
public_names.update(f'servicios/servicio-{name}.html' for name in ('odoo','web','whatsapp','microapps','ads','analytics','nfc'))
public_names.update(('css/service-page.css','js/service-page.js','css/service-visuals.css'))
public_names.update(('css/service-icons.css','js/service-icons.js'))
public_names.update(f'img/services/{name}-visual.webp' for name in ('odoo','web','whatsapp','microapps','ads','analytics','nfc'))
public_names.update(f'img/services/{name}.svg' for name in ('meta','google-ads','analytics','nfc'))

public_names.add('css/companies.css')
public_names.add('css/tech-core.css')
public_names.add('css/solution-story.css')
public_names.add('css/solution-dark.css')
public_names.add('css/theme-controls.css')
public_names.add('css/client-experience.css')
public_names.add('css/legal-editorial.css')
public_names.add('js/legal.js')
public_names.add('css/about-company.css')
public_names.update(('comercial/cotizacion.html','css/quotation.css','js/quotation-core.js','js/quotation.js'))
public_names.add('img/raylab-lettering.svg')
public_names.update(f'fonts/{name}' for name in ('dm-sans.woff','space-grotesk.woff','dm-sans-license.txt','space-grotesk-license.txt'))
public_names.update(f'img/companies/{name}.png' for name in ('vex','taprofile','digilab','sos'))
public_names.update(('img/companies/logica.png','img/companies/union-corp.png'))
public_names.update(('comercial/catalogo.html', 'css/catalogo.css', 'js/catalogo.js', 'documentos/raylab-catalogo.pdf', 'img/catalogo/logo.png'))
public_names.update(f'img/catalogo/{name}-visual.jpg' for name in ('odoo','web','whatsapp','microapps','ads','analytics','nfc'))
files = sorted(source / name for name in public_names)
legacy_pdf_aliases = {name.replace('raylab-', 'raylio-'): name for name in public_names if name.startswith('documentos/raylab-') and name != 'documentos/raylab-catalogo.pdf'}
assert all(p.is_file() and not p.is_symlink() for p in files), 'Missing or linked public file'
assert sum(p.stat().st_size for p in files) <= 10 * 1024 * 1024, 'Public site including the downloadable catalogue exceeds the 10 MB packaging budget'
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
