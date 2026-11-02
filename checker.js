// Kontrola odpovědí: parser matematických výrazů, vyhodnocení a převod do LaTeXu.
// Bez práce se stránkou, takže jde testovat v Node (node tools/test_checker.js).
//
// Lukáš píše odpověď na iPadu obyčejným textem, např.  2sqrt(3),  3/4,  x^2-2x+1,
// (x-1)(x+3),  1/3 x^3 + C. Parser zvládá implicitní násobení (2x, 2(x+1), xsinx),
// desetinnou čárku, znaky π √ ² ³ − × ÷ ·  a funkce sqrt, sin, cos, tan, ln, log, exp, abs.
(function (root) {
  "use strict";

  const FUNKCE = ["arcsin", "arccos", "arctan", "sqrt", "sin", "cos", "tan", "ln", "log", "exp", "abs"];
  const KONSTANTY = ["pi", "e"];

  // ---------- normalizace a tokenizace ----------

  function normalizuj(s) {
    return String(s)
      .replace(/[−–—]/g, "-")
      .replace(/[×·∙⋅]/g, "*")
      .replace(/÷/g, "/")
      .replace(/²/g, "^2").replace(/³/g, "^3")
      .replace(/π/g, "pi")
      .replace(/√/g, "sqrt")
      .replace(/[₀-₉]+/g, (m) => "_" + [...m].map((c) => c.charCodeAt(0) - 8320).join("") + " ")
      .replace(/(\d),(?=\d)/g, "$1.")   // desetinná čárka 1,5 → 1.5
      .replace(/\*\*/g, "^")
      .trim();
  }

  function tokenizuj(s) {
    const tokeny = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9.]/.test(c)) {
        const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
        if (!m) throw new Error("Nerozumím číslu u znaku „" + c + "“.");
        tokeny.push({ t: "num", v: parseFloat(m[1]), text: m[1] });
        i += m[1].length;
        continue;
      }
      if (/[a-zA-Z]/.test(c)) {
        const beh = /^[a-zA-Z]+/.exec(s.slice(i))[0];
        // rozdělit běh písmen na známá jména a jednopísmenné proměnné (xsinx → x sin x)
        let j = 0;
        while (j < beh.length) {
          const zbytek = beh.slice(j);
          const f = FUNKCE.find((n) => zbytek.toLowerCase().startsWith(n));
          if (f) { tokeny.push({ t: "fn", n: f }); j += f.length; continue; }
          const k = KONSTANTY.find((n) => zbytek.startsWith(n));
          if (k) { tokeny.push({ t: "const", n: k }); j += k.length; continue; }
          tokeny.push({ t: "var", n: zbytek[0] });
          j += 1;
        }
        i += beh.length;
        // základ logaritmu: log_3 x, log_a x, log3(x), log₂x
        const posledni = tokeny[tokeny.length - 1];
        if (posledni.t === "fn" && posledni.n === "log" && beh.toLowerCase().endsWith("log")) {
          const m = /^_?(\d+(?:\.\d+)?)/.exec(s.slice(i)) || /^_([a-zA-Z])/.exec(s.slice(i));
          if (m) {
            posledni.zaklad = /\d/.test(m[1]) ? { t: "num", v: parseFloat(m[1]), text: m[1] } : { t: "var", n: m[1] };
            i += m[0].length;
          }
        }
        continue;
      }
      if ("+-*/^()|".includes(c)) { tokeny.push({ t: "op", v: c }); i++; continue; }
      if (c === "[" || c === "{") { tokeny.push({ t: "op", v: "(" }); i++; continue; }
      if (c === "]" || c === "}") { tokeny.push({ t: "op", v: ")" }); i++; continue; }
      throw new Error("Nerozumím znaku „" + c + "“.");
    }
    return tokeny;
  }

  // ---------- parser (rekurzivní sestup) ----------

  function parsuj(vstup) {
    const tokeny = tokenizuj(normalizuj(vstup));
    if (!tokeny.length) throw new Error("Odpověď je prázdná.");
    let p = 0;
    let vAbs = 0; // jsme uvnitř |…| – pak | neznamená začátek nové absolutní hodnoty
    const dalsi = () => tokeny[p];
    const jeOp = (v) => dalsi() && dalsi().t === "op" && dalsi().v === v;
    const zacinaPrimar = () => {
      const t = dalsi();
      if (!t) return false;
      if (t.t !== "op") return true;
      return t.v === "(" || (t.v === "|" && vAbs === 0);
    };

    function vyraz() {
      let a = clen();
      while (jeOp("+") || jeOp("-")) {
        const op = tokeny[p++].v;
        a = { t: "bin", op, a, b: clen() };
      }
      return a;
    }
    function clen() {
      let a = unarni();
      for (;;) {
        if (jeOp("*") || jeOp("/")) {
          const op = tokeny[p++].v;
          a = { t: "bin", op, a, b: unarni() };
        } else if (zacinaPrimar()) {
          a = { t: "bin", op: "*", a, b: mocnina(), implicitni: true };
        } else break;
      }
      return a;
    }
    function unarni() {
      if (jeOp("-")) { p++; return { t: "neg", a: unarni() }; }
      if (jeOp("+")) { p++; return unarni(); }
      return mocnina();
    }
    function mocnina() {
      const zaklad = primar();
      if (jeOp("^")) { p++; return { t: "bin", op: "^", a: zaklad, b: unarni() }; }
      return zaklad;
    }
    function primar() {
      const t = dalsi();
      if (!t) throw new Error("Výraz je nedokončený.");
      if (t.t === "num") { p++; return { t: "num", v: t.v, text: t.text }; }
      if (t.t === "const") { p++; return { t: "const", n: t.n }; }
      if (t.t === "var") { p++; return { t: "var", n: t.n }; }
      if (t.t === "fn") {
        p++;
        // sin^2(x) = (sin x)^2
        let exponent = null;
        if (jeOp("^")) { p++; exponent = unarni(); }
        let arg;
        if (jeOp("(")) { p++; arg = vyraz(); zavri(")"); }
        else if (zacinaPrimar() || jeOp("-")) arg = jeOp("-") ? unarni() : mocnina();  // sin x, sqrt3
        else throw new Error("Za " + t.n + " chybí argument.");
        const f = { t: "fn", f: t.n, a: arg };
        if (t.zaklad) f.z = t.zaklad;
        return exponent ? { t: "bin", op: "^", a: f, b: exponent } : f;
      }
      if (t.t === "op" && t.v === "(") { p++; const e = vyraz(); zavri(")"); return { t: "zav", a: e }; }
      if (t.t === "op" && t.v === "|") {
        p++; vAbs++;
        const e = vyraz();
        vAbs--;
        zavri("|");
        return { t: "fn", f: "abs", a: e };
      }
      throw new Error("Nečekaný znak „" + t.v + "“.");
    }
    function zavri(v) {
      if (!jeOp(v)) throw new Error(v === ")" ? "Chybí zavírací závorka )." : "Chybí zavírací |.");
      p++;
    }

    const ast = vyraz();
    if (p < tokeny.length) throw new Error("Nerozumím části „" + (tokeny[p].v || tokeny[p].n || tokeny[p].text) + "“.");
    return ast;
  }

  // ---------- vyhodnocení ----------

  const FN = {
    sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan,
    arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan,
    ln: Math.log, log: Math.log10, exp: Math.exp, abs: Math.abs,
  };

  function vyhodnot(ast, prom) {
    switch (ast.t) {
      case "num": return ast.v;
      case "const": return ast.n === "pi" ? Math.PI : Math.E;
      case "var":
        if (!prom || !(ast.n in prom)) throw new Error("Neznámá proměnná " + ast.n + ".");
        return prom[ast.n];
      case "zav": return vyhodnot(ast.a, prom);
      case "neg": return -vyhodnot(ast.a, prom);
      case "fn":
        if (ast.z) return Math.log(vyhodnot(ast.a, prom)) / Math.log(vyhodnot(ast.z, prom));
        return FN[ast.f](vyhodnot(ast.a, prom));
      case "bin": {
        const a = vyhodnot(ast.a, prom), b = vyhodnot(ast.b, prom);
        if (ast.op === "+") return a + b;
        if (ast.op === "-") return a - b;
        if (ast.op === "*") return a * b;
        if (ast.op === "/") return a / b;
        return Math.pow(a, b);
      }
    }
    throw new Error("Neznámý uzel");
  }

  function promenne(ast, mnozina) {
    mnozina = mnozina || new Set();
    if (ast.t === "var") mnozina.add(ast.n);
    if (ast.a) promenne(ast.a, mnozina);
    if (ast.b) promenne(ast.b, mnozina);
    if (ast.z) promenne(ast.z, mnozina);
    return mnozina;
  }

  function maDesetinne(ast) {
    if (ast.t === "num") return ast.text.includes(".");
    return Boolean((ast.a && maDesetinne(ast.a)) || (ast.b && maDesetinne(ast.b)));
  }

  // ---------- LaTeX pro náhled „rozumím tomu jako…“ ----------

  const PRIORITA = { "+": 1, "-": 1, "*": 2, "/": 2, "^": 4 };
  function priorita(ast) {
    if (ast.t === "bin") return PRIORITA[ast.op];
    if (ast.t === "neg") return 2;
    return 5;
  }
  const bezZavorek = (ast) => (ast.t === "zav" ? bezZavorek(ast.a) : ast);
  const zavorky = (s) => "\\left(" + s + "\\right)";

  function latex(ast) {
    switch (ast.t) {
      case "num": return ast.text.replace(/^\./, "0.");
      case "const": return ast.n === "pi" ? "\\pi" : "e";
      case "var": return ast.n;
      case "zav": return zavorky(latex(ast.a));
      case "neg": {
        const vnitrni = priorita(ast.a) <= 1 ? zavorky(latex(ast.a)) : latex(ast.a);
        return "-" + vnitrni;
      }
      case "fn": {
        const arg = bezZavorek(ast.a);
        if (ast.f === "sqrt") return "\\sqrt{" + latex(arg) + "}";
        if (ast.f === "abs") return "\\left|" + latex(arg) + "\\right|";
        if (ast.f === "exp") return "e^{" + latex(arg) + "}";
        let jmeno = { arcsin: "\\arcsin", arccos: "\\arccos", arctan: "\\arctan", log: "\\log" }[ast.f] || "\\" + ast.f;
        if (ast.z) jmeno += "_{" + latex(ast.z) + "}";
        const jednoduchy = arg.t === "num" || arg.t === "var" || arg.t === "const";
        return jmeno + (jednoduchy ? " " + latex(arg) : zavorky(latex(arg)));
      }
      case "bin": {
        const op = ast.op;
        if (op === "/") return "\\frac{" + latex(bezZavorek(ast.a)) + "}{" + latex(bezZavorek(ast.b)) + "}";
        if (op === "^") {
          const z = ast.a;
          const zs = priorita(z) < 5 || z.t === "fn" ? zavorky(latex(bezZavorek(z))) : latex(z);
          return zs + "^{" + latex(bezZavorek(ast.b)) + "}";
        }
        const pa = priorita(ast.a), pb = priorita(ast.b);
        const ls = pa < PRIORITA[op] ? zavorky(latex(ast.a)) : latex(ast.a);
        let rs;
        if (op === "-") rs = pb <= 1 ? zavorky(latex(ast.b)) : latex(ast.b);
        else rs = pb < PRIORITA[op] || (op === "*" && ast.b.t === "neg") ? zavorky(latex(ast.b)) : latex(ast.b);
        if (op === "*") {
          // mezi dvěma čísly (2·3) a před číslem musí být tečka, jinak stačí psát vedle sebe
          const zacinaCislem = /^[0-9.]/.test(rs);
          return ls + (zacinaCislem ? " \\cdot " : " ") + rs;
        }
        return ls + " " + op + " " + rs;
      }
    }
    return "?";
  }

  // ---------- porovnání ----------

  // Odstraní levou stranu „x =“, „f'(x) =“, „y=“ – Lukáš ji často napíše ze zvyku.
  function bezLeveStrany(s) {
    const i = String(s).lastIndexOf("=");
    return i >= 0 ? String(s).slice(i + 1) : String(s);
  }

  function blizko(a, b, rel) {
    return Math.abs(a - b) <= (rel || 1e-9) * Math.max(1, Math.abs(a), Math.abs(b));
  }

  // Tolerance pro zaokrouhlenou odpověď: polovina jednotky na posledním platném místě
  // (IB standard = 3 platné číslice).
  function toleranceProPlatne(ocekavano, platne) {
    if (ocekavano === 0) return 0.5 * Math.pow(10, -platne);
    const rad = Math.floor(Math.log10(Math.abs(ocekavano)));
    return 0.5 * Math.pow(10, rad - platne + 1) * (1 + 1e-9);
  }

  // Porovná jedno číslo. Vrací {ok, zprava}.
  const jeLiteral = (ast) => ast.t === "num" || (ast.t === "neg" && ast.a.t === "num");

  function porovnejCislo(vstupAst, ocekavano, platne, mista) {
    platne = platne || 3;
    const hodnota = vyhodnot(vstupAst, {});
    if (!isFinite(hodnota)) return { ok: false, zprava: "Tahle odpověď nemá konečnou hodnotu." };
    if (blizko(hodnota, ocekavano, 1e-9)) return { ok: true };
    // Zaokrouhlenou odpověď uznáme, když je to desetinné číslo nebo samotné číslo (939 místo 938,57…).
    // Výraz typu 2sqrt(3) musí sedět přesně.
    if (maDesetinne(vstupAst) || jeLiteral(vstupAst)) {
      const rozdil = Math.abs(hodnota - ocekavano);
      if (mista !== undefined) {
        if (rozdil <= 0.5 * Math.pow(10, -mista) * (1 + 1e-9)) return { ok: true, zprava: "Správně (zaokrouhleno)." };
        if (rozdil <= 5 * Math.pow(10, -mista)) return { ok: false, skoro: true, zprava: mista === 0 ? "Skoro! Zkontroluj zaokrouhlení na celé číslo." : "Skoro! Zkontroluj zaokrouhlení na " + mista + " desetinná místa." };
        return { ok: false };
      }
      if (rozdil <= toleranceProPlatne(ocekavano, platne)) return { ok: true, zprava: "Správně (zaokrouhleno)." };
      if (Math.abs(hodnota - ocekavano) <= toleranceProPlatne(ocekavano, Math.max(1, platne - 1)) * 1.0001)
        return { ok: false, skoro: true, zprava: "Skoro! Zaokrouhli přesněji – aspoň na " + platne + " platné číslice." };
    }
    return { ok: false };
  }

  // Body, ve kterých se porovnávají výrazy (pevné, aby byla kontrola opakovatelná)
  // (i větší kladná čísla – inverze typu log(x - 4) jsou definované až od x > 4)
  const BODY = [0.37, 1.13, -0.71, 2.29, -1.61, 0.83, 1.79, -2.23, 2.71, -0.29, 3.37, 0.11,
    4.43, 5.71, -3.17, 7.19, 9.37, 12.6, 15.3, 21.7];

  function porovnejVyrazy(vstupAst, ocekavanyAst, nazvy, konstanta) {
    let platnych = 0;
    let rozdil = null;
    for (let i = 0; i < BODY.length; i++) {
      const prom = { C: 0, c: 0, K: 0 };
      nazvy.forEach((n, k) => { prom[n] = BODY[(i + 3 * k) % BODY.length] + 0.17 * k; });
      let a, b;
      try { a = vyhodnot(vstupAst, prom); b = vyhodnot(ocekavanyAst, prom); } catch (e) { return { ok: false, zprava: e.message }; }
      if (!isFinite(a) || !isFinite(b)) continue;   // mimo definiční obor (ln záporného čísla…)
      platnych++;
      if (konstanta) {
        // u neurčitého integrálu stačí, když se liší o konstantu
        const d = a - b;
        if (rozdil === null) rozdil = d;
        else if (!blizko(d, rozdil, 1e-7)) return { ok: false };
      } else if (!blizko(a, b, 1e-7)) return { ok: false };
    }
    if (platnych < 4) return { ok: false, zprava: "Výraz se nedá ověřit – zkontroluj ho prosím." };
    return { ok: true };
  }

  function jeSoucin(ast) {
    ast = bezZavorek(ast);
    if (ast.t === "neg") return jeSoucin(ast.a);
    return ast.t === "bin" && (ast.op === "*" || (ast.op === "^" && bezZavorek(ast.a).t !== "var"));
  }

  // Rozdělí odpověď s více řešeními: „2; -3“, „x=2 nebo x=-3“, „2, -3“
  function rozdelReseni(s) {
    return normalizuj(s)
      .split(/;|\s+(?:nebo|a|or|and)\s+|,\s+|,(?=\s*[-+]?[a-zA-Z(])/)
      .map((x) => bezLeveStrany(x).trim())
      .filter(Boolean);
  }

  // Hlavní vstup: zkontroluje odpověď na úlohu.
  // Vrací { ok, zprava?, skoro?, chybaVstupu? }.
  function zkontroluj(uloha, vstup) {
    try {
      if (uloha.typ === "vyber") return { ok: Number(vstup) === uloha.odpoved };

      if (uloha.typ === "cislo") {
        const ast = parsuj(bezLeveStrany(vstup));
        const nezname = [...promenne(ast)];
        if (nezname.length) return { ok: false, chybaVstupu: true, zprava: "Tady se čeká číslo, ale v odpovědi je " + nezname.join(", ") + "." };
        return porovnejCislo(ast, vyhodnot(parsuj(String(uloha.odpoved)), {}), uloha.platneCislice, uloha.desetinnaMista);
      }

      if (uloha.typ === "mnozina") {
        const casti = rozdelReseni(vstup);
        const ocekavane = uloha.odpoved.map((o) => vyhodnot(parsuj(String(o)), {}));
        if (casti.length !== ocekavane.length)
          return { ok: false, zprava: "Počet řešení nesedí – " + (casti.length < ocekavane.length ? "nějaké chybí." : "některé je navíc.") };
        const zbyva = ocekavane.slice();
        let zaokrouhleno = false;
        for (const c of casti) {
          const ast = parsuj(c);
          if (promenne(ast).size) return { ok: false, chybaVstupu: true, zprava: "Řešení piš jako čísla oddělená středníkem, např. 2; -3." };
          const i = zbyva.findIndex((o) => porovnejCislo(ast, o, uloha.platneCislice, uloha.desetinnaMista).ok);
          if (i < 0) return { ok: false };
          if (!blizko(vyhodnot(ast, {}), ocekavane[i], 1e-9)) zaokrouhleno = true;
          zbyva.splice(i, 1);
        }
        return { ok: true, zprava: zaokrouhleno ? "Správně (zaokrouhleno)." : undefined };
      }

      if (uloha.typ === "vyraz") {
        const nazvy = uloha.promenne || ["x"];
        const ast = parsuj(bezLeveStrany(vstup));
        const povolene = new Set(nazvy.concat(uloha.konstanta ? ["C", "c", "K"] : []));
        const cizi = [...promenne(ast)].filter((n) => !povolene.has(n));
        if (cizi.length) return { ok: false, chybaVstupu: true, zprava: "Neznámá proměnná " + cizi.join(", ") + " (počítá se s " + nazvy.join(", ") + ")." };
        const vysledek = porovnejVyrazy(ast, parsuj(uloha.odpoved), nazvy, uloha.konstanta);
        if (vysledek.ok && uloha.tvar === "soucin" && !jeSoucin(ast))
          return { ok: false, skoro: true, zprava: "Hodnota sedí, ale úloha chce výraz rozložit na součin." };
        if (vysledek.ok && uloha.konstanta && ![...promenne(ast)].some((n) => n === "C" || n === "c" || n === "K"))
          return { ok: true, zprava: "Správně – jen nezapomeň na + C." };
        return vysledek;
      }
    } catch (e) {
      return { ok: false, chybaVstupu: true, zprava: e.message };
    }
    return { ok: false, zprava: "Neznámý typ úlohy." };
  }

  // Náhled zápisu pro políčko odpovědi – LaTeX, nebo chyba
  function nahled(uloha, vstup) {
    if (!String(vstup).trim()) return { latex: "" };
    try {
      if (uloha.typ === "mnozina") return { latex: rozdelReseni(vstup).map((c) => latex(parsuj(c))).join(";\\quad ") };
      return { latex: latex(parsuj(bezLeveStrany(vstup))) };
    } catch (e) {
      return { chyba: e.message };
    }
  }

  const api = { parsuj, vyhodnot, latex, zkontroluj, nahled, rozdelReseni, normalizuj };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Kontrola = api;
})(typeof window !== "undefined" ? window : globalThis);
