from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from openpyxl import load_workbook


REQUIRED_SHEETS = (
    "DANE",
    "OPISY",
    "OPISY-Main Planning Principles",
    "Kronsberg-Key characteristics",
    "Aspern Seestadt - Key Chara...",
    "Garnizon -Key Characteristics",
    "Ørestad Syd - Key Characteri...",
    "Elephant Park - Key Character..",
)
BLOCK_ID = re.compile(r"UB_[A-Z0-9]+", re.IGNORECASE)


def read_workbook(path: Path) -> dict[str, Any]:
    """Read the website workbook without inferring or altering source values."""
    workbook = load_workbook(path, data_only=False)
    try:
        missing = [sheet for sheet in REQUIRED_SHEETS if sheet not in workbook.sheetnames]
        if missing:
            raise ValueError(f"{path.name}: missing required sheets: {', '.join(missing)}")

        sheets: dict[str, list[dict[str, Any]]] = {}
        for sheet in workbook:
            rows = []
            for row in sheet.iter_rows():
                cells = {}
                for cell in row:
                    value = cell.value
                    if value is None:
                        continue
                    if cell.data_type == "f":
                        raise ValueError(f"{sheet.title}!{cell.coordinate}: formula requires explicit review")
                    if not isinstance(value, (str, int, float, bool)):
                        raise ValueError(f"{sheet.title}!{cell.coordinate}: unsupported value type {type(value).__name__}")
                    cells[cell.coordinate] = value
                if cells:
                    rows.append({"row": row[0].row, "cells": cells})
            sheets[sheet.title] = rows

        sites: list[dict[str, Any]] = []
        current_site: dict[str, Any] | None = None
        for row in sheets["DANE"]:
            number = row["row"]
            if number < 8:
                continue
            cells = row["cells"]
            name = cells.get(f"C{number}")
            block = cells.get(f"BC{number}")
            if name is not None:
                if not isinstance(name, str) or not name.strip():
                    raise ValueError(f"DANE!C{number}: invalid location name")
                if any(site["name"] == name for site in sites):
                    raise ValueError(f"DANE!C{number}: duplicate location {name}")
                current_site = {"name": name, "sourceRow": number, "blocks": []}
                sites.append(current_site)
            if block is not None:
                if not isinstance(block, str) or not BLOCK_ID.fullmatch(block):
                    raise ValueError(f"DANE!BC{number}: invalid urban block identifier {block!r}")
                if current_site is None:
                    raise ValueError(f"DANE!BC{number}: block has no preceding location")
                if any(item["name"].casefold() == block.casefold() for item in current_site["blocks"]):
                    raise ValueError(f"DANE!BC{number}: duplicate block {block} in {current_site['name']}")
                current_site["blocks"].append({"name": block, "sourceRow": number})
            elif name is None and cells:
                raise ValueError(f"DANE row {number}: data without a location or block identifier")

        if not sites:
            raise ValueError("DANE: no location rows found")
        return {"sourceFile": path.name, "sheets": sheets, "sites": sites}
    finally:
        workbook.close()
