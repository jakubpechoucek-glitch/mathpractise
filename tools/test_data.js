// Kontrola dat úloh:  node tools/test_data.js
// – každá odpověď a graf jde přečíst, id jsou unikátní
// – vybrané výsledky sedí s hodnotami z markscheme (zaokrouhlené odpovědi musí projít)
const K = require("../checker.js");
const KOLA = require("../data/kola.js");

let chyb = 0;
const chyba = (...a) => { chyb++; console.log("✗", ...a); };
const ids = new Set();
const TYPY = ["cislo", "mnozina", "vyraz", "vyber", "sam"];

for (const kolo of KOLA) {
  for (const u of kolo.ulohy) {
    if (ids.has(u.id)) chyba("duplicitní id", u.id);
    ids.add(u.id);
    if (!TYPY.includes(u.typ)) chyba(u.id, "neznámý typ", u.typ);
    if (!u.zadani || !u.reseni) chyba(u.id, "chybí zadání nebo řešení");
    try {
      if (u.typ === "cislo") K.vyhodnot(K.parsuj(u.odpoved), {});
      if (u.typ === "mnozina") u.odpoved.forEach((o) => K.vyhodnot(K.parsuj(o), {}));
      if (u.typ === "vyraz") K.parsuj(u.odpoved);
      if (u.typ === "vyber" && !(u.odpoved >= 0 && u.odpoved < u.moznosti.length)) chyba(u.id, "špatný index odpovědi");
      if (u.graf) u.graf.krivky.forEach((k) => K.parsuj(k.f));
    } catch (e) {
      chyba(u.id, "nejde přečíst:", e.message);
    }
    // správná odpověď musí projít vlastní kontrolou
    if (u.typ === "cislo" || u.typ === "vyraz") {
      const v = K.zkontroluj(u, String(u.odpoved));
      if (!v.ok) chyba(u.id, "vlastní odpověď neprošla", v);
    }
  }
}

// Odpovědi tak, jak by je napsal Lukáš (opsané z markscheme) → musí projít
const uloha = (id) => KOLA.flatMap((k) => k.ulohy).find((u) => u.id === id);
const OPSANE = {
  "k1-01": "128x^13/(25y^5)", "k1-04": "x+2-3x^-1", "k1-10": "3/7",
  "k2-04": "11264.93", "k2-05": "1498.08", "k2-06": "13.8", "k2-07": "3797", "k2-08": "30",
  "k2-09": "2063", "k2-10": "6149", "k2-11": "24996", "k2-12": "2007", "k2-13": "39636", "k2-15": "10",
  "k3-12": "5x-3y", "k3-14": "2a + 1/2 b - 3c",
  "k4-02": "5√3", "k4-06": "20/9", "k4-07": "2", "k4-09": "25^(1/5)", "k4-14": "1/3",
  "k5-01": "e^4", "k5-03": "10e", "k5-06": "ln49", "k5-07": "-0.569", "k5-08": "0.756", "k5-09": "-12.5",
  "k5-10": "0.506", "k5-11": "2.87", "k5-12": "-5.18",
  "k6-01": "log_3(x-4)", "k6-02": "log8(x-2)+1", "k6-03": "-log_2(x-1)", "k6-04": "log_3(x+8)+11",
  "k6-07": "sqrt(e^3)", "k6-08": "log_5(x/2)", "k6-17": "0.996", "k6-18": "-0.2e^(x+1)+6",
  "k7-01": "3y^2x", "k7-03": "3; 0", "k7-06": "-log_2(x-2)", "k7-08": "29922", "k7-09": "18383",
  "k7-10": "x = 32", "k7-12": "1.50",
  "x1-01": "2; 1", "x1-02": "-p+q", "x1-04": "2.97", "x1-06": "1/2", "x1-08": "9; 3",
  "x1-09": "-20", "x1-10": "-40", "x1-11": "3260000", "x1-12": "6.93", "x1-13": "8.05",
  "x1-14": "1.72", "x1-16": "3-e^(x-2)", "x1-17": "23",
};
for (const [id, vstup] of Object.entries(OPSANE)) {
  const u = uloha(id);
  if (!u) { chyba("neexistuje", id); continue; }
  const v = K.zkontroluj(u, vstup);
  if (!v.ok) chyba(id, JSON.stringify(vstup), "→", v);
}

const pocet = KOLA.reduce((s, k) => s + k.ulohy.length, 0);
console.log(chyb ? `\n${chyb} chyb` : `Data v pořádku ✓  (${KOLA.length} kol, ${pocet} úloh)`);
process.exit(chyb ? 1 : 0);
