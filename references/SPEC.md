# animatefa.st Lite v0.1: effect spec for AI coding agents

> Working name animatefa.st (formerly the gFLUO Motion Standard; gFLUO is the existing Webflow app). This file is the effect spec (`references/SPEC.md` in the skill, `llms.txt` in the repo root). A project's own brand styleguide is a separate file called `MOTION.md` in the project root, see section 4.

> Plain-language text animations for Webflow and HTML. You (the agent) pick one of 12 named effects and write ONE attribute: `data-motion="<effect>"`. A small runtime (GSAP 3.15 + ScrollTrigger + SplitText, all free) does the rest: timing, easing, splitting, accessibility. Never write GSAP code yourself for these effects.

Status: prototype, 15 Nov 2026. Runtime v0.1.1 tested headless. The jsDelivr URL is pinned to tag `v0.1.1` (see Install).

## 1. Install (once per site)

Put this in the page `<head>` (Webflow: Site settings > Custom code > Head code, or Webflow MCP, see the skill):

```html
<style>.js [data-motion]:not([data-motion-ready]){visibility:hidden}.ms-reveal [data-motion]{visibility:visible!important}@media (prefers-reduced-motion:reduce){[data-motion]{visibility:visible!important}}</style>
<script>document.documentElement.className+=" js";setTimeout(function(){document.documentElement.className+=" ms-reveal"},3000)</script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/gsap.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/ScrollTrigger.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/SplitText.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/gh/wojtekwoz/animatefast@v0.1.1/dist/animatefast-lite.min.js" integrity="sha384-NduON8+acxhHUZVpchMMEz+smjiRFa/dnz/paVPxRatiDv1bV09pnceoIfmdMT5/" crossorigin="anonymous" defer></script>
```

- The animatefa.st script is served by jsDelivr straight from the public GitHub repo `wojtekwoz/animatefast`, pinned to the tag `v0.1.1` (pinned tags are cached for good and match the `integrity` hash). If the URL returns 404, use option B or C.
- Order matters: GSAP, ScrollTrigger, SplitText, then animatefa.st Lite. All `defer`.
- If Webflow already loads GSAP (Site settings > GSAP toggles with ScrollTrigger and SplitText on), do not load it twice: keep only the style, the small inline script and the animatefa.st script.
- The first `<style>` + `<script>` pair stops a flash of the un-animated text and reveals everything after 3 s if any script fails.

**Option B, inline paste (no hosting at all).** Replace the last `<script src=...>` line with `<script>` + the full contents of `dist/animatefast-lite.min.js` + `</script>`. The file is 6,544 characters, so the whole head block is about 7,200 characters. Webflow's Head code field takes up to 50,000 characters (custom code needs a paid site plan), so this fits with room to spare. Keep it after the GSAP tags; it waits for the page to finish parsing, so the deferred GSAP files are ready by then. GSAP itself (about 70 KB) is too big to inline: load it from jsDelivr as above or use Webflow's GSAP toggle. Webflow MCP inline scripts are capped at 2,000 characters, so over MCP use the hosted URL (option A).

**Option C, self-host.** Plain HTML or exported code: copy `dist/animatefast-lite.min.js` next to the page and point the `src` at it (drop `integrity` if you change the file).

## 2. Attributes (the whole API, lowercase only)

| attribute | values | default | notes |
|---|---|---|---|
| `data-motion` | one of the 12 slugs below | required | |
| `data-motion-trigger` | `scroll` or `load` | `scroll` | `load` only for elements visible in the first screen |
| `data-motion-delay` | seconds, `0` to `2` | `0` | plain number, no unit: `0.3` |
| `data-motion-duration` | seconds, `0.2` to `2` | per effect | slower = calmer |
| `data-motion-stagger` | seconds, `0` to `1` | per effect | text: between letters/words/lines. Elements: between siblings with the same effect |
| `data-motion-start` | ScrollTrigger start | `top 80%` (clamped) | rarely needed; the runtime clamps the default so footer elements still fire |

Nothing else exists. Do not invent attributes (no ease, distance, direction, repeat).

## 3. The 12 effects

Match the user's words to the "Use when / user might say" column. If two fit, prefer the one higher in the list (ranked by real usage on Webflow sites).

| # | slug | element | what it looks like | use when / user might say (EN, PL) | defaults | good tweaks |
|---|---|---|---|---|---|---|
| 1 | `char-fade-down` | heading or short text (<120 chars) | letters drop in softly one by one | subtle, simple, letter by letter, fade, safe default for a headline; "delikatnie", "litera po literze", "z góry" | 0.4 s, stagger 0.03 | headline >30 chars: `stagger 0.02` |
| 2 | `element-from-bottom` | any block: card, button, section, image wrapper | block rises from below with a small bounce | cards, blocks, "slide up from the bottom", "one after another"; "karty", "od dołu", "wjeżdża" | 0.75 s | grid: `stagger 0.1` to `0.15` |
| 3 | `char-scale-blur` | short heading | big blurred letters settle into focus | bold, premium, cinematic, dreamy, blur, focus; "rozmycie", "ostrość", "efektowny" | 0.8 s, stagger 0.03 | one per page, hero only |
| 4 | `char-flip-y` | short heading | each letter flips in 3D | flip, 3D, rotate, spin, playful but clean; "obrót", "obraca się" | 0.8 s, 1 s total stagger | |
| 5 | `char-wave` | short heading | letters rise in a smooth wave | wave, flowing, friendly, light; "fala", "płynnie" | 0.3 s, stagger 0.02 | |
| 6 | `char-pop` | short heading, CTA text | letters pop from zero with overshoot | pop, bubbly, fun, energetic, bouncy letters; "wyskakują", "zabawnie", "energicznie" | 0.4 s, 0.8 s total stagger | |
| 7 | `element-scale-in` | badge, icon, logo, small block | grows from nothing | pop in (a block, not letters), grow, zoom, appear, badge, icon; "pojawia się", "rośnie", "ikona", "odznaka" | 0.5 s | |
| 8 | `word-slide-up` | heading or short paragraph (<25 words) | words slide up one by one | word by word, calm, elegant, readable, tagline, subheading; "słowo po słowie", "spokojnie", "elegancko" | 0.8 s, stagger 0.1 | calm: `duration 1` |
| 9 | `typewriter` | one short line (<60 chars) | typed out with a blinking cursor | typing, typewriter, terminal, code, cursor; "pisze się", "jak na maszynie", "kursor" | 0.05 s per char | slower: `stagger 0.08` |
| 10 | `element-from-left` | any block | slides in from the left with a soft bounce | from the left, side, sideways; "z lewej", "z boku" | 0.75 s | |
| 11 | `line-slide-up` | paragraph of any length | lines slide up together | paragraph, body text, description, line by line; "akapit", "linijka po linijce", "opis" | 0.8 s, 0.15 s total | hero subline: `load`, `delay 0.3` |
| 12 | `image-rise-tilt` | img or image block | rises with a slight tilt that straightens | photo, image, screenshot, mockup, tilt; "zdjęcie", "obrazek", "przechyla się" | 1.2 s | |

Modifiers in the request:
- "slow / calm / gentle / wolno / spokojnie": raise `data-motion-duration` about 1.5x (typewriter: `data-motion-stagger="0.08"`).
- "fast / snappy / szybko": lower duration about 0.6x.
- "on load / hero / first screen / od razu / po załadowaniu": `data-motion-trigger="load"` (only if the element really is in the first screen).
- "one after another / po kolei" on several blocks: same effect on each sibling + `data-motion-stagger="0.12"`.

Not in Lite (say so, offer the closest, do not hand-write GSAP): parallax, marquee/ticker, scroll scrub, counters, rotating words, button hovers, image wipes/clip reveals, magnetic buttons, page transitions. Counters, word rotation, wipes and hovers are in the paid animatefa.st pack.

## 4. Motion styleguide: keep motion on brand

Every project gets ONE motion personality, written down in a `MOTION.md` file in the project root (template: `templates/MOTION.md` in the skill). Before you add any effect, read it. Every effect you add must follow it, so a site never mixes a calm headline with a bouncy card.

### 4.1 Tokens

| token | values | what it controls | how you apply it |
|---|---|---|---|
| `preset` | `calm`, `playful`, `bold` | starting point for all other tokens | copy the preset values below, then adjust |
| `tempo` | `0.6` to `1.6` (1 = defaults) | speed. Higher = slower, calmer | `data-motion-duration` = default duration x tempo, rounded to 0.05 s. Omit the attribute when tempo is 1 |
| `stagger` | `0.6` to `1.6` | how much letters, words or cards trail each other | `data-motion-stagger` = default per-item stagger x token (only effects with a per-item default, see 4.3). Omit when 1 |
| `easing` | `soft`, `spring` | feel of the motion | which effects are allowed: `soft` = power-curve effects only, `spring` = overshoot/bounce effects allowed (see 4.3). There is no ease attribute |
| `intensity` | `low`, `medium`, `high` | how big and showy | `low`: no letter-level effects outside the hero heading, no 3D, blur, pop or typewriter. `medium`: one showy effect per page. `high`: anything in the role lists |
| `roles` | effect lists per role | which effect goes where | `hero_heading`, `heading`, `body`, `cta`, `card`, `image`, `badge`. First item = default for that role. `none` = leave static |
| `never` | effect list | hard bans for this brand | never use these, even if the user names them; say so and offer the role default |
| `max_effects` | 2 to 5 | distinct effects per page | never exceed (5 is the global hard cap) |
| `first_screen` | `load` | trigger for the first screen | always `load` |

### 4.2 Presets

| token | `calm` (editorial, studios, finance, health) | `playful` (consumer, kids, food, events) | `bold` (tech, SaaS, agencies, launches) |
|---|---|---|---|
| tempo | 1.3 | 0.9 | 0.8 |
| stagger | 1.2 | 1.0 | 0.8 |
| easing | soft | spring | soft |
| intensity | low | high | medium |
| hero_heading | `word-slide-up`, `char-fade-down` | `char-pop`, `char-wave`, `char-flip-y` | `char-scale-blur`, `char-fade-down` |
| heading | `word-slide-up` | `char-wave`, `word-slide-up` | `word-slide-up` |
| body | `line-slide-up` | `line-slide-up` | `line-slide-up` |
| cta | none | `element-scale-in` | `element-scale-in` |
| card | none (see gap below) | `element-from-bottom` | `element-from-bottom`, `element-from-left` |
| image | `image-rise-tilt` | `image-rise-tilt` | `image-rise-tilt` |
| badge | none | `element-scale-in` | `element-scale-in` |
| never | `char-pop`, `char-wave`, `char-flip-y`, `char-scale-blur`, `typewriter`, `element-from-bottom`, `element-from-left`, `element-scale-in` | `char-scale-blur` | `char-pop`, `char-wave` |
| max_effects | 3 | 5 | 4 |

Known gap: Lite has no soft fade-up for blocks (every block effect has a bounce or scale), so `calm` leaves cards static. A soft `element-fade-up` is the first candidate for v0.2.

### 4.3 Effect defaults and feel (for the token maths)

| slug | easing family | default duration | per-item stagger default (empty = total, do not override) | showy? |
|---|---|---|---|---|
| `char-fade-down` | soft | 0.4 | 0.03 | no |
| `element-from-bottom` | spring | 0.75 | 0 (siblings; use 0.12 for "one after another" x stagger token) | no |
| `char-scale-blur` | soft | 0.8 | 0.03 | yes |
| `char-flip-y` | soft | 0.8 | | yes |
| `char-wave` | soft | 0.3 | 0.02 | yes |
| `char-pop` | spring | 0.4 | | yes |
| `element-scale-in` | soft (scale from 0) | 0.5 | 0 | no |
| `word-slide-up` | soft | 0.8 | 0.1 | no |
| `typewriter` | none (steps) | none: tempo sets `data-motion-stagger` = 0.05 x tempo | 0.05 | yes |
| `element-from-left` | spring | 0.75 | 0 | no |
| `line-slide-up` | soft | 0.8 | | no |
| `image-rise-tilt` | soft | 1.2 | 0 | no |

Example, `calm` (tempo 1.3, stagger 1.2): `word-slide-up` gets `data-motion-duration="1.05"` and `data-motion-stagger="0.12"`; `line-slide-up` gets `data-motion-duration="1.05"` and no stagger attribute.

### 4.4 Precedence

1. Hard rules in section 6 (accessibility, max 5, char limits) always win.
2. The project `MOTION.md` beats a one-off request: if the user asks for a banned effect, say it is off-brand, offer the role default, and only use the banned one if they confirm (then suggest updating `MOTION.md`).
3. Modifiers in a request ("slower") adjust that element only, relative to the brand tempo.

### 4.5 No MOTION.md yet?

- Whole-page or multi-element request: create `MOTION.md` first from the closest preset (infer it from the brand, copy and visual style; ask if unclear), show it to the user in two lines, then apply.
- Single-element request: use plain defaults and offer to create a styleguide in one line.

## 5. Accessibility and performance (handled by the runtime, do not re-implement)

- `prefers-reduced-motion: reduce`: nothing splits or moves, the final state shows at first paint.
- Split text keeps an `aria-label` with the original text, so screen readers read words, not letters.
- Scroll effects play once. Waits for fonts (max 1.5 s) before splitting.
- If GSAP fails to load, content is shown and one console error explains why.

## 6. Rules (do / don't)

Do
1. Put `data-motion` on the element itself (the `h1`, `p`, card `div`, `img`), not on a wrapper of a heading.
2. Use `load` for everything in the first screen, `scroll` (default) below it.
3. Keep at most 5 different effects on a page and at most one letter-level effect (`char-*`, `typewriter`) visible at a time.
4. Keep the first screen done in about 1.5 s (a 40-letter headline with `char-fade-down` takes 1.6 s, so use `stagger 0.02` or `word-slide-up`).
5. The runtime clamps the default scroll start (`top 80%`) so elements in the last screen (footer tagline, final CTA) still fire when the page cannot scroll further. You do not need `data-motion-start="top bottom"`. You can still set `data-motion-start` if you want a specific trigger point.
6. Re-send existing attributes when an API replaces them (Webflow `set_attributes`).
7. Verify in a real browser after editing (skill: `scripts/verify.cjs` and `scripts/lint.cjs --styleguide MOTION.md`).

Don't
1. Letter effects on text over 120 characters (use `line-slide-up` or `word-slide-up`).
2. Nest animated elements (an animated card containing an animated heading animates twice).
3. Combine `data-motion` with a Webflow Interaction on the same element.
4. Animate nav, form fields or legal text.
5. Publish a Webflow site. Stop at staging/preview and tell the user.

## 7. Webflow specifics

- Designer, by hand: Element settings (D) > Custom attributes > + > Name `data-motion`, Value e.g. `word-slide-up`.
- Webflow MCP: `data_element_tool` `get_attributes` then `set_attributes` with existing + new attributes. Scripts: `data_scripts_tool` `register_hosted_script` with `hosted_location` = the jsDelivr URL, `integrity_hash` = `sha384-NduON8+acxhHUZVpchMMEz+smjiRFa/dnz/paVPxRatiDv1bV09pnceoIfmdMT5/`, `version` `0.1.1`, `display_name` `animatefa.st Lite`, then `add_site_script` (MCP inline scripts are capped at 2,000 characters, so use the hosted URL; or the user pastes option B in Site settings). Call `webflow_guide_tool` first, tool names change between MCP versions.
- Exported code / DevLink / plain HTML: edit the markup directly.

## 8. Examples

```html
<h1 data-motion="char-fade-down" data-motion-trigger="load" data-motion-stagger="0.02">Motion that ships</h1>
<p data-motion="line-slide-up" data-motion-trigger="load" data-motion-delay="0.3">We build Webflow sites for product teams.</p>
<h2 data-motion="word-slide-up">Calm, word by word</h2>
<div class="card" data-motion="element-from-bottom" data-motion-stagger="0.12">...</div>
<img data-motion="image-rise-tilt" src="shot.png" alt="Product screenshot">
```
