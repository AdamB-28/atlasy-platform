from __future__ import annotations

import json
import tempfile
import unittest
from io import BytesIO
from pathlib import Path

from openpyxl import Workbook, load_workbook

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
        self.assertEqual(
            elephant["location"]["coordinates"],
            {"lat": 51.4928183, "lng": -0.0962976, "zoom": 14},
        )
        self.assertEqual(
            elephant["location"]["coordinateSource"]["osmId"],
            "366979812",
        )
        orestad = next(city for city in data["cities"] if city["id"] == "orestad-syd")
        self.assertIsNone(orestad["location"]["coordinates"])
        self.assertIsNone(orestad["location"]["coordinateSource"])
        self.assertTrue(any("restaurant, not a district feature" in notice for notice in data["notices"]))
        self.assertNotIn("shadingAnalysis", elephant)
        self.assertEqual(elephant["sourceData"]["cells"]["D8"], " exact location ref ")
        self.assertNotIn("descriptions", elephant)
        self.assertNotIn("planningPrinciples", elephant)
        self.assertNotIn("keyCharacteristics", elephant)
        self.assertNotIn("P8", elephant["sourceData"]["cells"])

        block = elephant["analysisUnits"][0]
        self.assertEqual(block["name"], "UB_1")
        self.assertEqual(block["analysisLevel"], "urban-block")
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

    def test_rejects_locations_outside_the_approved_source_set(self):
        workbook = load_workbook(fixture_workbook())
        workbook["DANE"]["C8"] = "Hudson Yards"
        stream = BytesIO()
        workbook.save(stream)
        workbook.close()
        stream.seek(0)

        with self.assertRaisesRegex(ValueError, "Unapproved locations in DANE: Hudson Yards"):
            build_data(stream, source_file="source.xlsx")

    def test_validation_rejects_legacy_room_scenarios_and_profiles(self):
        data, _ = build_data(fixture_workbook(), source_file="source.xlsx")
        data["cities"][0]["analysisUnits"][0]["daylightFactor"] = {"simulation1": {}}
        data["benchmarks"] = [{"name": "retired benchmark"}]

        errors = validate_data(data)

        self.assertTrue(any("legacy scenario data" in error for error in errors))
        self.assertTrue(any("Legacy benchmark profiles" in error for error in errors))

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
        block = data["cities"][0]["analysisUnits"][0]
        self.assertEqual(block["function"], "Residential")
        self.assertEqual(block["sourceData"]["cells"]["BM8"], "Residential")
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
        self.assertTrue(any("TASK-16" in notice for notice in data["notices"]))
        self.assertTrue(any("TASK-17" in notice for notice in data["notices"]))
        self.assertFalse(any(row["row"] == 11 for row in data["sourceWorkbook"]["sheets"]["DANE"]))

    def test_site_analysis_matches_workbook_cells_when_available(self):
        if not WORKBOOK_PATH.exists():
            self.skipTest("Approved source workbook is not available")
        workbook = load_workbook(WORKBOOK_PATH, data_only=True, read_only=True)
        try:
            data, _ = build_data(WORKBOOK_PATH)
            for city in data["cities"]:
                site = city["siteAnalysis"]
                row = city["source"]["row"]
                distributions = [
                    site["sunHoursDistribution"]["ground"],
                    site["sunHoursDistribution"]["buildings"],
                    site["daylightPotentialDistribution"],
                ]
                for distribution in distributions:
                    for item in distribution["bins"]:
                        self.assertEqual(item["source"]["row"], row)
                        self.assertEqual(item["value"], workbook["DANE"][item["source"]["cell"]].value)
                for item in site["solarEnergySpecsSource"]:
                    self.assertEqual(item["source"]["row"], row)
                    self.assertEqual(item["value"], workbook["DANE"][item["source"]["cell"]].value)
                self.assertEqual(site["sunHoursDistribution"]["ground"]["bins"][0]["source"]["cell"], f"R{row}")
                self.assertEqual(site["sunHoursDistribution"]["buildings"]["bins"][0]["source"]["cell"], f"AB{row}")
                self.assertEqual(site["daylightPotentialDistribution"]["bins"][0]["source"]["cell"], f"AM{row}")
                self.assertEqual(site["solarEnergySpecsSource"][0]["source"]["cell"], f"AW{row}")
        finally:
            workbook.close()

    def test_block_ratio_source_cells_are_percentage_formatted_when_available(self):
        if not WORKBOOK_PATH.exists():
            self.skipTest("Approved source workbook is not available")
        workbook = load_workbook(WORKBOOK_PATH, data_only=True, read_only=True)
        try:
            data, _ = build_data(WORKBOOK_PATH)
            for city in data["cities"]:
                for block in city["analysisUnits"]:
                    row = block["source"]["row"]
                    for column, field in (("BG", "greenSpaceRatio"), ("BH", "buildingCoverage")):
                        cell = workbook["DANE"][f"{column}{row}"]
                        self.assertIn("%", cell.number_format)
                        self.assertEqual(block["indicators"][field], cell.value)
                        self.assertIsInstance(cell.value, (int, float))
                        self.assertGreaterEqual(cell.value, 0)
                        self.assertLessEqual(cell.value, 1)
        finally:
            workbook.close()

    def test_block_analysis_values_match_each_workbook_row_when_available(self):
        if not WORKBOOK_PATH.exists():
            self.skipTest("Approved source workbook is not available")
        workbook = load_workbook(WORKBOOK_PATH, data_only=True, read_only=True)
        try:
            data, _ = build_data(WORKBOOK_PATH)
            for city in data["cities"]:
                for block in city["analysisUnits"]:
                    row = block["source"]["row"]
                    self.assertEqual(block["name"], workbook["DANE"][f"BC{row}"].value)
                    for column, field in (("BF", "buildingIntensity"), ("BG", "greenSpaceRatio"), ("BH", "buildingCoverage"), ("BI", "avgFloors")):
                        self.assertEqual(block["indicators"][field], workbook["DANE"][f"{column}{row}"].value)
                    distributions = [
                        *block["sunHoursDistribution"].values(),
                        block["daylightPotentialDistribution"],
                    ]
                    for distribution in distributions:
                        for item in distribution["bins"]:
                            self.assertEqual(item["source"]["row"], row)
                            self.assertEqual(item["value"], workbook["DANE"][item["source"]["cell"]].value)
                    for item in block["solarEnergySpecsSource"]:
                        self.assertEqual(item["source"]["row"], row)
                        self.assertEqual(item["value"], workbook["DANE"][item["source"]["cell"]].value)
                    self.assertEqual(block["function"], workbook["DANE"][f"BM{row}"].value)
                    self.assertEqual(block["sourceData"]["cells"].get(f"BM{row}"), block["function"])
        finally:
            workbook.close()

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
                if link["cell"] == "BE8":
                    self.assertEqual(link["referencedName"], "Elephant_and_Castle_UB_model_3D")
                    self.assertEqual(link["resolvedName"], "Elephant_and_Case_UB_1_model_3D")
                    self.assertIn("owner confirmed", link["aliasNote"])
                else:
                    self.assertEqual(link["referencedName"], link["resolvedName"])
                self.assertEqual(link["sourceFile"], WORKBOOK_PATH.name)
                self.assertEqual(link["sheet"], "DANE")
                self.assertTrue(link["cell"])

            unresolved = {
                link["cell"]: link
                for link in data["imageCatalog"]
                if link["status"] == "unresolved"
            }
            self.assertEqual(set(unresolved), {"Q15", "AL15", "AV15"})
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

    def test_image_extension_case_and_duplicate_matches_are_explicit(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            asset_root = root / "assets"
            source = asset_root / "ELEPHANT_AND_CASTLE" / "GRAFIKI" / "overview_test.png"
            source.parent.mkdir(parents=True)
            source.write_bytes(b"approved image")
            data, _ = build_data(fixture_workbook(), source_file="source.xlsx")
            resolve_image_links(data, asset_root, root / "public")
            link = next(item for item in data["imageCatalog"] if item["cell"] == "BB8")
            self.assertEqual(link["status"], "copied")
            self.assertEqual(link["resolvedName"], "overview_test")
            self.assertEqual(
                (root / "public" / "ELEPHANT_AND_CASTLE" / "overview_test.PNG").read_bytes(),
                b"approved image",
            )
            self.assertEqual(exact_asset_matches(asset_root, "Overview_test", "elephant-and-castle"), [])

            duplicate = asset_root / "ELEPHANT_AND_CASTLE" / "FORMA" / "overview_test.PnG"
            duplicate.parent.mkdir()
            duplicate.write_bytes(b"another image")
            ambiguous, _ = build_data(fixture_workbook(), source_file="source.xlsx")
            warnings = resolve_image_links(ambiguous, asset_root, root / "other-public")
            link = next(item for item in ambiguous["imageCatalog"] if item["cell"] == "BB8")
            self.assertEqual(link["status"], "unresolved")
            self.assertIsNone(link["publicUrl"])
            self.assertIsNone(ambiguous["cities"][0]["siteAnalysis"]["urbanBlocksImage"])
            self.assertIn("Multiple approved assets", link["aliasNote"])
            self.assertTrue(any("BB8" in warning and "ambiguous" in warning for warning in warnings))

    def test_reimport_prunes_only_scoped_assets_after_success_and_is_idempotent(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            workbook_path = root / "DANE_NA_STRONE" / "TABELA_EXCEL" / "source.xlsx"
            asset_root = root / "DANE_NA_STRONE" / "RYSUNKI"
            public_dir = root / "public"
            output_path = public_dir / "data" / "atlas.json"
            private_path = root / "private" / "content.json"
            workbook_path.parent.mkdir(parents=True)
            workbook_path.write_bytes(fixture_workbook().getvalue())

            source_assets = {
                asset_root / "GRAFIKI_LOCATION" / "exact location ref.PNG": b"location",
                asset_root / "ELEPHANT_AND_CASTLE" / "overview_test.PNG": b"overview",
                asset_root / "ELEPHANT_AND_CASTLE" / "sun_test.PNG": b"sun",
                asset_root / "ELEPHANT_AND_CASTLE" / "daylight_test.PNG": b"daylight",
            }
            for path, content in source_assets.items():
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(content)

            valid_existing = public_dir / "ELEPHANT_AND_CASTLE" / "overview_test.PNG"
            valid_existing.parent.mkdir(parents=True, exist_ok=True)
            valid_existing.write_bytes(source_assets[
                asset_root / "ELEPHANT_AND_CASTLE" / "overview_test.PNG"
            ])

            stale_images = [
                public_dir / "HUDSON_YARDS" / "Hudson_Yards_21marzec.PNG",
                public_dir / "GARNIZON" / "old_test.PNG",
                public_dir / "ELEPHANT_AND_CASTLE" / "old_test.PNG",
            ]
            for path in stale_images:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(b"stale")

            unrelated_images = [
                public_dir / "unrelated.PNG",
                public_dir / "OTHER" / "unrelated.PNG",
                public_dir / "ELEPHANT_AND_CASTLE" / "nested" / "unrelated.PNG",
            ]
            for path in unrelated_images:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(b"unrelated")
            source_before = {path: path.read_bytes() for path in source_assets}

            data, _ = import_data(
                workbook_path,
                output_path,
                private_output_path=private_path,
            )

            self.assertEqual(
                next(link for link in data["imageCatalog"] if link["cell"] == "BB8")["status"],
                "present",
            )
            for path in stale_images:
                self.assertFalse(path.exists(), path)
            for path in unrelated_images:
                self.assertEqual(path.read_bytes(), b"unrelated")
            for path, content in source_before.items():
                self.assertEqual(path.read_bytes(), content)
            for link in data["imageCatalog"]:
                if link["status"] in {"copied", "present"}:
                    folder = {
                        "elephant-and-castle": "ELEPHANT_AND_CASTLE",
                        "garnizon": "GARNIZON",
                        "kronsberg": "KRONSBERG",
                        "aspern-seestadt": "SEESTADT",
                        "orestad-syd": "ORESTAD",
                    }[link["cityId"]]
                    self.assertTrue(
                        (public_dir / folder / f"{link['resolvedName']}.PNG").is_file()
                    )

            public_before_repeat = {
                path.relative_to(public_dir): path.read_bytes()
                for path in public_dir.rglob("*")
                if path.is_file()
            }
            repeated_data, _ = import_data(
                workbook_path,
                output_path,
                private_output_path=private_path,
            )
            public_after_repeat = {
                path.relative_to(public_dir): path.read_bytes()
                for path in public_dir.rglob("*")
                if path.is_file()
            }
            self.assertNotEqual(data, repeated_data)
            stable_data, _ = import_data(
                workbook_path,
                output_path,
                private_output_path=private_path,
            )
            stable_public = {
                path.relative_to(public_dir): path.read_bytes()
                for path in public_dir.rglob("*")
                if path.is_file()
            }
            self.assertEqual(repeated_data, stable_data)
            self.assertEqual(public_after_repeat, stable_public)
            for path, content in source_before.items():
                self.assertEqual(path.read_bytes(), content)

    def test_incomplete_import_does_not_prune_or_overwrite_published_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            public_dir = root / "public"
            output_path = public_dir / "data" / "atlas.json"
            private_path = root / "private" / "content.json"
            published = {
                output_path: b"existing atlas",
                private_path: b"existing private data",
                public_dir / "ELEPHANT_AND_CASTLE" / "stale.PNG": b"stale image",
                public_dir / "unrelated" / "image.PNG": b"unrelated image",
            }
            for path, content in published.items():
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(content)

            invalid_workbook = load_workbook(fixture_workbook())
            invalid_workbook.remove(invalid_workbook["Garnizon -Key Characteristics"])
            invalid_stream = BytesIO()
            invalid_workbook.save(invalid_stream)
            invalid_workbook.close()
            invalid_stream.seek(0)

            with self.assertRaisesRegex(ValueError, "missing required sheets"):
                import_data(
                    invalid_stream,
                    output_path,
                    private_output_path=private_path,
                )

            for path, content in published.items():
                self.assertEqual(path.read_bytes(), content)


if __name__ == "__main__":
    unittest.main()
