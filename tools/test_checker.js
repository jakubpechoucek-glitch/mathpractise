// Testy kontroly odpovědí:  node tools/test_checker.js
const K = require("../checker.js");

let chyb = 0;
function ma(nazev, uloha, vstup, ocekavano) {
  const r = K.zkontroluj(uloha, vstup);
  if (r.ok !== ocekavano) {
    chyb++;
    console.log("✗", nazev, JSON.stringify(vstup), "→", r);
  }
}
function latex(vstup, ocekavano) {
  const l = K.latex(K.parsuj(vstup));
  if (l !== ocekavano) { chyb++; console.log("✗ latex", vstup, "→", l, "≠", ocekavano); }
}

// --- čísla ---
const tri4 = { typ: "cislo", odpoved: "3/4" };
ma("zlomek", tri4, "3/4", true);
ma("desetinné přesně", tri4, "0.75", true);
ma("desetinná čárka", tri4, "0,75", true);
ma("x = …", tri4, "x = 3/4", true);
ma("špatně", tri4, "4/3", false);

const odm = { typ: "cislo", odpoved: "2sqrt(3)" };
ma("odmocnina", odm, "2sqrt(3)", true);
ma("odmocnina znakem", odm, "2√3", true);
ma("sqrt12", odm, "sqrt(12)", true);
ma("3 platné", odm, "3.46", true);
ma("víc platných", odm, "3.4641", true);
ma("málo přesné", odm, "3.5", false);
ma("špatně zaokrouhleno", odm, "3.47", false);
ma("bez desetinné tečky musí být přesně", odm, "3", false);
const r = K.zkontroluj(odm, "3.5");
if (!r.skoro) { chyb++; console.log("✗ 3.5 má být „skoro“", r); }

ma("pí", { typ: "cislo", odpoved: "pi/6" }, "π/6", true);
ma("pí desetinně", { typ: "cislo", odpoved: "pi/6" }, "0.524", true);
ma("ln", { typ: "cislo", odpoved: "ln(5)/ln(2)" }, "2.32", true);
ma("záporné", { typ: "cislo", odpoved: "-12" }, "−12", true);
ma("velké číslo 3 s.f. celé", { typ: "cislo", odpoved: "12345.678" }, "12300", true);
ma("velké číslo mimo", { typ: "cislo", odpoved: "12345.678" }, "12400", false);
ma("populace celé", { typ: "cislo", odpoved: "232*1.15^10" }, "939", true);
ma("rok přesně", { typ: "cislo", odpoved: "2063", desetinnaMista: 0 }, "2063", true);
ma("rok vedle", { typ: "cislo", odpoved: "2063", desetinnaMista: 0 }, "2064", false);
ma("na celé", { typ: "cislo", odpoved: "25000*1.003^60", desetinnaMista: 0 }, "29922", true);
ma("na celé špatně", { typ: "cislo", odpoved: "25000*1.003^60", desetinnaMista: 0 }, "29900", false);
ma("velké číslo 3 s.f.", { typ: "cislo", odpoved: "12345.678" }, "12300.0", true);
ma("nula", { typ: "cislo", odpoved: "0" }, "0", true);
ma("proměnná v čísle", tri4, "3x/4", false);
ma("nesmysl", tri4, "3/", false);

// --- více řešení ---
const kv = { typ: "mnozina", odpoved: ["2", "-3"] };
ma("středník", kv, "2; -3", true);
ma("opačné pořadí", kv, "-3; 2", true);
ma("nebo", kv, "x = 2 nebo x = -3", true);
ma("čárka s mezerou", kv, "2, -3", true);
ma("chybí řešení", kv, "2", false);
ma("špatné řešení", kv, "2; 3", false);
ma("odmocniny", { typ: "mnozina", odpoved: ["1+sqrt(2)", "1-sqrt(2)"] }, "2.41; -0.414", true);

// --- výrazy ---
const der = { typ: "vyraz", odpoved: "3x^2 - 4x" };
ma("derivace", der, "3x^2-4x", true);
ma("derivace s f'(x)=", der, "f'(x) = 3x² − 4x", true);
ma("derivace vytknuto", der, "x(3x-4)", true);
ma("derivace špatně", der, "3x^2-4", false);
ma("cizí proměnná", der, "3y^2", false);

const rozklad = { typ: "vyraz", odpoved: "x^2+2x-3", tvar: "soucin" };
ma("rozklad", rozklad, "(x+3)(x-1)", true);
ma("rozklad roznásobený", rozklad, "x^2+2x-3", false);

const integral = { typ: "vyraz", odpoved: "x^3/3 + 2x", konstanta: true };
ma("integrál s C", integral, "1/3x^3 + 2x + C", true);
ma("integrál bez C", integral, "x^3/3+2x", true);
ma("integrál jiná konstanta", integral, "(x^3+6x+1)/3", true);
ma("integrál špatně", integral, "x^3+2x", false);

ma("ln a definiční obor", { typ: "vyraz", odpoved: "1/x" }, "1/x", true);
ma("sin^2", { typ: "vyraz", odpoved: "1-cos(x)^2" }, "sin^2(x)", true);
ma("sinx bez závorek", { typ: "vyraz", odpoved: "x*sin(x)" }, "xsinx", true);
ma("e^x", { typ: "vyraz", odpoved: "exp(2x)" }, "e^(2x)", true);
ma("dvě proměnné", { typ: "vyraz", odpoved: "(a+b)^2", promenne: ["a", "b"] }, "a^2+2ab+b^2", true);
ma("absolutní hodnota", { typ: "vyraz", odpoved: "abs(x-1)" }, "|x-1|", true);

// --- logaritmy se základem ---
ma("log_3", { typ: "cislo", odpoved: "2" }, "log_3(9)", true);
ma("log3 bez podtržítka", { typ: "cislo", odpoved: "2" }, "log3(9)", true);
ma("log₂", { typ: "cislo", odpoved: "5" }, "log₂32", true);
ma("log10", { typ: "cislo", odpoved: "3" }, "log(1000)", true);
ma("inverze", { typ: "vyraz", odpoved: "ln(x-4)/ln(3)" }, "log_3(x-4)", true);
ma("inverze bez _", { typ: "vyraz", odpoved: "ln(x-4)/ln(3)" }, "log3(x-4)", true);
ma("log_a", { typ: "vyraz", odpoved: "1", promenne: ["a"] }, "log_a(a)", true);
ma("p a q", { typ: "vyraz", odpoved: "2p+q", promenne: ["p", "q"] }, "q+2p", true);
latex("log_3(x-4)", "\\log_{3}\\left(x - 4\\right)");

// --- výběr ---
ma("výběr", { typ: "vyber", odpoved: 2 }, "2", true);
ma("výběr špatně", { typ: "vyber", odpoved: 2 }, "1", false);

// --- náhled v LaTeXu ---
latex("2sqrt(3)", "2 \\sqrt{3}");
latex("3/4", "\\frac{3}{4}");
latex("x^2-2x+1", "x^{2} - 2 x + 1");
latex("(x+1)(x-1)", "\\left(x + 1\\right) \\left(x - 1\\right)");
latex("2*3", "2 \\cdot 3");
latex("sin x", "\\sin x");

console.log(chyb ? `\n${chyb} chyb` : "Všechny testy prošly ✓");
process.exit(chyb ? 1 : 0);
