# Szybki start

## Wymagania

- Node.js 18 lub nowszy i npm
- Python 3.8 lub nowszy (bez dodatkowych pakietów)
- Dostęp do internetu dla kafli OpenStreetMap

## Praca lokalna

```powershell
cd urban-daylight-platform
npm install
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

## Gdzie szukać kodu

- `src/pages/` — eksploracja lokalizacji i porównania
- `src/components/` — mapa, wykresy, wizualizacje i szczegóły analizy
- `src/types/index.ts` — kontrakt atlasu
- `scripts/import_data.py` — parser, normalizacja i walidacja CSV
- `tests/` — testy danych oraz importera

Pełny opis schematu i ograniczeń źródła znajduje się w [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md).
