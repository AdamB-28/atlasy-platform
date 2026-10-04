# Atlas światła dziennego

Edukacyjna aplikacja do badania dostępu do światła dziennego, morfologii miejskiej i potencjału energii słonecznej. Zawiera trzy studia przypadku: Elephant and Castle, Garnizon i Hudson Yards oraz osobny zestaw pięciu europejskich benchmarków.

## Uruchomienie

Wymagane: Node.js 18+ oraz Python 3.8+. Z katalogu aplikacji:

```powershell
npm install
npm run dev
```

Vite wypisze adres lokalnego serwera. Przy pierwszym uruchomieniu aplikacja pobiera podkład mapy z OpenStreetMap.

## Aktualizacja danych

1. Umieść najnowsze pliki `ATLASY_DANE_<data>(Arkusz1).csv` i `ATLASY_DANE_<data>(Arkusz2).csv` w `../.venv/TEMP/`. Katalog jest zachowany jako lokalny drop-zone i ignorowany przez Git.
2. Umieść dostarczone obrazy w tym katalogu lub jego podkatalogach. Importer kopiuje do `public/` tylko grafiki wskazane w źródłowych tabelach.
3. Z katalogu aplikacji uruchom `npm run data:import`. Skrypt wybiera najnowszy plik każdego arkusza, waliduje dane i generuje `public/data/atlas.json`.
4. Sprawdź komunikaty `WARNING`, zwłaszcza brakujące obrazy lub pliki źródłowe.
5. Uruchom `npm test`, `npm run lint` i `npm run build`.

Launcher Pythona najpierw szuka interpretera w lokalnym `.venv`, potem w zmiennej `PYTHON`, na `PATH` i w Windowsowym launcherze `py`. Nie trzeba instalować pakietów Python; importer korzysta ze standardowej biblioteki.

## Dane i rzetelność

- `cities` zawiera trzy studia przypadku, mapę lokalizacyjną bloków E&C, wskaźniki terenowe oraz jednostki `analysisUnits` (urban blocks i dostępne symulacje pomieszczeń).
- `benchmarks` łączy rozkłady potencjału z Arkusza 2 z dostępnym kontekstem FAR/GAR, opisami, rozkładami słońca i potencjałem energii z Arkusza 1. Nie są pełnymi studiami mapowymi.
- Profile liczbowe bez nazwy bloku są pokazywane oddzielnie z numerem wiersza; importer nie przypisuje im lokalizacji na podstawie domysłu.
- Każdy rekord zachowuje pochodzenie: nazwę pliku, arkusz i wiersz źródłowy.
- Puste pola pozostają puste. Aplikacja nie dopisuje fikcyjnych wartości i nie porównuje bezpośrednio wyników z różnych skal analizy.
- Arkusz 1 wskazuje dodatkowy plik `DATA_FORMA_260630`, którego obecnie brakuje. Importer wyświetla to ograniczenie; wartości z tego pliku nie są odtwarzane ani zgadywane.

## Polecenia

```powershell
npm run data:import  # import CSV i wskazanych grafik
npm test             # testy atlasu i importera
npm run lint         # ESLint
npm run build        # TypeScript i build produkcyjny
npm run preview      # podgląd buildu
```

## Podgląd administratora

Hasło `KTMadmin!` włącza lokalny tryb inspekcji: można wpisać je na bramce logowania albo otworzyć pozycję `Admin` w nagłówku po zwykłym zalogowaniu. Tryb pokazuje surowe rekordy JSON oraz ścieżkę pliku CSV w `.venv/TEMP`. Pod każdym obrazem widać, skąd jest podlinkowany: plik CSV w TEMP, arkusz, komórka, nazwa z komórki, alias, plik obrazu w TEMP i publiczny URL. `Admin on` wyłącza podgląd; stan istnieje tylko w bieżącej karcie. Podpisy obrazów są metadanymi inspekcji, nie kontrolą dostępu.

To nie jest mechanizm bezpieczeństwa: aplikacja jest statyczna, a oba hasła i cały atlas są dostarczane do przeglądarki. Używaj tego wyłącznie do lokalnej inspekcji danych, nie do ochrony poufnych informacji.

Szczegółowy model i zasady aktualizacji opisuje [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md); skrócona konfiguracja jest w [SETUP.md](SETUP.md).
