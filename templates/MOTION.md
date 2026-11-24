---
# animatefast motion styleguide. Lives in the project root as MOTION.md.
# The agent reads this before adding any animation. Values: see SPEC.md section 4.
animatefast: 0.1
preset: calm            # calm | playful | bold
tempo: 1.3              # 0.6-1.6, duration multiplier (higher = slower)
stagger: 1.2            # 0.6-1.6, per-item stagger multiplier
easing: soft            # soft | spring
intensity: low          # low | medium | high
max_effects: 3          # distinct effects per page, max 5
first_screen: load
roles:
  hero_heading: [word-slide-up, char-fade-down]
  heading: [word-slide-up]
  body: [line-slide-up]
  cta: none
  card: none
  image: [image-rise-tilt]
  badge: none
never: [char-pop, char-wave, char-flip-y, char-scale-blur, typewriter, element-from-bottom, element-from-left, element-scale-in]
---

# Motion styleguide: {Project name}

Brand feel in one line: {e.g. quiet, editorial, confident; motion should feel like turning a page}.

- Skip motion on: navigation, forms, pricing tables, legal text.
- Notes for the agent: {anything specific, e.g. "case study pages may use image-rise-tilt on every hero image"}.
