from __future__ import annotations

import json
import tempfile
import unittest
from io import BytesIO
from pathlib import Path

from openpyxl import Workbook

from scripts.import_data import (
    build_data,
    exact_asset_matches,
    import_data,
    resolve_image_links,
    validate_data,
)
from scripts.workbook_source import REQUIRED_SHEETS


WORKBOOK_PATH = (
    Path(__file__).resolve().parents[2]
    / "TEMP__TRUTH"
    / "IEA_TASK_70_ATLASY"
    / "DANE_NA_STRONE"
    / "TABELA_EXCEL"
    / "ATLASY_DANE_261107.xlsx"
)


def fixture_workbook() -> BytesIO:
    workbook = Workbook()
    workbook.active.title = REQUIRED_SHEETS[0]
    for sheet_name in REQUIRED_SHEETS[1:]:
        workbook.create_sheet(sheet_name)

    dane = workbook["DANE"]
    dane["C4"] = "Name"
    dane["D4"] = "Site characteristics"
    dane["BD4"] = "Urban blocks"
    dane["Q5"] = "Sun hours (obrazek)"
    dane["R5"] = "Sun hours - 21 March; 00:00 - 24:00 (%)"
    dane["AM5"] = "Daylight potential (%)"
    dane["D6"] = "General information"
    dane["R6"] = "GROUND"
    dane["AB6"] = "BUILDINGS (FACADES, ROFFS, OTHER)"
    dane["BD6"] = "Top view"
    dane["BE6"] = "Simplified 3D form"
    dane["BF6"] = "Urban indicators"
    dane["BM6"] = "Buildings functions"
    dane["BO6"] = "GROUND"
    dane["BY6"] = "FACADES"
    dane["CI6"] = "ROOFS"
    dane["CS6"] = "Daylight potential"
    dane["DD6"] = "Solar energy potential"
    dane["D7"] = "Location"
    dane["E7"] = "Country"
    dane["N7"] = "Top view"
    dane["O7"] = "Model 3D"
    dane["P7"] = "Types of development"
    dane["R7"] = "0-1"
    dane["S7"] = "1-2"
    dane["AB7"] = "0-1"
    dane["AM7"] = "0-5"
    dane["AW7"] = "area (m²)"
    dane["AZ7"] = "area to be covered by the panels (m²) - 60%"
    dane["BC7"] = "name"
    dane["BD7"] = "Top view"
    dane["BE7"] = "Simplified 3D form"
    dane["BF7"] = "Floor area ratio"
    dane["BG7"] = "Green Area Ratio (GAR)"
    dane["BM7"] = "Function"
    dane["BO7"] = "0-1"
    dane["BP7"] = "1-2"
    dane["BY7"] = "0-1"
    dane["CI7"] = "0-1"
    dane["CT7"] = "0-5"
    dane["DD7"] = "area (m²)"
    dane["DG7"] = "area to be covered by the panels (m²) - 60%"

    for row, name, block in (
        (8, "Elephant & Castle – Elephant Park", "UB_1"),
        (9, None, "UB_2"),
        (10, "Garnizon", "UB_1"),
        (11, None, "UB_2"),
        (12, None, "UB_3"),
        (13, "Kronsberg", "UB_1"),
        (14, "Aspern Seestadt", "UB_1"),
        (15, "Ørestad Syd", "UB_1"),
    ):
        if name:
            dane[f"C{row}"] = name
            dane[f"E{row}"] = "Source location text"
        dane[f"BC{row}"] = block
        dane[f"BE{row}"] = "source_model_name"
        dane[f"BF{row}"] = 2.29
        dane[f"BG{row}"] = "35%"
        dane[f"BM{row}"] = "Residential"
        dane[f"BO{row}"] = 50
        dane[f"R{row}"] = 40
    dane["D8"] = " exact location ref "
    dane["BB8"] = "overview_test"
    dane["BD8"] = "missing_plan"
    dane["BN8"] = "sun_test"
    dane["CS8"] = "daylight_test"
    dane["Q14"] = "Kronsberg_site_sun"
    dane["AL14"] = "Kronsberg_site_daylight"
    dane["AV14"] = "Kronsberg_site_solar"
    dane["AW8"] = 9971
    dane["AZ8"] = 59982
    dane["DD8"] = 9971
    dane["DG8"] = 59982
    dane["CT8"] = None
    dane["F8"] = "Unapproved site description."

    descriptions = workbook["OPISY"]
    descriptions["D2"] = "Description 1"
    descriptions["E2"] = "Description 2"
    descriptions["C3"] = "Elephant & Castle – Elephant Park"
    descriptions["D3"] = "First exact description."
    descriptions["E4"] = "Continuation on the next source row."

    planning = workbook["OPISY-Main Planning Principles"]
    planning["B4"] = "Elephant & Castle – Elephant Park"
    planning["C4"] = "Exact planning principle."

    characteristics = workbook[REQUIRED_SHEETS[-1]]
    characteristics["C4"] = "The indicators refer primarily to Elephant Park."
    characteristics["C5"] = "Indicator"
    characteristics["D5"] = "Elephant Park"
    characteristics["C6"] = "Location"
    characteristics["D6"] = "Elephant & Castle, London"
    characteristics["E7"] = "contact@example.com"
    characteristics["E8"] = "+1 555 0100"

    stream = BytesIO()
    workbook.save(stream)
    workbook.close()
    stream.seek(0)
    return stream


class ImportDataTests(unittest.TestCase):
    def test_imports_source_rows_sheets_and_exact_provenance_repeatably(self):
        data, warnings = build_data(fixture_workbook(), source_file="source.xlsx")
        repeated, _ = build_data(fixture_workbook(), source_file="source.xlsx")
        self.assertEqual(data, repeated)
        self.assertEqual(warnings, [])
        self.assertEqual(
            [city["name"] for city in data["cities"]],
            [
                "Elephant & Castle – Elephant Park",
                "Garnizon",
                "Kronsberg",
                "Aspern Seestadt",
                "Ørestad Syd",
            ],
        )

        elephant = data["cities"][0]
        self.assertEqual(elephant["source"], {
            "file": "source.xlsx",
            "sheet": "DANE",
            "row": 8,
            "cell": "C8",
            "status": "source",
        })
        self.assertEqual(elephant["location"]["country"], "Source location text")
        self.assertIsNone(elephant["location"]["coordinates"])
        self.assertEqual(elephant["sourceData"]["cells"]["D8"], " exact location ref ")
        self.assertNotIn("descriptions", elephant)
        self.assertNotIn("planningPrinciples", elephant)
        self.assertNotIn("keyCharacteristics", elephant)
        self.assertNotIn("P8", elephant["sourceData"]["cells"])

        block = elephant["analysisUnits"][0]
        self.assertEqual(block["name"], "UB_1")
        self.assertEqual(block["source"]["cell"], "BC8")
        self.assertEqual(block["indicators"]["buildingIntensity"], 2.29)
        self.assertEqual(block["distributions"][0]["bins"][0], {
            "label": "0-1",
            "value": 50,
            "source": {"sheet": "DANE", "row": 8, "cell": "BO8"},
        })
        self.assertIsNone(block["distributions"][-1]["bins"][0]["value"])
        self.assertIsNone(block["imageLinks"][0]["sourceTempPath"])
        self.assertEqual(block["imageLinks"][0]["resolvedName"], None)
        self.assertEqual(block["imageLinks"][0]["status"], "unresolved")
        self.assertIsNone(block["solarEnergySpecs"]["panelArea"])
        self.assertIn("DG8", block["solarEnergySpecs"]["panelAreaWarning"])
        self.assertIn("DD8", block["solarEnergySpecs"]["panelAreaWarning"])
        self.assertEqual(data["sourceWorkbook"]["sheets"]["DANE"][0]["source"]["sheet"], "DANE")
        self.assertEqual(data["sourceWorkbook"]["file"], "source.xlsx")
        self.assertNotIn("cells", data["sourceWorkbook"]["sheets"]["OPISY"][0])
        self.assertFalse(validate_data(data))

    def test_unapproved_narrative_is_private_with_provenance(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output_path = root / "public" / "data" / "atlas.json"
            private_path = root / "private" / "content.json"
            data, _ = import_data(
                fixture_workbook(),
                output_path,
                private_output_path=private_path,
            )
            public_text = output_path.read_text(encoding="utf-8")
            private = json.loads(private_path.read_text(encoding="utf-8"))
        for unapproved_text in (
            "First exact description.",
            "Continuation on the next source row.",
            "Exact planning principle.",
            "Elephant & Castle, London",
            "The indicators refer primarily to Elephant Park.",
            "Unapproved site description.",
            "contact@example.com",
            "+1 555 0100",
        ):
            self.assertNotIn(unapproved_text, public_text)
            self.assertIn(unapproved_text, json.dumps(private, ensure_ascii=False))
        opis_row = next(
            row for row in private["sourceSheets"]["OPISY"] if row["row"] == 3
        )
        self.assertEqual(opis_row["cells"]["D3"], "First exact description.")
        self.assertEqual(opis_row["source"], {"sheet": "OPISY", "row": 3})
        self.assertNotIn("descriptions", data["cities"][0])
        dane_rows = {row["row"]: row for row in private["sourceSheets"]["DANE"]}
        self.assertEqual(dane_rows[8]["cells"]["F8"], "Unapproved site description.")
        self.assertEqual(dane_rows[8]["cells"]["BM8"], "Residential")
        self.assertEqual(dane_rows[11]["cells"]["BC11"], "UB_2")
        self.assertEqual(dane_rows[11]["cells"]["BM11"], "Residential")
        self.assertFalse(any(row["row"] == 11 for row in data["sourceWorkbook"]["sheets"]["DANE"]))

    def test_excludes_garnizon_ub_2_from_all_published_workbook_data(self):
        data, _ = build_data(fixture_workbook(), source_file="source.xlsx")
        garnizon = next(city for city in data["cities"] if city["name"] == "Garnizon")
        self.assertEqual([block["name"] for block in garnizon["analysisUnits"]], ["UB_1", "UB_3"])
        self.assertFalse(any(row["row"] == 11 for row in data["sourceWorkbook"]["sheets"]["DANE"]))
        self.assertEqual(data["exclusions"], [{
            "reason": "Excluded by TEMP__TRUTH/IEA_TASK_70_ATLASY/NOTATKI.docx",
            "source": {
                "file": "source.xlsx",
                "sheet": "DANE",
                "row": 11,
                "cell": "BC11",
            },
        }])
        self.assertNotIn("UB_2", json.dumps(garnizon))

    def test_actual_workbook_values_and_ambiguity_notes_when_available(self):
        if not WORKBOOK_PATH.exists():
            self.skipTest("Approved source workbook is not available")
        data, _ = build_data(WORKBOOK_PATH)
        self.assertEqual(
            [city["name"] for city in data["cities"]],
            [
                "Elephant & Castle – Elephant Park",
                "Garnizon",
                "Kronsberg",
                "Aspern Seestadt",
                "Ørestad Syd",
            ],
        )
        garnizon = next(city for city in data["cities"] if city["name"] == "Garnizon")
        self.assertEqual([block["name"] for block in garnizon["analysisUnits"]], ["UB_1", "UB_3"])
        aspern = next(city for city in data["cities"] if city["name"] == "Aspern Seestadt")
        self.assertEqual(aspern["source"]["row"], 15)
        elephant = data["cities"][0]
        block = next(item for item in elephant["analysisUnits"] if item["name"] == "UB_1")
        self.assertEqual(block["sourceData"]["cells"]["BE8"], "Elephant_and_Castle_UB_model_3D")
        solar_values = {
            item["label"]: item["value"]
            for item in block["solarEnergySpecsSource"]
        }
        self.assertEqual(solar_values["area (m²)"], 9971)
        self.assertEqual(
            solar_values["area to be covered by the panels (m²) - 60%"], 59982
        )
        self.assertIsNone(block["solarEnergySpecs"]["panelArea"])
        self.assertIn("DG8", block["solarEnergySpecs"]["panelAreaWarning"])
        self.assertIn("DD8", block["solarEnergySpecs"]["panelAreaWarning"])
        self.assertTrue(any("TASK-15" in notice for notice in data["notices"]))
        self.assertTrue(any("TASK-16" in notice for notice in data["notices"]))
        self.assertTrue(any("TASK-17" in notice for notice in data["notices"]))
        self.assertFalse(any(row["row"] == 11 for row in data["sourceWorkbook"]["sheets"]["DANE"]))

    def test_exact_approved_assets_resolve_but_known_conflicts_stay_unresolved(self):
        if not WORKBOOK_PATH.exists():
            self.skipTest("Approved source workbook is not available")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output_path = root / "public" / "data" / "atlas.json"
            private_path = root / "private" / "content.json"
            data, _ = import_data(
                WORKBOOK_PATH, output_path, private_output_path=private_path
            )
            generated_public = json.loads(output_path.read_text(encoding="utf-8"))
            copied = [
                link for link in data["imageCatalog"] if link["status"] == "copied"
            ]
            self.assertGreater(len(copied), 0)
            for link in copied:
                folder = next(
                    city for city in data["cities"] if city["id"] == link["cityId"]
                )
                public_folder = {
                    "elephant-and-castle": "ELEPHANT_AND_CASTLE",
                    "garnizon": "GARNIZON",
                    "kronsberg": "KRONSBERG",
                    "aspern-seestadt": "SEESTADT",
                    "orestad-syd": "ORESTADT",
                }[folder["id"]]
                self.assertTrue(
                    (root / "public" / public_folder / f"{link['resolvedName']}.PNG").exists()
                )
                self.assertEqual(link["referencedName"], link["resolvedName"])
                self.assertEqual(link["sourceFile"], WORKBOOK_PATH.name)
                self.assertEqual(link["sheet"], "DANE")
                self.assertTrue(link["cell"])

            unresolved = {
                link["cell"]: link
                for link in data["imageCatalog"]
                if link["status"] == "unresolved"
            }
            self.assertEqual(set(unresolved), {"BE8", "Q15", "AL15", "AV15"})
            for cell, link in unresolved.items():
                self.assertIsNone(link["publicUrl"], cell)
                self.assertIsNone(link["tempPath"], cell)

            public_text = output_path.read_text(encoding="utf-8")
            private = json.loads(private_path.read_text(encoding="utf-8"))
            opisy = next(
                row for row in private["sourceSheets"]["OPISY"] if row["row"] == 3
            )
            self.assertTrue(opisy["cells"]["D3"])
            self.assertNotIn(opisy["cells"]["D3"], public_text)
            self.assertEqual(
                generated_public["cities"][0]["location"]["imageUrl"],
                generated_public["cities"][0]["imageLinks"][0]["resolvedName"],
            )

    def test_exact_image_matches_are_location_scoped_and_exclude_stale_assets(self):
        asset_root = Path(__file__).parent / "fixtures" / "asset_match_scope"
        data, _ = build_data(fixture_workbook(), source_file="source.xlsx")
        warnings = resolve_image_links(data, asset_root)
        city = data["cities"][0]
        links = {
            link["cell"]: link
            for record in [city, *city["analysisUnits"]]
            for link in record["imageLinks"]
        }
        self.assertEqual(
            exact_asset_matches(asset_root, "exact location ref", "elephant-and-castle", True),
            [asset_root / "GRAFIKI_LOCATION" / "exact location ref.PNG"],
        )
        self.assertEqual(
            exact_asset_matches(asset_root, "overview_test", "elephant-and-castle"),
            [asset_root / "ELEPHANT_AND_CASTLE" / "GRAFIKI" / "overview_test.PNG"],
        )
        self.assertEqual(
            exact_asset_matches(asset_root, "sun_test", "elephant-and-castle"),
            [asset_root / "ELEPHANT_AND_CASTLE" / "FORMA" / "sun_test.PNG"],
        )
        self.assertEqual(city["location"]["imageUrl"], None)
        self.assertEqual(links["BD8"]["status"], "unresolved")
        self.assertIn("BD8", " ".join(warnings))
        self.assertIn("No exact asset found", links["BD8"]["aliasNote"])


if __name__ == "__main__":
    unittest.main()
