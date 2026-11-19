// Headless browser tests for the Lite runtime's scroll arming (short pages, first screen, page bottom, resize, reduced motion).
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { NO_CHROME, launch, fixtures, open, sleep, state, byId, waitRevealed, revealed, unplayed } = require("./helpers.cjs");
const { SHORT, LONG, EXPLICIT, RESIZE } = require("./pages.cjs");

let browser, fx;
const skip = NO_CHROME;
before(async () => { if (skip) return; fx = fixtures(); browser = await launch(); });
after(async () => { await browser?.close(); fx?.cleanup(); });

test("short page that cannot scroll reveals every scroll element on load", { skip }, async () => {
  const pg = await open(browser, fx.file("short.html", SHORT));
  assert.strictEqual(await pg.evaluate(() => document.documentElement.scrollHeight <= innerHeight), true, "fixture must not scroll");
  await waitRevealed(pg, [], 3000);
  const s = await state(pg);
  assert.strictEqual(s.length, 5);
  assert.strictEqual(await pg.evaluate(() => scrollY), 0, "no scrolling happened");
  assert.deepStrictEqual(pg.errors, []);
  await pg.close();
});

test("long page: first screen plays at once, below the fold waits for scroll, footer plays at the very bottom", { skip }, async () => {
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

test("explicit data-motion-start=\"top 40%\" waits for its own threshold, not the default one", { skip }, async () => {
  const pg = await open(browser, fx.file("explicit.html", EXPLICIT));
  await waitRevealed(pg, ["x-first"], 3000);
  await sleep(1000);
  const atTop = await byId(pg, "x-el");
  assert.ok(atTop.ready && unplayed(atTop), "must wait at scrollY=0: " + JSON.stringify(atTop));

  // threshold is 2000 - 0.4 * 800 = 1680; the default "top 80%" would already have fired at 1360
  await pg.evaluate(() => scrollTo(0, 1670));
  await sleep(500);
  const near = await byId(pg, "x-el");
  assert.ok(unplayed(near), "must still wait 10px before its threshold: " + JSON.stringify(near));

  await pg.evaluate(() => scrollTo(0, 1700));
  await waitRevealed(pg, ["x-el"], 3000);
  assert.deepStrictEqual(pg.errors, []);
  await pg.close();
});

test("resize: an element below the fold reveals once a taller viewport makes the page non-scrollable", { skip }, async () => {
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

test("each element plays once and its ScrollTrigger is killed", { skip }, async () => {
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

test("refresh after the queue drains: new first-screen element plays at once, new below-the-fold element waits for scroll", { skip }, async () => {
  const pg = await open(browser, fx.file("long-refresh.html", LONG));
  // record window scroll listener changes so the test sees the detach and the re-attach
  await pg.evaluate(() => {
    window.__scrollListeners = [];
    const add = window.addEventListener, rem = window.removeEventListener;
    window.addEventListener = function(t) { if (t === "scroll") __scrollListeners.push("add"); return add.apply(this, arguments); };
    window.removeEventListener = function(t) { if (t === "scroll") __scrollListeners.push("remove"); return rem.apply(this, arguments); };
  });
  await waitRevealed(pg, ["l-first"], 3000);
  await pg.evaluate(() => scrollTo(0, 2300));
  await waitRevealed(pg, ["l-mid"], 3000);
  await pg.evaluate(() => scrollTo(0, 3200));
  await waitRevealed(pg, ["l-foot"], 3000);
  await pg.evaluate(() => scrollTo(0, 0));
  await sleep(300);
  assert.deepStrictEqual(await pg.evaluate(() => __scrollListeners), ["remove"], "scroll listener detached once the queue drained");

  // #n-mid at 2000px: default start "top 80%" is scrollY 2000 - 640 = 1360
  await pg.evaluate(() => {
    const box = document.getElementById("l-first").parentElement;
    box.insertAdjacentHTML("beforeend",
      '<h2 id="n-top" data-motion="word-slide-up" style="position:absolute;top:450px;left:40px">Added in the first screen</h2>' +
      '<h2 id="n-mid" data-motion="word-slide-up" style="position:absolute;top:2000px;left:40px">Added below the fold</h2>');
    MotionStandard.refresh();
  });
  await waitRevealed(pg, ["n-top"], 3000);
  await sleep(1000);
  assert.strictEqual(await pg.evaluate(() => scrollY), 0, "no scrolling happened");
  const mid = await byId(pg, "n-mid");
  assert.ok(mid.ready && unplayed(mid), "new below-the-fold element must wait at scrollY=0: " + JSON.stringify(mid));
  assert.deepStrictEqual(await pg.evaluate(() => __scrollListeners), ["remove", "add"], "scroll listener re-attached for the new pending element");

  await pg.evaluate(() => scrollTo(0, 1500));
  await waitRevealed(pg, ["n-mid"], 3000);
  assert.deepStrictEqual(pg.errors, []);
  await pg.close();
});

test("reduced motion: everything visible at once and not split", { skip }, async () => {
  for (const [name, html] of [["short-rm.html", SHORT], ["long-rm.html", LONG]]) {
    const pg = await open(browser, fx.file(name, html), { reduced: true });
    await waitRevealed(pg, [], 3000);
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
