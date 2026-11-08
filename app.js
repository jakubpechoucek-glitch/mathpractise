// Math Practice – příprava na assessment rozdělená do kol.
// Další kolo se odemkne, až jsou všechny úlohy předchozího uzavřené
// (vyřešené správně, nebo po 3 pokusech / zobrazení řešení).
//
// Postup se ukládá v prohlížeči (localStorage). Parametry adresy:
//   ?vse    – odemkne všechna kola (náhled pro rodiče)
//   #/kolo/k3 – přímý odkaz na kolo
(function () {
  "use strict";

  const KLIC = "mathpractise-v1";
  const MAX_POKUSU = { cislo: 3, mnozina: 3, vyraz: 3, vyber: 2 };
  const params = new URLSearchParams(location.search);
  const ODEMKNOUT_VSE = params.has("vse");
  const app = document.getElementById("app");
  const VSECHNA = window.KOLA || [];
  const KOLA = VSECHNA.filter((k) => !k.extra);     // 7 kol, odemykají se postupně
  const EXTRA = VSECHNA.filter((k) => k.extra);     // samostatné sady, odemčené hned
  const K = window.Kontrola;

  // ---------- stav ----------

  function nacti() {
    try {
      const s = JSON.parse(localStorage.getItem(KLIC));
      if (s && s.ulohy) return s;
    } catch (e) { /* soukromé okno apod. */ }
    return { ulohy: {}, kola: {}, opakovani: {} };
  }
  let stav = nacti();
  stav.opakovani = stav.opakovani || {};
  function uloz() {
    try { localStorage.setItem(KLIC, JSON.stringify(stav)); } catch (e) { /* nevadí */ }
  }

  const stavUlohy = (sada, id) => (sada[id] = sada[id] || { pokusy: 0, ok: false, uzavreno: false, prvni: null });

  function prehledKola(kolo) {
    const u = kolo.ulohy.map((x) => stav.ulohy[x.id] || {});
    const uzavreno = u.filter((x) => x.uzavreno).length;
    return {
      celkem: kolo.ulohy.length,
      uzavreno,
      spravne: u.filter((x) => x.ok).length,
      napoprve: u.filter((x) => x.prvni === true).length,
      hotovo: uzavreno === kolo.ulohy.length,
    };
  }
  // Odemykání po kolech je vypnuté (všechna kola otevřená). Zpět zapnout: ZAMYKAT_KOLA = true.
  const ZAMYKAT_KOLA = false;
  const jeOdemceno = (i) => !ZAMYKAT_KOLA || ODEMKNOUT_VSE || i === 0 || prehledKola(KOLA[i - 1]).hotovo;
  const kOpakovani = () => VSECHNA.flatMap((k) => k.ulohy).filter((u) => stav.ulohy[u.id] && stav.ulohy[u.id].uzavreno && !stav.ulohy[u.id].prvni);

  // ---------- pomocné ----------

  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // Text úlohy: **tučně**, *kurzíva*, nové řádky, \$ = znak dolaru, $…$ = vzorec (KaTeX)
  function text(t) {
    return esc(t)
      .replace(/\\\$/g, '<span class="dolar">$</span>')
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*\w])\*([^*\n]+?)\*(?!\*)/g, "$1<em>$2</em>")
      .split("\n").map((r) => `<p>${r}</p>`).join("");
  }
  function vzorce(el) {
    if (!window.renderMathInElement) return;
    try {
      window.renderMathInElement(el, { delimiters: [{ left: "$", right: "$", display: false }], throwOnError: false });
    } catch (e) { /* zůstane text */ }
  }
  const datum = (ts) => new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const otazky = (n) => n + (n === 1 ? " question" : " questions");

  // ---------- přehled kol ----------

  function domu() {
    document.title = "Math Practice";
    const prvniNehotove = KOLA.findIndex((k) => !prehledKola(k).hotovo);
    const opak = kOpakovani();
    app.innerHTML = `
      <a class="zpet" href="/rozcestnik/">← Rozcestník</a>
      <h1>Exponentials &amp; Logarithms</h1>
      <p class="lead">Assessment prep in 7 rounds. All rounds are open – pick any one you want to practise.
        Work on paper or with your calculator, and type only the final answer here.</p>
      <ol class="cesta" aria-label="Progress">
        ${KOLA.map((k, i) => `<li class="${prehledKola(k).hotovo ? "hotovo" : i === prvniNehotove ? "ted" : ""}"></li>`).join("")}
      </ol>
      <ul class="kola">
        ${KOLA.map((k, i) => {
          const p = prehledKola(k);
          const odemceno = jeOdemceno(i);
          const trida = p.hotovo ? "hotovo" : odemceno ? (i === prvniNehotove ? "ted" : "") : "zamceno";
          const stavText = p.hotovo
            ? `✓ ${p.spravne}/${p.celkem}${stav.kola[k.id] ? " · " + datum(stav.kola[k.id]) : ""}`
            : !odemceno ? "🔒 locked"
            : p.uzavreno ? `${p.uzavreno}/${p.celkem} done` : "Start →";
          const obsah = `
            <span class="den">day<b>${i + 1}</b></span>
            <span><h2>${esc(k.nazev)}</h2><p>${otazky(k.ulohy.length)} · ${esc(k.popis)}</p></span>
            <span class="stav">${stavText}</span>`;
          return `<li>${odemceno
            ? `<a class="kolo ${trida}" href="#/kolo/${k.id}">${obsah}</a>`
            : `<div class="kolo ${trida}" aria-disabled="true">${obsah}</div>`}</li>`;
        }).join("")}
      </ul>
      ${EXTRA.length ? `<h2 class="sekce">Extra practice</h2>
      <ul class="kola">
        ${EXTRA.map((k) => {
          const p = prehledKola(k);
          const stavText = p.hotovo ? `✓ ${p.spravne}/${p.celkem}` : p.uzavreno ? `${p.uzavreno}/${p.celkem} done` : "Start →";
          return `<li><a class="kolo extra ${p.hotovo ? "hotovo" : ""}" href="#/kolo/${k.id}">
            <span class="den">${esc(k.stitek || "extra")}</span>
            <span><h2>${esc(k.nazev)}</h2><p>${otazky(k.ulohy.length)} · ${esc(k.popis)}</p></span>
            <span class="stav">${stavText}</span></a></li>`;
        }).join("")}
      </ul>` : ""}
      ${opak.length ? `<a class="opakovani" href="#/opakovani"><span>To review: ${otazky(opak.length)} you didn't get right first time</span><span>Practise →</span></a>` : ""}
      <p class="paticka">Your progress is saved in this browser. <button type="button" id="smazat">Start again from scratch</button></p>`;
    app.querySelector("#smazat").addEventListener("click", () => {
      if (confirm("Really delete all your progress and start again from day 1?")) {
        stav = { ulohy: {}, kola: {}, opakovani: {} };
        uloz();
        domu();
      }
    });
  }

  // ---------- kolo ----------

  function zobrazKolo(id) {
    const extra = EXTRA.find((k) => k.id === id);
    if (extra) return zobrazExtra(extra);
    const i = KOLA.findIndex((k) => k.id === id);
    if (i < 0 || !jeOdemceno(i)) { location.hash = ""; return; }
    const kolo = KOLA[i];
    document.title = `Day ${i + 1} · ${kolo.nazev}`;
    vykresliSadu({
      nadpis: kolo.nazev,
      podnadpis: `Day ${i + 1} of ${KOLA.length}`,
      popis: kolo.popis,
      stitky: [kolo.kalkulacka ? "🧮 calculator allowed" : "🚫 no calculator"],
      ulohy: kolo.ulohy,
      sada: stav.ulohy,
      poZmene: () => {
        const p = prehledKola(kolo);
        if (p.hotovo && !stav.kola[kolo.id]) { stav.kola[kolo.id] = Date.now(); uloz(); }
        return p.hotovo ? banner(kolo, i, p) : "";
      },
      ukazPokrok: () => { const p = prehledKola(kolo); return `${p.uzavreno}/${p.celkem} done`; },
    });
  }

  function zobrazExtra(kolo) {
    document.title = kolo.nazev;
    vykresliSadu({
      nadpis: kolo.nazev,
      podnadpis: "Extra practice",
      popis: kolo.popis,
      stitky: [kolo.kalkulacka ? "🧮 calculator allowed" : "🚫 no calculator"],
      ulohy: kolo.ulohy,
      sada: stav.ulohy,
      poZmene: () => {
        const p = prehledKola(kolo);
        if (!p.hotovo) return "";
        if (!stav.kola[kolo.id]) { stav.kola[kolo.id] = Date.now(); uloz(); }
        return `<div class="hotovo-banner"><h2>Set complete 🎉</h2>
          <p>Right first time: ${p.napoprve} of ${p.celkem}. Correct in total: ${p.spravne}.</p>
          <a href="#/">All rounds</a></div>`;
      },
      ukazPokrok: () => { const p = prehledKola(kolo); return `${p.uzavreno}/${p.celkem} done`; },
    });
  }

  function banner(kolo, i, p) {
    const dalsi = KOLA[i + 1];
    return `<div class="hotovo-banner">
      <h2>Round complete 🎉</h2>
      <p>Right first time: ${p.napoprve} of ${p.celkem}. Correct in total: ${p.spravne}.
        ${dalsi ? `Next up: day ${i + 2} – ${esc(dalsi.nazev)}.` : "That was the last round – good luck in the assessment!"}</p>
      ${dalsi ? `<a href="#/kolo/${dalsi.id}">Continue to day ${i + 2} →</a> · ` : ""}<a href="#/">All rounds</a>
    </div>`;
  }

  function zobrazOpakovani() {
    const ulohy = kOpakovani();
    document.title = "Review mistakes";
    vykresliSadu({
      nadpis: "Review mistakes",
      podnadpis: "Questions you didn't get right first time",
      popis: "Try them again. This doesn't change your round scores.",
      stitky: [],
      ulohy,
      sada: stav.opakovani,
      poZmene: () => "",
      ukazPokrok: () => `${ulohy.filter((u) => stav.opakovani[u.id] && stav.opakovani[u.id].ok).length}/${ulohy.length} correct`,
    });
  }

  function vykresliSadu(o) {
    app.innerHTML = `
      <a class="zpet" href="#/">← All rounds</a>
      <p class="navod" style="margin:0 0 2px">${esc(o.podnadpis)}</p>
      <h1>${esc(o.nadpis)}</h1>
      <p class="lead">${esc(o.popis)}</p>
      <div class="info">${o.stitky.map((s) => `<span class="stitek">${s}</span>`).join("")}<span class="stitek ink" id="pokrok">${o.ukazPokrok()}</span></div>
      <div id="ulohy"></div>
      <div id="konec">${o.poZmene()}</div>`;
    const kontejner = app.querySelector("#ulohy");
    let predchoziUvod = null;
    o.ulohy.forEach((u, n) => {
      const el = document.createElement("article");
      kontejner.appendChild(el);
      const ukazUvod = u.uvod && u.uvod !== predchoziUvod;
      predchoziUvod = u.uvod || null;
      vykresliUlohu(el, u, n + 1, o, ukazUvod);
    });
    window.scrollTo(0, 0);
  }

  // ---------- jedna úloha ----------

  function vykresliUlohu(el, u, cislo, o, ukazUvod) {
    const s = stavUlohy(o.sada, u.id);
    const otevrena = !s.uzavreno;
    el.className = "uloha" + (s.ok ? " ok" : s.uzavreno ? " uzavreno-chyba" : "");
    el.id = "u-" + u.id;
    const vysledek = s.ok ? (s.prvni ? "✓ first time" : "✓ correct") : s.uzavreno ? "✗ see the solution" : s.pokusy ? `attempt ${s.pokusy + 1} of ${MAX_POKUSU[u.typ] || 1}` : "";

    el.innerHTML = `
      <header><span class="cislo">${cislo}</span><span class="zdroj">${esc(u.zdroj || "")}</span><span class="vysledek">${vysledek}</span></header>
      ${ukazUvod ? `<div class="uvod">${text(u.uvod)}</div>` : ""}
      <div class="zadani">${text(u.zadani)}</div>
      <div class="odpoved"></div>
      <div class="zpravy"></div>
      <div class="dalsi"></div>`;

    const odp = el.querySelector(".odpoved");
    const zpravy = el.querySelector(".zpravy");
    const dalsi = el.querySelector(".dalsi");

    const ukazReseni = () => {
      dalsi.insertAdjacentHTML("beforeend", `<div class="reseni"><h3>Solution</h3>${text(u.reseni)}${u.graf ? graf(u.graf) : ""}</div>`);
    };
    const ukazNapovedu = () => {
      dalsi.insertAdjacentHTML("afterbegin", `<div class="napoveda"><h3>Hint</h3>${text(u.napoveda)}</div>`);
    };

    const zmena = () => {
      uloz();
      vykresliUlohu(el, u, cislo, o, ukazUvod);
      const pokrok = app.querySelector("#pokrok");
      if (pokrok) pokrok.textContent = o.ukazPokrok();
      const konec = app.querySelector("#konec");
      const pred = konec.innerHTML;
      konec.innerHTML = o.poZmene();
      if (!pred && konec.innerHTML) konec.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    if (u.typ === "sam") {
      // úloha na náčrt / důkaz – Lukáš si ji ohodnotí sám podle řešení
      if (otevrena && !s.ukazano) {
        odp.innerHTML = `<p class="navod">You can't type this one – do it on paper, then compare with the solution.</p>
          <button class="tl" type="button">Done – show the solution</button>`;
        odp.querySelector("button").onclick = () => { s.ukazano = true; uloz(); vykresliUlohu(el, u, cislo, o, ukazUvod); };
      } else {
        ukazReseni();
        if (otevrena) {
          dalsi.insertAdjacentHTML("beforeend", `<div class="sebehodnoceni"><button class="tl ano" type="button">✓ I got it right</button><button class="tl ne" type="button">✗ I made a mistake</button></div>`);
          dalsi.querySelector(".ano").onclick = () => { Object.assign(s, { ok: true, uzavreno: true, prvni: true, pokusy: 1 }); zmena(); };
          dalsi.querySelector(".ne").onclick = () => { Object.assign(s, { ok: false, uzavreno: true, prvni: false, pokusy: 1 }); zmena(); };
        }
      }
      vzorce(el);
      return;
    }

    if (u.typ === "vyber") {
      odp.innerHTML = `<div class="moznosti">${u.moznosti.map((m, i) => `<button type="button" data-i="${i}">${text(m)}</button>`).join("")}</div>`;
      odp.querySelectorAll("button").forEach((b) => {
        const i = Number(b.dataset.i);
        if ((s.spatne || []).includes(i)) b.classList.add("spatne");
        if (s.uzavreno && i === u.odpoved) b.classList.add("spravne");
        b.disabled = !otevrena || (s.spatne || []).includes(i);
        b.onclick = () => {
          const r = K.zkontroluj(u, i);
          zaznamenej(s, u, r.ok);
          if (!r.ok) s.spatne = (s.spatne || []).concat(i);
          zmena();
        };
      });
    } else {
      const navody = {
        cislo: "A number – exact (3/7, 2√3, ln(2)/3, e^4) or rounded to 3 significant figures.",
        mnozina: "Separate all solutions with semicolons, e.g. 2; −3. If there is only one, write just one.",
        vyraz: `An expression in ${(u.promenne || ["x"]).join(", ")}. Type a log with a base as log_3(x).`,
      };
      if (u.desetinnaMista === 0) navody.cislo = "A whole number (round to the nearest whole number).";
      odp.innerHTML = `
        <p class="navod">${navody[u.typ]}</p>
        <form class="radek" autocomplete="off">
          <input type="text" inputmode="text" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done"
            aria-label="Answer" value="${esc(s.odpoved || "")}" ${otevrena ? "" : "disabled"}>
          <button class="tl" type="submit" ${otevrena ? "" : "disabled"}>Check</button>
        </form>
        ${otevrena ? `<div class="klavesy">${klavesy(u).map((k) => `<button type="button" data-vlozit="${esc(k[1])}" aria-label="${esc(k[0])}">${esc(k[0])}</button>`).join("")}</div>` : ""}
        <div class="nahled"></div>`;
      const input = odp.querySelector("input");
      const nahled = odp.querySelector(".nahled");
      const obnovNahled = () => {
        const n = K.nahled(u, input.value);
        if (n.chyba) nahled.innerHTML = `<span class="chyba">${esc(n.chyba)}</span>`;
        else if (n.latex) {
          nahled.innerHTML = "I read this as: <span></span>";
          try { window.katex.render(n.latex, nahled.querySelector("span"), { throwOnError: false }); }
          catch (e) { nahled.querySelector("span").textContent = input.value; }
        } else nahled.innerHTML = "";
      };
      input.addEventListener("input", obnovNahled);
      obnovNahled();
      odp.querySelectorAll(".klavesy button").forEach((b) => {
        b.onclick = () => {
          const v = b.dataset.vlozit;
          const a = input.selectionStart ?? input.value.length, z = input.selectionEnd ?? a;
          input.value = input.value.slice(0, a) + v + input.value.slice(z);
          const kurzor = a + (v.endsWith("()") ? v.length - 1 : v.length);
          input.focus();
          input.setSelectionRange(kurzor, kurzor);
          obnovNahled();
        };
      });
      odp.querySelector("form").onsubmit = (ev) => {
        ev.preventDefault();
        if (!input.value.trim()) return;
        const r = K.zkontroluj(u, input.value);
        s.odpoved = input.value;
        if (r.chybaVstupu) {
          // chyba v zápisu se nepočítá jako pokus
          zpravy.innerHTML = `<p class="zprava skoro">${esc(r.zprava)}</p>`;
          return;
        }
        zaznamenej(s, u, r.ok);
        s.posledni = r.ok ? (r.zprava || "Correct!") : r.zprava || "That's not right.";
        s.skoro = !!r.skoro;
        zmena();
      };
    }

    // zprávy po pokusu
    if (s.posledni && (s.pokusy || s.uzavreno)) {
      const trida = s.ok ? "ok" : s.skoro ? "skoro" : "no";
      let t = s.posledni;
      if (!s.ok && !s.uzavreno) {
        const zbyva = (MAX_POKUSU[u.typ] || 1) - s.pokusy;
        t += ` Try again (${zbyva === 1 ? "last attempt" : zbyva + " attempts left"}).`;
      }
      if (!s.ok && s.uzavreno) t = s.pokusy ? "Not this time – go through the solution below." : "Solution shown – go through it and make sure you understand each step.";
      zpravy.innerHTML = `<p class="zprava ${trida}">${esc(t)}</p>`;
    }

    if (otevrena) {
      const tl = [];
      if (u.napoveda) tl.push(`<button class="tl vedlejsi male" type="button" data-a="napoveda">💡 Hint</button>`);
      tl.push(`<button class="tl vedlejsi male" type="button" data-a="vzdat">Show solution</button>`);
      dalsi.innerHTML = `<div class="akce">${tl.join("")}</div>`;
      const bN = dalsi.querySelector('[data-a="napoveda"]');
      if (bN) bN.onclick = () => { bN.remove(); ukazNapovedu(); vzorce(dalsi); };
      dalsi.querySelector('[data-a="vzdat"]').onclick = () => {
        if (!confirm("Show the solution? The question will be marked as not solved.")) return;
        Object.assign(s, { uzavreno: true, ok: false, prvni: s.prvni === null ? false : s.prvni, posledni: "Solution shown." });
        zmena();
      };
    } else {
      ukazReseni();
    }
    vzorce(el);
  }

  function zaznamenej(s, u, ok) {
    s.pokusy++;
    if (s.prvni === null) s.prvni = ok;
    if (ok) { s.ok = true; s.uzavreno = true; }
    else if (s.pokusy >= (MAX_POKUSU[u.typ] || 1)) s.uzavreno = true;
  }

  // Tlačítka nad klávesnicí – to, co se na iPadu špatně hledá
  function klavesy(u) {
    const zaklad = [["^", "^"], ["√", "sqrt()"], ["(", "("], [")", ")"], ["/", "/"], ["−", "-"]];
    const log = [["ln", "ln()"], ["log", "log()"], ["logₐ", "log_"], ["e", "e"]];
    if (u.typ === "vyraz") return (u.promenne || ["x"]).map((v) => [v, v]).concat(zaklad, log);
    if (u.typ === "mnozina") return [[";", "; "]].concat(zaklad, log);
    return zaklad.concat(log, [["π", "π"]]);
  }

  // ---------- graf v řešení (SVG) ----------

  function graf(g) {
    const W = 360, H = 270, P = 22;
    const [x0, x1] = g.x, [y0, y1] = g.y;
    const sx = (x) => P + ((x - x0) / (x1 - x0)) * (W - 2 * P);
    const sy = (y) => H - P - ((y - y0) / (y1 - y0)) * (H - 2 * P);
    const krok = (x1 - x0) > 12 ? 2 : 1;
    let s = `<svg class="graf" viewBox="0 0 ${W} ${H}" role="img" aria-label="Graph">`;
    for (let x = Math.ceil(x0); x <= x1; x += 1) s += `<line x1="${sx(x)}" x2="${sx(x)}" y1="${sy(y0)}" y2="${sy(y1)}" stroke="var(--graf-grid)"/>`;
    for (let y = Math.ceil(y0); y <= y1; y += 1) s += `<line x1="${sx(x0)}" x2="${sx(x1)}" y1="${sy(y)}" y2="${sy(y)}" stroke="var(--graf-grid)"/>`;
    s += `<line x1="${sx(x0)}" x2="${sx(x1)}" y1="${sy(0)}" y2="${sy(0)}" stroke="var(--graf-osa)" stroke-width="1.3"/>`;
    s += `<line x1="${sx(0)}" x2="${sx(0)}" y1="${sy(y0)}" y2="${sy(y1)}" stroke="var(--graf-osa)" stroke-width="1.3"/>`;
    for (let x = Math.ceil(x0 / krok) * krok; x <= x1; x += krok) if (x) s += `<text x="${sx(x)}" y="${sy(0) + 13}" text-anchor="middle">${x}</text>`;
    for (let y = Math.ceil(y0 / krok) * krok; y <= y1; y += krok) if (y) s += `<text x="${sx(0) - 5}" y="${sy(y) + 4}" text-anchor="end">${y}</text>`;
    (g.asymptoty?.x || []).forEach((a) => { s += `<line x1="${sx(a)}" x2="${sx(a)}" y1="${sy(y0)}" y2="${sy(y1)}" stroke="var(--no)" stroke-dasharray="6 5" stroke-width="1.4"/>`; });
    (g.asymptoty?.y || []).forEach((a) => { s += `<line x1="${sx(x0)}" x2="${sx(x1)}" y1="${sy(a)}" y2="${sy(a)}" stroke="var(--no)" stroke-dasharray="6 5" stroke-width="1.4"/>`; });
    const barvy = ["var(--graf-1)", "var(--graf-2)", "var(--graf-osa)"];
    let legenda = "";
    let b = 0;
    g.krivky.forEach((k) => {
      const barva = k.carkovane ? "var(--graf-osa)" : barvy[b++ % 2];
      const ast = K.parsuj(k.f);
      let d = "", kreslim = false;
      const N = 500;
      for (let i = 0; i <= N; i++) {
        const x = x0 + ((x1 - x0) * i) / N;
        let y;
        try { y = K.vyhodnot(ast, { x }); } catch (e) { y = NaN; }
        if (!isFinite(y) || y < y0 - (y1 - y0) || y > y1 + (y1 - y0)) { kreslim = false; continue; }
        d += (kreslim ? "L" : "M") + sx(x).toFixed(1) + " " + sy(y).toFixed(1);
        kreslim = true;
      }
      s += `<path d="${d}" fill="none" stroke="${barva}" stroke-width="${k.carkovane ? 1.3 : 2.4}" ${k.carkovane ? 'stroke-dasharray="4 4"' : ""}/>`;
      legenda += `<span style="--c:${barva}">${esc(k.popis || k.f)}</span>`;
    });
    (g.body || []).forEach(([x, y, popis]) => {
      s += `<circle cx="${sx(x)}" cy="${sy(y)}" r="4" fill="var(--text)"/><text x="${sx(x) + 7}" y="${sy(y) - 7}" style="fill:var(--text)">${esc(popis)}</text>`;
    });
    s += `<clipPath id="c"><rect x="${P}" y="${P}" width="${W - 2 * P}" height="${H - 2 * P}"/></clipPath></svg>`;
    return s.replace(/<path /g, '<path clip-path="url(#c)" ') + `<div class="legenda">${legenda}</div>`;
  }

  // ---------- směrování ----------

  function trasa() {
    const h = location.hash;
    const m = /^#\/kolo\/([\w-]+)/.exec(h);
    if (m) zobrazKolo(m[1]);
    else if (h === "#/opakovani") zobrazOpakovani();
    else domu();
  }
  window.addEventListener("hashchange", trasa);
  if (!K || !VSECHNA.length) app.innerHTML = "<p>Could not load the questions.</p>";
  else trasa();
})();
