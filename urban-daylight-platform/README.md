# Atlas światła dziennego

Edukacyjna aplikacja do badania dostępu do światła dziennego, morfologii miejskiej i potencjału energii słonecznej. Zaimportowane dane źródłowe obejmują pięć lokalizacji: Elephant & Castle – Elephant Park, Garnizon, Kronsberg, Aspern Seestadt i Ørestad Syd.

## Uruchomienie

Wymagane: Node.js 18+ oraz Python 3.10+. Z katalogu aplikacji:

```powershell
npm install
node scripts/run-python.mjs -m pip install -r requirements.txt
npm run dev
```

Vite wypisze adres lokalnego serwera. Przy pierwszym uruchomieniu aplikacja pobiera podkład mapy z OpenStreetMap.

## Aktualizacja danych

1. Używaj zatwierdzonego skoroszytu `../TEMP__TRUTH/IEA_TASK_70_ATLASY/DANE_NA_STRONE/TABELA_EXCEL/ATLASY_DANE_261107.xlsx`. Starsze pliki CSV, foldery `DANE`/`stare` i materiały w `.venv/TEMP` nie są źródłem importu.
2. Z katalogu aplikacji uruchom `npm run data:import`. Importer czyta wyłącznie powyższy skoroszyt i generuje `public/data/atlas.json`.
3. Sprawdź komunikaty `NOTICE`, a następnie uruchom `npm test`, `npm run lint` i `npm run build`.

Atlas zachowuje pochodzenie danych do weryfikacji; oznaczenia komórek i wewnętrzne komunikaty są ukryte w zwykłym widoku strony. Pełne surowe arkusze są zapisywane lokalnie w `.venv/atlas-private-content.json`, natomiast zatwierdzone opisy formy i funkcji zabudowy oraz przejrzane fragmenty opisów lokalizacji są publikowane. Wskazane fragmenty o niejasnych źródłach lub metodach pozostają lokalne do wyjaśnienia. Skoroszyt nie zawiera współrzędnych; pięć punktów zweryfikowano niezależnie w OpenStreetMap. Dla Ørestad Syd punktem jest budynek 8tallet wewnątrz obszaru studium, a nie centrum dzielnicy. Garnizon UB_2 jest wyłączony zgodnie z `NOTATKI.docx`. Obrazy są dopasowywane do właściwych lokalizacji; dwa udokumentowane wyjątki dotyczą potwierdzonego modelu Elephant Park UB_1 oraz uzgodnionych obrazów Aspern. Wartość powierzchni paneli Elephant Park UB_1 pokazuje interpretację poprawki przecinka zgłoszonej przez właściciela, wraz z ostrzeżeniem o pozostałej różnicy względem 60% powierzchni dachu.

Launcher Pythona szuka interpretera wskazanego przez `PYTHON`, następnie w lokalnym `.venv`, na `PATH` i w Windowsowym launcherze `py`. Czytnik skoroszytu i importer wymagają `openpyxl` z `requirements.txt`.

## Dane i rzetelność

- `cities` pochodzi z lokalizacji w arkuszu `DANE`; `analysisUnits` zawiera wskazane tam bloki urbanistyczne.
- `OPISY`, zasady planowania i arkusze charakterystyk są importowane wraz z pochodzeniem każdej wartości.
- `benchmarks` oraz symulacje pomieszczeń nie są odtwarzane ze starszych CSV i pozostają puste.
- Każdy rekord zachowuje pochodzenie: nazwę skoroszytu, arkusz, wiersz i — dla wartości komórkowych — adres komórki.
- Puste pola pozostają puste. Aplikacja nie dopisuje fikcyjnych wartości i nie porównuje bezpośrednio wyników z różnych skal analizy.
- Przekroje ulic korzystają z szerokości i wysokości budynków ze skoroszytu. Jeśli nie określono przypisania wysokości do poszczególnych ulic, przekrój jest ilustracyjny: używa pierwszej podanej wysokości (środka przedziału, jeśli jest zakresem). Cień przy takim przekroju jest również ilustracyjny; model zakłada światło prostopadłe do ulicy i nie przedstawia rzeczywistej analizy nasłonecznienia.
- Niezweryfikowane odwołania graficzne i niespójne wartości słoneczne są oznaczone do sprawdzenia. Wyjątki zatwierdzone przez właściciela lub uzgodnione z materiałem źródłowym zachowują oryginalną wartość i opis decyzji.

## Polecenia

```powershell
npm run data:import  # import zatwierdzonego skoroszytu
npm test             # testy atlasu i importera
npm run lint         # ESLint
npm run build        # TypeScript i build produkcyjny
npm run preview      # podgląd buildu
```

## Podgląd administratora

Publiczna strona nie wymaga hasła ani nie pokazuje przycisku administratora. Aby włączyć lokalną inspekcję w bieżącej karcie, ustaw w konsoli przeglądarki `sessionStorage.setItem('adminMode', 'true')` i odśwież stronę. Aby ją wyłączyć, użyj `sessionStorage.removeItem('adminMode')` i ponownie odśwież stronę. Tryb pokazuje rekordy JSON i pochodzenie danych skoroszytu.

To nie jest mechanizm bezpieczeństwa: aplikacja jest statyczna, a dane atlasu i przełącznik inspekcji są dostarczane do przeglądarki. Ukrycie etykiet nie chroni danych przed odczytem.

Szczegółowy model i zasady aktualizacji opisuje [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md); skrócona konfiguracja jest w [SETUP.md](SETUP.md).
