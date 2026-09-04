"""Validate the SIX workbook and generate the app's JSON data files."""

from __future__ import annotations

import argparse
import json
import posixpath
import re
import sys
import zipfile
from collections import Counter
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
WORKBOOK = ROOT / "public" / "SIX-2026-Run-of-Show.xlsx"
GENERATED_DIR = ROOT / "src" / "generated"
GAMES_JSON = GENERATED_DIR / "games.json"
RUN_OF_SHOW_JSON = GENERATED_DIR / "runOfShow.json"

MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PACKAGE_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
NS = {"x": MAIN_NS, "r": REL_NS, "p": PACKAGE_REL_NS}

GAME_SHEET = "descriptions"
RUN_SHEET = "Run of Show"
GAME_HEADERS = [
    "Name",
    "Developer / Publisher",
    "Platforms",
    "Display Platforms",
    "Availability",
    "Release",
    "Demo / Build",
    "Quick Overview",
    "Full Description",
    "Official URL",
    "Steam App ID",
    "YouTube Video ID",
    "Media Slug",
    "Media Folder",
]
RUN_HEADERS = [
    "SEG",
    "GAME / BREAK",
    "DEVELOPER / PUBLISHER",
    "START",
    "END",
    "HOST",
    "PRODUCTION NOTES",
]
AVAILABILITY = {"Released", "Not yet released"}


class WorkbookValidationError(RuntimeError):
    pass


def column_index(reference: str) -> int:
    match = re.match(r"([A-Z]+)", reference.upper())
    if not match:
        raise WorkbookValidationError(f"Invalid cell reference: {reference}")
    value = 0
    for character in match.group(1):
        value = value * 26 + ord(character) - 64
    return value - 1


def shared_strings(archive: zipfile.ZipFile) -> list[str]:
    try:
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []
    return ["".join(node.text or "" for node in item.findall(".//x:t", NS)) for item in root]


def sheet_paths(archive: zipfile.ZipFile) -> dict[str, str]:
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    targets = {
        relation.get("Id"): relation.get("Target", "")
        for relation in relationships.findall("p:Relationship", NS)
    }
    paths: dict[str, str] = {}
    sheets = workbook.find("x:sheets", NS)
    if sheets is None:
        raise WorkbookValidationError("Workbook has no worksheets")
    for sheet in sheets:
        name = sheet.get("name", "")
        relation_id = sheet.get(f"{{{REL_NS}}}id", "")
        target = targets.get(relation_id, "").lstrip("/")
        if not target.startswith("xl/"):
            target = posixpath.normpath(posixpath.join("xl", target))
        paths[name] = target
    return paths


def cell_value(cell: ET.Element, strings: list[str]) -> str:
    cell_type = cell.get("t")
    if cell_type == "inlineStr":
        return "".join(node.text or "" for node in cell.findall(".//x:t", NS))
    value_node = cell.find("x:v", NS)
    value = "" if value_node is None or value_node.text is None else value_node.text
    if cell_type == "s" and value:
        try:
            return strings[int(value)]
        except (IndexError, ValueError) as exc:
            raise WorkbookValidationError(f"Invalid shared-string index {value}") from exc
    if cell_type == "b":
        return "true" if value == "1" else "false"
    return value


def read_rows(archive: zipfile.ZipFile, path: str, strings: list[str]) -> list[list[str]]:
    try:
        root = ET.fromstring(archive.read(path))
    except KeyError as exc:
        raise WorkbookValidationError(f"Worksheet content is missing: {path}") from exc
    rows: list[list[str]] = []
    for row in root.findall(".//x:sheetData/x:row", NS):
        values: dict[int, str] = {}
        for cell in row.findall("x:c", NS):
            reference = cell.get("r", "")
            values[column_index(reference)] = cell_value(cell, strings)
        if values:
            width = max(values) + 1
            rows.append([values.get(index, "") for index in range(width)])
        else:
            rows.append([])
    return rows


def find_table(rows: list[list[str]], required_headers: list[str], sheet_name: str) -> list[dict[str, str]]:
    required = set(required_headers)
    for row_index, row in enumerate(rows):
        headers = [value.strip() for value in row]
        if required.issubset(headers):
            positions = {header: headers.index(header) for header in required_headers}
            records: list[dict[str, str]] = []
            for values in rows[row_index + 1 :]:
                record = {
                    header: values[position].strip() if position < len(values) else ""
                    for header, position in positions.items()
                }
                if any(record.values()):
                    records.append(record)
            return records
    raise WorkbookValidationError(
        f"{sheet_name!r} is missing its required header row: {', '.join(required_headers)}"
    )


def comma_list(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def valid_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def normalize_time(value: str, location: str) -> str:
    try:
        numeric = float(value)
    except ValueError:
        numeric = None
    if numeric is not None:
        minutes = round((numeric % 1) * 24 * 60)
        hours, minute = divmod(minutes, 60)
        if hours == 24:
            hours = 0
        suffix = "AM" if hours < 12 else "PM"
        display_hour = hours % 12 or 12
        return f"{display_hour}:{minute:02d} {suffix}"

    for pattern in ("%I:%M %p", "%I:%M:%S %p", "%H:%M", "%H:%M:%S"):
        try:
            parsed = datetime.strptime(value.strip(), pattern)
            return parsed.strftime("%I:%M %p").lstrip("0")
        except ValueError:
            pass
    raise WorkbookValidationError(f"{location} has an invalid time: {value!r}")


def validate_games(records: list[dict[str, str]]) -> list[dict[str, object]]:
    errors: list[str] = []
    games: list[dict[str, object]] = []
    for row_number, record in enumerate(records, start=4):
        location = f"{GAME_SHEET} row {row_number}"
        required = [
            "Name",
            "Developer / Publisher",
            "Platforms",
            "Display Platforms",
            "Availability",
            "Release",
            "Demo / Build",
            "Quick Overview",
            "Full Description",
            "YouTube Video ID",
            "Media Slug",
            "Media Folder",
        ]
        for header in required:
            if not record[header]:
                errors.append(f"{location}: {header} is required")
        if record["Availability"] not in AVAILABILITY:
            errors.append(
                f"{location}: Availability must be one of {', '.join(sorted(AVAILABILITY))}"
            )
        if record["Official URL"] and not valid_url(record["Official URL"]):
            errors.append(f"{location}: Official URL is not a valid http(s) URL")
        if record["Steam App ID"] and not record["Steam App ID"].isdigit():
            errors.append(f"{location}: Steam App ID must contain digits only")
        if record["YouTube Video ID"] and not re.fullmatch(
            r"[A-Za-z0-9_-]{11}", record["YouTube Video ID"]
        ):
            errors.append(f"{location}: YouTube Video ID must be 11 URL-safe characters")
        games.append(
            {
                "title": record["Name"],
                "developer": record["Developer / Publisher"],
                "platforms": comma_list(record["Platforms"]),
                "displayPlatforms": comma_list(record["Display Platforms"]),
                "availability": record["Availability"],
                "release": record["Release"],
                "demo": record["Demo / Build"],
                "overview": record["Quick Overview"],
                "description": record["Full Description"],
                "officialUrl": record["Official URL"] or None,
                "steamAppId": record["Steam App ID"] or None,
                "youtubeVideoId": record["YouTube Video ID"],
                "mediaSlug": record["Media Slug"],
                "mediaFolder": record["Media Folder"],
            }
        )

    duplicates = sorted(
        value
        for value, count in Counter(str(game["title"]) for game in games).items()
        if count > 1
    )
    if duplicates:
        errors.append(f"Duplicate Name values: {', '.join(duplicates)}")
    if not games:
        errors.append(f"{GAME_SHEET!r} contains no game rows")
    if errors:
        raise WorkbookValidationError("Workbook validation failed:\n- " + "\n- ".join(errors))
    return games


def schedule_kind(title: str, segment: str, game_titles: set[str]) -> str:
    if title == "SIX Hype Hour":
        return "hype"
    if title in game_titles:
        return "game"
    if title == "Break / Transition":
        return "transition"
    if "Sponsor Ad Read" in title:
        return "ad"
    if title.startswith("Opening"):
        return "intro"
    if title.startswith("Closing"):
        return "closing"
    if segment not in {"", "-"}:
        raise WorkbookValidationError(
            f"Run of Show title {title!r} has a segment number but does not match a game Name"
        )
    raise WorkbookValidationError(f"Run of Show has an unknown row type: {title!r}")


def validate_schedule(
    records: list[dict[str, str]], games: list[dict[str, object]]
) -> list[dict[str, object]]:
    game_titles = {str(game["title"]) for game in games}
    kind_counts: Counter[str] = Counter()
    schedule: list[dict[str, object]] = []
    errors: list[str] = []
    for row_number, record in enumerate(records, start=5):
        location = f"{RUN_SHEET} row {row_number}"
        title = record["GAME / BREAK"]
        if not title:
            errors.append(f"{location}: GAME / BREAK is required")
            continue
        try:
            kind = schedule_kind(title, record["SEG"], game_titles)
            start = normalize_time(record["START"], f"{location} START")
            end = normalize_time(record["END"], f"{location} END")
        except WorkbookValidationError as exc:
            errors.append(str(exc))
            continue
        if not record["HOST"]:
            errors.append(f"{location}: HOST is required")
        segment_text = record["SEG"]
        segment_number: int | None = None
        if segment_text not in {"", "-"}:
            try:
                segment_number = int(float(segment_text))
            except ValueError:
                errors.append(f"{location}: SEG must be a whole number or '-' ")
        kind_counts[kind] += 1
        item_id = f"{kind}-{segment_number or kind_counts[kind]}"
        schedule.append(
            {
                "id": item_id,
                "kind": kind,
                "segmentNumber": segment_number,
                "title": title,
                "developer": record["DEVELOPER / PUBLISHER"],
                "start": start,
                "end": end,
                "hosts": record["HOST"],
                "productionNotes": record["PRODUCTION NOTES"],
            }
        )

    scheduled_game_titles = [
        str(item["title"]) for item in schedule if item["kind"] == "game"
    ]
    missing = sorted(game_titles - set(scheduled_game_titles))
    duplicates = sorted(
        title for title, count in Counter(scheduled_game_titles).items() if count > 1
    )
    if missing:
        errors.append(f"Games missing from Run of Show: {', '.join(missing)}")
    if duplicates:
        errors.append(f"Games scheduled more than once: {', '.join(duplicates)}")
    if kind_counts["intro"] != 1 or kind_counts["closing"] != 1:
        errors.append("Run of Show must contain exactly one opening and one closing row")
    if errors:
        raise WorkbookValidationError("Workbook validation failed:\n- " + "\n- ".join(errors))
    return schedule


def load_workbook_data(
    path: Path = WORKBOOK,
) -> tuple[list[dict[str, object]], dict[str, object]]:
    try:
        with zipfile.ZipFile(path) as archive:
            if archive.testzip() is not None:
                raise WorkbookValidationError("Workbook ZIP is corrupt")
            paths = sheet_paths(archive)
            missing_sheets = [name for name in (RUN_SHEET, GAME_SHEET) if name not in paths]
            if missing_sheets:
                raise WorkbookValidationError(
                    f"Workbook is missing required worksheets: {', '.join(missing_sheets)}"
                )
            strings = shared_strings(archive)
            game_records = find_table(
                read_rows(archive, paths[GAME_SHEET], strings), GAME_HEADERS, GAME_SHEET
            )
            run_rows = read_rows(archive, paths[RUN_SHEET], strings)
            run_records = find_table(run_rows, RUN_HEADERS, RUN_SHEET)
    except (FileNotFoundError, zipfile.BadZipFile) as exc:
        raise WorkbookValidationError(f"Cannot read workbook {path}: {exc}") from exc

    games = validate_games(game_records)
    host_note = next(
        (value.strip() for row in run_rows for value in row if value.strip().startswith("Host A =")),
        "",
    )
    if not host_note:
        raise WorkbookValidationError(
            f"{RUN_SHEET!r} is missing the Host A / Host B assignment note"
        )
    schedule = {"hostNote": host_note, "items": validate_schedule(run_records, games)}
    return games, schedule


def json_bytes(value: object) -> bytes:
    return (json.dumps(value, indent=2, ensure_ascii=False) + "\n").encode("utf-8")


def generate(*, check: bool = False) -> None:
    games, schedule = load_workbook_data()
    outputs = {GAMES_JSON: json_bytes(games), RUN_OF_SHOW_JSON: json_bytes(schedule)}
    if check:
        stale = [path for path, expected in outputs.items() if not path.exists() or path.read_bytes() != expected]
        if stale:
            relative = ", ".join(str(path.relative_to(ROOT)) for path in stale)
            raise WorkbookValidationError(
                f"Generated data is stale: {relative}. Run `npm run data:build`."
            )
    else:
        GENERATED_DIR.mkdir(parents=True, exist_ok=True)
        for path, payload in outputs.items():
            path.write_bytes(payload)
    print(
        json.dumps(
            {
                "workbook": str(WORKBOOK),
                "games": len(games),
                "scheduleRows": len(schedule["items"]),
                "mode": "check" if check else "write",
            }
        )
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="fail if generated JSON is stale")
    arguments = parser.parse_args()
    try:
        generate(check=arguments.check)
    except WorkbookValidationError as exc:
        print(str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
