# Formát úloh (`data/kola.js`)

Kola jsou pole `KOLA`. Každé kolo:

```js
{
  id: "k3",                       // unikátní, používá se v adrese #/kolo/k3 a v uloženém postupu
  nazev: "Intro to logs & log laws",
  popis: "Krátký popis česky.",
  kalkulacka: false,              // štítek „bez kalkulačky“ / „s kalkulačkou“
  ulohy: [ … ],
}
```

## Úloha

Společná pole:

| Pole | Povinné | Význam |
|---|---|---|
| `id` | ano | unikátní napříč všemi koly (`k3-07`). **Neměnit**, když už Lukáš úlohu řešil, jinak se ztratí její stav. |
| `typ` | ano | `cislo`, `mnozina`, `vyraz`, `vyber`, `sam` |
| `zadani` | ano | text zadání |
| `reseni` | ano | postup a výsledek, každý řádek je nový odstavec |
| `uvod` | ne | společný úvod pro víc částí; zobrazí se jen u první z po sobě jdoucích úloh se stejným úvodem |
| `napoveda` | ne | tlačítko 💡 Nápověda |
| `zdroj` | ne | odkud úloha je (`Unit 3 Review Q12`) |
| `graf` | ne | graf zobrazený v řešení, viz níže |

Texty: vzorce v LaTeXu mezi `$…$`, `**tučně**`, `*kurzíva*`, znak dolaru jako `\$`.
Celý soubor používá `r`…`` (String.raw), takže se zpětná lomítka nezdvojují.

### Podle typu

```js
// číslo – přesně nebo na 3 platné číslice
{ typ: "cislo", odpoved: "ln(2)/3" }
{ typ: "cislo", odpoved: "25000*1.003^60", desetinnaMista: 0 }   // „to the nearest whole number“
{ typ: "cislo", odpoved: "0.35", platneCislice: 2 }              // jiná přesnost

// více řešení (pořadí nehraje roli, počet musí sedět)
{ typ: "mnozina", odpoved: ["-3", "-1"] }

// výraz – porovnává se dosazením
{ typ: "vyraz", odpoved: "ln(x-4)/ln(3)" }                       // proměnná x
{ typ: "vyraz", odpoved: "2p + q", promenne: ["p", "q"] }
{ typ: "vyraz", odpoved: "x^2+2x-3", tvar: "soucin" }           // musí být rozložené na součin
{ typ: "vyraz", odpoved: "x^3/3", konstanta: true }             // neurčitý integrál, + C

// výběr – odpoved je index správné možnosti (od 0)
{ typ: "vyber", moznosti: [r`$x > 8$`, r`$x > -8$`], odpoved: 1 }

// sebehodnocení (náčrt, důkaz) – žádná odpověď
{ typ: "sam" }
```

Výraz v `odpoved` se píše stejně, jako by ho psal Lukáš: `sqrt()`, `ln()`, `log()` = základ 10,
`log_3()` = základ 3, `e`, `pi`, `^`, implicitní násobení.

### Graf v řešení

```js
graf: {
  x: [-4, 6], y: [-3, 8],                        // rozsah os
  krivky: [
    { f: "2^(-x) + 2", popis: "g" },
    { f: "-log_2(x-2)", popis: "g⁻¹" },
    { f: "x", carkovane: true, popis: "y = x" },
  ],
  asymptoty: { x: [2], y: [2] },                 // čárkovaně červeně
  body: [[0, 3, "(0, 3)"], [3, 0, "(3, 0)"]],
}
```

## Kontrola po úpravě

```bash
node tools/test_data.js
```

Ověří, že každá odpověď jde přečíst, správná odpověď projde vlastní kontrolou a id jsou
unikátní. Do objektu `OPSANE` v testu se vyplatí přidat výsledek z markscheme, tak jak by ho
napsal Lukáš (zaokrouhlený).
