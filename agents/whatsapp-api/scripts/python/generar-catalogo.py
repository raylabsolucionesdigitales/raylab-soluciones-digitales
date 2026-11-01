"""Genera las cinco fichas comerciales públicas con la marca de empresa.json."""
from pathlib import Path
import json
from xml.sax.saxutils import escape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, white

HERE = Path(__file__).resolve().parents[2]
ROOT = HERE.parents[1]
DEST = ROOT / 'sites/raylab/dist/documentos'
DEST.mkdir(exist_ok=True)
catalog = json.loads((HERE / 'config/catalogo.json').read_text(encoding='utf-8'))
business = json.loads((HERE / 'config/empresa.json').read_text(encoding='utf-8'))
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='Copy', fontName='Helvetica', fontSize=10, leading=16, spaceAfter=10, textColor=HexColor('#241b37')))
styles.add(ParagraphStyle(name='TitleRaylab', fontName='Helvetica-Bold', fontSize=25, leading=30, spaceAfter=18, textColor=HexColor('#7845D8')))
styles.add(ParagraphStyle(name='SectionRaylab', fontName='Helvetica-Bold', fontSize=12, leading=17, spaceBefore=13, spaceAfter=8, textColor=HexColor('#7845D8')))
def page(canvas, doc):
    canvas.setFillColor(HexColor('#100b20'))
    canvas.rect(0, 772, 595, 70, fill=1, stroke=0)
    canvas.setFillColor(white)
    canvas.setFont('Helvetica-Bold', 17)
    canvas.drawString(45, 803, business['name'].split()[0].upper())
    canvas.setFont('Helvetica', 8)
    canvas.drawString(45, 787, 'SOLUCIONES DIGITALES')
    canvas.setFillColor(HexColor('#655778'))
    canvas.setFont('Helvetica', 8)
    canvas.drawString(45, 35, 'rayliotechsolutions.pages.dev | WhatsApp +51 906 962 740')
    canvas.drawRightString(550, 35, str(doc.page))
for item in catalog:
    story = [Paragraph(escape(item['title']), styles['TitleRaylab']), Paragraph(escape(item['summary']), styles['Copy'])]
    for heading, lines in [('Qué podemos evaluar contigo', item['items']), ('Para entender tu proyecto', item['questions'])]:
        story.append(Paragraph(heading, styles['SectionRaylab']))
        for line in lines:
            story.append(Paragraph('• ' + escape(line), styles['Copy']))
    story += [Paragraph('Alcance y siguiente paso', styles['SectionRaylab']), Paragraph(escape(item['scope']), styles['Copy']), Paragraph('Precios y plazos por evaluación y cotización. Cuéntanos tu necesidad para definir una propuesta; no necesitas tener todos los detalles resueltos.', styles['Copy'])]
    SimpleDocTemplate(str(DEST / f"raylab-{item['id']}.pdf"), pagesize=(595,842), topMargin=98, bottomMargin=60, leftMargin=45, rightMargin=45, title=item['title'], author=business['name']).build(story, onFirstPage=page, onLaterPages=page)
print(f'{len(catalog)} PDF públicos generados. La configuración del agente está en empresa.json.')
