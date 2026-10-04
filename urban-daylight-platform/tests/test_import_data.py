import csv
import tempfile
import unittest
from pathlib import Path

from scripts.import_data import column_letter, import_data, number, read_csv, resolve_image_links, validate_data


class ImportDataTests(unittest.TestCase):
    def test_number_reads_european_decimal_and_percent(self):
        self.assertEqual(number("3,96"), 3.96)
        self.assertEqual(number("38,76%"), 38.76)
        self.assertEqual(number("no data"), None)

    def test_csv_reader_keeps_quoted_multiline_descriptions(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "quoted.csv"
            with path.open("w", encoding="cp1250", newline="") as file:
                csv.writer(file, delimiter=";", quotechar='"').writerow(["First line\nsecond line", "3,2"])
            rows = read_csv(path)
        self.assertEqual(rows, [["First line\nsecond line", "3,2"]])

    def test_real_drop_folder_imports_places_units_and_benchmarks(self):
        root = Path(__file__).resolve().parents[2]
        temp_dir = root / ".venv" / "TEMP"
        if not temp_dir.exists():
            self.skipTest("Local TEMP data is not available")
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "atlas.json"
            data, _ = import_data(temp_dir, output, copy_assets=False)
            first_export = output.read_bytes()
            import_data(temp_dir, output, copy_assets=False)
            self.assertEqual(output.read_bytes(), first_export)
        self.assertEqual({city["id"] for city in data["cities"]}, {"elephant-and-castle", "garnizon", "hudson-yards"})
        city_by_id = {city["id"]: city for city in data["cities"]}
        self.assertEqual([unit["name"] for unit in city_by_id["elephant-and-castle"]["analysisUnits"]], ["UB_1", "UB_2", "Selected room · 750 lx study"])
        self.assertEqual([unit["name"] for unit in city_by_id["garnizon"]["analysisUnits"]], ["UB_1", "UB_2", "UB_3"])
        elephant = city_by_id["elephant-and-castle"]
        elephant_room = next(unit for unit in elephant["analysisUnits"] if unit["analysisLevel"] == "selected-room")
        self.assertEqual(elephant["siteAnalysis"]["urbanBlocksImage"], "ELEPHANT_AND_CASTLE_260925")
        locator = next(link for link in elephant["imageLinks"] if link["field"] == "siteAnalysis.urbanBlocksImage")
        self.assertEqual(locator["columnLetter"], "BC")
        self.assertEqual(locator["row"], elephant["source"]["row"])
        self.assertEqual(locator["sheet"], "Arkusz1")
        self.assertTrue(locator["tempPath"])
        self.assertTrue(locator["publicUrl"].endswith("/ELEPHANT_AND_CASTLE/ELEPHANT_AND_CASTLE_260925.PNG"))
        elephant_block = next(unit for unit in elephant["analysisUnits"] if unit["name"] == "UB_1")
        daylight_link = next(link for link in elephant_block["imageLinks"] if link["field"] == "daylightPotential")
        self.assertIn("_UB_1", daylight_link["resolvedName"])
        self.assertEqual(daylight_link["columnLetter"], "CT")
        self.assertEqual(daylight_link["row"], elephant_block["sourceRow"])
        model_link = next(link for link in elephant_block["imageLinks"] if link["field"] == "form3d")
        self.assertEqual(model_link["referencedName"], "Elephant_and_Castle_UB_model_3D")
        self.assertEqual(model_link["resolvedName"], "Elephant_and_Case_UB_1_model_3D")
        self.assertIn("Known filename alias", model_link["aliasNote"])
        self.assertTrue(model_link["tempPath"])
        self.assertEqual(elephant_room["daylightFactor"]["simulation1"]["avgValue"], "5,17%")
        self.assertEqual(elephant_room["spatialDaylightAutonomy"]["simulation1"]["autonomy"], "Average sDA value is 49,54%")
        self.assertEqual(elephant_room["usefulDaylightIlluminance"]["simulation1"]["avgValue"], "64,09%")
        self.assertEqual(elephant_room["usefulDaylightIlluminance"]["conclusions"], "The maximum value of 76.07% and the fact that as much as 94.5% of the area falls below the glare threshold (Below Target) suggests that the room is very well protected against overheating and excessive glare, whilst maintaining a usable level of natural light for most of the year.")
        self.assertEqual(len(data["benchmarks"]), 5)
        self.assertEqual(city_by_id["elephant-and-castle"]["overview"]["far"], 3.96)
        self.assertEqual(city_by_id["hudson-yards"]["analysisUnits"][0]["daylightFactor"]["simulation1"]["avgValue"], "6,96%")
        self.assertEqual(city_by_id["hudson-yards"]["analysisUnits"][0]["analysisLevel"], "selected-room")
        hudson_room = city_by_id["hudson-yards"]["analysisUnits"][0]
        self.assertEqual(hudson_room["spatialDaylightAutonomy"]["simulation1"]["autonomy"], "Average sDA value is 75,77%")
        self.assertIn("Lower UDI values near the windows", hudson_room["usefulDaylightIlluminance"]["conclusions"])
        self.assertIn("Gdańsk", city_by_id["garnizon"]["location"]["country"])
        self.assertIn("DATA_FORMA_260630", data["notices"][0])
        self.assertEqual(city_by_id["elephant-and-castle"]["source"]["file"], "ATLASY_DANE_260920(Arkusz1).csv")
        self.assertEqual(data["sourceFolder"], ".venv/TEMP")
        self.assertEqual(city_by_id["elephant-and-castle"]["source"]["tempPath"], "ATLASY_DANE_260920(Arkusz1).csv")
        self.assertEqual(locator["sourceTempPath"], "ATLASY_DANE_260920(Arkusz1).csv")
        self.assertTrue(all(link.get("sourceTempPath") == "ATLASY_DANE_260920(Arkusz1).csv" for link in elephant["imageLinks"]))
        benchmark_by_id = {benchmark["id"]: benchmark for benchmark in data["benchmarks"]}
        self.assertEqual(benchmark_by_id["kronsberg"]["source"]["tempPath"], "ATLASY_DANE_260920(Arkusz2).csv")
        self.assertEqual(benchmark_by_id["kronsberg"]["context"]["floorAreaRatio"], 0.55)
        self.assertEqual(benchmark_by_id["kronsberg"]["context"]["source"]["file"], "ATLASY_DANE_260920(Arkusz1).csv")
        self.assertEqual(benchmark_by_id["seestadt"]["context"]["solarEnergySpecs"]["annualElectricity"], 19800000.0)
        self.assertEqual(benchmark_by_id["orestad"]["name"], "Ørestad")
        self.assertEqual(len(benchmark_by_id["kronsberg"]["unassignedProfiles"]), 1)
        self.assertEqual(len(data["unassignedProfiles"]), 1)

    def test_row_order_does_not_change_city_assignment(self):
        root = Path(__file__).resolve().parents[2]
        temp_dir = root / ".venv" / "TEMP"
        if not temp_dir.exists():
            self.skipTest("Local TEMP data is not available")
        rows = read_csv(next(temp_dir.glob("ATLASY_DANE_*(Arkusz1).csv")))
        with tempfile.TemporaryDirectory() as directory:
            reordered = Path(directory)
            with (reordered / "ATLASY_DANE_1(Arkusz1).csv").open("w", encoding="cp1250", newline="") as file:
                csv.writer(file, delimiter=";", quotechar='"').writerows(rows[:5] + list(reversed(rows[5:])))
            source2 = next(temp_dir.glob("ATLASY_DANE_*(Arkusz2).csv"))
            (reordered / source2.name).write_bytes(source2.read_bytes())
            data, _ = import_data(reordered, reordered / "out.json", copy_assets=False)
        self.assertEqual({city["id"] for city in data["cities"]}, {"elephant-and-castle", "garnizon", "hudson-yards"})
        self.assertEqual(next(city for city in data["cities"] if city["id"] == "elephant-and-castle")["overview"]["far"], 3.96)

    def test_validator_rejects_duplicate_units_and_out_of_range_percentages(self):
        sample = {
            "cities": [{
                "id": "sample",
                "name": "Sample",
                "source": {"row": 1},
                "analysisUnits": [{"id": "one"}, {"id": "one"}],
                "distribution": {"unit": "%", "bins": [{"label": "x", "value": 101}]},
            }],
            "benchmarks": [],
        }
        errors = validate_data(sample)
        self.assertTrue(any("unique within sample" in error for error in errors))
        self.assertTrue(any("outside 0-100" in error for error in errors))

    def test_column_letter_uses_spreadsheet_numbering(self):
        self.assertEqual(column_letter(0), "A")
        self.assertEqual(column_letter(25), "Z")
        self.assertEqual(column_letter(54), "BC")

    def test_missing_image_keeps_null_temp_path(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            data = {
                "cities": [{
                    "id": "sample",
                    "name": "Sample",
                    "folder": "SAMPLE",
                    "imageLinks": [{
                        "field": "location.imageUrl",
                        "label": "Location image",
                        "column": 3,
                        "columnLetter": "D",
                        "rawCell": "missing_picture",
                        "referencedName": "missing_picture",
                        "resolvedName": "missing_picture",
                        "aliasNote": None,
                        "sourceFile": "sample.csv",
                        "sheet": "Arkusz1",
                        "row": 6,
                        "tempPath": None,
                        "publicUrl": None,
                        "status": "unresolved",
                    }],
                    "analysisUnits": [],
                }]
            }
            warnings = resolve_image_links(data, root, root / "public", copy_assets=False)
        self.assertIsNone(data["cities"][0]["imageLinks"][0]["tempPath"])
        self.assertEqual(data["cities"][0]["imageLinks"][0]["status"], "missing")
        self.assertTrue(any("missing image" in warning for warning in warnings))

    def test_validator_rejects_complete_distribution_that_does_not_sum_to_100(self):
        sample = {
            "cities": [],
            "benchmarks": [{"distribution": {"unit": "%", "bins": [
                {"label": "low", "value": 20}, {"label": "high", "value": 20}
            ]}}],
        }
        errors = validate_data(sample)
        self.assertTrue(any("does not sum to 100" in error for error in errors))

    def test_missing_source_sheet_is_reported_without_deleting_drop_folder(self):
        with tempfile.TemporaryDirectory() as directory:
            temp_dir = Path(directory)
            with self.assertRaisesRegex(FileNotFoundError, "Arkusz1"):
                import_data(temp_dir, temp_dir / "out.json", copy_assets=False)
            self.assertTrue(temp_dir.exists())


if __name__ == "__main__":
    unittest.main()