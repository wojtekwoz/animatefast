#!/usr/bin/env node
// animatefa.st Lite linter v0.1 (from the Motion Standard linter 2026-11-12). Checks a page's data-motion markup against the AGENTS.md hard rules
// BEFORE the runtime runs (JS disabled), at a 1280x800 desktop viewport.
// Usage: node lint.cjs <url|file.html> [--lite] [--styleguide MOTION.md] [--json] [--effects path/to/effects.json]
// Needs npm install in the skill folder (puppeteer-core) and a local Chrome/Chromium (auto-detected on macOS/Linux, or CHROME env).
// Exit 0 = no errors (warnings allowed), 1 = errors, 2 = could not run.
const path = require("path"), fs = require("fs");
const args = process.argv.slice(2), flag = n => args.includes(n);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const target = args.find((a, i) => !a.startsWith("--") && !["--effects", "--styleguide"].includes(args[i - 1]));
if (!target) { console.error("usage: node motion-lint.js <url|file.html> [--lite] [--json]"); process.exit(2); }
const effectsPath = opt("--effects") || path.resolve(__dirname, "../references/effects.lite.json");
const EFX = JSON.parse(fs.readFileSync(effectsPath, "utf8"));
const CHROME_PATHS = [process.env.CHROME, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium", "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
const exe = CHROME_PATHS.find(p => p && require("fs").existsSync(p));
const P = (() => { for (const m of ["puppeteer-core", "puppeteer", process.env.PUPPETEER_CORE, "/tmp/pt/node_modules/puppeteer-core"]) { if (!m) continue; try { return require(m); } catch (e) {} } console.error("could not run: run npm install in the skill folder (installs puppeteer-core)"); process.exit(2); })();
if (!exe && !P.executablePath) { console.error("could not run: no Chrome found, set CHROME=/path/to/chrome"); process.exit(2); }
const url = /^https?:|^file:/.test(target) ? target : "file://" + path.resolve(target);


// --- styleguide (project MOTION.md front matter, tiny YAML subset: key: value, key: [a, b], one nested level) ---
function parseStyleguide(file) {
  const txt = fs.readFileSync(file, "utf8"), m = txt.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) throw new Error(file + " has no front matter");
  const out = {}; let parent = null;
  const val = v => { v = v.replace(/\s+#.*$/, "").trim(); if (/^\[.*\]$/.test(v)) return v.slice(1, -1).split(",").map(x => x.trim()).filter(Boolean); if (v === "none") return []; return isNaN(+v) || v === "" ? v : +v; };
  for (const line of m[1].split(/\r?\n/)) {
    if (/^\s*(#|$)/.test(line)) continue;
    const mm = line.match(/^(\s*)([a-z_]+):\s*(.*)$/); if (!mm) continue;
    if (mm[1].length && parent) out[parent][mm[2]] = val(mm[3]);
    else if (mm[3].replace(/\s+#.*$/, "").trim() === "") { parent = mm[2]; out[parent] = {}; }
    else { parent = null; out[mm[2]] = val(mm[3]); }
  }
  return out;
}
const DEF_DUR = { "char-fade-down": 0.4, "element-from-bottom": 0.75, "char-scale-blur": 0.8, "char-flip-y": 0.8, "char-wave": 0.3, "char-pop": 0.4, "element-scale-in": 0.5, "word-slide-up": 0.8, "element-from-left": 0.75, "line-slide-up": 0.8, "image-rise-tilt": 1.2 };
const SPRING = ["element-from-bottom", "element-from-left", "char-pop"];
const SG = opt("--styleguide") ? parseStyleguide(opt("--styleguide")) : null;
const effects = {}; EFX.effects.forEach(e => effects[e.slug] = e);
const secs = s => { const m = String(s || "").match(/(\d+(?:\.\d+)?)\s*s\b/); return m ? +m[1] : 0.6; };
const stagDef = s => { const m = String(s || "").match(/(?<!total )stagger\s+(\d+(?:\.\d+)?)/); return m ? +m[1] : 0; };
const isChar = slug => /^char-/.test(slug) || slug === "typewriter";
const KNOWN_ATTR = ["data-motion", "data-motion-trigger", "data-motion-delay", "data-motion-duration", "data-motion-stagger", "data-motion-start", "data-motion-from", "data-motion-ready"];
const FROM_OK = { "image-wipe": ["center", "left", "right", "top", "bottom"], "magnetic": ["text"] };

(async () => {
  const b = await P.launch({ ...(exe ? { executablePath: exe } : {}), args: ["--no-sandbox"], headless: "new" });
  const pg = await b.newPage();
  await pg.setJavaScriptEnabled(false);
  await pg.setViewport({ width: 1280, height: 800 });
  await pg.goto(url, { waitUntil: "load", timeout: 45000 });
  const page = await pg.evaluate(() => {
    const vh = innerHeight, els = [].slice.call(document.querySelectorAll("[data-motion]"));
    const desc = el => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "");
    return {
      vh, docH: document.documentElement.scrollHeight,
      legacy: document.querySelectorAll("[data-gsap]:not([data-motion])").length,
      scripts: [].map.call(document.scripts, s => s.src || (/MotionStandard/.test(s.textContent) ? "inline:animatefast-lite" : "")),
      headCss: [].map.call(document.querySelectorAll("style"), s => s.textContent).join("\n") + [].map.call(document.querySelectorAll("link[rel=stylesheet]"), l => /motion-standard/.test(l.href) ? "[data-motion]" : "").join(""),
      els: els.map((el, i) => {
        const r = el.getBoundingClientRect(), attrs = {};
        [].forEach.call(el.attributes, a => { if (a.name.startsWith("data-motion")) attrs[a.name] = a.value; });
        const sib = el.parentElement ? [].filter.call(el.parentElement.children, s => s.getAttribute("data-motion") === el.getAttribute("data-motion")).length : 1;
        return { i, d: desc(el), attrs, top: r.top + scrollY, h: r.height, text: (el.textContent || "").replace(/\s+/g, " ").trim(),
          nested: !!(el.parentElement && el.parentElement.closest("[data-motion]")), ix: el.hasAttribute("data-w-id"), sib };
      })
    };
  });
  await b.close();

  const out = []; const add = (lvl, rule, el, msg) => out.push({ lvl, rule, el: el ? el.d : "page", msg });
  const slugs = new Set();
  let loadTimes = [], firstScreenChar = [];
  for (const e of page.els) {
    const slug = e.attrs["data-motion"], fx = effects[slug];
    if (!fx) { add("error", "unknown-effect", e, `"${slug}" is not in effects.json`); continue; }
    if (flag("--lite") && fx.tier !== "lite") add("error", "pack-only", e, `"${slug}" is a pack effect, not in Lite`);
    slugs.add(slug);
    for (const k in e.attrs) if (!KNOWN_ATTR.includes(k)) add("error", "unknown-attribute", e, `${k} is not a Motion Standard attribute`);
    const tr = e.attrs["data-motion-trigger"] || (fx.trigger === "hover" ? "hover" : "scroll");
    if (!["scroll", "load", "hover"].includes(tr)) add("error", "bad-trigger", e, `trigger "${tr}" (use scroll, load or hover)`);
    if (tr === "hover" && fx.trigger !== "hover") add("error", "bad-trigger", e, `${slug} is a reveal effect, it has no hover mode`);
    if (fx.trigger === "hover" && e.attrs["data-motion-trigger"] && tr !== "hover") add("warn", "bad-trigger", e, `${slug} is hover-only; the trigger attribute is ignored`);
    for (const [k, max] of [["delay", 2], ["duration", 2], ["stagger", 1]]) {
      const v = e.attrs["data-motion-" + k]; if (v === undefined) continue;
      if (isNaN(parseFloat(v)) || /[a-z]/i.test(v)) add("error", "bad-number", e, `data-motion-${k}="${v}" must be plain seconds like 0.3`);
      else if (+v < 0 || +v > max) add("warn", "out-of-range", e, `data-motion-${k}=${v}s is outside 0-${max}s`);
    }
    const from = e.attrs["data-motion-from"];
    if (from !== undefined && !(FROM_OK[slug] || []).includes(from)) add("error", "bad-from", e, `data-motion-from="${from}" is not valid for ${slug}`);
    if (isChar(slug) && e.text.length > 120) add("error", "char-on-long-text", e, `${e.text.length} characters; use a word-* or line-* effect`);
    if (slug === "counter" && !/\d/.test(e.text)) add("error", "counter-no-number", e, "counter needs a number in the text");
    if (e.nested) add("error", "nested", e, "inside another data-motion element (animates twice); put the attribute on one of them");
    if (e.ix) add("warn", "webflow-ix", e, "has a Webflow Interaction (data-w-id); do not combine with data-motion");
    const inFirst = e.top < page.vh;
    // hint only: the runtime clamps the default start, so footers still fire
    if (tr === "scroll" && !e.attrs["data-motion-start"] && e.top > page.docH - page.vh * 0.2) add("hint", "start-unreachable", e, `starts at ${Math.round(e.top)}px but the page ends at ${page.docH}px; the runtime clamps the start so the effect still fires. Optional: set data-motion-start if you want a specific point`);
    if (tr === "load" && !inFirst) add("error", "load-below-fold", e, `trigger load but starts at ${Math.round(e.top)}px (first screen is ${page.vh}px)`);
    if (tr === "scroll" && inFirst && e.top + e.h * 0.2 < page.vh * 0.8 && fx.trigger !== "hover") add("warn", "first-screen-scroll", e, "in the first screen with a scroll trigger; use load so it does not wait for ScrollTrigger");
    if (inFirst && isChar(slug)) firstScreenChar.push(e);
    if (tr === "load") {
      const dur = +e.attrs["data-motion-duration"] || secs(fx.defaults), st = e.attrs["data-motion-stagger"] !== undefined ? +e.attrs["data-motion-stagger"] : stagDef(fx.defaults);
      const n = fx.family === "text" ? (isChar(slug) ? e.text.replace(/\s/g, "").length : /^word/.test(slug) ? e.text.split(" ").length : 3) : 1;
      loadTimes.push((+e.attrs["data-motion-delay"] || 0) + dur + (fx.family === "text" ? st * Math.max(n - 1, 0) : 0));
    }
    if (e.sib > 8 && e.attrs["data-motion-stagger"]) add("warn", "long-stagger", e, `${e.sib} siblings share a stagger; later rows wait up to 1 s. Stagger the first row only or drop it`);
  }
  if (SG) {
    const never = [].concat(SG.never || []), roles = SG.roles || {}, allowed = new Set([].concat(...Object.values(roles).map(v => [].concat(v))));
    const tempo = +SG.tempo || 1, maxFx = Math.min(+SG.max_effects || 5, 5);
    for (const e of page.els) {
      const slug = e.attrs["data-motion"]; if (!effects[slug]) continue;
      if (never.includes(slug)) add("error", "off-brand", e, `${slug} is in the styleguide's never list`);
      else if (allowed.size && !allowed.has(slug)) add("warn", "not-in-roles", e, `${slug} is not in any styleguide role`);
      if (SG.easing === "soft" && SPRING.includes(slug)) add("error", "off-brand-easing", e, `${slug} has a spring/bounce feel but the styleguide easing is soft`);
      if (tempo !== 1 && DEF_DUR[slug]) {
        const exp = Math.round(DEF_DUR[slug] * tempo / 0.05) * 0.05, got = e.attrs["data-motion-duration"];
        if (got === undefined) add("warn", "tempo", e, `styleguide tempo ${tempo}: expected data-motion-duration about ${exp.toFixed(2)}`);
        else if (Math.abs(+got - exp) / exp > 0.35) add("warn", "tempo", e, `duration ${got} is far from the brand tempo (${exp.toFixed(2)})`);
      }
      if (tempo !== 1 && slug === "typewriter" && e.attrs["data-motion-stagger"] === undefined) add("warn", "tempo", e, `styleguide tempo ${tempo}: expected data-motion-stagger about ${(0.05 * tempo).toFixed(2)}`);
    }
    if (slugs.size > maxFx) add("error", "styleguide-max-effects", null, `${slugs.size} distinct effects; the styleguide allows ${maxFx}`);
  }
  if (slugs.size > 5) add("error", "too-many-effects", null, `${slugs.size} distinct effects (${[...slugs].join(", ")}); max 5 per page`);
  if (firstScreenChar.length > 1) add("warn", "char-effects-first-screen", null, `${firstScreenChar.length} character-level effects in the first screen (${firstScreenChar.map(e => e.d).join(", ")}); keep one`);
  const reveal = Math.max(0, ...loadTimes); if (reveal > 1.5) add("warn", "slow-first-screen", null, `first screen finishes at about ${reveal.toFixed(1)} s; keep it under 1.5 s`);
  if (page.els.length && !page.scripts.some(s => /motion-standard|gfluo-lite|animatefast/.test(s))) add("warn", "runtime-missing", null, "no animatefa.st Lite script found on the page (jsDelivr, self-hosted or inline)");
  if (page.els.length && !/\[data-motion\]/.test(page.headCss)) add("warn", "prehide-missing", null, "pre-hide CSS (head.html) not found; content may flash");
  if (page.legacy) add("info", "legacy", null, `${page.legacy} legacy data-gsap elements (aliased by the runtime)`);

  const errors = out.filter(o => o.lvl === "error").length, warns = out.filter(o => o.lvl === "warn").length, hints = out.filter(o => o.lvl === "hint").length;
  if (flag("--json")) console.log(JSON.stringify({ url, elements: page.els.length, distinct: [...slugs], errors, warnings: warns, hints, findings: out }, null, 1));
  else {
    console.log(`${url}\n${page.els.length} animated elements, ${slugs.size} distinct effects`);
    out.forEach(o => console.log(`${o.lvl.toUpperCase().padEnd(5)} ${o.rule.padEnd(24)} ${o.el}: ${o.msg}`));
    const extra = (warns ? `, ${warns} warnings` : ", 0 warnings") + (hints ? `, ${hints} hints` : "");
    console.log(errors ? `FAIL: ${errors} errors${extra}` : `PASS: 0 errors${extra}`);
  }
  process.exit(errors ? 1 : 0);
})().catch(e => { console.error("could not run: " + e.message); process.exit(2); });
