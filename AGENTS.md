# animatefa.st for Codex, Cursor and other agents that read AGENTS.md

Claude Code loads this folder as a skill automatically when it lives in `~/.claude/skills/animatefast/`. Other agents do not, so paste the block below into your project's `AGENTS.md` (Codex) or `.cursor/rules/animatefast.mdc` (Cursor). It points at the same clone.

```md
## Animations (animatefa.st Lite)
When the user asks for text, scroll or load animations, or a motion styleguide, follow `~/.claude/skills/animatefast/SKILL.md`.
- Read the project's `MOTION.md` (brand motion styleguide) first; create it from `~/.claude/skills/animatefast/templates/MOTION.md` for whole-page requests if it is missing.
- Use only the 12 effects in `~/.claude/skills/animatefast/references/SPEC.md`, applied with `data-motion` attributes. Never hand-write GSAP for them.
- Before saying it is done, run `node ~/.claude/skills/animatefast/scripts/lint.cjs <page> --lite --styleguide MOTION.md` and `node ~/.claude/skills/animatefast/scripts/verify.cjs <page>`.
- Never publish a Webflow site; stop at staging and report.
```
