// Runs the skill's own checks (scripts/verify.cjs and scripts/lint.cjs) against the local runtime build.
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const path = require("path");
const { execFile } = require("child_process");
const { ROOT, fixtures } = require("./helpers.cjs");
const { SHORT, REALISTIC, allEffects } = require("./pages.cjs");

let fx;
before(() => { fx = fixtures(); });
after(() => fx.cleanup());

const run = (script, args) => new Promise(res => execFile(process.execPath, [path.join(ROOT, "scripts", script), ...args], { timeout: 90000 },
  (err, stdout, stderr) => res({ code: err ? err.code : 0, out: stdout + stderr })));

test("verify.cjs passes on a long page with all 12 Lite effects", async () => {
  const { slugs, html } = allEffects();
  assert.strictEqual(slugs.length, 12);
  const r = await run("verify.cjs", [fx.file("all-effects.html", html)]);
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /^PASS$/m);
  for (const s of slugs) assert.match(r.out, new RegExp("^ok +\\S+ " + s + " ", "m"), s + " not ok:\n" + r.out);
});

test("verify.cjs passes on the short page that cannot scroll", async () => {
  const r = await run("verify.cjs", [fx.file("short.html", SHORT)]);
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /^PASS$/m);
});

test("lint.cjs --lite passes on a realistic page with at most 5 effects", async () => {
  const r = await run("lint.cjs", [fx.file("realistic.html", REALISTIC), "--lite"]);
  assert.strictEqual(r.code, 0, r.out);
  assert.match(r.out, /^PASS: 0 errors/m);
  assert.doesNotMatch(r.out, /runtime-missing|prehide-missing/);
});
