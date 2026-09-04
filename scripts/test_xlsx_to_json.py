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
        self.assertEqual(91, len(schedule["items"]))
        self.assertEqual("hype", schedule["items"][0]["kind"])
        self.assertEqual("10:00 AM", schedule["items"][0]["start"])
        self.assertEqual("12:00 PM", schedule["items"][0]["end"])
        self.assertIn("Host A =", schedule["hostNote"])
        self.assertEqual("Ascent Rivals", games[0]["title"])
        self.assertEqual("Hit & Haunted", games[16]["title"])
        self.assertEqual(
            {game["title"] for game in games},
            {
                item["title"]
                for item in schedule["items"]
                if item["kind"] == "game"
            },
        )

    def test_time_normalization_accepts_excel_numbers_and_text(self):
        self.assertEqual("10:00 AM", normalize_time("0.4166666667", "test"))
        self.assertEqual("4:05 PM", normalize_time("16:05", "test"))

    def test_schema_uses_name_and_production_notes(self):
        self.assertEqual("Name", GAME_HEADERS[0])
        self.assertNotIn("GAME ID", RUN_HEADERS)
        self.assertIn("PRODUCTION NOTES", RUN_HEADERS)

    def test_schedule_joins_by_name_after_rows_are_moved(self):
        def row(segment, title, start, end):
            return {
                "SEG": segment,
                "GAME / BREAK": title,
                "DEVELOPER / PUBLISHER": "",
                "START": start,
                "END": end,
                "HOST": "A",
                "PRODUCTION NOTES": "",
            }

        games = [{"title": "First Game"}, {"title": "Second Game"}]
        records = [
            row("1", "Opening / Welcome", "10:00 AM", "10:05 AM"),
            row("2", "Second Game", "10:05 AM", "10:11 AM"),
            row("3", "First Game", "10:11 AM", "10:17 AM"),
            row("4", "Closing / Thank You", "10:17 AM", "10:22 AM"),
        ]

        schedule = validate_schedule(records, games)

        self.assertEqual(
            ["Second Game", "First Game"],
            [item["title"] for item in schedule[1:3]],
        )


if __name__ == "__main__":
    unittest.main()
