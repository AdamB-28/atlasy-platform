# Dokumentacja projektu

## Cel

Atlas wspiera naukę interpretowania relacji między formą miejską, ekspozycją na słońce, dostępem do światła dziennego i potencjałem energii słonecznej. Rozkłady opisują wyniki źródłowe; pojedynczy najwyższy słupek sam w sobie nie jest oceną projektu.

## Lokalny tryb administratora

Administrator może użyć `KTMadmin!` na bramce logowania albo włączyć tryb przez pozycję `Admin` w nagłówku. Panele pokazują JSON rekordów, w tym pochodzenie, surowe wyniki i brakujące wartości. Odwołania do grafik bez weryfikacji pozostają bez publicznego URL. Podpisy obrazów są metadanymi inspekcji, nie kontrolą dostępu. `Admin on` wyłącza tryb; stan jest przechowywany tylko w `sessionStorage` bieżącej karty.

To wyłącznie przełącznik interfejsu, a nie kontrola dostępu: hasło oraz `atlas.json` są wysyłane do każdej przeglądarki przez statyczną aplikację. Nie umieszczaj tu poufnych danych. Do rzeczywistej ochrony potrzebny byłby backend z autoryzacją serwerową.

## Przepływ danych

```text
../TEMP__TRUTH/IEA_TASK_70_ATLASY/DANE_NA_STRONE/TABELA_EXCEL/ATLASY_DANE_261107.xlsx
          -> scripts/workbook_source.py
          -> scripts/import_data.py
          -> public/data/atlas.json
          -> React hooks -> strony i wizualizacje
```

Importer korzysta wyłącznie z zatwierdzonego skoroszytu i jego aktualnego folderu `RYSUNKI`. Nie czyta starszych CSV, `.venv/TEMP` ani katalogów `DANE`/`stare`. Wartości wymagające jawnej weryfikacji są odrzucane, gdy są formułami.

### Kontrakt `atlas.json`

- `cities[]`: pięć lokalizacji nazwanych w `DANE`; nazwy źródłowe i wiersze pochodzenia są zachowane.
- `analysisUnits[]`: bloki urbanistyczne przypisane przez identyfikator z `DANE!BC`; każde pole źródłowe ma adres komórki w `sourceData`.
- `sourceWorkbook.sheets`: publiczne, bezpieczne wartości arkusza `DANE` i indeks wierszy pozostałych arkuszy bez ich treści. Proza źródłowa z `DANE` nie trafia do publicznego raw data. Garnizon UB_2 jest pominięty w wyjściu, a dokładne źródło decyzji zapisano w `exclusions[]`.
- `imageCatalog[]`: odwołania do grafik z surową nazwą i komórką źródłową. Dopasowanie jest dokładne i ograniczone do folderu właściwej lokalizacji w `RYSUNKI` (lub `GRAFIKI_LOCATION` dla map lokalizacyjnych); katalogi `stare` i pozostałe lokalizacje są ignorowane. Brak pliku jest raportowany, a znane konflikty pozostają `unresolved`, bez zgadywania aliasów.
- `notices[]`: ograniczenia źródła i nierozstrzygnięte kwestie wymagające weryfikacji.
- `source`: plik, arkusz, wiersz i komórka źródłowa rekordu.

Pełne komórki wszystkich arkuszy są zapisywane lokalnie w `.venv/atlas-private-content.json`, z oryginalnymi wartościami i pochodzeniem arkusz/wiersz/komórka; obejmuje to opisowe kolumny `DANE`, funkcje bloków i wykluczony publicznie wiersz Garnizonu UB_2. Ten plik nie może być kopiowany do `public/`; w nim także pozostają wszystkie dane osobowe/kontaktowe znalezione w arkuszach do czasu oceny ich publikacji. Puste komórki nie są zamieniane na zera. Wartości źródłowe zachowują oryginalny typ i zapis. Jeżeli obszar paneli przekracza podany obszar dachu, dokładne wartości i komórki źródłowe są zachowane, lecz wartość panel area jest pominięta w tabeli i opatrzona ostrzeżeniem do weryfikacji.

## Aktualizacja źródeł

1. Użyj zatwierdzonego skoroszytu w `../TEMP__TRUTH/IEA_TASK_70_ATLASY/DANE_NA_STRONE/TABELA_EXCEL/ATLASY_DANE_261107.xlsx`.
2. Uruchom `npm run data:import` z katalogu aplikacji.
3. Rozstrzygnij nierozwiązane odwołania do grafik i niespójności w odpowiednich zadaniach źródłowych; do tego czasu nie wprowadzaj aliasów ani korekt.
4. Uruchom `npm test`, `npm run lint` i `npm run build`.

Importer nie modyfikuje skoroszytu ani katalogu `TEMP__TRUTH`. Starsze CSV i archiwalne materiały nie są fallbackiem.

## Testowanie

- `npm run test:data` sprawdza wygenerowany atlas, pochodzenie, wykluczenia i nierozstrzygnięte kwestie źródłowe.
- `npm run test:import` sprawdza import skoroszytu, prywatność niezatwierdzonego tekstu, grupowanie, dopasowanie obrazów, braki, powtarzalność i pochodzenie.
- Czytnik i importer wymagają `openpyxl` z `requirements.txt`.
- `npm run lint` sprawdza kod źródłowy, a `npm run build` kompilację TypeScript i aplikacji.

## Ograniczenia i utrzymanie

- Współrzędne nie są podane w skoroszycie i pozostają puste; wymagają niezależnej weryfikacji przed użyciem na mapie.
- DANE!BE8 ma nierozstrzygniętą nazwę modelu 3D UB_1; Q15, AL15 i AV15 przypisują wierszowi Aspern Seestadt nazwy plików Kronsberg. Żadne z tych odwołań nie jest automatycznie rozwiązywane.
- DANE!DD8 i DG8 pozostają w źródłowych wartościach mimo niespójności obszaru paneli; importer nie wprowadza korekty.
- Stare obrazy w `public/` nie są dowodem poprawnego mapowania nowego workbooka i nie są używane jako fallback.
