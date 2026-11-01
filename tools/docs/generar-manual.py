"""Genera el PDF interno desde RAYLAB-MANUAL.md. No incluye secretos ni publica nada."""
from pathlib import Path
import re
from xml.sax.saxutils import escape
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Preformatted, PageBreak,
    KeepTogether,
)
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon, Path as VectorPath, Group
import xml.etree.ElementTree as ET
from reportlab.graphics import renderPDF

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'docs/RAYLAB-MANUAL.md'
TARGET = SOURCE.with_suffix('.pdf')
PURPLE = colors.HexColor('#7845D8')
INK = colors.HexColor('#20162F')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='RayBody', fontName='Helvetica', fontSize=9.3, leading=14,
                          textColor=INK, spaceAfter=8, wordWrap='CJK'))
styles.add(ParagraphStyle(name='RayH2', parent=styles['Heading2'], fontSize=16, leading=20,
                          textColor=PURPLE, spaceBefore=18, spaceAfter=10))
styles.add(ParagraphStyle(name='RayH3', parent=styles['Heading3'], fontSize=11, leading=15,
                          textColor=INK, spaceBefore=12, spaceAfter=7))
styles.add(ParagraphStyle(name='RayCell', parent=styles['RayBody'], fontSize=8, leading=11,
                          spaceAfter=2))
styles.add(ParagraphStyle(name='RayCode', fontName='Courier', fontSize=7.1, leading=10,
                          backColor=colors.HexColor('#F3EFF9'), borderPadding=8, spaceAfter=12))

def inline(text):
    text = escape(text)
    text = re.sub(r'`([^`]+)`', r'<font face="Courier">\1</font>', text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)', r'<link href="\2" color="#7845D8">\1</link>', text)
    return text

def flow(title, labels):
    d = Drawing(475, 62 * len(labels) + 35)
    top = d.height - 17
    d.add(String(0, top, title, fontName='Helvetica-Bold', fontSize=12, fillColor=PURPLE))
    for i, label in enumerate(labels):
        y = top - 53 - i * 62
        d.add(Rect(48, y, 378, 40, rx=9, ry=9, fillColor=colors.HexColor('#F0EAF9'), strokeColor=PURPLE))
        d.add(String(237, y + 16, label, textAnchor='middle', fontName='Helvetica', fontSize=10, fillColor=INK))
        if i < len(labels) - 1:
            d.add(Line(237, y, 237, y - 20, strokeColor=PURPLE))
            d.add(Polygon([233, y - 15, 241, y - 15, 237, y - 22], fillColor=PURPLE, strokeColor=PURPLE))
    return d

story = []
try:
    from svglib.svglib import svg2rlg
    logo = svg2rlg(str(ROOT / 'sites/raylab/dist/img/logo.svg'))
    if logo:
        scale = min(90 / logo.width, 90 / logo.height)
        logo.scale(scale, scale)
        logo.width *= scale
        logo.height *= scale
        story.extend([logo, Spacer(1, 24)])
except ImportError:
    # The project's logo only uses these absolute SVG path commands.
    # Keep its real outlines; use solid brand colors in the printed document.
    logo = Drawing(90, 90)
    group = Group(transform=(90 / 840, 0, 0, -90 / 840, -220 * 90 / 840, 1060 * 90 / 840))
    tree = ET.parse(ROOT / 'sites/raylab/dist/img/logo.svg')
    for index, element in enumerate(tree.findall('.//{http://www.w3.org/2000/svg}path')):
        tokens = re.findall(r'[A-Za-z]|[-+]?(?:\d*\.\d+|\d+)', element.attrib['d'])
        path = VectorPath(fillColor=colors.HexColor('#8B5CF6' if index == 0 else '#C4B5FD'), strokeColor=None)
        j, x, y = 0, 0., 0.
        while j < len(tokens):
            command = tokens[j]
            j += 1
            sizes = {'M': 2, 'L': 2, 'H': 1, 'V': 1, 'C': 6, 'Q': 4, 'Z': 0}
            if command not in sizes:
                raise ValueError(f'Unsupported SVG command: {command}')
            count = sizes[command]
            values = [float(v) for v in tokens[j:j + count]]
            j += count
            if command == 'M':
                x, y = values
                path.moveTo(x, y)
            elif command == 'L':
                x, y = values
                path.lineTo(x, y)
            elif command == 'H':
                x = values[0]
                path.lineTo(x, y)
            elif command == 'V':
                y = values[0]
                path.lineTo(x, y)
            elif command == 'C':
                path.curveTo(*values)
                x, y = values[-2:]
            elif command == 'Q':
                qx, qy, endx, endy = values
                path.curveTo(x + 2 / 3 * (qx - x), y + 2 / 3 * (qy - y),
                             endx + 2 / 3 * (qx - endx), endy + 2 / 3 * (qy - endy), endx, endy)
                x, y = endx, endy
            else:
                path.closePath()
        group.add(path)
    logo.add(group)
    story.extend([logo, Spacer(1, 24)])
story.extend([
    Paragraph('RAYLAB', ParagraphStyle(name='Cover', fontName='Helvetica-Bold', fontSize=38, leading=45, textColor=PURPLE)),
    Paragraph('SOLUCIONES DIGITALES', styles['RayH2']),
    Spacer(1, 32),
    Paragraph('Manual del proyecto y del agente de WhatsApp', styles['Title']),
    Spacer(1, 18),
    Paragraph('Web, infraestructura, configuración, errores resueltos y operación.', styles['RayBody']),
    Paragraph('Versión 1.0 · 27 de octubre de 2026 · Uso interno', styles['RayBody']),
    Spacer(1, 24),
    Paragraph('<b>Hito confirmado:</b> respuesta automática directa en WhatsApp con el número de prueba de Meta.', styles['RayBody']),
    Paragraph('El número empresarial, la memoria de conversación y la transferencia humana siguen pendientes. Sin contraseñas ni tokens en este documento.', styles['RayBody']),
    PageBreak(),
    flow('Arquitectura: conversación automática de prueba', [
        'Cliente autorizado escribe por WhatsApp', 'Meta entrega el evento al Worker /webhook',
        'Firma validada + mensaje guardado en D1', 'Workers AI genera una respuesta de Raylab',
        'D1 reclama el intento y evita duplicados', 'Graph API acepta el envío', 'Cliente recibe la respuesta en WhatsApp',
    ]),
    Spacer(1, 16),
    Paragraph('Diagrama explicativo elaborado para el manual; no es una captura del panel.', styles['RayBody']),
    PageBreak(),
    flow('La solución del bloqueo de recepción', [
        'messages: Suscrito en el panel de la app', 'GET WABA/subscribed_apps: Raylab no estaba',
        'POST WABA/subscribed_apps con token de Raylab', 'GET de comprobación: RAYLAB_SUSCRITA=True',
        'Nueva consulta directa por WhatsApp: respondió',
    ]),
    Spacer(1, 16),
    Paragraph('Son dos suscripciones distintas. Una prueba sintética correcta no comprobaba la vinculación del WABA.', styles['RayBody']),
    PageBreak(),
])

lines = SOURCE.read_text(encoding='utf-8').splitlines()
i = 0
while i < len(lines):
    line = lines[i].strip()
    if not line or line.startswith('# '):
        i += 1
        continue
    if line.startswith('```'):
        i += 1
        block = []
        while i < len(lines) and not lines[i].startswith('```'):
            # Wrap only long prose/code lines to keep content inside the page.
            value = lines[i]
            while len(value) > 100:
                split = value.rfind(' ', 0, 100)
                if split < 30:
                    split = 100
                block.append(value[:split])
                value = value[split:].lstrip()
            block.append(value)
            i += 1
        story.append(Preformatted('\n'.join(block), styles['RayCode']))
        i += 1
        continue
    if line.startswith('|'):
        rows = []
        while i < len(lines) and lines[i].strip().startswith('|'):
            cells = [x.strip() for x in lines[i].strip().strip('|').split('|')]
            if not all(re.fullmatch(r':?-+:?', x.replace(' ', '')) for x in cells):
                rows.append([Paragraph(inline(x), styles['RayCell']) for x in cells])
            i += 1
        table = Table(rows, colWidths=[475 / len(rows[0])] * len(rows[0]), repeatRows=1, hAlign='LEFT')
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E8DEF7')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#FAF8FC')]),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('GRID', (0, 0), (-1, -1), .3, colors.HexColor('#D8CCE8')),
            ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ]))
        story.extend([table, Spacer(1, 12)])
        continue
    if line.startswith('### '):
        story.append(Paragraph(inline(line[4:]), styles['RayH3']))
    elif line.startswith('## '):
        story.append(Paragraph(inline(line[3:]), styles['RayH2']))
    elif line.startswith('- '):
        story.append(Paragraph('• ' + inline(line[2:]), styles['RayBody']))
    else:
        story.append(Paragraph(inline(line), styles['RayBody']))
    i += 1

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(colors.HexColor('#D8CCE8'))
    canvas.line(50, 44, 545, 44)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(INK)
    canvas.drawString(50, 30, 'Raylab Soluciones Digitales · Uso interno · 27/10/2026')
    canvas.drawRightString(545, 30, str(doc.page))
    canvas.restoreState()

doc = SimpleDocTemplate(str(TARGET), pagesize=(595.28, 841.89), leftMargin=55, rightMargin=55,
                        topMargin=48, bottomMargin=62, title='Raylab Soluciones Digitales — Manual del proyecto',
                        author='Raylab Soluciones Digitales', pageCompression=1)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(f'PDF generado: {TARGET.name} ({TARGET.stat().st_size} bytes)')
