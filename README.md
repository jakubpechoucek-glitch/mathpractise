# Math Practice

Webový nástroj pro Lukáše na přípravu na assessment z matematiky (IB Analysis & Approaches SL,
Unit 3: Exponentials and Logarithms). Příklady jsou rozdělené do **7 kol, jedno kolo na den**.
Další kolo se odemkne, až je to předchozí dokončené.

**Web:** https://jakubpechoucek-glitch.github.io/mathpractise/
(náhled všech kol bez odemykání: `?vse`)

Aplikace i úlohy jsou **anglicky**, protože Lukáš studuje v angličtině. Dokumentace je česky.

## Jak to funguje

- Lukáš počítá na papíře nebo v kalkulačce a do políčka zapíše **jen výsledek**.
- Odpověď se zkontroluje hned. Na každou úlohu má 3 pokusy (u výběru z možností 2), pak se ukáže řešení.
- Pod políčkem se průběžně ukazuje, jak aplikace zápisu rozumí („I read this as…“).
- Úlohy, které napoprvé nevyšly, se dají kdykoli procvičit znovu (sekce *To review*).
- Postup se ukládá v prohlížeči na iPadu (localStorage).

## Soubory

| Soubor | Co dělá |
|---|---|
| `index.html`, `style.css`, `app.js` | aplikace: přehled kol, úlohy, kontrola, grafy v řešení |
| `checker.js` | kontrola odpovědí: parser matematických výrazů, porovnání čísel a výrazů, náhled v LaTeXu |
| `data/kola.js` | všech 102 úloh rozdělených do 7 kol |
| `tools/test_checker.js` | testy kontroly odpovědí |
| `tools/test_data.js` | kontrola dat: každá odpověď jde přečíst a výsledky sedí s markscheme |
| `docs/navrh.md` | návrh řešení: rozdělení do kol, ověřování výsledků, ukládání, otevřené otázky |
| `docs/format-uloh.md` | jak přidat nebo upravit úlohy |
| `PROGRESS.md` | stav projektu a co zbývá |

## Testy

```bash
node tools/test_checker.js
```

```bash
node tools/test_data.js
```

Bez instalace a bez buildu. Je to statický web na GitHub Pages, KaTeX (vzorce) se načítá z cdnjs.
