import tempfile
import unittest
from pathlib import Path

from openpyxl import Workbook, load_workbook

from scripts.workbook_source import REQUIRED_SHEETS, read_workbook


class WorkbookSourceTests(unittest.TestCase):
    def make_workbook(self, path: Path) -> None:
        workbook = Workbook()
        workbook.active.title = REQUIRED_SHEETS[0]
        for name in REQUIRED_SHEETS[1:]:
            workbook.create_sheet(name)
        sheet = workbook["DANE"]
        sheet["C8"] = "Ørestad Syd"
        sheet["E8"] = "Copenhagen, Denmark"
        sheet["BC8"] = "UB_1"
        sheet["BF8"] = 2.29
        sheet["BC9"] = "UB_A"
        sheet["D9"] = "  text \nwith accents: Gdańsk  "
        sheet["C10"] = "Kronsberg"
        sheet["BC10"] = "UB_1"
        workbook["OPISY"]["C3"] = "Ørestad Syd"
        workbook["OPISY"]["D3"] = "A description"
        workbook.save(path)
        workbook.close()

    def test_reads_locations_cells_and_sheets_without_changing_values(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "source.xlsx"
            self.make_workbook(path)
            result = read_workbook(path)
            self.assertEqual(result, read_workbook(path))
        self.assertEqual(result["sourceFile"], "source.xlsx")
        self.assertEqual(result["sites"], [
            {"name": "Ørestad Syd", "sourceRow": 8, "blocks": [
                {"name": "UB_1", "sourceRow": 8}, {"name": "UB_A", "sourceRow": 9},
            ]},
            {"name": "Kronsberg", "sourceRow": 10, "blocks": [{"name": "UB_1", "sourceRow": 10}]},
        ])
        rows = {row["row"]: row["cells"] for row in result["sheets"]["DANE"]}
        self.assertEqual(rows[8]["BF8"], 2.29)
        self.assertNotIn("BG8", rows[8])
        self.assertEqual(rows[9]["D9"], "  text \nwith accents: Gdańsk  ")
        self.assertEqual(result["sheets"]["OPISY"][0]["cells"]["D3"], "A description")

    def test_rejects_missing_sheets_formulas_and_orphan_blocks(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "source.xlsx"
            self.make_workbook(path)
            workbook = load_workbook(path)
            del workbook[REQUIRED_SHEETS[-1]]
            workbook.save(path)
            workbook.close()
            with self.assertRaisesRegex(ValueError, "missing required sheets"):
                read_workbook(path)

            self.make_workbook(path)
            workbook = load_workbook(path)
            workbook["DANE"]["BF8"] = "=1+1"
            workbook.save(path)
            workbook.close()
            with self.assertRaisesRegex(ValueError, "DANE!BF8: formula"):
                read_workbook(path)

            self.make_workbook(path)
            workbook = load_workbook(path)
            workbook["DANE"]["C8"] = None
            workbook.save(path)
            workbook.close()
            with self.assertRaisesRegex(ValueError, "block has no preceding location"):
                read_workbook(path)

    def test_actual_workbook_structure_when_present(self):
        root = Path(__file__).resolve().parents[2]
        path = root / "TEMP__TRUTH" / "IEA_TASK_70_ATLASY" / "DANE_NA_STRONE" / "TABELA_EXCEL" / "ATLASY_DANE_261107.xlsx"
        if not path.exists():
            self.skipTest("Local source workbook is not available")
        result = read_workbook(path)
        self.assertEqual([site["name"] for site in result["sites"]], [
            "Elephant & Castle – Elephant Park", "Garnizon", "Kronsberg", "Aspern Seestadt", "Ørestad Syd",
        ])
        self.assertEqual([block["name"] for block in result["sites"][3]["blocks"]], [
            "UB_1", "UB_2", "UB_3", "UB_4", "UB_A",
        ])


if __name__ == "__main__":
    unittest.main()
