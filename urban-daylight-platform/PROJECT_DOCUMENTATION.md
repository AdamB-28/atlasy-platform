# Dokumentacja projektu

## Cel

Atlas służy do nauki interpretowania relacji między formą miejską, ekspozycją na słońce, dostępem do światła dziennego i potencjałem energii słonecznej. Wykresy opisują rozkłady; pojedynczy najwyższy słupek nie jest sam w sobie oceną „dobrego” projektu.

## Doświadczenie użytkownika

- Mapa i lista prowadzą do trzech głównych studiów przypadku.
- Strona lokalizacji przedstawia kontekst, wskaźniki, zacienienie sezonowe i analizę terenu.
- Wybór urban blocku pokazuje dostępne dane morfologiczne i środowiskowe.
- Elephant and Castle i Hudson Yards zawierają dostępne symulacje wybranych pomieszczeń. E&C używa kryterium sDA 750 lx, Hudson Yards 300 lx; oba scenariusze są odróżnione od urban blocks i wzajemnie nie są rankingowane.
- Eksplorator benchmarków pokazuje rozkłady Arkusza 2 oraz dostępny kontekst FAR/GAR, opisy, rozkłady słońca i potencjał energii solarnej z Arkusza 1.
- Wiersz Kronsberg zawiera dodatkowy profil bez ID bloku; następujący wiersz pomiarowy nie ma nazwy miejsca ani bloku. Interfejs pokazuje numery obu źródłowych wierszy i nie dopowiada lokalizacji.
- Porównania pokazują dostępne wartości także wtedy, gdy druga strona nie ma pomiaru. Różne skale/protokoły są blokowane, a wskaźniki FAR, GAR i liczba pięter nie są oznaczane jako „lepsze” przez samą wielkość.
- Lokalny tryb administratora (`KTMadmin!`) otwiera surowe rekordy JSON na poziomie lokalizacji, jednostki, benchmarku, porównania i profilu bez przypisania. Pokazuje ścieżkę CSV w `.venv/TEMP`. Pod każdym obrazem pokazuje komórkę CSV, alias, plik TEMP i publiczny URL.

## Lokalny tryb administratora

Administrator może użyć `KTMadmin!` na bramce logowania albo włączyć tryb przez pozycję `Admin` w nagłówku. W trybie admina rozwijane panele pokazują pełny JSON rekordu, w tym pochodzenie, surowe wyniki, brakujące wartości i serie. Podpisy obrazów są metadanymi inspekcji, nie kontrolą dostępu. `Admin on` wyłącza tryb; stan jest przechowywany tylko w `sessionStorage` bieżącej karty.

To wyłącznie przełącznik interfejsu, a nie kontrola dostępu: hasło oraz `atlas.json` są wysyłane do każdej przeglądarki przez statyczną aplikację. Nie umieszczaj tu poufnych danych. Do rzeczywistej ochrony potrzebny byłby backend z autoryzacją serwerową.

## Przepływ danych

```text
.venv/TEMP/*.csv + dostarczone grafiki
          -> scripts/import_data.py
          -> public/data/atlas.json + public/{CITY}/
          -> React hooks -> strony i wizualizacje
```

Importer używa wyłącznie standardowej biblioteki Pythona. Obsługuje CSV rozdzielany średnikami, cytowane pola wielowierszowe, UTF-8/CP1250, przecinki dziesiętne oraz typowe znaczniki pustych danych. Lokalizacje wykrywa po nazwach, a urban blocks przypisuje po identyfikatorach i nazwach referencji w wierszu, nie po numerze wiersza ani kolejności miast.

### Kontrakt `atlas.json`

- `cities[]`: stabilne ID lokalizacji, pozycja mapy, kontekst, wskaźniki, zacienienie, `siteAnalysis`, `analysisUnits[]` i `source`.
- `analysisUnits[]`: ID, nazwa, `analysisLevel` (`urban-block` lub `selected-room`), dostępne obrazy, wskaźniki, rozkłady i dane symulacji.
- `benchmarks[]`: ID, nazwa, rozkład daylight potential z Arkusza 2, opcjonalny kontekst Arkusza 1 i źródła obu arkuszy. Benchmarki nie są lokalizacjami mapy.
- `unassignedProfiles[]`: zachowane serie rozkładów, dla których w źródle brakuje identyfikatora miejsca/bloku.
- `notices[]`: widoczne ograniczenia wejściowych danych.
- `source`: plik wejściowy, arkusz, numer wiersza i stan kompletności.

Procentowe rozkłady są sprawdzane pod kątem zakresu 0–100 i sumy kompletnego rozkładu (tolerancja 2 punkty procentowe). Walidator sprawdza również unikalność ID studiów, bloków i benchmarków. Nieobecne dane pozostają `null`/pominięte; wyników liczbowych nie zastępuje się lorem ipsum.

## Aktualizacja źródeł

1. Zachowaj folder `../.venv/TEMP`; to przewidziane miejsce na kolejne wersje danych.
2. Umieść w nim najnowsze `ATLASY_DANE_<data>(Arkusz1).csv` i `ATLASY_DANE_<data>(Arkusz2).csv`; obrazy mogą być w podkatalogach.
3. Uruchom `npm run data:import` z katalogu aplikacji.
4. Rozwiąż zgłoszone braki grafik albo świadomie zaakceptuj puste obrazy.
5. Uruchom `npm test`, `npm run lint` i `npm run build`.

Aplikacja nie czyta ani nie usuwa źródłowego folderu po imporcie. Arkusz 1 wspomina o `DATA_FORMA_260630`, ale pliku nie dostarczono. Dodatkowe informacje z tego pliku pozostają nieuzupełnione do czasu otrzymania prawdziwego źródła.

## Testowanie

- `npm run test:data` kontroluje strukturę wygenerowanego atlasu i kompletność benchmarków.
- `npm run test:import` uruchamia testy parsera, kolejności rekordów, braków, powtarzalności eksportu i walidatora.
- `npm test` uruchamia oba zestawy.
- `npm run lint` sprawdza kod źródłowy.
- `npm run build` uruchamia TypeScript i kompilację produkcyjną.

Testy importera korzystające z lokalnych danych pomijają tylko test źródłowy, gdy `.venv/TEMP` nie istnieje; pozostałe przypadki parsera i walidatora nadal są uruchamiane.

## Ograniczenia i utrzymanie

- Arkusz 2 dostarcza rozkłady dla pięciu miejsc, ale nie komplet metadanych lokalizacyjnych; dlatego jest benchmarkiem, a nie kolejnymi markerami mapy.
- Wartości z różnych skal, jednostek i metod symulacji wymagają weryfikacji źródłowej przed porównaniem.
- Nie usuwaj nieużywanych jeszcze grafik źródłowych bez sprawdzenia nowych odwołań w CSV.
- `.venv/TEMP` pozostaje lokalny i ignorowany przez Git; nie czyść go automatycznie.
