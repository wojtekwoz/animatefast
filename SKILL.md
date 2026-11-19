---
name: animatefast
description: Add on-brand text and element animations to a Webflow site or an HTML page from a plain-language request ("make the headline come in word by word", "niech zdjęcie wjedzie z lekkim przechyleniem"), using animatefa.st Lite (12 named GSAP effects applied with one data-motion attribute) and the project's MOTION.md motion styleguide, then verify they render and animate. Use when the user asks for scroll or load animations, reveal effects, text animation, GSAP effects, a motion styleguide, or "make this page feel alive" on Webflow or HTML.
---

# animatefa.st (Lite)

You turn a description of motion into `data-motion` attributes from a fixed list of 12 effects, keep every page consistent with the project's motion styleguide, and prove it works in a real browser. You never write GSAP code for these effects.

Read `references/SPEC.md` once per session. It is the source of truth for effect names, attributes, defaults, styleguide tokens and rules. `references/effects.lite.json` is the same effect list for machines. (animatefa.st is the working name; the existing gFLUO Webflow app is a separate product.)

## Workflow

### 0. Check Lite, then read or create the styleguide
- First check the request is in Lite. Outside Lite (parallax, scroll-linked movement, scroll scrub, cursor effects, marquee, counter, hover effects, page transitions): change NOTHING in the files (no runtime, no `MOTION.md`, no other effects), even for whole-page requests. Say in one line it is not in Lite and offer the closest Lite effect as a suggestion only. Apply it only if the user accepts in a later message.
- Look for `MOTION.md` in the project root (for Webflow: in the repo or folder the user works from; if none, ask where to keep it or keep it in the conversation).
- Found: parse the front matter (`preset`, `tempo`, `stagger`, `easing`, `intensity`, `roles`, `never`, `max_effects`). Everything below must follow it.
- Not found and the user asked for the whole page: create `MOTION.md` from `templates/MOTION.md`, filling in the closest preset from SPEC.md 4.2 (infer from the brand, copy and visual style; ask if unclear). Tell the user the preset and its one-line feel, then continue.
- Not found and the request names specific elements: use plain defaults, and offer in one line to create a styleguide.

### 1. Understand the request
- Find the target element(s) and their role: hero heading, heading, body, cta, card, image, badge. If the request names none ("animate the page"), use step 3.
- Note modifiers: slow/calm, fast, on load/hero, one after another (EN or PL, see SPEC.md section 3).
- Only do what was asked. Animate only the elements the user named; never animate the whole page or create `MOTION.md` unless the user asked for the whole page.

### 2. Pick the effect
- With a styleguide: take the role's list from `roles` (first item is the default). If the user's words match another effect in that list, use it. If they match a banned (`never`) or off-role effect, say it is off-brand, offer the role default, and only use theirs if they confirm.
- Without one: match the user's words against the "use when / user might say" column in SPEC.md. Ties go to the effect higher in the table.
- "Pop in", "pop" or "bounce in" on a block (badge, button, card, image, tag) means `element-scale-in`. Use letter effects (`char-pop`, `char-fade-down`, `char-wave`, `typewriter` etc.) only when the user explicitly asks for letters, characters or "letter by letter".
- Check the element fits: `char-*` and `typewriter` only on text under 120 characters (typewriter under 60), `line-slide-up` for paragraphs, `element-*` for blocks, `image-rise-tilt` for images.
- Element near the very bottom of the page (footer, last CTA)? The runtime clamps the default start, so the effect still fires. You can set `data-motion-start` if you want a specific point. The linter may hint `start-unreachable`; that is not an error.

### 2b. Apply the tokens
- `tempo` not 1: `data-motion-duration` = default duration x tempo (SPEC.md 4.3), rounded to 0.05. Typewriter: `data-motion-stagger` = 0.05 x tempo instead.
- `stagger` not 1: `data-motion-stagger` = per-item default x token, only for effects that have a per-item default. Card groups "one after another": 0.12 x token.
- A request modifier ("a bit slower") multiplies on top, for that element only.
- Same role, same attributes across the whole site. Count distinct effects against `max_effects`.

### 3. Whole-page requests
Use the styleguide roles: hero heading with `load`; hero body with `load` and `delay 0.3`; hero image or badge with `load` and `delay 0.2`. Below the first screen: headings, body, cards, images per role. Stop adding effects at `max_effects` (prefer leaving a role static over adding a new effect). One letter-level effect in view at a time. Skip nav, forms, footer legal text.

### 4. Install the runtime once
Check the page/site head for `animatefast-lite` (or `MotionStandard` in an inline script). If missing, add the head block from SPEC.md section 1. The script comes from jsDelivr (`cdn.jsdelivr.net/gh/wojtekwoz/animatefast@v0.1.2/dist/animatefast-lite.min.js`, with the `integrity` hash). If Webflow already loads GSAP via Site settings, add only the animatefa.st part. If the jsDelivr URL is not reachable (404 means the repo is not public yet, or you are offline), use the fallback instead of giving up: plain HTML gets a self-hosted copy of `dist/animatefast-lite.min.js` next to the page; Webflow gets the inline paste (option B in SPEC.md, about 7,200 characters, under Webflow's 50,000 limit). Say which one you used.

### 5. Apply
- **Plain HTML / exported Webflow code / DevLink:** edit the element's opening tag. Keep every existing attribute and class.
- **Webflow via MCP:** call `webflow_guide_tool` first. Then per element `data_element_tool` `get_attributes`, then `set_attributes` with existing + new attributes. Runtime: `data_scripts_tool` `register_hosted_script` with the jsDelivr URL and its `integrity_hash` (MCP inline scripts are capped at 2,000 characters, so no inline over MCP) + `add_site_script`; pre-hide CSS appended (never replaced) to head code. Never publish.
- **Webflow without MCP:** give the user a short table "element > Name `data-motion` > Value `<slug>` (+ duration/stagger)" for Element settings > Custom attributes, plus the head code for Site settings. That is the fallback, not the default.

### 6. Verify (always, before you say done)
1. `node scripts/lint.cjs <file-or-url> --lite --styleguide <project>/MOTION.md` (drop `--styleguide` if there is none): must print PASS. Fix every ERROR. Mention any WARN you keep and why.
2. `node scripts/verify.cjs <file-or-url> --shots <dir>`: every element must be `ok` (ready, animated, ends visible, text intact), console clean, reduced motion visible and not split. Look at `mid.png` and `final.png`.
3. For Webflow use the staging `*.webflow.io` URL or the Designer preview, never the production domain, and never publish.
Both scripts need `npm install` once in this skill folder (installs puppeteer-core) and a local Chrome or Chromium (found automatically on macOS and Linux, or set `CHROME=/path/to/chrome`).

### 7. Report
One short message: styleguide used or created (preset), what you changed (element > effect > attributes), anything refused or off-brand and why, verify result, and "not published" for Webflow.

## Examples

| request | result |
|---|---|
| "Make the hero headline come in letter by letter on load, subtle" (no styleguide) | `<h1 data-motion="char-fade-down" data-motion-trigger="load">` |
| "Spokojne wejście nagłówka sekcji słowo po słowie" (no styleguide) | `<h2 data-motion="word-slide-up" data-motion-duration="1.2">` |
| "Ożyw całą stronę", brand is a quiet architecture studio | create `MOTION.md` with preset `calm`; hero `word-slide-up` + `line-slide-up` with duration 1.05, image `image-rise-tilt` with duration 1.55; cards stay static |
| "Make the 'New' badge pop in" (first screen) | `.badge` gets `data-motion="element-scale-in" data-motion-trigger="load"`, NOT `char-pop` |
| "Make the badge pop letter by letter" with a `calm` MOTION.md | off-brand (`char-pop` is in `never`, badge is `none`): say so, leave it static unless the user confirms |
| "Tagline w stopce ma się pisać jak na maszynie" | `<p data-motion="typewriter">` (under 60 chars; footer, no special start attribute needed) |
| "Add parallax to the hero background" | not in Lite: say so, suggest a reveal instead, change nothing in the files |
