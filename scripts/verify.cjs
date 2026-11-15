#!/usr/bin/env node
// animatefa.st Lite render check. Usage: node verify.cjs <url|file.html> [--shots outDir] [--json]
// Loads the page in headless Chrome, scrolls through it, and checks every [data-motion] element:
//  1) the runtime prepared it (data-motion-ready), 2) it actually moved (opacity/transform changed while playing),
//  3) it ends fully visible with its original text, 4) console has no errors or warnings,
//  5) with prefers-reduced-motion it is visible at once and is not split.
// Exit 0 = pass, 1 = fail, 2 = could not run. Needs npm install in the skill folder (puppeteer-core) and a local Chrome/Chromium (auto-detected on macOS/Linux, or CHROME env).
const path = require("path"), fs = require("fs");
const args = process.argv.slice(2), opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const target = args.find((a, i) => !a.startsWith("--") && !["--shots"].includes(args[i - 1]));
if (!target) { console.error("usage: node verify.cjs <url|file.html> [--shots dir] [--json]"); process.exit(2); }
const url = /^https?:|^file:/.test(target) ? target : "file://" + path.resolve(target);
const shots = opt("--shots");
const CHROME_PATHS = [process.env.CHROME, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium", "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
const exe = CHROME_PATHS.find(p => p && require("fs").existsSync(p));
const P = (() => { for (const m of ["puppeteer-core", "puppeteer", process.env.PUPPETEER_CORE, "/tmp/pt/node_modules/puppeteer-core"]) { if (!m) continue; try { return require(m); } catch (e) {} } console.error("could not run: run npm install in the skill folder (installs puppeteer-core)"); process.exit(2); })();
if (!exe && !P.executablePath) { console.error("could not run: no Chrome found, set CHROME=/path/to/chrome"); process.exit(2); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

const PROBE = () => {
  // samples min opacity and any non-identity transform on each animated element and its split children
  window.__ms = [];
  const els = () => [].slice.call(document.querySelectorAll("[data-motion]"));
  const tick = () => {
    els().forEach((el, i) => {
      const rec = window.__ms[i] || (window.__ms[i] = { slug: el.getAttribute("data-motion"), minOp: 1, moved: false, text0: null });
      if (rec.text0 === null) rec.text0 = el.textContent.replace(/\s+/g, " ").trim();
      const nodes = [el].concat([].slice.call(el.querySelectorAll("span")).slice(0, 6));
      nodes.forEach(n => {
        const cs = getComputedStyle(n), op = parseFloat(cs.opacity);
        if (op < rec.minOp) rec.minOp = op;
        if (cs.transform && cs.transform !== "none" && !/^matrix\(1, 0, 0, 1, 0, 0\)$/.test(cs.transform)) rec.moved = true;
        if (cs.filter && cs.filter !== "none") rec.moved = true;
      });
    });
    requestAnimationFrame(tick);
  };
  document.addEventListener("DOMContentLoaded", () => requestAnimationFrame(tick));
};

(async () => {
  const b = await P.launch({ headless: "new", args: ["--no-sandbox"], ...(exe ? { executablePath: exe } : {}) });
  const res = { url, console: [], elements: [], reduced: null, pass: false };
  const pg = await b.newPage();
  pg.on("console", m => { if (["error", "warn", "warning"].includes(m.type())) res.console.push(m.type() + ": " + m.text()); });
  pg.on("pageerror", e => res.console.push("pageerror: " + e.message));
  await pg.setViewport({ width: 1280, height: 800 });
  await pg.evaluateOnNewDocument(PROBE);
  await pg.goto(url, { waitUntil: "networkidle0", timeout: 45000 });
  await sleep(450);
  if (shots) { fs.mkdirSync(shots, { recursive: true }); await pg.screenshot({ path: path.join(shots, "mid.png") }); }
  const H = await pg.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= H; y += 250) { await pg.evaluate(y => scrollTo(0, y), y); await sleep(160); }
  await sleep(3200);
  res.elements = await pg.evaluate(() => [].slice.call(document.querySelectorAll("[data-motion]")).map((el, i) => {
    const r = window.__ms[i] || {}, cs = getComputedStyle(el);
    // split letters/words carry aria-hidden, so count them too; only skip the typewriter cursor "|"
    const hiddenKids = [].slice.call(el.querySelectorAll("*")).filter(k => k.textContent.trim() !== "|" && parseFloat(getComputedStyle(k).opacity) < 0.99).length;
    const text = el.textContent.replace(/\|/g, "").replace(/\s+/g, " ").trim();
    return { slug: el.getAttribute("data-motion"), tag: el.tagName.toLowerCase(), ready: el.hasAttribute("data-motion-ready"),
      animated: (r.minOp !== undefined && r.minOp < 0.95) || !!r.moved, endVisible: cs.visibility === "visible" && parseFloat(cs.opacity) > 0.99 && hiddenKids === 0,
      textIntact: !r.text0 || text === r.text0.replace(/\|/g, "").trim() };
  }));
  if (shots) { await pg.evaluate(() => scrollTo(0, 0)); await sleep(200); await pg.screenshot({ path: path.join(shots, "final.png"), fullPage: true }); }
  // reduced motion pass
  const rp = await b.newPage();
  await rp.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await rp.goto(url, { waitUntil: "networkidle0", timeout: 45000 }); await sleep(300);
  res.reduced = await rp.evaluate(() => { const els = [].slice.call(document.querySelectorAll("[data-motion]"));
    return { allVisible: els.every(el => getComputedStyle(el).visibility === "visible" && parseFloat(getComputedStyle(el).opacity) > 0.99), noSplit: els.every(el => !el.querySelector("[aria-hidden='true'] , span span, div[style*='inline-block']")) }; });
  await b.close();
  const bad = res.elements.filter(e => !(e.ready && e.animated && e.endVisible && e.textIntact));
  res.pass = res.elements.length > 0 && !bad.length && !res.console.length && res.reduced.allVisible && res.reduced.noSplit;
  if (args.includes("--json")) console.log(JSON.stringify(res, null, 1));
  else {
    console.log(url);
    res.elements.forEach(e => console.log(`${e.ready && e.animated && e.endVisible && e.textIntact ? "ok  " : "FAIL"} ${e.tag} ${e.slug}  ready=${e.ready} animated=${e.animated} endVisible=${e.endVisible} textIntact=${e.textIntact}`));
    console.log("console: " + (res.console.length ? res.console.join(" | ") : "clean"));
    console.log(`reduced motion: visible=${res.reduced.allVisible} notSplit=${res.reduced.noSplit}`);
    console.log(res.pass ? "PASS" : "FAIL");
  }
  process.exit(res.pass ? 0 : 1);
})().catch(e => { console.error("could not run: " + e.message); process.exit(2); });
