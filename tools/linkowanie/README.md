# Linkowanie wewnętrzne i-hydraulik.pl (od 08.10.2026)

Narzędzie pilnuje dwóch rzeczy:

1. **Linki w artykułach poradnika** – artykuł-realizacja linkuje do podstrony dzielnicy zlecenia (pierwsza wzmianka) i do 3 najbliższych dzielnic z podstroną. Zdania pisze się ręcznie, każde inaczej, kolejnym wariantem rotacji A–F. Narzędzie tylko sprawdza, czy linki są.
2. **Kafelki poradnika** – na każdej podstronie `/hydraulik<dzielnica>` sekcja `<ZleceniaZPoradnika slugi={[...]} />` (komponent `src/components/ZleceniaZPoradnika.astro`) z 2 artykułami. Dobór: ręczny przydział z `strony.json` → artykuły z tej dzielnicy → artykuły z najmniejszą liczbą kafli. Artykuł z `pubDate` w przyszłości nie trafia do kafli. Strona główna bez kafli.

Sąsiedzi to zawsze **dzielnice** (albo miasta dla miasta), nigdy osiedla: Anin, Bródno, Saska Kępa, Stara Miłosna mają `typ: "osiedle"` i nie są liczone jako sąsiad (polecenie właściciela 08.10.2026).

## Pliki

- `dane/miejsca.json` – współrzędne i typ (dzielnica / osiedle / miasto).
- `dane/strony.json` – podstrony dzielnic: miejsce, anchor odmieniony, `kafle` = ręczny przydział (pusta lista = automat).
- `dane/sasiedzi.json` – 3 najbliższe podstrony dla każdego miejsca (generowane komendą `sasiedzi --zapisz`).
- `dane/artykuly.json` – miejsce zlecenia każdego artykułu, `potwierdzone`.
- `linkowanie.cjs` – narzędzie.

## Komendy (z katalogu projektu)

```
node tools/linkowanie/linkowanie.cjs status              # raport: brakujące linki, nowe strony/artykuły, czekające na podstronę, kafle
node tools/linkowanie/linkowanie.cjs artykuly --zapisz   # dopisz nowe artykuły (miejsce do potwierdzenia)
node tools/linkowanie/linkowanie.cjs sasiedzi --zapisz   # przelicz 3 najbliższych
node tools/linkowanie/linkowanie.cjs kafle --apply       # wstaw/odśwież kafle na podstronach
```

Bez `--apply` / `--zapisz` nic nie jest zmieniane.

## Nowy artykuł

1. `artykuly --zapisz` → w `dane/artykuly.json` sprawdzić miejsce (z tytułu/opisu/leadu, nie ze zdań o zasięgu ani listy w CTA) i ustawić `potwierdzone: true`.
2. W treści: pierwsza wzmianka o miejscu zlecenia = link do podstrony; zdanie z 3 dzielnicami z `sasiedzi.json`, odmienionymi („na Woli”, „w Wawrze”). Dopisać wiersz w tabeli rotacji.
3. `status` (sekcja „brakujące linki” ma być pusta), `kafle --apply`, build, kontrole.

## Nowa podstrona dzielnicy

1. Dopisać do `dane/strony.json` (i do `miejsca.json`, jeśli brak współrzędnych), `sasiedzi --zapisz`.
2. `status` pokaże artykuły, które czekały na tę stronę, i artykuły, w których zmienili się najbliżsi – tam poprawić zdania ręcznie.
3. `kafle --apply` przelicza WSZYSTKIE podstrony: po nim `git diff --stat` i cofnąć niechciane (`git checkout HEAD -- src/pages/<slug>.astro`).

## Zabezpieczenia

- Znacznik kafli jest podmieniany tylko w pełnej, jednoliniowej postaci `<ZleceniaZPoradnika slugi={[...]} />`. Inna postać = strona pominięta z komunikatem, treść nie jest wycinana.
- Końce linii pliku są zachowane (`hydraulikzoliborz.astro` ma CRLF).

## Kontrola po buildzie

- każdy `href="/…"` ma plik w `dist`; zero `href` kończących się `/` i zero `.html`;
- na zmienionych podstronach bez zmian liczba pytań FAQ i blok FAQPage;
- zero numerów innych marek.
