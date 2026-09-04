from pathlib import Path
from xml.sax.saxutils import escape

from xlsx_to_json import load_workbook_data

from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "SIX-2026-Run-of-Show.pdf"
_, generated_run_of_show = load_workbook_data()
rows = [
    {
        "kind": str(item["kind"]).title(),
        "segment": str(item["segmentNumber"] or ""),
        "start": str(item["start"]),
        "end": str(item["end"]),
        "hosts": str(item["hosts"]),
        "title": str(item["title"]),
        "developer": str(item["developer"]),
        "notes": str(item["productionNotes"]),
    }
    for item in generated_run_of_show["items"]
]

styles = getSampleStyleSheet()
body = ParagraphStyle("body", parent=styles["BodyText"], fontName="Helvetica", fontSize=6.6, leading=8.0, textColor=colors.HexColor("#202028"))
header = ParagraphStyle("header", parent=body, fontName="Helvetica-Bold", textColor=colors.white, fontSize=7, leading=8)
game_style = ParagraphStyle("game", parent=body, fontName="Helvetica-Bold", textColor=colors.HexColor("#7445C7"))
break_style = ParagraphStyle("break", parent=body, fontName="Helvetica-Oblique", textColor=colors.HexColor("#66616E"))
special_style = ParagraphStyle("special", parent=body, fontName="Helvetica-Bold", textColor=colors.HexColor("#202028"))
title_style = ParagraphStyle("title", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=18, leading=20, textColor=colors.HexColor("#7445C7"), spaceAfter=2)
subtitle_style = ParagraphStyle("subtitle", parent=body, fontName="Helvetica-Bold", fontSize=10, textColor=colors.HexColor("#D64524"), spaceAfter=5)
host_note = escape(str(generated_run_of_show["hostNote"])).replace(
    " | ", " &nbsp;&nbsp;|&nbsp;&nbsp; "
)

doc = SimpleDocTemplate(str(OUT), pagesize=landscape(letter), rightMargin=.32*inch, leftMargin=.32*inch, topMargin=.30*inch, bottomMargin=.30*inch)
story = [
    Paragraph("Seattle Indies Expo - SIX 2026", title_style),
    Paragraph("Run of Show - Rough Draft", subtitle_style),
    Paragraph(host_note, body),
    Spacer(1, 7),
]
headers = ["SEG", "GAME / BREAK", "DEVELOPER / PUBLISHER", "START", "END", "HOST", "PRODUCTION NOTES"]
data = [[Paragraph(h, header) for h in headers]]
for row in rows:
    if row["kind"] == "Game":
        title_cell = Paragraph(row["title"].replace("&", "&amp;"), game_style)
    elif row["kind"] == "Transition":
        title_cell = Paragraph(row["title"].replace("&", "&amp;"), break_style)
    else:
        title_cell = Paragraph(row["title"].replace("&", "&amp;"), special_style)
    data.append([
        Paragraph(row["segment"] or "-", body),
        title_cell,
        Paragraph(row["developer"].replace("&", "&amp;"), body),
        Paragraph(row["start"], body),
        Paragraph(row["end"], body),
        Paragraph(row["hosts"].replace("&", "&amp;"), body),
        Paragraph(row["notes"].replace("&", "&amp;") or "&nbsp;", body),
    ])

table = Table(data, colWidths=[.38*inch, 1.72*inch, 1.45*inch, .70*inch, .70*inch, .62*inch, 4.76*inch], repeatRows=1)
style = [
    ("BACKGROUND", (0,0), (-1,0), colors.HexColor("#7445C7")),
    ("GRID", (0,0), (-1,-1), .3, colors.HexColor("#CBC9D1")),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("LEFTPADDING", (0,0), (-1,-1), 3.5),
    ("RIGHTPADDING", (0,0), (-1,-1), 3.5),
    ("TOPPADDING", (0,0), (-1,-1), 3.5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 3.5),
]
for index, row in enumerate(rows, start=1):
    if row["kind"] == "Ad":
        style.append(("BACKGROUND", (0,index), (-1,index), colors.HexColor("#EADCF4")))
    elif row["kind"] == "Hype":
        style.append(("BACKGROUND", (0,index), (-1,index), colors.HexColor("#FCE4D6")))
        style.append(("TEXTCOLOR", (0,index), (-1,index), colors.HexColor("#C2410C")))
    elif row["kind"] == "Transition":
        style.append(("BACKGROUND", (0,index), (-1,index), colors.HexColor("#F2F1F5")))
        style.append(("TEXTCOLOR", (0,index), (-1,index), colors.HexColor("#66616E")))
    elif row["kind"] in ("Intro", "Closing"):
        style.append(("BACKGROUND", (0,index), (-1,index), colors.HexColor("#E4F6D9")))
table.setStyle(TableStyle(style))
story.append(table)
doc.build(story)

ads = [r for r in rows if r["kind"] == "Ad"]
print({"numbered_segments": 43, "total_rows": len(rows), "ads": len(ads), "end": rows[-1]["end"], "ad_hosts": [(r["start"], r["hosts"]) for r in ads]})
