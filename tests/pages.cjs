// Fixture pages. All use the default scroll trigger unless noted. Viewport in the tests is 1280x800.
const fs = require("fs"), path = require("path");
const { page, ROOT } = require("./helpers.cjs");

// fits in 800px, cannot scroll; #s-bottom sits near the bottom of the screen
const SHORT = page(`
<div style="height:700px;padding:40px">
  <h1 id="s-title" data-motion="word-slide-up">Short page, nothing to scroll</h1>
  <h2 id="s-h2" data-motion="char-fade-down" style="position:absolute;top:340px;left:40px">Visible on load</h2>
  <p id="s-lines" data-motion="line-slide-up" style="position:absolute;top:440px;left:40px;width:600px">A paragraph that should reveal line by line without any scroll at all, because the page cannot scroll.</p>
  <div id="s-card" data-motion="element-from-bottom" style="position:absolute;top:540px;left:40px;width:300px;height:60px;background:#eee">Card</div>
  <div id="s-bottom" data-motion="element-scale-in" style="position:absolute;top:720px;left:40px;width:200px;height:40px;background:#ddd">Near the bottom</div>
</div>`);

// exactly 4000px tall: #l-first in the first screen, #l-mid at 2500px, #l-foot in the last 10% (top 3880px, start clamps to max scroll 3200)
const LONG = page(`
<div style="position:relative;height:4000px;overflow:hidden">
  <h2 id="l-first" data-motion="word-slide-up" style="position:absolute;top:300px;left:40px">In the first screen</h2>
  <div id="l-mid" data-motion="element-from-bottom" style="position:absolute;top:2500px;left:40px;width:300px;height:80px;background:#eee">Middle</div>
  <p id="l-foot" data-motion="char-fade-down" style="position:absolute;top:3880px;left:40px">Footer line</p>
</div>`);

// 4000px tall, #x-el at 2000px with an explicit start "top 40%": threshold is scrollY 2000 - 320 = 1680.
// A text effect, so the element itself is not transformed and its measured top stays at 2000px.
const EXPLICIT = page(`
<div style="position:relative;height:4000px;overflow:hidden">
  <h2 id="x-first" data-motion="word-slide-up" style="position:absolute;top:300px;left:40px">In the first screen</h2>
  <h2 id="x-el" data-motion="word-slide-up" data-motion-start="top 40%" style="position:absolute;top:2000px;left:40px">Explicit start at 40 percent</h2>
</div>`);

// 1100px tall: scrollable at 800px, #r-el at 1000px is below the fold; at 1200px tall the page cannot scroll
const RESIZE = page(`
<div style="position:relative;height:1100px">
  <h1 id="r-top" data-motion="char-fade-down" data-motion-trigger="load" style="position:absolute;top:40px;left:40px">Resize me</h1>
  <div id="r-el" data-motion="element-from-left" style="position:absolute;top:1000px;left:40px;width:300px;height:60px;background:#eee">Below the fold</div>
</div>`);

// every Lite effect, one per 700px block
function allEffects() {
  const slugs = JSON.parse(fs.readFileSync(path.join(ROOT, "references/effects.lite.json"), "utf8")).effects.map(e => e.slug);
  const img = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='240'%3E%3Crect width='400' height='240' fill='%237c5cff'/%3E%3C/svg%3E";
  const el = s => {
    if (s === "image-rise-tilt") return `<img data-motion="${s}" alt="Block" width="400" height="240" src="${img}">`;
    if (s === "line-slide-up") return `<p data-motion="${s}" style="max-width:600px">A longer paragraph that wraps onto a few lines so the line split has more than one line to slide up into place.</p>`;
    if (/^element-/.test(s)) return `<div data-motion="${s}" style="width:300px;padding:20px;background:#eee">A block for ${s}</div>`;
    return `<h2 data-motion="${s}">Effect ${s}</h2>`;
  };
  return { slugs, html: page(slugs.map(s => `<section style="height:700px;padding:60px 40px">${el(s)}</section>`).join("\n")) };
}

// realistic landing page with 4 distinct effects, hero on load
const REALISTIC = page(`
<header style="min-height:700px;padding:80px 40px">
  <h1 data-motion="word-slide-up" data-motion-trigger="load">Websites that move people</h1>
  <p data-motion="line-slide-up" data-motion-trigger="load" data-motion-delay="0.2" style="max-width:560px;margin-top:20px">We design and build sites for product teams who care about the details.</p>
</header>
<section style="padding:110px 40px">
  <h2 data-motion="word-slide-up">What we do</h2>
  <div style="display:flex;gap:20px;margin-top:20px">
    <div data-motion="element-from-bottom" data-motion-stagger="0.1" style="flex:1;padding:28px;background:#fff">Strategy</div>
    <div data-motion="element-from-bottom" data-motion-stagger="0.1" style="flex:1;padding:28px;background:#fff">Design</div>
    <div data-motion="element-from-bottom" data-motion-stagger="0.1" style="flex:1;padding:28px;background:#fff">Build</div>
  </div>
</section>
<section style="padding:110px 40px">
  <img data-motion="image-rise-tilt" alt="Product" width="820" height="480" src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='820' height='480'%3E%3Crect width='820' height='480' fill='%23ff6b6b'/%3E%3C/svg%3E">
</section>
<footer style="padding:60px 40px"><p>Made with care.</p></footer>`, "body{background:#f6f4ef}");

module.exports = { SHORT, LONG, EXPLICIT, RESIZE, REALISTIC, allEffects };
