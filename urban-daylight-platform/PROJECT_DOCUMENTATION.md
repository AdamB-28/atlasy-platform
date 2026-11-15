# Dokumentacja projektu

## Cel

Atlas wspiera naukę interpretowania relacji między formą miejską, ekspozycją na słońce, dostępem do światła dziennego i potencjałem energii słonecznej. Rozkłady opisują wyniki źródłowe; pojedynczy najwyższy słupek sam w sobie nie jest oceną projektu.

## Lokalny tryb administratora

Publiczna strona nie ma bramki logowania. Pozycja `Admin` w nagłówku włącza opcjonalny tryb inspekcji. Panele pokazują JSON rekordów, w tym pochodzenie, surowe wyniki i brakujące wartości. Podpisy obrazów są metadanymi inspekcji, nie kontrolą dostępu. `Admin on` wyłącza tryb; stan jest przechowywany tylko w `sessionStorage` bieżącej karty.

To wyłącznie przełącznik interfejsu, a nie kontrola dostępu: `atlas.json` jest wysyłany do każdej przeglądarki przez statyczną aplikację. Ukryte w zwykłym widoku pochodzenie pozostaje w publicznym pliku danych. Nie umieszczaj tu poufnych danych. Do rzeczywistej ochrony potrzebny byłby backend z autoryzacją serwerową.

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
- `imageCatalog[]`: odwołania do grafik z surową nazwą i komórką źródłową. Dopasowanie jest ograniczone do folderu właściwej lokalizacji w `RYSUNKI` lub `GRAFIKI_LOCATION`, z udokumentowanymi wyjątkami dla potwierdzonego modelu Elephant Park UB_1 oraz uzgodnionych obrazów Aspern. Brak pliku jest raportowany.
- `notices[]`: ograniczenia źródła i nierozstrzygnięte kwestie wymagające weryfikacji.
- `source`: plik, arkusz, wiersz i komórka źródłowa rekordu.

Pełne komórki wszystkich arkuszy są zapisywane lokalnie w `.venv/atlas-private-content.json`, z oryginalnymi wartościami i pochodzeniem arkusz/wiersz/komórka; obejmuje to również wykluczony publicznie wiersz Garnizonu UB_2. Ten plik nie może być kopiowany do `public/`; w nim także pozostają wszystkie dane osobowe/kontaktowe znalezione w arkuszach do czasu oceny ich publikacji. Puste komórki nie są zamieniane na zera. Przy przekroczeniu obszaru dachu powierzchnia paneli jest pomijana i oznaczana ostrzeżeniem, poza określonym wyjątkiem opisanym niżej.

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

- Współrzędne zweryfikowano niezależnie w OpenStreetMap; punkt Ørestad Syd oznacza 8tallet w obszarze studium, a nie centrum dzielnicy.
- Model UB_1 Elephant Park potwierdził właściciel; trzy obrazy Aspern uzgodniono z modelem i oryginalnymi danymi Forma. Alias zachowuje opis decyzji i oryginalne odwołanie.
- Wartości DANE!DD8 i DG8 są zachowane. Dla dokładnie określonej wartości DG8 importer pokazuje interpretację poprawki przecinka zgłoszonej przez właściciela, z ostrzeżeniem o różnicy względem 60% dachu.
- Stare obrazy w `public/` nie są dowodem poprawnego mapowania nowego workbooka i nie są używane jako fallback.
