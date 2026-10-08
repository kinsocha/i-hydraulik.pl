#!/usr/bin/env node
// System linkowania wewnetrznego i-hydraulik.pl (od 08.10.2026)
// Uzycie (z katalogu projektu):
//   node tools/linkowanie/linkowanie.cjs status             – raport: brakujace linki w artykulach, nowe strony/artykuly, czekajace na podstrone
//   node tools/linkowanie/linkowanie.cjs sasiedzi [--zapisz] – 3 najblizsze dzielnice z podstrona dla kazdego miejsca (bez osiedli i miast); --zapisz = dane/sasiedzi.json
//   node tools/linkowanie/linkowanie.cjs artykuly [--zapisz] – nowe artykuly do rejestru dane/artykuly.json (miejsce DO POTWIERDZENIA)
//   node tools/linkowanie/linkowanie.cjs kafle [--apply]     – wstawia/odswieza <ZleceniaZPoradnika slugi={[...]} /> na podstronach dzielnic
// Bez --apply / --zapisz nic nie jest zmieniane.
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "../..");
const DANE = (f) => path.join(__dirname, "dane", f);
const J = (f) => JSON.parse(fs.readFileSync(DANE(f), "utf8"));
const zapiszJ = (f, o) => fs.writeFileSync(DANE(f), JSON.stringify(o, null, 2) + "\n");
const PAGES = path.join(ROOT, "src/pages"), ART = path.join(ROOT, "src/content/poradnik");
const cmd = process.argv[2] || "status";
const APPLY = process.argv.includes("--apply") || process.argv.includes("--zapisz");

const miejsca = J("miejsca.json"), strony = J("strony.json");
const sasiedzi = fs.existsSync(DANE("sasiedzi.json")) ? J("sasiedzi.json") : {};
const artykuly = fs.existsSync(DANE("artykuly.json")) ? J("artykuly.json") : {};

const KOMPONENT = "ZleceniaZPoradnika";
const IMPORT = `import ${KOMPONENT} from "../components/${KOMPONENT}.astro";`;
const ILE_KAFLI = 2;

// ---------- pliki ----------
const czytaj = (f) => fs.readFileSync(f, "utf8");
// zapis z zachowaniem koncow linii oryginalu (hydraulikzoliborz.astro ma CRLF)
function zapisz(f, tekstLF, oryginal) {
  const crlf = /\r\n/.test(oryginal);
  fs.writeFileSync(f, crlf ? tekstLF.replace(/\r?\n/g, "\r\n") : tekstLF);
}
const doLF = (s) => s.replace(/\r\n/g, "\n");

const listaArtykulow = () => fs.readdirSync(ART).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""));
const listaStronDzielnic = () => fs.readdirSync(PAGES).filter((f) => /^hydraulik[a-z]+\.astro$/.test(f)).map((f) => f.replace(".astro", ""));

function czytajArtykul(slug) {
  const s = doLF(czytaj(path.join(ART, slug + ".md")));
  const koniecFm = s.indexOf("\n---", 4);
  const fm = s.slice(0, koniecFm), body = s.slice(koniecFm + 4);
  const pole = (k) => { const m = fm.match(new RegExp("^" + k + ":[ \\t]*(.*)$", "m")); return m ? m[1].replace(/^"|"$/g, "").trim() : ""; };
  const pubDate = new Date(pole("pubDate"));
  const linki = [...body.matchAll(/\]\(\/(hydraulik[a-z]+)\)|href="\/(hydraulik[a-z]+)"/g)].map((m) => m[1] || m[2]);
  return { slug, title: pole("title"), desc: pole("description"), lead: pole("heroLead"), pubDate, body, linki };
}

// ---------- miejsca ----------
const WZORCE = {
  "Anin": "Anin\\p{L}*", "Białołęka": "Białoł\\p{L}*", "Bielany": "Bielan\\p{L}*", "Mokotów": "Mokot\\p{L}*", "Rembertów": "Rembert\\p{L}*",
  "Targówek": "Targ[óo]w\\p{L}*", "Ursynów": "Ursyn\\p{L}*", "Wawer": "Waw(er|r)\\p{L}*", "Wola": "Wol[iaąę]", "Żoliborz": "Żolibor\\p{L}*",
  "Bródno": "Bródn\\p{L}*", "Praga Północ": "Pra(ga|dze|gi|gę)", "Saska Kępa": "Sask\\p{L}* Kęp\\p{L}*", "Wesoła": "Wesoł\\p{L}*",
  "Stara Miłosna": "Star\\p{L}* Miłos\\p{L}*", "Marki": "Mark(i|ach|ami|om)|Marek",
};
const RE = Object.fromEntries(Object.entries(WZORCE).map(([k, v]) => [k, new RegExp("(?<!\\p{L})(" + v + ")(?!\\p{L})", "u")]));
const znajdzMiejsca = (txt) => Object.keys(RE).filter((m) => RE[m].test(txt));
const ZASIEG = /dojeżdżam|dojeżdżamy|przyjeżdżam|wykonuję|naprawiam|wymieniam|pracuję|w całej warszawie|całego miasta|okolic/iu;
function rozpoznajMiejsce(a) {
  const wNaglowku = znajdzMiejsca([a.title, a.desc, a.lead].join(" "));
  if (wNaglowku.length) return { miejsce: wNaglowku[0], zrodlo: "tytuł/opis/lead" };
  const akapity = a.body.split(/\n\n/).filter((p) => p.trim() && !/^(#|!\[|<)/.test(p.trim()));
  for (const p of akapity.slice(0, Math.ceil(akapity.length / 2))) {
    if (ZASIEG.test(p)) continue; // zdania o zasiegu to nie miejsce zlecenia
    const m = znajdzMiejsca(p);
    if (m.length) return { miejsce: m[0], zrodlo: "treść: „" + p.replace(/\s+/g, " ").slice(0, 80) + "…”" };
  }
  return { miejsce: null, zrodlo: "brak miejsca (poradnik ogólny)" };
}

const km = (a, b) => { const r = Math.PI / 180, dl = (b.lon - a.lon) * r * Math.cos(((a.lat + b.lat) / 2) * r), dp = (b.lat - a.lat) * r; return 6371 * Math.sqrt(dl * dl + dp * dp); };
const stronaMiejsca = (m) => Object.keys(strony).find((s) => strony[s].miejsce === m) || null;
// 3 najblizsze DZIELNICE z podstrona (bez osiedli i miast – polecenie wlasciciela 08.10.2026); miasto dostaje tylko miasta
function najblizsze(miejsce, n = 3) {
  const m = miejsca[miejsce]; if (!m) return [];
  const typCelu = m.typ === "miasto" ? "miasto" : "dzielnica";
  return Object.entries(strony)
    .filter(([, s]) => s.miejsce !== miejsce && miejsca[s.miejsce] && miejsca[s.miejsce].typ === typCelu)
    .map(([slug, s]) => [slug, km(m, miejsca[s.miejsce])]).sort((a, b) => a[1] - b[1]).slice(0, n);
}

// ---------- dobor kafli ----------
function doborKafli() {
  const teraz = new Date();
  const arts = {};
  for (const slug of listaArtykulow()) {
    const a = czytajArtykul(slug);
    if (!(a.pubDate <= teraz)) continue; // artykul z przyszla data sie nie zbuduje
    const r = artykuly[slug] || {};
    arts[slug] = { slug, miejsce: r.potwierdzone ? r.miejsce : null, links: 0 };
  }
  const problemy = [];
  const lista = Object.entries(strony).map(([slug, s]) => ({ slug, miejsce: s.miejsce, wybrane: [] }));
  const uzyj = (pg, a) => { pg.wybrane.push(a.slug); a.links++; };
  // 1. reczny przydzial z strony.json (kafle)
  for (const pg of lista) for (const s of strony[pg.slug].kafle || []) {
    if (!arts[s]) { problemy.push(pg.slug + ": kafel " + s + " nie istnieje albo ma pubDate w przyszłości"); continue; }
    if (pg.wybrane.length < ILE_KAFLI) uzyj(pg, arts[s]);
  }
  // 2. artykuly z miejsca tej podstrony, najmniej linkowane najpierw
  for (const pg of lista) {
    const c = Object.values(arts).filter((a) => a.miejsce === pg.miejsce && !pg.wybrane.includes(a.slug)).sort((x, y) => x.links - y.links);
    for (const a of c) { if (pg.wybrane.length >= ILE_KAFLI) break; uzyj(pg, a); }
  }
  // 3. wyrownanie: artykuly z najmniejsza liczba linkow
  for (const pg of lista) while (pg.wybrane.length < ILE_KAFLI) {
    const c = Object.values(arts).filter((a) => !pg.wybrane.includes(a.slug)).sort((x, y) => x.links - y.links || x.slug.localeCompare(y.slug))[0];
    if (!c) break; uzyj(pg, c);
  }
  return { arts, lista, problemy };
}

// wstawia/odswieza znacznik; zwraca nowy tekst albo rzuca blad (nigdy nie wycina tresci)
function wstawKafle(srcLF, slugi) {
  const tag = `<${KOMPONENT} slugi={${JSON.stringify(slugi)}} />`;
  let s = srcLF;
  const wystapienia = s.split("<" + KOMPONENT).length - 1;
  if (wystapienia > 1) throw new Error("więcej niż jeden znacznik " + KOMPONENT);
  if (wystapienia === 1) {
    // tylko pelny, samozamykajacy sie znacznik w jednej linii; inaczej stop
    const re = new RegExp("<" + KOMPONENT + " slugi=\\{\\[[^\\]\\n]*\\]\\} />");
    if (!re.test(s)) throw new Error("znacznik " + KOMPONENT + " ma nieoczekiwaną postać – popraw ręcznie, nic nie zmieniam");
    s = s.replace(re, () => tag);
  } else {
    const i = s.indexOf('<section id="obszar"');
    if (i < 0) throw new Error("brak sekcji #obszar");
    const j = s.indexOf("</section>", i);
    if (j < 0) throw new Error("sekcja #obszar bez </section>");
    const k = j + "</section>".length;
    s = s.slice(0, k) + "\n\n      " + tag + s.slice(k);
  }
  if (!s.includes(IMPORT)) {
    if (s.startsWith("---\n")) s = s.replace("---\n", "---\n" + IMPORT + "\n");
    else s = "---\n" + IMPORT + "\n---\n" + s;
  }
  return s;
}

// ---------- komendy ----------
if (cmd === "artykuly") {
  let nowe = 0;
  for (const slug of listaArtykulow()) {
    if (artykuly[slug]) continue;
    const r = rozpoznajMiejsce(czytajArtykul(slug)); nowe++;
    artykuly[slug] = { miejsce: r.miejsce, zrodlo: r.zrodlo, potwierdzone: false };
    console.log("NOWY: " + slug + " | miejsce: " + (r.miejsce || "—") + " | " + r.zrodlo);
  }
  if (APPLY && nowe) { zapiszJ("artykuly.json", artykuly); console.log("zapisano " + nowe + " wpisów (potwierdzone: false – sprawdź miejsce i ustaw true)"); }
  else console.log(nowe + " nowych artykułów" + (nowe ? "; użyj --zapisz" : ""));
  process.exit(0);
}

if (cmd === "sasiedzi") {
  const wynik = {};
  for (const m of Object.keys(miejsca)) {
    const n = najblizsze(m); wynik[m] = n.map(([s]) => s);
    const zm = JSON.stringify(sasiedzi[m] || []) !== JSON.stringify(wynik[m]);
    console.log((zm ? "* " : "  ") + m.padEnd(15) + n.map(([s, d]) => s + " (" + d.toFixed(1) + " km)").join(", ") + (zm ? "   [w rejestrze: " + (sasiedzi[m] || []).join(", ") + "]" : ""));
  }
  if (APPLY) { zapiszJ("sasiedzi.json", wynik); console.log("zapisano dane/sasiedzi.json"); }
  else console.log("* = różni się od dane/sasiedzi.json; --zapisz nadpisuje rejestr (po zmianie popraw zdania w artykułach ręcznie)");
  process.exit(0);
}

if (cmd === "kafle") {
  const { lista, problemy, arts } = doborKafli(); problemy.forEach((p) => console.log("UWAGA: " + p));
  let n = 0;
  for (const pg of lista) {
    const file = path.join(PAGES, pg.slug + ".astro"); if (!fs.existsSync(file)) { console.log("BRAK PLIKU " + pg.slug); continue; }
    const oryg = czytaj(file);
    let nowy;
    try { nowy = wstawKafle(doLF(oryg), pg.wybrane); } catch (e) { console.log("POMIJAM " + pg.slug + ": " + e.message); continue; }
    if (nowy !== doLF(oryg)) { n++; console.log((APPLY ? "ZAPISUJĘ " : "ZMIENIŁBYM ") + pg.slug + " -> " + pg.wybrane.join(", ")); if (APPLY) zapisz(file, nowy, oryg); }
    else console.log("bez zmian " + pg.slug + " -> " + pg.wybrane.join(", "));
  }
  const rozklad = {}; Object.values(arts).forEach((a) => (rozklad[a.links] = (rozklad[a.links] || 0) + 1));
  console.log("kafli na artykuł: " + Object.entries(rozklad).map(([k, v]) => k + " → " + v + " art.").join(" | "));
  console.log("bez kafla: " + (Object.values(arts).filter((a) => !a.links).map((a) => a.slug).join(", ") || "brak"));
  console.log(APPLY ? "zapisano " + n + " stron (sprawdź git diff --stat)" : n + " stron do zmiany; użyj --apply");
  process.exit(0);
}

// ---------- status ----------
const H = (t) => console.log("\n=== " + t);
H("PODSTRONY DZIELNIC SPOZA dane/strony.json (dopisz: miejsce, anchor odmieniony)");
const noweStr = listaStronDzielnic().filter((s) => !strony[s]); console.log("  " + (noweStr.join(", ") || "brak"));
H("PODSTRONY Z REJESTRU, KTÓRYCH NIE MA NA DYSKU");
const brak = Object.keys(strony).filter((s) => !fs.existsSync(path.join(PAGES, s + ".astro"))); console.log("  " + (brak.join(", ") || "brak"));

H("NOWE ARTYKUŁY SPOZA REJESTRU (artykuly --zapisz, potem potwierdź miejsce)");
const noweArt = listaArtykulow().filter((s) => !artykuly[s]);
noweArt.forEach((s) => { const r = rozpoznajMiejsce(czytajArtykul(s)); console.log("  " + s + " | " + (r.miejsce || "—") + " | " + r.zrodlo); });
if (!noweArt.length) console.log("  brak");
H("ARTYKUŁY Z MIEJSCEM DO POTWIERDZENIA");
const doPotw = Object.entries(artykuly).filter(([, a]) => !a.potwierdzone); doPotw.forEach(([s, a]) => console.log("  " + s + " | " + (a.miejsce || "—"))); if (!doPotw.length) console.log("  brak");

H("BRAKUJĄCE LINKI W ARTYKUŁACH (link do dzielnicy zlecenia + 3 najbliższe z dane/sasiedzi.json)");
let braki = 0;
for (const [slug, r] of Object.entries(artykuly)) {
  if (!r.potwierdzone || !r.miejsce || !fs.existsSync(path.join(ART, slug + ".md"))) continue;
  const a = czytajArtykul(slug), wlasna = stronaMiejsca(r.miejsce);
  const potrzebne = [...(wlasna ? [wlasna] : []), ...(sasiedzi[r.miejsce] || [])];
  const nie = potrzebne.filter((p) => !a.linki.includes(p));
  const obce = a.linki.filter((l) => strony[l] && miejsca[strony[l].miejsce] && miejsca[strony[l].miejsce].typ === "osiedle" && l !== wlasna);
  if (nie.length || obce.length) { braki++; console.log("  " + slug + " (" + r.miejsce + ")" + (nie.length ? " brak: " + nie.join(", ") : "") + (obce.length ? " | link do osiedla jako sąsiada: " + obce.join(", ") : "")); }
}
if (!braki) console.log("  brak");

H("ARTYKUŁY CZEKAJĄCE NA PODSTRONĘ (jest miejsce zlecenia, nie ma podstrony)");
const czeka = {};
for (const [s, a] of Object.entries(artykuly)) if (a.potwierdzone && a.miejsce && !stronaMiejsca(a.miejsce)) (czeka[a.miejsce] = czeka[a.miejsce] || []).push(s);
Object.entries(czeka).forEach(([m, v]) => console.log("  gdy powstanie strona „" + m + "”: link w " + v.join(", ") + " + kafle"));
if (!Object.keys(czeka).length) console.log("  brak");

H("KAFLE PORADNIKA RÓŻNE OD WYLICZONYCH (kafle --apply)");
const { lista } = doborKafli(); let dk = 0;
for (const pg of lista) {
  const f = path.join(PAGES, pg.slug + ".astro"); if (!fs.existsSync(f)) continue;
  const m = czytaj(f).match(new RegExp("<" + KOMPONENT + " slugi=\\{(\\[[^\\]\\n]*\\])\\} />"));
  const naStronie = m ? JSON.parse(m[1]) : null;
  if (!naStronie || naStronie.join() !== pg.wybrane.join()) { dk++; console.log("  " + pg.slug + ": na stronie " + (naStronie ? naStronie.join(", ") : "brak sekcji") + " | wyliczone " + pg.wybrane.join(", ")); }
}
if (!dk) console.log("  brak");
