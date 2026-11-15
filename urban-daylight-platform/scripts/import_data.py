from __future__ import annotations

import argparse
import filecmp
from io import BytesIO
import json
import re
import shutil
import sys
import unicodedata
from pathlib import Path
from typing import Any, BinaryIO

try:
    from .workbook_source import REQUIRED_SHEETS, read_workbook
except ImportError:
    from workbook_source import REQUIRED_SHEETS, read_workbook


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_WORKBOOK = (
    ROOT
    / "TEMP__TRUTH"
    / "IEA_TASK_70_ATLASY"
    / "DANE_NA_STRONE"
    / "TABELA_EXCEL"
    / "ATLASY_DANE_261107.xlsx"
)
DEFAULT_OUTPUT = ROOT / "urban-daylight-platform" / "public" / "data" / "atlas.json"
EXCLUDED_BLOCKS = {("garnizon", "ub_2"): "Excluded by TEMP__TRUTH/IEA_TASK_70_ATLASY/NOTATKI.docx"}
CITY_ID_OVERRIDES = {
    "elephant & castle – elephant park": "elephant-and-castle",
    "garnizon": "garnizon",
    "kronsberg": "kronsberg",
    "aspern seestadt": "aspern-seestadt",
    "ørestad syd": "orestad-syd",
}
VERIFIED_COORDINATES = {
    "elephant-and-castle": {
        "coordinates": {"lat": 51.4928183, "lng": -0.0962976, "zoom": 14},
        "coordinateSource": {
            "provider": "OpenStreetMap",
            "matchedName": "Elephant Park",
            "method": "Nominatim representative point for the named locality",
            "queryUrl": "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=Elephant%20Park%2C%20Elephant%20and%20Castle%2C%20London%2C%20UK",
            "featureUrl": "https://www.openstreetmap.org/way/366979812",
            "osmType": "way",
            "osmId": "366979812",
            "license": "Data © OpenStreetMap contributors, ODbL 1.0",
        },
    },
    "garnizon": {
        "coordinates": {"lat": 54.3845063, "lng": 18.5928283, "zoom": 15},
        "coordinateSource": {
            "provider": "OpenStreetMap",
            "matchedName": "Garnizon",
            "method": "Nominatim representative point for the named commercial area",
            "queryUrl": "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=Garnizon%2C%20Wrzeszcz%2C%20Gdansk%2C%20Poland",
            "featureUrl": "https://www.openstreetmap.org/relation/17995285",
            "osmType": "relation",
            "osmId": "17995285",
            "license": "Data © OpenStreetMap contributors, ODbL 1.0",
        },
    },
    "kronsberg": {
        "coordinates": {"lat": 52.3381288, "lng": 9.834295, "zoom": 13},
        "coordinateSource": {
            "provider": "OpenStreetMap",
            "matchedName": "Kronsberg",
            "method": "Nominatim point for the named Hannover suburb",
            "queryUrl": "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=Kronsberg%2C%20Hannover%2C%20Germany",
            "featureUrl": "https://www.openstreetmap.org/node/163156634",
            "osmType": "node",
            "osmId": "163156634",
            "license": "Data © OpenStreetMap contributors, ODbL 1.0",
        },
    },
    "aspern-seestadt": {
        "coordinates": {"lat": 48.2271676, "lng": 16.5058256, "zoom": 14},
        "coordinateSource": {
            "provider": "OpenStreetMap",
            "matchedName": "Seestadt Aspern",
            "method": "Nominatim representative point for the named Vienna suburb",
            "queryUrl": "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=Aspern%20Seestadt%2C%20Vienna%2C%20Austria",
            "featureUrl": "https://www.openstreetmap.org/way/28100015",
            "osmType": "way",
            "osmId": "28100015",
            "license": "Data © OpenStreetMap contributors, ODbL 1.0",
        },
    },
}
APPROVED_CITY_NAMES = {
    "Elephant & Castle – Elephant Park",
    "Garnizon",
    "Kronsberg",
    "Aspern Seestadt",
    "Ørestad Syd",
}
SITE_IMAGE_FIELDS = {
    "D": ("location.imageUrl", "Location map", "location", "imageUrl"),
    "N": ("overview.schwarzplanImage", "Site top view", "overview", "schwarzplanImage"),
    "O": ("overview.model3dImage", "Site 3D model", "overview", "model3dImage"),
    "BB": ("siteAnalysis.urbanBlocksImage", "Selected urban blocks", "siteAnalysis", "urbanBlocksImage"),
    "Q": ("siteAnalysis.sunHoursImage", "Site sun hours", "siteAnalysis", "sunHoursImage"),
    "AL": ("siteAnalysis.daylightPotentialImage", "Site daylight potential", "siteAnalysis", "daylightPotentialImage"),
    "AV": ("siteAnalysis.solarEnergyImage", "Site solar potential", "siteAnalysis", "solarEnergyImage"),
}
BLOCK_IMAGE_FIELDS = {
    "BD": ("plan", "Urban-block top view"),
    "BE": ("form3d", "Simplified 3D form"),
    "BN": ("sunHours", "Urban-block sun hours"),
    "CS": ("daylightPotential", "Urban-block daylight potential"),
    "DC": ("solarEnergy", "Urban-block solar potential"),
}
CITY_FOLDERS = {
    "elephant-and-castle": "ELEPHANT_AND_CASTLE",
    "garnizon": "GARNIZON",
    "kronsberg": "KRONSBERG",
    "aspern-seestadt": "SEESTADT",
    "orestad-syd": "ORESTADT",
}
KNOWN_CONFLICT_CELLS = {
    "Q15": "TASK-17: the file name identifies Kronsberg, not the Aspern Seestadt source row.",
    "AL15": "TASK-17: the file name identifies Kronsberg, not the Aspern Seestadt source row.",
    "AV15": "TASK-17: the file name identifies Kronsberg, not the Aspern Seestadt source row.",
}
PRIVATE_DANE_COLUMNS = {"F", "G", "H", "I", "J", "K", "L", "M", "P", "BM"}
SITE_DISTRIBUTIONS = (
    ("Sun hours", "GROUND", range(18, 28), 7, "R5"),
    ("Sun hours", "BUILDINGS (FACADES, ROFFS, OTHER)", range(28, 38), 7, "R5"),
    ("Daylight potential", "BUILDINGS (FACADES, ROFFS, OTHER)", range(39, 48), 7, "AM5"),
)
BLOCK_DISTRIBUTIONS = (
    ("Sun hours", "GROUND", range(67, 77), 7, "R5"),
    ("Sun hours", "FACADES", range(77, 87), 7, "R5"),
    ("Sun hours", "ROOFS", range(87, 97), 7, "R5"),
    ("Daylight potential", "FACADES", range(98, 107), 7, "AM5"),
)
SITE_SOLAR_COLUMNS = range(49, 54)
BLOCK_SOLAR_COLUMNS = range(108, 113)
def column_number(label: str) -> int:
    number = 0
    for character in label:
        number = number * 26 + ord(character.upper()) - ord("A") + 1
    return number


def column_letter(index: int) -> str:
    label = ""
    while index:
        index, remainder = divmod(index - 1, 26)
        label = chr(65 + remainder) + label
    return label


def source_ref(sheet: str, row: int, cell: str | None = None) -> dict[str, Any]:
    result: dict[str, Any] = {"sheet": sheet, "row": row}
    if cell:
        result["cell"] = cell
    return result


def public_dane_cells(cells: dict[str, Any]) -> dict[str, Any]:
    return {
        coordinate: value
        for coordinate, value in cells.items()
        if not any(
            coordinate.startswith(column)
            and coordinate[len(column):].isdigit()
            for column in PRIVATE_DANE_COLUMNS
        )
    }


def source_row_data(
    sheet: str, row: dict[str, Any], include_values: bool = True
) -> dict[str, Any]:
    cells = row["cells"]
    if sheet == "DANE":
        cells = public_dane_cells(cells)
    return {
        "row": row["row"],
        **({"cells": cells} if include_values else {}),
        "source": source_ref(sheet, row["row"]),
    }


def workbook_path_label(workbook_path: Path | BinaryIO, source_file: str) -> str:
    if not isinstance(workbook_path, Path):
        return "in-memory"
    try:
        return workbook_path.resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return source_file


def slug(value: str) -> str:
    value = value.replace("Ø", "O").replace("ø", "o")
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    normalized = normalized.casefold().replace("&", " and ")
    return re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")


def make_distribution(
    sheet: str,
    source_row: int,
    cells: dict[str, Any],
    header_cells: dict[str, Any],
    label_row: int,
    data_columns: range,
    scope: str,
    distribution_name: str,
    header: str | None,
) -> dict[str, Any]:
    bins = []
    for column in data_columns:
        cell = f"{column_letter(column)}{source_row}"
        label_cell = f"{column_letter(column)}{label_row}"
        bins.append({
            "label": header_cells.get(label_cell),
            "value": cells.get(cell),
            "source": source_ref(sheet, source_row, cell),
        })
    return {
        "name": distribution_name,
        "scope": scope,
        "unitHeader": header,
        "bins": bins,
        "source": source_ref(sheet, source_row),
    }


def distributions_for_row(
    sheet: str,
    source_row: int,
    row_cells: dict[str, Any],
    header_cells: dict[str, Any],
    specifications: tuple[tuple[str, str, range, int, str], ...],
) -> list[dict[str, Any]]:
    result = []
    for name, scope, columns, label_row, unit_header_cell in specifications:
        result.append(make_distribution(
            sheet,
            source_row,
            row_cells,
            header_cells,
            label_row,
            columns,
            scope,
            name,
            header_cells.get(unit_header_cell),
        ))
    return result


def labeled_values(
    sheet: str,
    row_number: int,
    data_cells: dict[str, Any],
    header_cells: dict[str, Any],
    label_row: int,
    columns: range,
) -> list[dict[str, Any]]:
    return [
        {
            "label": header_cells.get(f"{column_letter(column)}{label_row}"),
            "value": data_cells.get(f"{column_letter(column)}{row_number}"),
            "source": source_ref(sheet, row_number, f"{column_letter(column)}{row_number}"),
        }
        for column in columns
    ]


def chart_distribution(source_distribution: dict[str, Any]) -> dict[str, Any]:
    return {
        "unit": "%" if "%" in (source_distribution["unitHeader"] or "") else None,
        "unitHeader": source_distribution["unitHeader"],
        "scope": source_distribution["scope"],
        "bins": source_distribution["bins"],
        "source": source_distribution["source"],
    }


def solar_specs(
    source_values: list[dict[str, Any]],
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    keys = ("area", "totalSolarEnergy", "avgSolarEnergy", "panelArea", "annualElectricity")
    specs = {key: item["value"] for key, item in zip(keys, source_values)}
    area = specs.get("area")
    panel_area = specs.get("panelArea")
    if (
        isinstance(area, (int, float))
        and isinstance(panel_area, (int, float))
        and panel_area > area
    ):
        area_source = next((item for item in source_values if item["label"] == "area (m²)"), None)
        panel_source = next(
            (item for item in source_values if item["label"] == "area to be covered by the panels (m²) - 60%"),
            None,
        )
        area_cell = area_source["source"]["cell"] if area_source else "source area cell"
        panel_cell = panel_source["source"]["cell"] if panel_source else "source panel-area cell"
        specs["panelArea"] = None
        specs["panelAreaWarning"] = (
            f"Panel area from {panel_cell} exceeds the reported roof area from {area_cell}; "
            "the panel-area result is omitted pending source verification."
        )
    return specs, source_values


def image_link(
    workbook_file: str,
    sheet: str,
    row_number: int,
    column: int,
    value: Any,
    label: str,
    field: str,
) -> dict[str, Any]:
    cell = f"{column_letter(column)}{row_number}"
    referenced_name = value.strip() if isinstance(value, str) and value.strip() else None
    return {
        "field": field,
        "label": label,
        "column": column - 1,
        "columnLetter": column_letter(column),
        "cell": cell,
        "rawCell": value,
        "referencedName": referenced_name,
        "resolvedName": None,
        "aliasNote": None,
        "sourceFile": workbook_file,
        "sourceTempPath": None,
        "sheet": sheet,
        "row": row_number,
        "tempPath": None,
        "publicUrl": None,
        "status": "unresolved" if referenced_name else "empty",
    }


def image_links_for_row(
    workbook_file: str,
    sheet: str,
    row_number: int,
    cells: dict[str, Any],
    mappings: dict[str, tuple[str, str]],
) -> list[dict[str, Any]]:
    links = []
    for column_letters, (field, label) in mappings.items():
        column = column_number(column_letters)
        cell = f"{column_letters}{row_number}"
        if cells.get(cell) is not None:
            links.append(image_link(
                workbook_file, sheet, row_number, column, cells[cell], label, field
            ))
    return links


def build_city(
    site: dict[str, Any], source_file: str, root_sites: list[dict[str, Any]],
    header_cells: dict[str, Any],
) -> dict[str, Any]:
    row_number = site["sourceRow"]
    row = next(item for item in root_sites if item["row"] == row_number)
    cells = row["cells"]
    site_sun_hours = distributions_for_row(
        "DANE", row_number, cells, header_cells, SITE_DISTRIBUTIONS[:2]
    )
    site_daylight = distributions_for_row(
        "DANE", row_number, cells, header_cells, SITE_DISTRIBUTIONS[2:]
    )
    site_solar_values = labeled_values(
        "DANE", row_number, cells, header_cells, 7, SITE_SOLAR_COLUMNS
    )
    site_solar_specs, site_solar_source = solar_specs(site_solar_values)
    city = {
        "id": CITY_ID_OVERRIDES.get(site["name"].casefold(), slug(site["name"])),
        "name": site["name"],
        "location": {
            "country": cells.get(f"E{row_number}"),
            "coordinates": VERIFIED_COORDINATES.get(
                CITY_ID_OVERRIDES.get(site["name"].casefold(), slug(site["name"])),
                {},
            ).get("coordinates"),
            "coordinateSource": VERIFIED_COORDINATES.get(
                CITY_ID_OVERRIDES.get(site["name"].casefold(), slug(site["name"])),
                {},
            ).get("coordinateSource"),
            "imageUrl": None,
        },
        "timeline": {"years": None, "description": None},
        "overview": {"schwarzplanImage": None, "model3dImage": None, "far": None},
        "urbanIndicators": {
            "buildingIntensity": None,
            "greenSpacePercentage": None,
            "buildingTypes": None,
            "transport": None,
            "greenBlueInfrastructure": None,
        },
        "siteAnalysis": {
            "sunHoursImage": None,
            "daylightPotentialImage": None,
            "solarEnergyImage": None,
            "urbanBlocksImage": None,
            "sunHours": site_sun_hours,
            "sunHoursDistribution": {
                "ground": chart_distribution(site_sun_hours[0]),
                "buildings": chart_distribution(site_sun_hours[1]),
            },
            "daylightPotential": site_daylight,
            "daylightPotentialDistribution": chart_distribution(site_daylight[0]),
            "solarEnergySpecs": site_solar_specs,
            "solarEnergySpecsSource": site_solar_source,
        },
        "analysisUnits": [],
        "source": {
            "file": source_file,
            "sheet": "DANE",
            "row": row_number,
            "cell": f"C{row_number}",
            "status": "source",
        },
        "sourceData": source_row_data("DANE", row),
        "imageLinks": image_links_for_row(
            source_file, "DANE", row_number, cells,
            {
                column: (field, label)
                for column, (field, label, _section, _property) in SITE_IMAGE_FIELDS.items()
            },
        ),
    }
    return city


def build_block(
    row: dict[str, Any], source_file: str,
    header_cells: dict[str, Any],
) -> dict[str, Any]:
    row_number = row["row"]
    cells = row["cells"]
    block_name = cells[f"BC{row_number}"]
    block_distributions = distributions_for_row(
        "DANE", row_number, cells, header_cells, BLOCK_DISTRIBUTIONS
    )
    block_solar_values = labeled_values(
        "DANE", row_number, cells, header_cells, 7, BLOCK_SOLAR_COLUMNS
    )
    block_solar_specs, block_solar_source = solar_specs(block_solar_values)
    return {
        "id": block_name,
        "name": block_name,
        "analysisLevel": "urban-block",
        "sourceRow": row_number,
        "source": {
            "file": source_file,
            "sheet": "DANE",
            "row": row_number,
            "cell": f"BC{row_number}",
            "status": "source",
        },
        "sourceData": source_row_data("DANE", row),
        "plan": None,
        "form3d": None,
        "far": cells.get(f"BF{row_number}"),
        "indicators": {
            "buildingIntensity": cells.get(f"BF{row_number}"),
            "greenSpaceRatio": cells.get(f"BG{row_number}"),
            "buildingCoverage": cells.get(f"BH{row_number}"),
            "avgFloors": cells.get(f"BI{row_number}"),
            "treeCount": None,
            "heightToWidthRatio": cells.get(f"BL{row_number}"),
            "streetWidth": cells.get(f"BK{row_number}"),
            "buildingHeight": cells.get(f"BJ{row_number}"),
        },
        "function": None,
        "sunHours": None,
        "daylightPotential": None,
        "solarEnergy": None,
        "distributions": block_distributions,
        "sunHoursDistribution": {
            "ground": chart_distribution(block_distributions[0]),
            "facades": chart_distribution(block_distributions[1]),
            "roofs": chart_distribution(block_distributions[2]),
        },
        "daylightPotentialDistribution": chart_distribution(block_distributions[3]),
        "solarEnergySpecs": block_solar_specs,
        "solarEnergySpecsSource": block_solar_source,
        "imageLinks": image_links_for_row(
            source_file, "DANE", row_number, cells,
            {column: (field, label) for column, (field, label) in BLOCK_IMAGE_FIELDS.items()},
        ),
    }


def workbook_source_sheets(
    workbook_data: dict[str, Any], excluded_rows: set[int]
) -> dict[str, list[dict[str, Any]]]:
    sheets: dict[str, list[dict[str, Any]]] = {}
    for name, rows in workbook_data["sheets"].items():
        if name == "DANE":
            rows = [row for row in rows if row["row"] not in excluded_rows]
            sheets[name] = [source_row_data(name, row) for row in rows]
        else:
            sheets[name] = [
                source_row_data(name, row, include_values=False) for row in rows
            ]
    return sheets


def exact_asset_matches(
    asset_root: Path,
    referenced_name: str,
    city_id: str,
    is_location_image: bool = False,
) -> list[Path]:
    if is_location_image:
        roots = [
            path for path in asset_root.iterdir()
            if path.is_dir() and path.name.casefold() == "grafiki_location"
        ] if asset_root.is_dir() else []
    else:
        location_root = asset_root / CITY_FOLDERS[city_id]
        roots = [location_root] if location_root.is_dir() else []
    return [
        path
        for root in roots
        for path in root.rglob("*")
        if path.is_file()
        and path.suffix.casefold() == ".png"
        and path.stem == referenced_name
        and all(part.casefold() != "stare" for part in path.relative_to(root).parts)
    ]


def set_image_field(record: dict[str, Any], field: str, value: str) -> None:
    target = record
    segments = field.split(".")
    for segment in segments[:-1]:
        target = target[segment]
    target[segments[-1]] = value


def cleanup_generated_images(data: dict[str, Any], public_dir: Path) -> None:
    referenced_images = {
        (CITY_FOLDERS[link["cityId"]], link["resolvedName"].casefold())
        for link in data["imageCatalog"]
        if link["status"] in {"copied", "present"} and link["resolvedName"]
    }
    generated_folders = {*CITY_FOLDERS.values(), "HUDSON_YARDS"}
    for folder in sorted(generated_folders):
        folder_path = public_dir / folder
        if folder_path.is_symlink() or not folder_path.is_dir():
            continue
        for image_path in folder_path.iterdir():
            if (
                image_path.is_symlink()
                or not image_path.is_file()
                or image_path.suffix.casefold() != ".png"
                or (folder, image_path.stem.casefold()) in referenced_images
            ):
                continue
            image_path.unlink()


def resolve_image_links(
    data: dict[str, Any],
    asset_root: Path | None = None,
    public_dir: Path | None = None,
) -> list[str]:
    warnings = []
    for city in data["cities"]:
        folder = CITY_FOLDERS[city["id"]]
        for record in [city, *city.get("analysisUnits", [])]:
            for link in record.get("imageLinks", []):
                if link["status"] == "empty":
                    continue
                cell = link["cell"]
                if cell in KNOWN_CONFLICT_CELLS:
                    link["aliasNote"] = KNOWN_CONFLICT_CELLS[cell]
                    continue
                if not asset_root:
                    continue
                referenced = link["referencedName"]
                approved_alias = (
                    city["id"] == "elephant-and-castle"
                    and record.get("name") == "UB_1"
                    and cell == "BE8"
                    and referenced == "Elephant_and_Castle_UB_model_3D"
                )
                resolved = "Elephant_and_Case_UB_1_model_3D" if approved_alias else referenced
                if approved_alias:
                    link["aliasNote"] = "TASK-15: owner confirmed this UB_1 model filename on 2026-11-15."
                matches = exact_asset_matches(
                    asset_root,
                    resolved,
                    city["id"],
                    is_location_image=link["field"] == "location.imageUrl",
                )
                if len(matches) != 1:
                    if len(matches) > 1:
                        link["aliasNote"] = "Multiple approved assets have this exact filename."
                        warnings.append(
                            f"{city['name']} {cell}: ambiguous exact image {resolved}.PNG"
                        )
                    else:
                        link["aliasNote"] = "No exact asset found in the approved source folders."
                        warnings.append(
                            f"{city['name']} {cell}: {resolved}.PNG was not found in the approved "
                            "location-specific source folder."
                        )
                    continue

                if not public_dir:
                    continue
                source = matches[0]
                target = public_dir / folder / f"{resolved}.PNG"
                target.parent.mkdir(parents=True, exist_ok=True)
                if target.exists() and filecmp.cmp(source, target, shallow=False):
                    link["status"] = "present"
                else:
                    shutil.copy2(source, target)
                    link["status"] = "copied"
                link["resolvedName"] = resolved
                try:
                    link["sourceTempPath"] = source.relative_to(ROOT).as_posix()
                except ValueError:
                    link["sourceTempPath"] = None
                link["tempPath"] = link["sourceTempPath"]
                link["publicUrl"] = f"/atlasy-platform/{folder}/{resolved}.PNG"
                set_image_field(record, link["field"], resolved)

    data["imageCatalog"] = [
        {"cityId": city["id"], **link}
        for city in data["cities"]
        for record in [city, *city.get("analysisUnits", [])]
        for link in record.get("imageLinks", [])
    ]
    return warnings


def build_private_content(workbook_path: Path | BinaryIO) -> dict[str, Any]:
    source_file = workbook_path.name if isinstance(workbook_path, Path) else "source.xlsx"
    workbook_data = read_workbook(workbook_path, source_file=source_file)
    private_sheets = {}
    for sheet, rows in workbook_data["sheets"].items():
        private_sheets[sheet] = [
            {
                "row": row["row"],
                "cells": row["cells"],
                "source": source_ref(sheet, row["row"]),
            }
            for row in rows
        ]
    return {
        "sourceWorkbook": workbook_data["sourceFile"],
        "sourcePath": workbook_path_label(workbook_path, source_file),
        "sourceSheets": private_sheets,
        "note": "Local-only source text and metadata; do not publish or copy into public assets.",
    }


def build_data(
    workbook_path: Path | BinaryIO,
    source_file: str | None = None,
    asset_root: Path | None = None,
    public_dir: Path | None = None,
) -> tuple[dict[str, Any], list[str]]:
    workbook_data = read_workbook(workbook_path, source_file=source_file)
    unapproved_sites = [
        site["name"]
        for site in workbook_data["sites"]
        if site["name"] not in APPROVED_CITY_NAMES
    ]
    if unapproved_sites:
        raise ValueError(
            "Unapproved locations in DANE: " + ", ".join(unapproved_sites)
        )
    source_file = workbook_data["sourceFile"]
    source_path = workbook_path_label(workbook_path, source_file)
    d_data_rows = workbook_data["sheets"]["DANE"]
    header_cells: dict[str, Any] = {}
    for source_row in (5, 6, 7):
        header_row = next(
            (row for row in d_data_rows if row["row"] == source_row), None
        )
        if header_row:
            header_cells.update(header_row["cells"])
    sites = workbook_data["sites"]
    cities = [build_city(site, source_file, d_data_rows, header_cells) for site in sites]
    cities_by_name = {city["name"].casefold(): city for city in cities}

    for row in d_data_rows:
        row_number = row["row"]
        if row_number < 8:
            continue
        block = row["cells"].get(f"BC{row_number}")
        if not block:
            continue
        # The reader's grouped site rows are authoritative; row order is not used to infer ownership.
        site = next(
            (
                item for item in sites
                if any(block_row["sourceRow"] == row_number for block_row in item["blocks"])
            ),
            None,
        )
        if site is None:
            raise ValueError(f"DANE!BC{row_number}: block has no source location")
        city = cities_by_name[site["name"].casefold()]
        excluded_reason = EXCLUDED_BLOCKS.get((site["name"].casefold(), block.casefold()))
        if excluded_reason:
            continue
        city["analysisUnits"].append(build_block(row, source_file, header_cells))

    exclusion_rows = []
    excluded_dane_rows: set[int] = set()
    for site in sites:
        for block in site["blocks"]:
            reason = EXCLUDED_BLOCKS.get((site["name"].casefold(), block["name"].casefold()))
            if reason:
                excluded_dane_rows.add(block["sourceRow"])
                exclusion_rows.append({
                    "reason": reason,
                    "source": {
                        "file": source_file,
                        "sheet": "DANE",
                        "row": block["sourceRow"],
                        "cell": f"BC{block['sourceRow']}",
                    },
                })

    notices = [
        "The website workbook contains no coordinates. Four map points are independently verified against matching OpenStreetMap locality or development features. Ørestad Syd remains unmapped: its exact-name OpenStreetMap result is a restaurant, not a district feature, and no coordinate is assigned pending a reliable source for the case-study area.",
        "Unapproved descriptions, planning principles, and key characteristics are stored locally pending TASK-12 and TASK-25/30/35/40/48 approval.",
    ]
    for city in cities:
        for link in city["imageLinks"]:
            if city["name"] == "Aspern Seestadt" and link["cell"] in {"Q15", "AL15", "AV15"}:
                notices.append(
                    f"{link['cell']} is a Kronsberg-named image reference on the Aspern Seestadt row; "
                    "it remains unresolved pending TASK-17."
                )
    elephant = cities_by_name.get("elephant & castle – elephant park")
    if elephant:
        block = next((item for item in elephant["analysisUnits"] if item["name"] == "UB_1"), None)
        solar = {
            item["label"]: item["value"]
            for item in (block or {}).get("solarEnergySpecsSource", [])
        }
        if solar.get("area (m²)") == 9971 and solar.get("area to be covered by the panels (m²) - 60%") == 59982:
            notices.append(
                "Elephant Park DANE!DD8 and DANE!DG8 are preserved exactly despite the solar-area "
                "inconsistency; no correction is inferred pending TASK-16."
            )

    data = {
        "version": 2,
        "generatedFrom": [source_file],
        "sourceFolder": source_path.rsplit("/", 1)[0] if "/" in source_path else None,
        "cities": cities,
        "benchmarks": [],
        "unassignedProfiles": [],
        "imageCatalog": [],
        "notices": notices,
        "exclusions": exclusion_rows,
        "sourceWorkbook": {
            "file": source_file,
            "path": source_path,
            "sheets": workbook_source_sheets(workbook_data, excluded_dane_rows),
        },
    }
    errors = validate_data(data)
    if errors:
        raise ValueError("Invalid imported data: " + "; ".join(errors))
    return data, resolve_image_links(data, asset_root, public_dir)


def validate_data(data: dict[str, Any]) -> list[str]:
    errors = []
    cities = data.get("cities", [])
    city_ids = [city.get("id") for city in cities]
    city_names = [city.get("name") for city in cities]
    if len(city_ids) != len(set(city_ids)):
        errors.append("Case-study IDs must be unique")
    approved_city_ids = set(CITY_ID_OVERRIDES.values())
    if set(city_ids) != approved_city_ids or set(city_names) != APPROVED_CITY_NAMES:
        errors.append("Case studies must contain exactly the five approved locations")
    if data.get("benchmarks") or data.get("unassignedProfiles"):
        errors.append("Legacy benchmark profiles are not supported by the website workbook")
    for city in cities:
        if not city.get("name") or not city.get("source", {}).get("row"):
            errors.append(f"Case study {city.get('id')} is missing required provenance")
        block_ids = [block.get("id") for block in city.get("analysisUnits", [])]
        if len(block_ids) != len(set(block_ids)):
            errors.append(f"Analysis-unit IDs must be unique within {city.get('id')}")
        if city["name"].casefold() == "garnizon" and "UB_2" in block_ids:
            errors.append("Garnizon UB_2 must be excluded")
        for block in city.get("analysisUnits", []):
            source = block.get("source", {})
            if source.get("sheet") != "DANE" or not source.get("cell"):
                errors.append(f"Block {city.get('id')}/{block.get('id')} is missing cell provenance")
            if block.get("analysisLevel") != "urban-block":
                errors.append(f"Block {city.get('id')}/{block.get('id')} is not an urban-block analysis")
            if any(field in block for field in (
                "daylightFactor",
                "spatialDaylightAutonomy",
                "usefulDaylightIlluminance",
                "shadingAnalysis",
                "daylightPotential2",
            )):
                errors.append(f"Block {city.get('id')}/{block.get('id')} contains legacy scenario data")
        if "shadingAnalysis" in city:
            errors.append(f"Case study {city.get('id')} contains legacy shading data")
    return errors


def import_data(
    workbook_path: Path | BinaryIO,
    output_path: Path,
    private_output_path: Path | None = None,
) -> tuple[dict[str, Any], list[str]]:
    source_root = (
        workbook_path.parent.parent / "RYSUNKI"
        if isinstance(workbook_path, Path) and workbook_path.exists()
        else None
    )
    data, warnings = build_data(
        workbook_path,
        asset_root=source_root,
        public_dir=output_path.parent.parent,
    )
    private_output_path = private_output_path or ROOT / ".venv" / "atlas-private-content.json"
    private_output_path.parent.mkdir(parents=True, exist_ok=True)
    private_source = (
        workbook_path
        if isinstance(workbook_path, Path)
        else BytesIO(workbook_path.getvalue())
    )
    private_output_path.write_text(
        json.dumps(build_private_content(private_source), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    cleanup_generated_images(data, output_path.parent.parent)
    return data, warnings


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(errors="backslashreplace")
    parser = argparse.ArgumentParser(description="Import the approved website workbook.")
    parser.add_argument("--workbook", type=Path, default=DEFAULT_WORKBOOK)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    try:
        data, warnings = import_data(args.workbook, args.output)
    except (FileNotFoundError, ValueError, OSError) as error:
        print(f"Import failed: {error}", file=sys.stderr)
        return 1
    print(f"Imported {len(data['cities'])} source locations to {args.output}")
    for city in data["cities"]:
        print(f"  {city['name']}: {len(city['analysisUnits'])} eligible urban blocks")
    for warning in warnings:
        print(f"WARNING: {warning}")
    for notice in data["notices"]:
        print(f"NOTICE: {notice}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
