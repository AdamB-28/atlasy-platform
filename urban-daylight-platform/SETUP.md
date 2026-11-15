# Szybki start

## Wymagania

- Node.js 18 lub nowszy i npm
- Python 3.8 lub nowszy; testy nowego czytnika skoroszytu wymagają `openpyxl` z `requirements.txt`
- Dostęp do internetu dla kafli OpenStreetMap

## Praca lokalna

```powershell
cd urban-daylight-platform
npm install
node scripts/run-python.mjs -m pip install -r requirements.txt
npm run dev
```

## Import najnowszych danych

Umieść oba arkusze CSV w `../.venv/TEMP/`, zachowując wzór nazw `ATLASY_DANE_<data>(Arkusz1).csv` i `ATLASY_DANE_<data>(Arkusz2).csv`. Obrazy mogą znajdować się w podkatalogach tego samego drop-zone.

```powershell
npm run data:import
npm test
npm run lint
npm run build
```

Importer tworzy `public/data/atlas.json`, kopiuje potrzebne obrazy i zgłasza brakujące zasoby. Dla każdego rekordu i obrazu zapisuje względną ścieżkę pliku CSV w `.venv/TEMP`, komórkę, ścieżkę obrazu w TEMP i publiczny URL. Brak obrazu pozostaje `tempPath: null`; importer nie zgaduje ścieżki. Nie usuwa ani nie modyfikuje plików w TEMP. Jeżeli Python nie jest wykrywany, launcher próbuje kolejno lokalnego `.venv`, zmiennej `PYTHON`, `python` i `py -3`.

Trwa przygotowanie przejścia na skoroszyt `TEMP__TRUTH`. Czytnik `scripts/workbook_source.py` i jego testy sprawdzają układ arkuszy oraz zachowują współrzędne komórek, ale `npm run data:import` nadal korzysta z poprzednich plików CSV; nie należy uważać obecnego atlasu za zaktualizowany na podstawie nowego źródła.

## Gdzie szukać kodu

- `src/pages/` — eksploracja lokalizacji i porównania
- `src/components/` — mapa, wykresy, wizualizacje i szczegóły analizy
- `src/types/index.ts` — kontrakt atlasu
- `scripts/import_data.py` — parser, normalizacja i walidacja CSV
- `tests/` — testy danych oraz importera

Pełny opis schematu i ograniczeń źródła znajduje się w [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md).
