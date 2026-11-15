# Szybki start

## Wymagania

- Node.js 18 lub nowszy i npm
- Python 3.10 lub nowszy i `openpyxl` z `requirements.txt`
- Dostęp do internetu dla kafli OpenStreetMap

## Praca lokalna

```powershell
cd urban-daylight-platform
npm install
node scripts/run-python.mjs -m pip install -r requirements.txt
npm run dev
```

## Import danych źródłowych

Importer korzysta z zatwierdzonego skoroszytu:
`../TEMP__TRUTH/IEA_TASK_70_ATLASY/DANE_NA_STRONE/TABELA_EXCEL/ATLASY_DANE_261107.xlsx`.
Nie wybiera starszych CSV ani plików z `.venv/TEMP`.

```powershell
npm run data:import
npm test
npm run lint
npm run build
```

Importer tworzy `public/data/atlas.json` oraz lokalny `.venv/atlas-private-content.json`. Prywatny plik zachowuje wszystkie komórki źródłowe wraz z pochodzeniem — także opisowe pola `DANE`, funkcje bloków i wykluczony wiersz UB_2 — do czasu zatwierdzenia publikacji; nie kopiuj go do `public/`. Publiczny atlas zawiera tylko wartości zatwierdzone do wyświetlania. Jednoznaczne, dokładne nazwy obrazów są dopasowywane wyłącznie w folderze źródłowym właściwej lokalizacji albo w `GRAFIKI_LOCATION` dla map lokalizacyjnych; foldery `stare` i inne lokalizacje są ignorowane, a brak dopasowania jest raportowany. Niejednoznaczne lub konfliktowe referencje pozostają nierozwiązane. Obszar paneli większy niż podany obszar dachu zachowuje źródło, ale jest pomijany w tabeli i oznaczany ostrzeżeniem. Puste wartości nie są zastępowane. Garnizon UB_2 jest wyłączony zgodnie z notatkami źródłowymi. Współrzędne, których nie ma w skoroszycie, pozostają puste.

Jeżeli Python nie jest wykrywany, launcher próbuje kolejno lokalnego `.venv`, zmiennej `PYTHON`, `python` i `py -3`.

## Gdzie szukać kodu

- `src/pages/` — eksploracja lokalizacji i porównania
- `src/components/` — mapa, wykresy, wizualizacje i szczegóły analizy
- `src/types/index.ts` — kontrakt atlasu
- `scripts/workbook_source.py` — walidacja skoroszytu i odczyt arkuszy/komórek
- `scripts/import_data.py` — import workbooka i pochodzenie danych
- `tests/` — testy danych oraz importera

Pełny opis schematu i ograniczeń źródła znajduje się w [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md).
