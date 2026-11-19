"""Render actual generated raster artwork for each service."""
from html import escape

def render_visual(key):
    descriptions={
        'odoo':'Gestión empresarial con Odoo, inventario e información conectada.',
        'web':'Diseño de una página de negocio en computadora y celular.',
        'whatsapp':'Atención de consultas y documentos con un agente de WhatsApp.',
        'microapps':'Aplicación de reservas enfocada en una tarea de negocio.',
        'ads':'Campañas digitales con anuncios y un recorrido hacia el contacto.',
        'analytics':'Análisis de actividad web con gráficos y eventos de medición.',
        'nfc':'Tarjeta NFC y perfil digital de negocio en un smartphone.'
    }
    logos={
        'odoo':[('technologies/odoo','Odoo')],
        'web':[('technologies/html5','HTML5'),('technologies/css3','CSS3'),('technologies/javascript','JavaScript')],
        'whatsapp':[('technologies/whatsapp','WhatsApp')],
        'microapps':[('technologies/python','Python'),('technologies/javascript','JavaScript')],
        'ads':[('services/meta','Meta'),('services/google-ads','Google Ads')],
        'analytics':[('services/analytics','Google Analytics')],
        'nfc':[('services/nfc','NFC')]
    }
    brands=''.join('<img src="img/'+path+'.svg" alt="'+name+'" width="46" height="46">' for path,name in logos[key])
    return '<figure class="service-artwork"><div class="service-artwork-scene"><img class="service-artwork-image" src="img/services/'+key+'-visual.webp" alt="'+escape(descriptions[key],quote=True)+'" width="1536" height="1024" loading="lazy" decoding="async"><div class="service-artwork-brands" aria-label="Tecnologías del servicio">'+brands+'</div></div><figcaption>Ilustración del servicio · Raylab Soluciones Digitales</figcaption></figure>'
