import unittest

from xlsx_to_json import GAME_HEADERS, RUN_HEADERS, load_workbook_data, normalize_time


class WorkbookDataTests(unittest.TestCase):
    def test_current_workbook_has_complete_linked_data(self):
        games, schedule = load_workbook_data()

        self.assertEqual(41, len(games))
        self.assertEqual(90, len(schedule["items"]))
        self.assertIn("Host A =", schedule["hostNote"])
        self.assertEqual("ascent-rivals", games[0]["id"])
        self.assertEqual("hit-haunted", games[16]["id"])
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
        self.assertIn("PRODUCTION NOTES", RUN_HEADERS)


if __name__ == "__main__":
    unittest.main()
