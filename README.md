# animatefa.st

Tasteful text and element animations for Webflow and HTML, applied by your AI coding agent. You describe the motion in plain words ("make the headline come in word by word"), the agent picks one of 12 tuned GSAP effects, writes one `data-motion` attribute, keeps it on brand with your project's `MOTION.md` styleguide, and checks in a real browser that it works.

Early preview (v0.1.1). Made by the people behind gFLUO, the Webflow app for no-code GSAP text animations.

## Install (Claude Code)

```bash
git clone https://github.com/wojtekwoz/animatefast ~/.claude/skills/animatefast
cd ~/.claude/skills/animatefast && npm install   # puppeteer-core for the checks; uses your local Chrome
```

Then just ask Claude Code, for example: "Animate this landing page, it's a calm architecture studio" or "Niech nagłówek wchodzi słowo po słowie".

## Install (Codex, Cursor, others)

Clone as above, then paste the block from [`AGENTS.md`](AGENTS.md) into your project's `AGENTS.md` or Cursor rules.

## What's inside

| path | what |
|---|---|
| `SKILL.md` | the workflow your agent follows (styleguide, pick, apply, verify) |
| `references/SPEC.md` | the 12 effects, attributes, defaults, styleguide tokens and presets, rules. Same as `llms.txt` |
| `templates/MOTION.md` | brand motion styleguide template (presets: calm, playful, bold) |
| `dist/animatefast-lite.min.js` | the runtime (6.4 KB, 2.7 KB gzipped). Needs GSAP 3.15 + ScrollTrigger + SplitText, all free |
| `scripts/lint.cjs`, `scripts/verify.cjs` | checks the agent runs before it says done |
| `examples/sample.html` | a plain page to try it on |

## Using the script without the agent

```html
<script src="https://cdn.jsdelivr.net/gh/wojtekwoz/animatefast@v0.1.1/dist/animatefast-lite.min.js" integrity="sha384-NduON8+acxhHUZVpchMMEz+smjiRFa/dnz/paVPxRatiDv1bV09pnceoIfmdMT5/" crossorigin="anonymous" defer></script>
<h1 data-motion="word-slide-up">Hello</h1>
```

Full head block (GSAP, pre-hide CSS) and the inline-paste option for Webflow are in `references/SPEC.md` section 1.

## License

MIT, see `LICENSE`. GSAP is not included; it loads from jsDelivr under the GSAP Standard License.
