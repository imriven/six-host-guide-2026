import json
import re
from datetime import datetime, timedelta
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "SIX-2026-Run-of-Show.pdf"
source = (ROOT / "src" / "App.tsx").read_text().split("const release:", 1)[0]
pattern = re.compile(r'\[\s*"([^"]+)",\s*"([^"]+)",\s*"[^"]+",\s*"[^"]+",\s*"([^"]+)"', re.S)
games = [{"title": a, "developer": b, "overview": c} for a, b, c in pattern.findall(source)]
if len(games) != 41:
    raise RuntimeError(f"Expected 41 games, found {len(games)}")

host_pairs = ["A & B", "B & C", "C & D", "D & E", "E & F", "F & A"]
cursor = datetime(2026, 1, 1, 10, 0)
next_ad = cursor.replace(hour=11, minute=0)
rows = []

def stamp(value):
    return value.strftime("%-I:%M %p")

def add(kind, segment, start, end, hosts, title, developer, notes):
    rows.append({"kind": kind, "segment": segment, "start": stamp(start), "end": stamp(end), "hosts": hosts, "title": title, "developer": developer, "notes": notes})

# Segment 1: five-minute opening.
end = cursor + timedelta(minutes=5)
add("Intro", "1", cursor, end, "A & B", "Opening / Welcome to SIX 2026", "Seattle Indies", "Welcome viewers, introduce the event and hosts, explain the showcase format, and lead into the first game.")
cursor = end
end = cursor + timedelta(minutes=2)
add("Transition", "", cursor, end, "-", "Break / Transition", "", "Prepare the first developer and game feed.")
cursor = end

for game_index, game in enumerate(games):
    segment_number = game_index + 2
    # Segment 1 uses A & B, so Segment 2 continues the rotation with B & C.
    hosts = host_pairs[(game_index + 1) % len(host_pairs)]
    end = cursor + timedelta(minutes=6)
    add("Game", str(segment_number), cursor, end, hosts, game["title"], game["developer"], "Six-minute developer interview. Availability, guest names, pronunciation, questions, impressions, and talking points: TBD.")
    cursor = end

    # The first completed interview after each clock hour carries the ad read.
    if cursor >= next_ad:
        end = cursor + timedelta(minutes=2)
        add("Ad", "", cursor, end, hosts, "Seattle Indies / Sponsor Ad Read", "Sponsor copy pending", f"Read by Hosts {hosts}, from the preceding game segment. Return by thanking sponsors and preparing the transition.")
        cursor = end
        while next_ad <= cursor:
            next_ad += timedelta(hours=1)

    # Transitions are between numbered segments and are never numbered.
    end = cursor + timedelta(minutes=2)
    transition_note = "Thank the developer, reset the stage and feed, and prepare the closing." if game_index == len(games) - 1 else "Thank the developer, reset the stage and feed, and prepare the next host pair."
    add("Transition", "", cursor, end, "-", "Break / Transition", "", transition_note)
    cursor = end

# Final five-minute closing mirrors the opening segment.
end = cursor + timedelta(minutes=5)
add("Closing", "43", cursor, end, host_pairs[(43 - 1) % len(host_pairs)], "Closing / Thank You", "Seattle Indies", "Thank developers, sponsors, hosts, production, and viewers; share final Seattle Indies information and close the broadcast.")
cursor = end

styles = getSampleStyleSheet()
body = ParagraphStyle("body", parent=styles["BodyText"], fontName="Helvetica", fontSize=6.6, leading=8.0, textColor=colors.HexColor("#202028"))
header = ParagraphStyle("header", parent=body, fontName="Helvetica-Bold", textColor=colors.white, fontSize=7, leading=8)
game_style = ParagraphStyle("game", parent=body, fontName="Helvetica-Bold", textColor=colors.HexColor("#7445C7"))
break_style = ParagraphStyle("break", parent=body, fontName="Helvetica-Oblique", textColor=colors.HexColor("#66616E"))
special_style = ParagraphStyle("special", parent=body, fontName="Helvetica-Bold", textColor=colors.HexColor("#202028"))
title_style = ParagraphStyle("title", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=18, leading=20, textColor=colors.HexColor("#7445C7"), spaceAfter=2)
subtitle_style = ParagraphStyle("subtitle", parent=body, fontName="Helvetica-Bold", fontSize=10, textColor=colors.HexColor("#D64524"), spaceAfter=5)

doc = SimpleDocTemplate(str(OUT), pagesize=landscape(letter), rightMargin=.32*inch, leftMargin=.32*inch, topMargin=.30*inch, bottomMargin=.30*inch)
story = [
    Paragraph("Seattle Indies Expo - SIX 2026", title_style),
    Paragraph("Run of Show - Rough Draft", subtitle_style),
    Paragraph("Host A = TBD &nbsp;&nbsp;|&nbsp;&nbsp; Host B = TBD &nbsp;&nbsp;|&nbsp;&nbsp; Host C = TBD &nbsp;&nbsp;|&nbsp;&nbsp; Host D = TBD &nbsp;&nbsp;|&nbsp;&nbsp; Host E = TBD &nbsp;&nbsp;|&nbsp;&nbsp; Host F = TBD", body),
    Spacer(1, 7),
]
headers = ["SEG", "GAME / BREAK", "DEVELOPER / PUBLISHER", "START", "END", "HOSTS", "PRODUCTION NOTES"]
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
        Paragraph("&nbsp;", body),
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
    elif row["kind"] == "Transition":
        style.append(("BACKGROUND", (0,index), (-1,index), colors.HexColor("#F2F1F5")))
        style.append(("TEXTCOLOR", (0,index), (-1,index), colors.HexColor("#66616E")))
    elif row["kind"] in ("Intro", "Closing"):
        style.append(("BACKGROUND", (0,index), (-1,index), colors.HexColor("#E4F6D9")))
table.setStyle(TableStyle(style))
story.append(table)
doc.build(story)

ads = [r for r in rows if r["kind"] == "Ad"]
(ROOT / "tmp").mkdir(exist_ok=True)
(ROOT / "tmp" / "approved_run_of_show.json").write_text(json.dumps(rows, indent=2))
print({"numbered_segments": 43, "total_rows": len(rows), "ads": len(ads), "end": rows[-1]["end"], "ad_hosts": [(r["start"], r["hosts"]) for r in ads]})
