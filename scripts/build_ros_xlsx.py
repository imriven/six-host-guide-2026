"""Add the app's game-guide data to the run-of-show workbook.

The existing ``Run of Show`` worksheet is treated as the production-owned
template and is preserved.  This script extracts the currently hardcoded game
metadata from the TypeScript sources and adds (or replaces) a worksheet named
``descriptions``.  It intentionally uses only Python's standard library so the
workbook can be regenerated without installing another package.
"""

from __future__ import annotations

import json
import re
import shutil
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET
from xml.sax.saxutils import escape, quoteattr


ROOT = Path(__file__).resolve().parents[1]
APP_SOURCE = ROOT / "src" / "App.tsx"
DESCRIPTION_SOURCE = ROOT / "src" / "fullDescriptions.ts"
WORKBOOK = ROOT / "public" / "SIX-2026-Run-of-Show.xlsx"
DESCRIPTION_SHEET_NAME = "descriptions"

MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PACKAGE_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
CONTENT_NS = "http://schemas.openxmlformats.org/package/2006/content-types"
WORKSHEET_REL_TYPE = f"{REL_NS}/worksheet"
WORKSHEET_CONTENT_TYPE = (
    "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"
)

STRING = r'"((?:[^"\\]|\\.)*)"'
ROW_PATTERN = re.compile(
    rf"\[\s*{STRING}\s*,\s*{STRING}\s*,\s*{STRING}\s*,\s*{STRING}\s*,\s*{STRING}"
    rf"(?:\s*,\s*(undefined|true|false))?"
    rf"(?:\s*,\s*{STRING})?\s*,?\s*\]",
    re.DOTALL,
)
PAIR_PATTERN = re.compile(
    rf'(?:{STRING}|([A-Za-z_$][A-Za-z0-9_$]*))\s*:\s*{STRING}', re.DOTALL
)
RELEASE_PATTERN = re.compile(
    rf'(?:{STRING}|([A-Za-z_$][A-Za-z0-9_$]*))\s*:\s*'
    rf'\[\s*{STRING}\s*,\s*{STRING}\s*\]',
    re.DOTALL,
)


def ts_string(value: str) -> str:
    """Decode a captured TypeScript double-quoted string."""

    return json.loads(f'"{value}"')


def source_block(source: str, start: str, end: str) -> str:
    try:
        return source.split(start, 1)[1].split(end, 1)[0]
    except IndexError as exc:
        raise RuntimeError(f"Could not find source block between {start!r} and {end!r}") from exc


def parse_pairs(block: str) -> dict[str, str]:
    values: dict[str, str] = {}
    for match in PAIR_PATTERN.finditer(block):
        quoted_key, bare_key, raw_value = match.groups()
        key = ts_string(quoted_key) if quoted_key is not None else bare_key
        values[key] = ts_string(raw_value)
    return values


def parse_release(block: str) -> dict[str, tuple[str, str]]:
    values: dict[str, tuple[str, str]] = {}
    for match in RELEASE_PATTERN.finditer(block):
        quoted_key, bare_key, raw_release, raw_demo = match.groups()
        key = ts_string(quoted_key) if quoted_key is not None else bare_key
        values[key] = (ts_string(raw_release), ts_string(raw_demo))
    return values


def parse_string_set(block: str) -> set[str]:
    return {ts_string(value) for value in re.findall(STRING, block, re.DOTALL)}


def normalize_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.casefold())


def lookup_normalized(values: dict[str, tuple[str, str]], title: str) -> tuple[str, str]:
    normalized = {normalize_key(key): value for key, value in values.items()}
    return normalized.get(normalize_key(title), ("In development", "Not confirmed"))


def clean_platforms(title: str, raw_platforms: str, steam_ids: dict[str, str]) -> str:
    if title in {"Breach Of Contract", "Feeding Gooble"}:
        return "itch.io"

    items = raw_platforms.split(", ")
    labels: list[str] = []
    if "Steam" in items or title in steam_ids:
        labels.append("Steam")
    if "Mobile" in items:
        labels.append("Mobile")
    if any(item in {"PS5", "PlayStation"} for item in items):
        labels.append("PlayStation")
    if any(item in {"Xbox Series", "Xbox"} for item in items):
        labels.append("Xbox")
    if any(item in {"Switch 2", "Switch"} for item in items):
        labels.append("Switch")
    return ", ".join(labels)


def load_games() -> list[dict[str, str]]:
    app = APP_SOURCE.read_text(encoding="utf-8")
    descriptions_source = DESCRIPTION_SOURCE.read_text(encoding="utf-8")

    rows_block = source_block(app, "const rows:", "const release:")
    release_block = source_block(app, "const release:", "const released")
    released_block = source_block(app, "const released", "const mediaSlug")
    media_slug_block = source_block(app, "const mediaSlug", "const mediaFolder")
    media_folder_block = source_block(app, "const mediaFolder", "const videoIds")
    video_block = source_block(app, "const videoIds", "const steamIds")
    steam_block = source_block(app, "const steamIds", "const cleanPlatforms")

    release = parse_release(release_block)
    released = parse_string_set(released_block)
    media_slugs = parse_pairs(media_slug_block)
    media_folders = parse_pairs(media_folder_block)
    video_ids = parse_pairs(video_block)
    steam_ids = parse_pairs(steam_block)
    descriptions = parse_pairs(descriptions_source)

    games: list[dict[str, str]] = []
    for match in ROW_PATTERN.finditer(rows_block):
        (
            raw_title,
            raw_developer,
            raw_platforms,
            raw_source_status,
            raw_overview,
            raw_online,
            raw_url,
        ) = match.groups()
        title = ts_string(raw_title)
        platforms = ts_string(raw_platforms)
        release_date, demo = lookup_normalized(release, title)
        fallback_slug = re.sub(r"[^a-z0-9]+", "", title.casefold())
        online = "" if raw_online in {None, "undefined"} else raw_online
        official_url = ts_string(raw_url) if raw_url is not None else ""
        overview = ts_string(raw_overview)

        games.append(
            {
                "Name": title,
                "Developer / Publisher": ts_string(raw_developer),
                "Platforms (source)": platforms,
                "Platforms (shown)": clean_platforms(title, platforms, steam_ids),
                "Availability": "Released" if title in released else "Not yet released",
                "Release": release_date,
                "Demo / Build": demo,
                "Quick Overview": overview,
                "Full Description": descriptions.get(title, overview),
                "Official URL": official_url,
                "Steam App ID": steam_ids.get(title, ""),
                "YouTube Video ID": video_ids.get(title, ""),
                "Media Slug": media_slugs.get(title, fallback_slug),
                "Media Folder": media_folders.get(title, fallback_slug),
                "Online flag": online,
                "Legacy source status": ts_string(raw_source_status),
            }
        )

    if len(games) != 41:
        raise RuntimeError(f"Expected 41 games, found {len(games)}")
    names = [game["Name"] for game in games]
    if len(names) != len(set(names)):
        raise RuntimeError("Game names must be unique")
    missing_descriptions = sorted(set(names) - descriptions.keys())
    if missing_descriptions:
        raise RuntimeError(f"Missing full descriptions: {', '.join(missing_descriptions)}")
    missing_videos = sorted(set(names) - video_ids.keys())
    if missing_videos:
        raise RuntimeError(f"Missing YouTube video IDs: {', '.join(missing_videos)}")
    return games


def excel_column(index: int) -> str:
    letters = ""
    while index:
        index, remainder = divmod(index - 1, 26)
        letters = chr(65 + remainder) + letters
    return letters


def cell(reference: str, value: str, style: int) -> str:
    preserve = ' xml:space="preserve"' if value != value.strip() else ""
    return (
        f'<c r={quoteattr(reference)} s={quoteattr(str(style))} t="inlineStr">'
        f"<is><t{preserve}>{escape(value)}</t></is></c>"
    )


def descriptions_sheet(games: list[dict[str, str]]) -> bytes:
    headers = list(games[0])
    last_column = excel_column(len(headers))
    last_row = len(games) + 3
    widths = [
        27,
        30,
        25,
        24,
        20,
        23,
        31,
        56,
        82,
        42,
        16,
        19,
        25,
        25,
        13,
        22,
    ]
    cols = "".join(
        f'<col min="{index}" max="{index}" width="{width}" customWidth="1" />'
        for index, width in enumerate(widths, start=1)
    )

    title_cells = [cell("A1", "SIX 2026 | Game Guide Data", 2)]
    subtitle_cells = [
        cell(
            "A2",
            "Editable game metadata currently mirrored from src/App.tsx and src/fullDescriptions.ts",
            4,
        )
    ]
    header_cells = [
        cell(f"{excel_column(index)}3", header, 9)
        for index, header in enumerate(headers, start=1)
    ]
    rows = [
        f'<row r="1" ht="30" customHeight="1">{"".join(title_cells)}</row>',
        f'<row r="2" ht="24" customHeight="1">{"".join(subtitle_cells)}</row>',
        f'<row r="3" ht="32" customHeight="1">{"".join(header_cells)}</row>',
    ]
    for row_number, game in enumerate(games, start=4):
        values = [
            cell(f"{excel_column(index)}{row_number}", str(game[header]), 17)
            for index, header in enumerate(headers, start=1)
        ]
        rows.append(
            f'<row r="{row_number}" ht="84" customHeight="1">{"".join(values)}</row>'
        )

    xml = (
        '<?xml version="1.0" encoding="utf-8"?>'
        f'<worksheet xmlns="{MAIN_NS}">'
        f'<dimension ref="A1:{last_column}{last_row}" />'
        '<sheetViews><sheetView showGridLines="0" workbookViewId="0">'
        '<pane ySplit="3" topLeftCell="A4" activePane="bottomLeft" state="frozen" />'
        '</sheetView></sheetViews>'
        '<sheetFormatPr defaultRowHeight="15" />'
        f"<cols>{cols}</cols>"
        f'<sheetData>{"".join(rows)}</sheetData>'
        f'<autoFilter ref="A3:{last_column}{last_row}" />'
        f'<mergeCells count="2"><mergeCell ref="A1:{last_column}1" />'
        f'<mergeCell ref="A2:{last_column}2" /></mergeCells>'
        '</worksheet>'
    )
    return xml.encode("utf-8")


def replace_descriptions_sheet(games: list[dict[str, str]]) -> None:
    if not WORKBOOK.exists():
        raise RuntimeError(f"Workbook template does not exist: {WORKBOOK}")

    ET.register_namespace("x", MAIN_NS)
    ET.register_namespace("r", REL_NS)
    ET.register_namespace("", PACKAGE_REL_NS)

    with zipfile.ZipFile(WORKBOOK, "r") as source_zip:
        archive = {name: source_zip.read(name) for name in source_zip.namelist()}

    workbook_root = ET.fromstring(archive["xl/workbook.xml"])
    rels_root = ET.fromstring(archive["xl/_rels/workbook.xml.rels"].decode("utf-8-sig"))
    content_root = ET.fromstring(archive["[Content_Types].xml"].decode("utf-8-sig"))
    sheets = workbook_root.find(f"{{{MAIN_NS}}}sheets")
    if sheets is None:
        raise RuntimeError("Workbook has no sheets collection")

    removed_paths: set[str] = set()
    for sheet in list(sheets):
        if sheet.get("name") != DESCRIPTION_SHEET_NAME:
            continue
        relation_id = sheet.get(f"{{{REL_NS}}}id")
        sheets.remove(sheet)
        for relation in list(rels_root):
            if relation.get("Id") == relation_id:
                target = relation.get("Target", "").lstrip("/")
                if not target.startswith("xl/"):
                    target = f"xl/{target}"
                removed_paths.add(target)
                rels_root.remove(relation)

    for override in list(content_root):
        part_name = override.get("PartName", "").lstrip("/")
        if part_name in removed_paths:
            content_root.remove(override)

    existing_sheet_numbers = [
        int(match.group(1))
        for name in archive
        if (match := re.fullmatch(r"xl/worksheets/sheet(\d+)\.xml", name))
        and name not in removed_paths
    ]
    sheet_number = max(existing_sheet_numbers, default=0) + 1
    sheet_path = f"xl/worksheets/sheet{sheet_number}.xml"
    relationship_id = "rIdDescriptions"
    used_relation_ids = {relation.get("Id") for relation in rels_root}
    suffix = 2
    while relationship_id in used_relation_ids:
        relationship_id = f"rIdDescriptions{suffix}"
        suffix += 1

    used_sheet_ids = [int(sheet.get("sheetId", "0")) for sheet in sheets]
    ET.SubElement(
        sheets,
        f"{{{MAIN_NS}}}sheet",
        {
            "name": DESCRIPTION_SHEET_NAME,
            "sheetId": str(max(used_sheet_ids, default=0) + 1),
            f"{{{REL_NS}}}id": relationship_id,
        },
    )
    ET.SubElement(
        rels_root,
        f"{{{PACKAGE_REL_NS}}}Relationship",
        {
            "Type": WORKSHEET_REL_TYPE,
            "Target": f"/{sheet_path}",
            "Id": relationship_id,
        },
    )
    ET.SubElement(
        content_root,
        f"{{{CONTENT_NS}}}Override",
        {"PartName": f"/{sheet_path}", "ContentType": WORKSHEET_CONTENT_TYPE},
    )

    archive["xl/workbook.xml"] = ET.tostring(
        workbook_root, encoding="utf-8", xml_declaration=True
    )
    archive["xl/_rels/workbook.xml.rels"] = ET.tostring(
        rels_root, encoding="utf-8", xml_declaration=True
    )
    archive["[Content_Types].xml"] = ET.tostring(
        content_root, encoding="utf-8", xml_declaration=True
    )
    for removed_path in removed_paths:
        archive.pop(removed_path, None)
    archive[sheet_path] = descriptions_sheet(games)

    with tempfile.NamedTemporaryFile(
        prefix="six-run-of-show-", suffix=".xlsx", dir=WORKBOOK.parent, delete=False
    ) as temporary:
        temporary_path = Path(temporary.name)

    try:
        with zipfile.ZipFile(temporary_path, "w", zipfile.ZIP_DEFLATED) as output_zip:
            for name, payload in archive.items():
                output_zip.writestr(name, payload)
        with zipfile.ZipFile(temporary_path, "r") as check_zip:
            bad_file = check_zip.testzip()
            if bad_file:
                raise RuntimeError(f"Generated workbook contains a corrupt member: {bad_file}")
        shutil.move(temporary_path, WORKBOOK)
    finally:
        temporary_path.unlink(missing_ok=True)


def main() -> None:
    games = load_games()
    replace_descriptions_sheet(games)
    print(
        json.dumps(
            {
                "output": str(WORKBOOK),
                "worksheets": ["Run of Show", DESCRIPTION_SHEET_NAME],
                "description_rows": len(games),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
