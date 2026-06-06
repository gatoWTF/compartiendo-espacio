# -*- coding: utf-8 -*-
"""Convierte los documentos Markdown del entregable a PDF y el SVG a PDF/PNG."""
import os, re, sys
import markdown as md
from xhtml2pdf import pisa

BASE = os.path.dirname(os.path.abspath(__file__))

EMOJI = {
    "✅": "[OK]", "⚠️": "[!]", "❌": "[X]", "🟢": "(verde)", "🟡": "(amarillo)",
    "🔴": "(rojo)", "⚫": "(gris)", "▶": ">", "│": "|", "─": "-", "├": "+",
    "└": "+", "▼": "v", "→": "->", "←": "<-", "☝️": "", "🎉": "", "🔎": "",
    "📦": "", "🛠️": "", "🔧": "", "•": "-",
}
def de_emoji(s):
    for k, v in EMOJI.items():
        s = s.replace(k, v)
    # quita cualquier emoji residual fuera del BMP imprimible
    return "".join(ch for ch in s if ord(ch) < 0x2190 or ch in "—…“”‘’áéíóúñÁÉÍÓÚÑ¿¡üÜ")

CSS = """
@page { size: a4 portrait; margin: 1.8cm; }
body { font-family: Helvetica; font-size: 10pt; color:#222; line-height:1.45; }
h1 { font-size:18pt; color:#0f172a; margin:0 0 4pt; }
h2 { font-size:13.5pt; color:#1e3a8a; border-bottom:1px solid #cbd5e1; padding-bottom:2pt; margin-top:14pt; }
h3 { font-size:11pt; color:#0e7490; margin-top:10pt; }
p, li { font-size:10pt; }
code { font-family:Courier; background:#f1f5f9; font-size:8.5pt; }
pre { font-family:Courier; background:#f1f5f9; font-size:8pt; padding:6pt; border:1px solid #e2e8f0; }
table { border-collapse:collapse; width:100%; margin:6pt 0; }
th, td { border:1px solid #94a3b8; padding:3pt 5pt; font-size:8.5pt; }
th { background:#e2e8f0; font-weight:bold; }
blockquote { color:#475569; border-left:3px solid #cbd5e1; padding-left:8pt; margin-left:0; }
hr { border:0; border-top:1px solid #cbd5e1; }
"""

def md_to_pdf(md_path, pdf_path):
    with open(md_path, encoding="utf-8") as f:
        text = de_emoji(f.read())
    html_body = md.markdown(text, extensions=["tables", "fenced_code", "sane_lists"])
    html = f"<html><head><meta charset='utf-8'><style>{CSS}</style></head><body>{html_body}</body></html>"
    with open(pdf_path, "wb") as out:
        res = pisa.CreatePDF(html, dest=out, encoding="utf-8")
    return not res.err

DOCS = [
    ("00_LEEME_ENTREGA.md", "00_LEEME_ENTREGA.pdf"),
    ("02_Descripcion_Persistencia.md", "02_Descripcion_Persistencia.pdf"),
    ("03_Informe_Pruebas_Unitarias.md", "03_Informe_Pruebas_Unitarias.pdf"),
    ("05_Defensa_Oral_Guia.md", "05_Defensa_Oral_Guia.pdf"),
]

ok = True
for src, dst in DOCS:
    sp, dp = os.path.join(BASE, src), os.path.join(BASE, dst)
    try:
        good = md_to_pdf(sp, dp)
        print(f"PDF {'OK ' if good else 'ERR'} {dst}")
        ok = ok and good
    except Exception as e:
        print(f"PDF ERR {dst}: {e}"); ok = False

# SVG -> PDF y PNG
try:
    from svglib.svglib import svg2rlg
    from reportlab.graphics import renderPDF, renderPM
    svg = os.path.join(BASE, "01_Diagrama_Arquitectura", "arquitectura.svg")
    drawing = svg2rlg(svg)
    renderPDF.drawToFile(drawing, os.path.join(BASE, "01_Diagrama_Arquitectura", "arquitectura.pdf"))
    print("PDF OK  arquitectura.pdf")
    try:
        renderPM.drawToFile(drawing, os.path.join(BASE, "01_Diagrama_Arquitectura", "arquitectura.png"), fmt="PNG", dpi=144)
        print("PNG OK  arquitectura.png")
    except Exception as e:
        print(f"PNG ERR arquitectura.png: {e}")
except Exception as e:
    print(f"SVG ERR: {e}"); ok = False

sys.exit(0 if ok else 1)
