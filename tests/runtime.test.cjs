// Headless browser tests for the Lite runtime's scroll arming (short pages, first screen, page bottom, resize, reduced motion).
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { launch, fixtures, open, sleep, state, byId, waitRevealed, revealed, unplayed } = require("./helpers.cjs");
const { SHORT, LONG, RESIZE } = require("./pages.cjs");

let browser, fx;
before(async () => { browser = await launch(); fx = fixtures(); });
after(async () => { await browser.close(); fx.cleanup(); });

test("short page that cannot scroll reveals every scroll element on load", async () => {
  const pg = await open(browser, fx.file("short.html", SHORT));
  assert.strictEqual(await pg.evaluate(() => document.documentElement.scrollHeight <= innerHeight), true, "fixture must not scroll");
  await waitRevealed(pg, [], 3000);
  const s = await state(pg);
  assert.strictEqual(s.length, 5);
  assert.strictEqual(await pg.evaluate(() => scrollY), 0, "no scrolling happened");
  assert.deepStrictEqual(pg.errors, []);
  await pg.close();
});

test("long page: first screen plays at once, below the fold waits for scroll, footer plays at the very bottom", async () => {
  const pg = await open(browser, fx.file("long.html", LONG));
  assert.strictEqual(await pg.evaluate(() => document.documentElement.scrollHeight), 4000);
  await waitRevealed(pg, ["l-first"], 3000);
  await sleep(2000);
  // a forced refresh at scrollY=0 must not release below-the-fold elements either
  await pg.evaluate(() => ScrollTrigger.refresh());
  await sleep(300);
  const mid = await byId(pg, "l-mid"), foot = await byId(pg, "l-foot");
  assert.ok(mid.ready && unplayed(mid), "mid element must wait at scrollY=0: " + JSON.stringify(mid));
  assert.ok(foot.ready && unplayed(foot), "footer must wait at scrollY=0: " + JSON.stringify(foot));

  await pg.evaluate(() => scrollTo(0, 2300));
  await waitRevealed(pg, ["l-mid"], 3000);
  assert.ok(unplayed(await byId(pg, "l-foot")), "footer still waits at 2300px");

  await pg.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  assert.strictEqual(await pg.evaluate(() => scrollY), 3200);
  await waitRevealed(pg, ["l-foot"], 3000);
  assert.deepStrictEqual(pg.errors, []);
  await pg.close();
});

test("resize: an element below the fold reveals once a taller viewport makes the page non-scrollable", async () => {
  const pg = await open(browser, fx.file("resize.html", RESIZE));
  await waitRevealed(pg, ["r-top"], 3000);
  await sleep(1500);
  const before = await byId(pg, "r-el");
  assert.ok(before.ready && unplayed(before), "must wait while below the fold: " + JSON.stringify(before));
  await pg.setViewport({ width: 1280, height: 1200 });
  assert.strictEqual(await pg.evaluate(() => document.documentElement.scrollHeight <= innerHeight), true, "page no longer scrolls");
  await waitRevealed(pg, ["r-el"], 3000);
  assert.strictEqual(await pg.evaluate(() => scrollY), 0);
  assert.deepStrictEqual(pg.errors, []);
  await pg.close();
});

test("each element plays once and its ScrollTrigger is killed", async () => {
  const pg = await open(browser, fx.file("long-once.html", LONG));
  await waitRevealed(pg, ["l-first"], 3000);
  await pg.evaluate(() => scrollTo(0, 2300));
  await waitRevealed(pg, ["l-mid"], 3000);
  await pg.evaluate(() => scrollTo(0, 3200));
  await waitRevealed(pg, ["l-foot"], 3000);
  // all three played, so no scroll triggers remain; scrolling around and refreshing must not replay anything
  assert.strictEqual(await pg.evaluate(() => ScrollTrigger.getAll().length), 0);
  await pg.evaluate(() => { scrollTo(0, 0); ScrollTrigger.refresh(); scrollTo(0, 3200); ScrollTrigger.refresh(); });
  await sleep(150);
  assert.ok((await state(pg)).every(revealed), "nothing replays (a replay would drop opacity)");
  await pg.close();
});

test("reduced motion: everything visible at once and not split", async () => {
  for (const [name, html] of [["short-rm.html", SHORT], ["long-rm.html", LONG]]) {
    const pg = await open(browser, fx.file(name, html), { reduced: true });
    await sleep(300);
    const s = await state(pg);
    assert.ok(s.length > 0);
    for (const e of s) {
      assert.ok(revealed(e), name + " not visible: " + JSON.stringify(e));
      assert.strictEqual(e.spans, 0, name + " was split: " + JSON.stringify(e));
    }
    assert.strictEqual(await pg.evaluate(() => ScrollTrigger.getAll().length), 0, "no scroll triggers under reduced motion");
    await pg.close();
  }
});
