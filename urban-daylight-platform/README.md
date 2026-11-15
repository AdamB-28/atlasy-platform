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

Publiczny atlas zachowuje pochodzenie lokalizacji, bloków, liczb i obrazów. Zatwierdzenia opisów nie zostały ustalone: pełne komórki wszystkich arkuszy, w tym opisowe kolumny `DANE`, funkcje bloków i wykluczony wiersz Garnizonu UB_2, trafiają wyłącznie do lokalnego `.venv/atlas-private-content.json`, nie do pobieralnego `atlas.json`. Współrzędne nie są dostępne w skoroszycie i nie są odgadywane. Garnizon UB_2 jest wyłączony z publicznego atlasu zgodnie z `NOTATKI.docx`. Obrazy są publikowane tylko przy unikalnym, dokładnym dopasowaniu nazwy pliku w folderze właściwej lokalizacji (albo `GRAFIKI_LOCATION` dla map lokalizacyjnych); katalogi `stare` i inne lokalizacje są ignorowane, a brak dopasowania jest raportowany. Niespójny obszar paneli jest zachowany z pochodzeniem źródłowym, lecz pominięty w tabeli do weryfikacji.

Launcher Pythona szuka interpretera wskazanego przez `PYTHON`, następnie w lokalnym `.venv`, na `PATH` i w Windowsowym launcherze `py`. Czytnik skoroszytu i importer wymagają `openpyxl` z `requirements.txt`.

## Dane i rzetelność

- `cities` pochodzi z lokalizacji w arkuszu `DANE`; `analysisUnits` zawiera wskazane tam bloki urbanistyczne.
- `OPISY`, zasady planowania i arkusze charakterystyk są importowane wraz z pochodzeniem każdej wartości.
- `benchmarks` oraz symulacje pomieszczeń nie są odtwarzane ze starszych CSV i pozostają puste.
- Każdy rekord zachowuje pochodzenie: nazwę skoroszytu, arkusz, wiersz i — dla wartości komórkowych — adres komórki.
- Puste pola pozostają puste. Aplikacja nie dopisuje fikcyjnych wartości i nie porównuje bezpośrednio wyników z różnych skal analizy.
- Niezweryfikowane odwołania graficzne i niespójne wartości słoneczne są zachowane jako źródłowe i oznaczone do sprawdzenia; importer ich nie poprawia ani nie zastępuje.

## Polecenia

```powershell
npm run data:import  # import zatwierdzonego skoroszytu
npm test             # testy atlasu i importera
npm run lint         # ESLint
npm run build        # TypeScript i build produkcyjny
npm run preview      # podgląd buildu
```

## Podgląd administratora

Hasło `KTMadmin!` włącza lokalny tryb inspekcji: można wpisać je na bramce logowania albo otworzyć pozycję `Admin` w nagłówku po zwykłym zalogowaniu. Tryb pokazuje surowe rekordy JSON i zachowane pochodzenie danych skoroszytu. Nierozstrzygnięte odwołania do obrazów nie mają publicznego URL ani automatycznego aliasu. `Admin on` wyłącza podgląd; stan istnieje tylko w bieżącej karcie. Podpisy obrazów są metadanymi inspekcji, nie kontrolą dostępu.

To nie jest mechanizm bezpieczeństwa: aplikacja jest statyczna, a oba hasła i cały atlas są dostarczane do przeglądarki. Używaj tego wyłącznie do lokalnej inspekcji danych, nie do ochrony poufnych informacji.

Szczegółowy model i zasady aktualizacji opisuje [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md); skrócona konfiguracja jest w [SETUP.md](SETUP.md).
