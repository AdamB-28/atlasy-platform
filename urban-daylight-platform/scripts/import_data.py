from __future__ import annotations

import argparse
import csv
import json
import math
import re
import shutil
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_TEMP = ROOT / ".venv" / "TEMP"
DEFAULT_OUTPUT = ROOT / "urban-daylight-platform" / "public" / "data" / "atlas.json"
CITY_CONFIG = {
    "elephant and castle": {
        "id": "elephant-and-castle",
        "name": "Elephant and Castle",
        "folder": "ELEPHANT_AND_CASTLE",
        "coordinates": {"lat": 51.4937, "lng": -0.0996, "zoom": 15},
    },
    "garnizon": {
        "id": "garnizon",
        "name": "Garnizon",
        "folder": "GARNIZON",
        "coordinates": {"lat": 54.3813, "lng": 18.5955, "zoom": 15},
    },
    "hudson yards": {
        "id": "hudson-yards",
        "name": "Hudson Yards",
        "folder": "HUDSON_YARDS",
        "coordinates": {"lat": 40.7536, "lng": -74.0019, "zoom": 15},
    },
}
SUN_LABELS = ["0-1", "1-2", "2-3", "3-4", "4-5", "5-6", "6-7", "7-8", "8-9", "9+"]
DAYLIGHT_LABELS = ["0-5", "5-10", "10-15", "15-19", "19-23", "23-27", "27-32", "32-37", "37+"]
PUBLIC_BASE = "/atlasy-platform"
IMAGE_ALIASES = {("elephant-and-castle", "elephant_and_castle_ub_model_3d"): "elephant_and_case_ub_1_model_3d"}
IMAGE_FIELDS = {
    "location.imageUrl": ("Location image", 3),
    "overview.schwarzplanImage": ("Schwarzplan", 7),
    "overview.model3dImage": ("3D model", 8),
    "shadingAnalysis.marchSeptember": ("Shading · March/September", 14),
    "shadingAnalysis.june": ("Shading · June", 15),
    "shadingAnalysis.december": ("Shading · December", 16),
    "siteAnalysis.sunHoursImage": ("Site sun hours", 17),
    "siteAnalysis.daylightPotentialImage": ("Site daylight potential", 38),
    "siteAnalysis.solarEnergyImage": ("Site solar energy", 48),
    "siteAnalysis.urbanBlocksImage": ("Urban-block locator", 54),
    "plan": ("Site plan", 56),
    "form3d": ("3D form", 57),
    "sunHours": ("Sun hours", 66),
    "daylightPotential": ("Daylight potential", 97),
    "solarEnergy": ("Solar energy", 107),
    "daylightFactor.simulation1.image": ("Daylight factor · simulation 1", 113),
    "daylightFactor.simulation2.image": ("Daylight factor · simulation 2", 116),
    "spatialDaylightAutonomy.simulation1.image": ("Spatial daylight autonomy · simulation 1", 119),
    "spatialDaylightAutonomy.simulation2.image": ("Spatial daylight autonomy · simulation 2", 121),
    "usefulDaylightIlluminance.simulation1.image": ("Useful daylight illuminance · simulation 1", 124),
    "usefulDaylightIlluminance.simulation2.image": ("Useful daylight illuminance · simulation 2", 126),
}


def read_csv(path: Path) -> list[list[str]]:
    errors = []
    for encoding in ("utf-8-sig", "cp1250", "latin-1"):
        try:
            with path.open("r", encoding=encoding, newline="") as file:
                return list(csv.reader(file, delimiter=";", quotechar='"'))
        except UnicodeDecodeError as error:
            errors.append(error)
    raise errors[-1]


def value(row: list[str], column: int) -> str | None:
    if column >= len(row):
        return None
    cleaned = row[column].strip().strip('"').strip()
    if cleaned.casefold() in {"", "no data", "brak", "nan", "-"}:
        return None
    cleaned = cleaned.replace("Gda?sk", "Gdańsk").replace("Strzy?a", "Strzyża").replace("G?rny", "Górny")
    cleaned = cleaned.replace("militarybarracks", "military barracks")
    cleaned = cleaned.replace("value.The", "value. The").replace("outstandingaccess", "outstanding access")
    cleaned = cleaned.replace("east�west", "east-west").replace("Hell�s", "Hell's").replace("room�s", "room's")
    cleaned = cleaned.replace("urban fabric: � a direct", "urban fabric: a direct")
    sda_match = re.search(r"[?�]+rednia warto[?�]+ sDA wynosi\s*([\d]+[,.][\d]+\s*%)", cleaned, re.IGNORECASE)
    if sda_match:
        return f"Average sDA value is {sda_match.group(1)}"
    if cleaned.startswith(("Ni?sze warto?ci UDI", "Ni?sze wartości UDI")):
        return (
            "Lower UDI values near the windows result from exceeding the upper useful-illuminance limit "
            "(3000 lx). Although these areas receive abundant daylight, they are classified as excessive "
            "(UDI-high) and are excluded from UDI-acceptable. UDI describes whether illuminance falls "
            "within a useful range, not simply how much light is present."
        )
    return cleaned


def number(raw: str | None) -> float | None:
    if raw is None:
        return None
    match = re.search(r"[-+]?\d[\d\s]*(?:[,.]\d+)?", raw)
    if not match:
        return None
    try:
        return float(match.group(0).replace(" ", "").replace(",", "."))
    except ValueError:
        return None


def image_name(raw: str | None) -> str | None:
    if raw is None:
        return None
    return re.sub(r"^obraz(?:ek)?\s*:\s*", "", raw, flags=re.IGNORECASE).strip() or None


def column_letter(index: int) -> str:
    label = ""
    number_index = index + 1
    while number_index:
        number_index, remainder = divmod(number_index - 1, 26)
        label = chr(65 + remainder) + label
    return label


def relative_temp_path(temp_dir: Path, path: Path) -> str:
    return path.resolve().relative_to(temp_dir.resolve()).as_posix()


def record_image_link(
    row: list[str],
    field: str,
    column: int,
    source_file: str,
    source_row: int,
    sheet: str = "Arkusz1",
    source_temp_path: str | None = None,
) -> dict[str, Any] | None:
    raw_cell = row[column].strip() if column < len(row) and row[column].strip() else None
    referenced = image_name(value(row, column))
    if not referenced and not raw_cell:
        return None
    label, expected_column = IMAGE_FIELDS.get(field, (field, column))
    return {
        "field": field,
        "label": label if expected_column == column else field,
        "column": column,
        "columnLetter": column_letter(column),
        "rawCell": raw_cell,
        "referencedName": referenced,
        "resolvedName": referenced,
        "aliasNote": None,
        "sourceFile": source_file,
        "sourceTempPath": source_temp_path,
        "sheet": sheet,
        "row": source_row,
        "tempPath": None,
        "publicUrl": None,
        "status": "unresolved" if referenced else "empty",
    }


def attach_image_links(record: dict[str, Any], links: list[dict[str, Any]]) -> None:
    present = [link for link in links if link]
    if present:
        record["imageLinks"] = present


def distribution(row: list[str], start: int, labels: list[str], unit: str) -> dict[str, Any] | None:
    values = [number(value(row, start + offset)) for offset in range(len(labels))]
    if not any(item is not None for item in values):
        return None
    return {"unit": unit, "bins": [{"label": label, "value": item} for label, item in zip(labels, values)]}


def normalize_city(raw: str | None) -> dict[str, Any] | None:
    if raw is None:
        return None
    folded = raw.strip().casefold()
    for alias, config in CITY_CONFIG.items():
        if folded == alias or folded.startswith(f"{alias} ("):
            return config
    return None


def infer_city_from_row(row: list[str]) -> dict[str, Any] | None:
    searchable = re.sub(r"[^a-z0-9]", "", " ".join(row).casefold())
    for alias, config in CITY_CONFIG.items():
        if re.sub(r"[^a-z0-9]", "", alias) in searchable:
            return config
    return None


def make_unit(row: list[str], city: dict[str, Any], source_row: int, asset_dir: Path, source_file: str, source_temp_path: str | None = None) -> dict[str, Any] | None:
    unit_code = value(row, 55)
    if not unit_code or not re.fullmatch(r"UB[_ -]?\d+", unit_code, re.IGNORECASE):
        return None

    unit_id = int(re.search(r"\d+", unit_code).group())
    sun_distribution = {
        "ground": distribution(row, 67, SUN_LABELS, "%"),
        "facades": distribution(row, 77, SUN_LABELS, "%"),
        "roofs": distribution(row, 87, SUN_LABELS, "%"),
    }
    sun_distribution = {key: item for key, item in sun_distribution.items() if item}
    daylight_distribution = distribution(row, 98, DAYLIGHT_LABELS, "%")
    daylight_image = image_name(value(row, 97))
    solar_image = image_name(value(row, 107))
    if city["id"] == "elephant-and-castle":
        for field, candidate in (("daylight", daylight_image), ("solar", solar_image)):
            if not candidate:
                continue
            suffixed = f"{candidate}_UB_{unit_id}"
            if any(path.stem.casefold() == suffixed.casefold() for path in asset_dir.rglob("*")):
                if field == "daylight":
                    daylight_image = suffixed
                else:
                    solar_image = suffixed

    unit: dict[str, Any] = {
        "id": str(unit_id),
        "name": unit_code.upper().replace(" ", "_"),
        "analysisLevel": "urban-block",
        "sourceRow": source_row,
        "plan": image_name(value(row, 56)),
        "form3d": image_name(value(row, 57)),
        "far": number(value(row, 58)),
        "indicators": {
            "buildingIntensity": number(value(row, 58)),
            "greenSpaceRatio": value(row, 59),
            "buildingCoverage": value(row, 60),
            "avgFloors": number(value(row, 61)),
            "treeCount": value(row, 62),
            "heightToWidthRatio": value(row, 63),
            "streetWidth": value(row, 64),
        },
        "function": value(row, 65),
        "sunHours": image_name(value(row, 66)),
        "daylightPotential": daylight_image,
        "solarEnergy": solar_image,
    }
    if sun_distribution:
        unit["sunHoursDistribution"] = sun_distribution
    if daylight_distribution:
        unit["daylightPotentialDistribution"] = daylight_distribution
    links = [
        record_image_link(row, field, column, source_file, source_row, source_temp_path=source_temp_path)
        for field, column in (("plan", 56), ("form3d", 57), ("sunHours", 66), ("daylightPotential", 97), ("solarEnergy", 107))
    ]
    for link in links:
        if not link or link["field"] not in {"daylightPotential", "solarEnergy"}:
            continue
        if city["id"] != "elephant-and-castle" or not link["referencedName"]:
            continue
        suffixed = f"{link['referencedName']}_UB_{unit_id}"
        if any(path.stem.casefold() == suffixed.casefold() for path in asset_dir.rglob("*")):
            link["resolvedName"] = suffixed
            link["aliasNote"] = f"CSV stem matched a unit-specific TEMP file: {link['referencedName']} -> {suffixed}"
            if link["field"] == "daylightPotential":
                unit["daylightPotential"] = suffixed
            else:
                unit["solarEnergy"] = suffixed
    attach_image_links(unit, links)

    solar_specs = [number(value(row, column)) for column in range(108, 113)]
    if any(item is not None for item in solar_specs):
        unit["solarEnergySpecs"] = {
            "area": solar_specs[0],
            "totalSolarEnergy": solar_specs[1],
            "avgSolarEnergy": solar_specs[2],
            "panelArea": solar_specs[3],
            "annualElectricity": solar_specs[4],
        }
    return unit


def make_city(row: list[str], config: dict[str, Any], source_row: int, source_file: str, source_temp_path: str | None = None) -> dict[str, Any]:
    city: dict[str, Any] = {
        "id": config["id"],
        "name": config["name"],
        "location": {
            "country": value(row, 4),
            "coordinates": config["coordinates"],
            "imageUrl": image_name(value(row, 3)),
        },
        "timeline": {"years": value(row, 5), "description": value(row, 6)},
        "overview": {
            "schwarzplanImage": image_name(value(row, 7)),
            "model3dImage": image_name(value(row, 8)),
            "far": number(value(row, 9)),
        },
        "urbanIndicators": {
            "buildingIntensity": number(value(row, 9)),
            "greenSpacePercentage": value(row, 10),
            "buildingTypes": value(row, 11),
            "transport": value(row, 12),
            "greenBlueInfrastructure": value(row, 13),
        },
        "shadingAnalysis": {
            "marchSeptember": image_name(value(row, 14)),
            "june": image_name(value(row, 15)),
            "december": image_name(value(row, 16)),
        },
        "siteAnalysis": {
            "sunHoursImage": image_name(value(row, 17)),
            "urbanBlocksImage": image_name(value(row, 54)),
            "sunHoursDistribution": {
                "ground": distribution(row, 18, SUN_LABELS, "%"),
                "facades": distribution(row, 28, SUN_LABELS, "%"),
            },
            "daylightPotentialImage": image_name(value(row, 38)),
            "daylightPotentialDistribution": distribution(row, 39, DAYLIGHT_LABELS, "%"),
            "solarEnergyImage": image_name(value(row, 48)),
            "solarEnergySpecs": {
                "area": number(value(row, 49)),
                "totalSolarEnergy": number(value(row, 50)),
                "avgSolarEnergy": number(value(row, 51)),
                "panelArea": number(value(row, 52)),
                "annualElectricity": number(value(row, 53)),
            },
        },
        "analysisUnits": [],
        "source": {
            "file": source_file,
            "tempPath": source_temp_path,
            "sheet": "Arkusz1",
            "row": source_row,
            "status": "partial",
        },
    }
    city["siteAnalysis"]["sunHoursDistribution"] = {
        key: item for key, item in city["siteAnalysis"]["sunHoursDistribution"].items() if item
    }
    if not city["siteAnalysis"]["sunHoursDistribution"]:
        city["siteAnalysis"].pop("sunHoursDistribution")
    if not any(city["siteAnalysis"]["solarEnergySpecs"].values()):
        city["siteAnalysis"].pop("solarEnergySpecs")
    attach_image_links(city, [
        record_image_link(row, field, column, source_file, source_row, source_temp_path=source_temp_path)
        for field, (_, column) in IMAGE_FIELDS.items()
        if "." in field and not field.startswith(("daylightFactor", "spatialDaylight", "usefulDaylight"))
    ])
    return city


def add_room_analysis(city: dict[str, Any], row: list[str], source_row: int, source_file: str, source_temp_path: str | None = None) -> None:
    if city["id"] not in {"elephant-and-castle", "hudson-yards"}:
        return

    def simulation(image_col: int, value_col: int, value_key: str = "avgValue") -> dict[str, Any]:
        result = {"image": image_name(value(row, image_col)), value_key: value(row, value_col)}
        return result

    df = {"simulation1": simulation(113, 114), "simulation2": simulation(116, 117)}
    df["simulation1"]["description"] = value(row, 115)
    df["simulation2"]["description"] = value(row, 118)
    sda = {
        "simulation1": simulation(119, 120, "autonomy"),
        "simulation2": simulation(121, 122, "autonomy"),
        "interpretation": value(row, 123),
    }
    udi = {
        "simulation1": simulation(124, 125),
        "simulation2": simulation(126, 127),
        "interpretation": None,
        "conclusions": value(row, 128),
    }
    room_id = "selected-room"
    room_name = "Selected room scenarios"
    if city["id"] == "elephant-and-castle":
        room_id = "selected-room-1"
        room_name = "Selected room · 750 lx study"

    unit = {
        "id": room_id,
        "name": room_name,
        "analysisLevel": "selected-room",
        "comparisonKey": "room-750lx" if city["id"] == "elephant-and-castle" else "room-300lx",
        "sourceRow": source_row,
        "plan": None,
        "form3d": None,
        "far": None,
        "indicators": {
            "buildingIntensity": None,
            "greenSpaceRatio": None,
            "buildingCoverage": None,
            "avgFloors": None,
            "treeCount": None,
            "heightToWidthRatio": None,
            "streetWidth": None,
        },
        "function": "Room-scale daylight simulation; sDA criterion is 750 lx for this study. Results are not urban-block measurements." if city["id"] == "elephant-and-castle" else "Room-scale daylight simulations use a 300 lx sDA threshold; results are not urban-block measurements.",
        "sunHours": None,
        "daylightPotential": None,
        "solarEnergy": None,
        "daylightFactor": df,
        "spatialDaylightAutonomy": sda,
        "usefulDaylightIlluminance": udi,
    }
    attach_image_links(unit, [
        record_image_link(row, field, column, source_file, source_row, source_temp_path=source_temp_path)
        for field, (_, column) in IMAGE_FIELDS.items()
        if field.startswith(("daylightFactor", "spatialDaylightAutonomy", "usefulDaylightIlluminance"))
    ])
    city["analysisUnits"].append(unit)


def make_site_context(row: list[str], source_file: str, source_row: int, source_temp_path: str | None = None) -> dict[str, Any]:
    context: dict[str, Any] = {
        "country": value(row, 4),
        "floorAreaRatio": number(value(row, 9)),
        "greenSpaceRatio": value(row, 10),
        "buildingTypes": value(row, 11),
        "transport": value(row, 12),
        "greenBlueInfrastructure": value(row, 13),
        "sunHoursDistribution": {
            "ground": distribution(row, 18, SUN_LABELS, "%"),
            "facades": distribution(row, 28, SUN_LABELS, "%"),
        },
        "daylightPotentialDistribution": distribution(row, 39, DAYLIGHT_LABELS, "%"),
        "solarEnergySpecs": {
            "area": number(value(row, 49)),
            "totalSolarEnergy": number(value(row, 50)),
            "avgSolarEnergy": number(value(row, 51)),
            "panelArea": number(value(row, 52)),
            "annualElectricity": number(value(row, 53)),
        },
        "source": {"file": source_file, "tempPath": source_temp_path, "sheet": "Arkusz1", "row": source_row, "status": "partial"},
    }
    context["sunHoursDistribution"] = {key: item for key, item in context["sunHoursDistribution"].items() if item}
    if not context["sunHoursDistribution"]:
        context.pop("sunHoursDistribution")
    if not any(context["solarEnergySpecs"].values()):
        context.pop("solarEnergySpecs")
    if not any(context[key] for key in ("buildingTypes", "transport", "greenBlueInfrastructure")):
        for key in ("buildingTypes", "transport", "greenBlueInfrastructure"):
            context.pop(key)
    return context


def make_unassigned_profile(row: list[str], source_row: int, source_file: str | None = None, source_temp_path: str | None = None) -> dict[str, Any] | None:
    if source_row <= 5:
        return None
    if value(row, 55) and re.fullmatch(r"UB[_ -]?\d+", value(row, 55) or "", re.IGNORECASE):
        return None
    sun = {
        "ground": distribution(row, 67, SUN_LABELS, "%"),
        "facades": distribution(row, 77, SUN_LABELS, "%"),
        "roofs": distribution(row, 87, SUN_LABELS, "%"),
    }
    sun = {key: item for key, item in sun.items() if item}
    daylight = distribution(row, 98, DAYLIGHT_LABELS, "%")
    if not sun and not daylight:
        return None
    return {
        "name": "Unassigned urban profile",
        "sourceRow": source_row,
        "source": {"file": source_file, "tempPath": source_temp_path, "sheet": "Arkusz1", "row": source_row, "status": "partial"},
        "sunHoursDistribution": sun,
        "daylightPotentialDistribution": daylight,
        "attributionNote": (
            "This row belongs to a named place, but the source gives no urban-block identifier. Measurements are retained without assigning them to a named block."
            if value(row, 2)
            else "The source row contains measurements but no city or urban-block identifier. Values are retained without assigning them to a place."
        ),
    }


def benchmark_key(raw_name: str) -> str:
    cleaned = raw_name.replace("�", "Ø").replace("�", "Ø").strip()
    if cleaned.casefold().startswith(("ørestad", "orest ad", "orestad")):
        return "ørestad"
    return cleaned.casefold()


def make_benchmarks(rows: list[list[str]], source_file: str, site_source_file: str, site_rows: list[tuple[list[str], int]], source_temp_path: str | None = None, site_temp_path: str | None = None) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    benchmarks = []
    seen: set[str] = set()
    profiles_by_place: dict[str, list[dict[str, Any]]] = {}
    unassigned_profiles = []
    for row, source_row in site_rows:
        profile = make_unassigned_profile(row, source_row, site_source_file, site_temp_path)
        if not profile:
            continue
        place_name = value(row, 2)
        if place_name:
            profiles_by_place.setdefault(benchmark_key(place_name), []).append(profile)
        else:
            unassigned_profiles.append(profile)

    context_by_place = {
        benchmark_key(value(row, 2) or ""): make_site_context(row, site_source_file, source_row, site_temp_path)
        for row, source_row in site_rows
        if value(row, 2)
    }
    if "ørestad" in context_by_place:
        context_by_place["ørestad"]["country"] = "Denmark, Copenhagen"
    for source_row, row in enumerate(rows[3:], start=4):
        raw_name = value(row, 0)
        if not raw_name:
            continue
        name = raw_name.replace("�", "Ø").strip()
        if key := benchmark_key(name):
            if key == "ørestad":
                name = "Ørestad"
        else:
            key = name.casefold()
        if key in seen:
            continue
        seen.add(key)
        bins = [number(value(row, column)) for column in range(6, 15)]
        if not any(item is not None for item in bins):
            continue
        benchmark = {
            "id": re.sub(r"[^a-z0-9]+", "-", key).strip("-"),
            "name": name,
            "distribution": {
                "unit": "%",
                "bins": [{"label": label, "value": item} for label, item in zip(DAYLIGHT_LABELS, bins)],
            },
            "source": {"file": source_file, "tempPath": source_temp_path, "sheet": "Arkusz2", "row": source_row, "status": "source"},
        }
        if key == "ørestad":
            benchmark["id"] = "orestad"
            benchmark["context"] = {"country": "Denmark, Copenhagen", "sourceNote": "The place name is normalized to Ørestad; the source spells the city as 'Konhagen'."}
        if key in context_by_place:
            benchmark["context"] = {**benchmark.get("context", {}), **context_by_place[key]}
        if key in profiles_by_place:
            benchmark["unassignedProfiles"] = profiles_by_place[key]
        benchmarks.append(benchmark)
    return benchmarks, unassigned_profiles


def find_input(temp_dir: Path, sheet_number: int) -> Path:
    matches = sorted(temp_dir.glob(f"ATLASY_DANE_* (Arkusz{sheet_number}).csv"))
    if not matches:
        matches = sorted(temp_dir.glob(f"ATLASY_DANE_*(Arkusz{sheet_number}).csv"))
    if not matches:
        raise FileNotFoundError(f"Brak pliku ATLASY_DANE_*(Arkusz{sheet_number}).csv w {temp_dir}")
    return matches[-1]


def collect_images(value_obj: Any) -> set[str]:
    if isinstance(value_obj, dict):
        images = set()
        for key, item in value_obj.items():
            if key in {"imageUrl", "schwarzplanImage", "model3dImage", "plan", "form3d", "sunHours", "daylightPotential", "daylightPotential2", "solarEnergy", "image"} or key.endswith("Image"):
                if isinstance(item, str):
                    images.add(item)
            else:
                images.update(collect_images(item))
        return images
    if isinstance(value_obj, list):
        return set().union(*(collect_images(item) for item in value_obj)) if value_obj else set()
    return set()


def resolve_image_links(data: dict[str, Any], temp_dir: Path, public_dir: Path, copy_assets: bool) -> list[str]:
    warnings = []
    source_files = [path for path in temp_dir.rglob("*") if path.is_file() and path.suffix.casefold() in {".png", ".jpg", ".jpeg", ".webp"}]
    by_stem = {path.stem.casefold(): path for path in source_files}
    catalog = []
    for city in data["cities"]:
        folder_name = city["folder"]
        folder = public_dir / folder_name
        if copy_assets:
            folder.mkdir(parents=True, exist_ok=True)
        seen: set[tuple[str, int, str]] = set()
        records = [city, *city.get("analysisUnits", [])]
        for record in records:
            for link in record.get("imageLinks", []):
                identity = (link["field"], link["row"], link.get("referencedName") or "")
                if identity in seen:
                    continue
                seen.add(identity)
                referenced = link.get("resolvedName") or link.get("referencedName")
                if not referenced:
                    link["status"] = "empty"
                    catalog.append({"cityId": city["id"], **link})
                    continue
                lookup = IMAGE_ALIASES.get((city["id"], referenced.casefold()), referenced).casefold()
                if lookup != referenced.casefold():
                    alias_target = next((path.stem for path in source_files if path.stem.casefold() == lookup), lookup)
                    link["resolvedName"] = alias_target
                    link["aliasNote"] = f"Known filename alias: {referenced} -> {alias_target}"
                    referenced = alias_target
                source = by_stem.get(lookup)
                public_url = f"{PUBLIC_BASE}/{folder_name}/{referenced}.PNG"
                link["publicUrl"] = public_url
                target = folder / f"{referenced}.PNG"
                if source:
                    link["tempPath"] = source.relative_to(temp_dir).as_posix()
                    if copy_assets and not target.exists():
                        shutil.copy2(source, target)
                        link["status"] = "copied"
                    elif target.exists():
                        link["status"] = "present"
                    else:
                        link["status"] = "linked"
                elif target.exists():
                    link["tempPath"] = None
                    link["status"] = "public-only"
                    note = "No matching file in the current TEMP drop-zone; the published image was already present."
                    link["aliasNote"] = f"{link['aliasNote']} {note}" if link.get("aliasNote") else note
                    warnings.append(f"{city['name']}: {referenced}.PNG is published but not in the current TEMP drop-zone")
                else:
                    link["tempPath"] = None
                    link["status"] = "missing"
                    warnings.append(f"{city['name']}: missing image {referenced}.PNG")
                catalog.append({"cityId": city["id"], **link})
        for name in sorted(collect_images({key: val for key, val in city.items() if key not in {"source", "folder", "imageLinks"}})):
            if any(item.get("resolvedName") == name or item.get("referencedName") == name for item in catalog if item["cityId"] == city["id"]):
                continue
            warnings.append(f"{city['name']}: image {name}.PNG has no provenance link")
    data["imageCatalog"] = catalog
    return warnings


def validate_data(data: dict[str, Any]) -> list[str]:
    errors = []
    city_ids = [city.get("id") for city in data.get("cities", [])]
    if len(city_ids) != len(set(city_ids)):
        errors.append("Case-study IDs must be unique")
    benchmark_ids = [item.get("id") for item in data.get("benchmarks", [])]
    if len(benchmark_ids) != len(set(benchmark_ids)):
        errors.append("Benchmark IDs must be unique")

    def inspect(value_obj: Any, path: str) -> None:
        if isinstance(value_obj, dict):
            bins = value_obj.get("bins")
            if isinstance(bins, list) and value_obj.get("unit") == "%":
                measured = [item.get("value") for item in bins if item.get("value") is not None]
                if any(not isinstance(item, (int, float)) or item < 0 or item > 100 for item in measured):
                    errors.append(f"Percentage values outside 0-100 at {path}")
                if len(measured) == len(bins) and measured and not math.isclose(sum(measured), 100, abs_tol=2):
                    errors.append(f"Complete percentage distribution does not sum to 100 at {path}")
            for key, child in value_obj.items():
                inspect(child, f"{path}.{key}")
        elif isinstance(value_obj, list):
            for index, child in enumerate(value_obj):
                inspect(child, f"{path}[{index}]")

    for city in data.get("cities", []):
        if not city.get("name") or not city.get("source", {}).get("row"):
            errors.append(f"Case study {city.get('id')} is missing required provenance")
        unit_ids = [unit.get("id") for unit in city.get("analysisUnits", [])]
        if len(unit_ids) != len(set(unit_ids)):
            errors.append(f"Analysis-unit IDs must be unique within {city.get('id')}")
        inspect(city, city.get("id", "city"))
    inspect(data.get("benchmarks", []), "benchmarks")
    profile_rows = [profile.get("sourceRow") for profile in data.get("unassignedProfiles", [])]
    if len(profile_rows) != len(set(profile_rows)):
        errors.append("Unassigned profile source rows must be unique")
    for profile in data.get("unassignedProfiles", []):
        if not profile.get("sourceRow") or not profile.get("attributionNote"):
            errors.append("Unassigned profiles must retain their source row and attribution note")
        inspect(profile, f"unassignedProfiles.row-{profile.get('sourceRow')}")
    return errors


def import_data(temp_dir: Path, output_path: Path, copy_assets: bool = True) -> tuple[dict[str, Any], list[str]]:
    sheet1 = find_input(temp_dir, 1)
    sheet2 = find_input(temp_dir, 2)
    sheet1_temp_path = relative_temp_path(temp_dir, sheet1)
    sheet2_temp_path = relative_temp_path(temp_dir, sheet2)
    rows = read_csv(sheet1)
    cities: dict[str, dict[str, Any]] = {}
    city_rows: list[tuple[dict[str, Any], list[str], int]] = []
    for source_row, row in enumerate(rows):
        config = normalize_city(value(row, 2))
        if config:
            city_rows.append((config, row, source_row + 1))
    for config, row, source_row in city_rows:
        city = make_city(row, config, source_row, sheet1.name, sheet1_temp_path)
        cities[config["id"]] = city
        add_room_analysis(city, row, source_row, sheet1.name, sheet1_temp_path)

    for source_row, row in enumerate(rows):
        if not value(row, 55) or not re.fullmatch(r"UB[_ -]?\d+", value(row, 55) or "", re.IGNORECASE):
            continue
        config = infer_city_from_row(row)
        city = cities.get(config["id"]) if config else None
        if city:
            unit = make_unit(row, city, source_row + 1, temp_dir, sheet1.name, sheet1_temp_path)
            if unit and unit["id"] not in {existing["id"] for existing in city["analysisUnits"]}:
                city["analysisUnits"].append(unit)

    for city in cities.values():
        city["analysisUnits"].sort(key=lambda unit: (unit.get("analysisLevel") != "urban-block", str(unit["id"])))

    missing_cities = [config["name"] for config in CITY_CONFIG.values() if config["id"] not in cities]
    if missing_cities:
        raise ValueError(f"Brak wymaganych lokalizacji w Arkuszu 1: {', '.join(missing_cities)}")

    benchmark_site_rows = [(row, source_row + 1) for source_row, row in enumerate(rows)]
    benchmarks, unassigned_profiles = make_benchmarks(read_csv(sheet2), sheet2.name, sheet1.name, benchmark_site_rows, sheet2_temp_path, sheet1_temp_path)
    data = {
        "version": 1,
        "generatedFrom": [sheet1.name, sheet2.name],
        "sourceFolder": ".venv/TEMP",
        "cities": sorted(cities.values(), key=lambda city: city["id"]),
        "benchmarks": benchmarks,
        "unassignedProfiles": unassigned_profiles,
        "notices": [
            "The source workbook points to DATA_FORMA_260630 for additional values; that file was not provided. Missing values are left blank.",
            "Some numeric urban profiles have no place or block identifier in the source and are shown separately without guessed attribution.",
        ],
    }
    validation_errors = validate_data(data)
    if validation_errors:
        raise ValueError("Invalid imported data: " + "; ".join(validation_errors))
    public_dir = output_path.parent.parent
    for city in data["cities"]:
        city["folder"] = CITY_CONFIG[city["name"].casefold()]["folder"]
    warnings = resolve_image_links(data, temp_dir, public_dir, copy_assets)
    for city in data["cities"]:
        city.pop("folder", None)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return data, warnings


def main() -> int:
    parser = argparse.ArgumentParser(description="Import the latest urban daylight CSV tables.")
    parser.add_argument("--temp-dir", type=Path, default=DEFAULT_TEMP)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--no-copy-assets", action="store_true")
    args = parser.parse_args()
    try:
        data, warnings = import_data(args.temp_dir, args.output, not args.no_copy_assets)
    except (FileNotFoundError, ValueError, UnicodeError, csv.Error) as error:
        print(f"Import failed: {error}", file=sys.stderr)
        return 1
    print(f"Imported {len(data['cities'])} case studies and {len(data['benchmarks'])} benchmarks to {args.output}")
    print("Missing dependency: DATA_FORMA_260630 (additional source fields remain blank)")
    for city in data["cities"]:
        print(f"  {city['name']}: {len(city['analysisUnits'])} analysis units")
    for warning in warnings:
        print(f"WARNING: {warning}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())