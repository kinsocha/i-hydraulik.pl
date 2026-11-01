# i-hydraulik.pl – zasady projektu

## Linkowanie realizacji – dwa punkty, oba dwukierunkowo (2026-11-01)

Przy każdej nowej realizacji / artykule poradnika wykonać OBA punkty i zgłosić w podsumowaniu, co zlinkowano w którą stronę. Pełny opis: `tools/linkowanie/README.md`, sekcja „Dwa punkty linkowania realizacji”.

1. Realizacja z dzielnicy/miasta ↔ podstrona dzielnicy (link w leadzie + 3 najbliższe z `sasiedzi.json`; kafelek w `ZleceniaZPoradnika`).
2. Realizacja ↔ poradnik `/poradnik/awarie-hydrauliczne-woda-kanalizacja-co` (części: wodna, kanalizacyjna, c.o.).

## Strona przeglądowa awarii – schemat pytanie + odpowiedź + link (żądanie właściciela 2026-11-01)

Strona: `/poradnik/awarie-hydrauliczne-woda-kanalizacja-co`.
- Każdy przypadek na niej to PYTANIE + krótka odpowiedź. Pytanie jest linkiem do osobnego artykułu z realizacji (czytelnik łatwo znajduje swój problem, a nagłówki i anchory mówią Google i AI, czego dotyczy podstrona).
- Każdy artykuł z realizacji opisuje przypadek z praktyki właściciela w kolejności: co zauważył klient → jak ustalono przyczynę → jak awarię usunięto. Jeśli na przebieg lub skutki awarii wpłynął rodzaj budynku albo piętro, wyjaśnić, na czym ten wpływ polegał.
- Po opublikowaniu KAŻDEGO kolejnego artykułu z realizacji dodać na stronie przeglądowej pytanie, krótką odpowiedź i link do pełnego opisu (to jest punkt 2 linkowania, dwukierunkowo).
- PRZYPOMNIENIE: jeśli właściciel zleca artykuł z realizacji i pomija ten schemat, przypomnieć mu o nim (kolejność klient → przyczyna → usunięcie, wpływ budynku/piętra, dopisanie pytania na stronie przeglądowej).

## ZAKAZ łączenia z marką udraznianiekanalizacji.eu (żądanie właściciela 2026-11-01 – BARDZO WAŻNE)
- NIGDY nie linkować z tego projektu do domeny marki udraznianiekanalizacji.eu i odwrotnie (ani w treści, ani w nawigacji, ani w schema, ani w stopce).
- NIGDY nie mieszać przykładów: realizacje, zdjęcia, opinie, numery i opisy przypadków z jednej marki nie trafiają na drugą. Każda marka opisuje wyłącznie własne realizacje.
- Przed oddaniem strony: grep po domenie drugiej marki i jej numerze telefonu – ma dać 0 wyników.
