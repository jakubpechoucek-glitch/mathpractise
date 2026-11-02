# Návrh: příprava na assessment v 7 kolech

## Zadání

Lukáš se připravuje na assessment z matematiky (IB AA SL, téma *Exponentials and Logarithms*).
Příkladů je hodně (5 PDF, přes 100 úloh) a nemá je dělat všechny naráz. Má je dostávat po dávkách:
**7 kol**, další kolo se odemkne až po dokončení předchozího. Počítá na iPadu, takže zápis
složitějšího výsledku (zlomky, odmocniny, logaritmy) přes klávesnici musí být co nejjednodušší.

## Zdrojové materiály

| Soubor | Obsah | Použito |
|---|---|---|
| `Review- lesson Q-s with solutions.pdf` | 81 slidů, příklady z hodin 3.01–3.06 s řešením | kola 1–6 |
| `Unit 3 - REVIEW - Exponentials and Logs.pdf` + `(MS)` | 26 opakovacích úloh + markscheme | kola 1–7 |
| `Review - ln and e.pdf` | 4 úlohy na e a ln s řešením | kola 5–6 |
| `Logs - Exponents Markscheme.pdf` | loňský test Unit 4 v.A s ručně psaným řešením | kolo 7 celé |

PDF **nejsou v repozitáři** (jsou to školní materiály, repozitář je veřejný). Úlohy jsou přepsané
do `data/kola.js`. Výsledky jsou spočítané znovu a porovnané s markscheme (`tools/test_data.js`).

**V materiálech jsem našel tři chyby.** V aplikaci jsou opravené:

- *Lesson 3.04 Ex. 5a* `ln 27 + ln(1/3) = ln x`: ve slidu je `x = 81`, správně je **`x = 9`**
  (sčítání logaritmů je součin, ne podíl).
- *Lesson 3.05 You Try 2b* `log₄(x³) + log₂√x = 8`: ve slidu je `x = 2`, správně je **`x = 16`**
  (z `log₂ x = 4` plyne `x = 2⁴`).
- *Lesson 3.05 Example 1b* `ln x − ln 5 = ln(2x + 3)`: ve slidu je `x = −5/3`, ale to nesplňuje
  definiční obor. Rovnice **nemá řešení**. V aplikaci je z toho úloha přesně na tuhle past.

## Rozdělení do 7 kol

Kola jdou podle témat v pořadí, ve kterém se probírala. Poslední kolo je zkouška nanečisto.

| Den | Kolo | Úloh | Kalkulačka |
|---|---|---|---|
| 1 | Exponent rules & exponential equations (3.02 + Review 6–9) | 14 | ne |
| 2 | Growth, decay & compound interest (3.01 + Review 1–4, 26) | 15 | ano |
| 3 | Intro to logs & log laws (3.03a, b + Review 13–16) | 15 | ne |
| 4 | Change of base & log equations (3.03c, 3.05 + Review 5a, 10–12) | 14 | ne |
| 5 | Euler's number e & ln (3.04, 3.05 + ln and e) | 14 | ne |
| 6 | Inverse functions & graphs (3.03d + Review 17–20, 22, 23, 25 + ln and e) | 18 | ne |
| 7 | **Mock assessment**: celý test v.A + Review 21 a 24 | 12 | část |

Celkem 102 úloh, asi 30–45 minut denně. Úlohy s více částmi (a), (b), (c) jsou rozdělené na
samostatné úlohy se společným úvodem. Části, které jen opakují předchozí krok, jsou vynechané.

**Odemykání:** kolo je dokončené, když jsou všechny jeho úlohy uzavřené: správně vyřešené,
nebo po vyčerpání pokusů, nebo po zobrazení řešení. Nečeká se na kalendářní den. Když chce
Lukáš udělat dvě kola za den, může. Parametr `?vse` odemkne všechno, aby rodič mohl úlohy
projít předem.

## Jak ověřit výsledek, když se vzorec špatně píše na iPadu

Hlavní myšlenka: **nechtít po Lukášovi psát vzorec, pokud to jde.** Každá úloha má jeden z pěti
typů odpovědi a vybírá se ten nejjednodušší, který ještě ověří, že úlohu opravdu vyřešil.

| Typ | Kdy | Jak se kontroluje | Příklad |
|---|---|---|---|
| `cislo` | výsledek je číslo | přesná hodnota **nebo** zaokrouhlení na 3 platné číslice (standard IB) | `3/7`, `0.429`, `2√3`, `ln(2)/3`, `e^4` |
| `mnozina` | víc řešení rovnice | čísla oddělená středníkem, na pořadí nezáleží, počet musí sedět | `0; 7`, `x = 2 nebo x = −3` |
| `vyraz` | výsledek je výraz (inverze, zjednodušení) | dosadí se ~20 bodů a porovná se hodnota, takže projde jakýkoli správný tvar | `log_3(x-4)`, `x(3x-4)` |
| `vyber` | definiční obor, transformace, „ano/ne“ | výběr ze 3–4 možností, 2 pokusy | `x > −8` |
| `sam` | náčrt grafu, důkaz | Lukáš to udělá na papír, pak porovná s řešením (i s grafem) a sám se ohodnotí | sketch $g$ and $g^{-1}$ |

### Triky, které zjednodušují zápis

1. **Kontrolní číslo místo vzorce.** Když je výsledkem „zapiš jako jeden logaritmus“, úloha se
   ptá jen na číslo uvnitř: *„Write $2\log 3 - 3\log 2$ as $\log N$. Enter $N$.“* → `9/8`.
   Stejně u tvarů typu $b\log_5 3$ (zadá se jen $b$) nebo $S_{10} = k\log_a x$ (zadá se jen $k$).
2. **Výraz se kontroluje dosazením, ne textově.** `log_3(x-4)`, `ln(x-4)/ln(3)` i `log3(x-4)`
   jsou všechno správně. U zjednodušování projde `x + 2 - 3/x` i `x+2-3x^-1`.
3. **Volný zápis jako na kalkulačce:** implicitní násobení (`2x`, `2(x+1)`, `10e`), desetinná
   čárka i tečka, znaky `√ π ² ³ −` ze systémové klávesnice, `log_3`, `log3` i `log₃` pro základ.
4. **Řádek tlačítek nad klávesnicí** s tím, co se na iPadu špatně hledá: `^ √ ( ) / − ln log logₐ e π`
   a proměnné úlohy.
5. **Živý náhled** „Rozumím tomu jako: …“ vykreslí zápis jako vzorec. Lukáš hned vidí, jestli
   `1/2x` znamená $\frac12 x$, nebo $\frac{1}{2x}$, a opraví to před odesláním.
6. **Chyba v zápisu se nepočítá jako pokus.** Neuzavřená závorka nebo cizí proměnná vrátí
   upozornění a pokus neubere.
7. **„Skoro“ hlášky:** výsledek správně na 2 platné číslice → „zaokrouhli přesněji“. U rozkladu
   na součin s roznásobenou odpovědí → „hodnota sedí, ale chce se součin“. U neurčitého integrálu
   bez `+ C` → uzná, ale připomene.

### Co jsem zvažoval a proč ne

- **Psaní rukou (Apple Pencil) a rozpoznání vzorce:** nejpřirozenější, ale potřebuje placenou
  službu (Mathpix apod.) a rozpoznávání dělá chyby. To by frustrovalo víc než klávesnice.
- **MathLive (vizuální editor vzorců):** hezký, ale těžký (~800 kB) a na iPadu si přetahuje
  klávesnici se systémovou. Volný text s náhledem je jednodušší a stačí.
- **Fotka postupu a kontrola přes Claude API:** dávalo by smysl pro náčrty a důkazy, ale
  potřebuje backend a API klíč. Je to možné rozšíření, viz níže.

## Ukládání postupu

**Teď:** v prohlížeči na iPadu (`localStorage`). Funguje bez přihlášení a bez serveru.
Nevýhody: rodič neuvidí postup na svém zařízení a smazání dat Safari postup smaže.

**Možné rozšíření:** tabulka v Supabase za společným přihlášením rodiny (stejně jako Byty nebo
Finance). Postup by byl vidět odkudkoli a dalo by se sledovat, kolik času Lukáš strávil a co mu
nejde. Předpokladem je, že Lukáš bude mít účet v tabulce `clenove`.

## Otevřené otázky

1. **Veřejné repo a školní materiály.** Úlohy z PDF jsou teď v `data/kola.js` ve veřejném
   repozitáři. Varianty: nechat (jsou to běžné IB opakovací úlohy), nebo přesunout úlohy do Supabase
   za přihlášení.
2. **Přihlášení:** má být web za společným přihlášením rodiny (`RodinaAuth`)? Teď je otevřený.
3. **Jedno kolo denně natvrdo?** Teď se další kolo odemkne hned po dokončení. Jde přidat pravidlo
   „nejdřív další den“.
4. **Práh pro odemčení:** teď stačí kolo dokončit. Jde přidat podmínku, např. aspoň 60 % napoprvé,
   jinak nejdřív opakování chyb.
