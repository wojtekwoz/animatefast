// Requirements: the browser tests need a local Chrome/Chromium (auto-detected, or CHROME env) and
// network access to jsDelivr for GSAP 3.15.1. Without Chrome they are skipped, not failed.
// Shared helpers for the headless browser tests: Chrome detection (same list as scripts/verify.cjs),
// fixture pages that load the LOCAL dist/animatefast-lite.min.js, and an in-page state probe.
const path = require("path"), fs = require("fs"), os = require("os");
const P = require("puppeteer-core");

const ROOT = path.resolve(__dirname, "..");
// ANIMATEFAST_RUNTIME=/path/to/other.min.js runs the suite against another build (e.g. an older release)
const RUNTIME = process.env.ANIMATEFAST_RUNTIME ? path.resolve(process.env.ANIMATEFAST_RUNTIME) : path.join(ROOT, "dist/animatefast-lite.min.js");
// keep in sync with CHROME_PATHS in scripts/verify.cjs (CHROME env first)
const CHROME_PATHS = [process.env.CHROME, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium", "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
const exe = CHROME_PATHS.find(p => p && fs.existsSync(p));
// pass as test options: test(name, { skip: NO_CHROME }, fn)
const NO_CHROME = exe ? false : "no Chrome found, set CHROME=/path/to/chrome";

const sleep = ms => new Promise(r => setTimeout(r, ms));
const launch = () => P.launch({ headless: "new", args: ["--no-sandbox"], executablePath: exe });

// head block from references/SPEC.md section 1, with the runtime pointing at the local build
const HEAD = `<style>.js [data-motion]:not([data-motion-ready]){visibility:hidden}.ms-reveal [data-motion]{visibility:visible!important}@media (prefers-reduced-motion:reduce){[data-motion]{visibility:visible!important}}</style>
<script>document.documentElement.className+=" js";setTimeout(function(){document.documentElement.className+=" ms-reveal"},3000)</script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/gsap.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/ScrollTrigger.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/SplitText.min.js" defer></script>
<script src="${"file://" + RUNTIME}" defer></script>`;

function page(body, css = "") {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>animatefast test</title>
<style>*{box-sizing:border-box}html,body{margin:0;padding:0}body{font:18px/1.4 system-ui,sans-serif}h1,h2,p{margin:0}${css}</style>
${HEAD}
</head><body>${body}</body></html>`;
}

// writes fixtures to a fresh temp dir; returns { file(name, html) -> file path, cleanup() }
function fixtures() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "animatefast-test-"));
  return {
    dir,
    file(name, html) { const f = path.join(dir, name); fs.writeFileSync(f, html); return f; },
    cleanup() { fs.rmSync(dir, { recursive: true, force: true }); }
  };
}

// per [data-motion] element: ready flag, own opacity, visibility, hidden split children, span count
const STATE = () => [].slice.call(document.querySelectorAll("[data-motion]")).map(el => {
  const cs = getComputedStyle(el);
  const hiddenKids = [].slice.call(el.querySelectorAll("*")).filter(k => k.textContent.trim() !== "|" && parseFloat(getComputedStyle(k).opacity) < 0.99).length;
  return { id: el.id, slug: el.getAttribute("data-motion"), ready: el.hasAttribute("data-motion-ready"), opacity: parseFloat(cs.opacity),
    visibility: cs.visibility, hiddenKids, spans: el.querySelectorAll("span").length, top: el.getBoundingClientRect().top + scrollY };
});
const revealed = s => s.ready && s.visibility === "visible" && s.opacity > 0.99 && s.hiddenKids === 0;
const unplayed = s => s.opacity < 0.5 || s.hiddenKids > 0;

async function state(pg) { return pg.evaluate(STATE); }
async function byId(pg, id) { return (await state(pg)).find(s => s.id === id); }

// polls until every listed id (or all elements when ids is empty) is revealed
async function waitRevealed(pg, ids, timeout) {
  const t0 = Date.now();
  let last;
  while (Date.now() - t0 < timeout) {
    last = await state(pg);
    const want = ids.length ? last.filter(s => ids.includes(s.id)) : last;
    if (want.length && want.every(revealed)) return Date.now() - t0;
    await sleep(100);
  }
  throw new Error("not revealed within " + timeout + " ms: " + JSON.stringify(last.filter(s => !revealed(s))));
}

async function open(browser, file, { width = 1280, height = 800, reduced = false } = {}) {
  const pg = await browser.newPage();
  const errors = [];
  pg.on("pageerror", e => errors.push(e.message));
  pg.on("console", m => { if (["error", "warn", "warning"].includes(m.type())) errors.push(m.text()); });
  if (reduced) await pg.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await pg.setViewport({ width, height });
  await pg.goto("file://" + file, { waitUntil: "networkidle0", timeout: 45000 });
  pg.errors = errors;
  return pg;
}

module.exports = { ROOT, NO_CHROME, sleep, launch, page, fixtures, state, byId, waitRevealed, revealed, unplayed, open };
