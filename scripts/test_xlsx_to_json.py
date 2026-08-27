import unittest

from xlsx_to_json import (
    GAME_HEADERS,
    RUN_HEADERS,
    load_workbook_data,
    normalize_time,
    validate_schedule,
)


class WorkbookDataTests(unittest.TestCase):
    def test_current_workbook_has_complete_linked_data(self):
        games, schedule = load_workbook_data()

        self.assertEqual(41, len(games))
        self.assertEqual(90, len(schedule["items"]))
        self.assertIn("Host A =", schedule["hostNote"])
        self.assertEqual(1, games[0]["id"])
        self.assertEqual(17, games[16]["id"])
        self.assertEqual(
            {game["id"] for game in games},
            {
                item["gameId"]
                for item in schedule["items"]
                if item["kind"] == "game"
            },
        )

    def test_time_normalization_accepts_excel_numbers_and_text(self):
        self.assertEqual("10:00 AM", normalize_time("0.4166666667", "test"))
        self.assertEqual("4:05 PM", normalize_time("16:05", "test"))

    def test_schema_has_stable_id_and_production_notes(self):
        self.assertEqual("Game ID", GAME_HEADERS[0])
        self.assertIn("GAME ID", RUN_HEADERS)
        self.assertIn("PRODUCTION NOTES", RUN_HEADERS)

    def test_schedule_joins_by_integer_id_when_titles_differ(self):
        def row(segment, title, game_id, start, end):
            return {
                "SEG": segment,
                "GAME / BREAK": title,
                "DEVELOPER / PUBLISHER": "",
                "START": start,
                "END": end,
                "HOSTS": "A & B",
                "PRODUCTION NOTES": "",
                "GAME ID": game_id,
            }

        games = [{"id": 101, "title": "Renamed Catalogue Title"}]
        records = [
            row("1", "Opening / Welcome", "", "10:00 AM", "10:05 AM"),
            row("2", "Different Broadcast Title", "101", "10:05 AM", "10:11 AM"),
            row("3", "Closing / Thank You", "", "10:11 AM", "10:16 AM"),
        ]

        schedule = validate_schedule(records, games)

        self.assertEqual(101, schedule[1]["gameId"])


if __name__ == "__main__":
    unittest.main()
