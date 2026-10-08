# Drop / KINETIC

Branch: design/kinetic, derived from the preserved design/maximalist branch. Product rules in docs/PRODUCT_RULES.md stay authoritative.

User direction: matte rather than glossy, deliberately overloaded animation and microinteraction. UI UX Pro Max focused searches returned Kinetic Typography and Gen Z Chaos / Maximalism. The explicit user request overrides the skill's default recommendation to limit each view to one or two animated elements. Accessibility, direct project navigation and motion controls still apply.

Visual variance 10 / motion 10 / density 6. Peach graphic stage, ink typography, acid pinwheel, dashed orbit, traveling scribble, offset paper cards. No shaded torus, specular lighting, blur, or gradient sculpture. Letter-level wobble, baseline stretch, breathing type, independently drifting builds, pulsing concentric rings, spinning marks, sticker rocking, moving ribbons and scroll-linked seals.

Reactions: pointer trails and tap bursts on the hero; delegated magnetic buttons and cards; cursor-driven scene rotation; spring press feedback; animated support, monograms and card artwork; category geometry changes; navigation markers; arrow nudges; input focus treatment. Chaos mode accelerates the scene. Native link navigation is preserved. Effects are bounded, cleaned up on pause/unmount and suppressed under reduced motion. Keyboard focus pauses moving project targets. Visibility changes pause CSS motion.

Implementation uses CSS, SVG, requestAnimationFrame, Web Animations and IntersectionObserver. No new dependencies. Main heading retains one accessible name while decorative letters are hidden from assistive technology.

Validation: production build, formatting, lint, types, seven domain tests and thirteen browser tests. Public route checks cover 375/768/1024/1440px and WCAG 2 A/AA + 2.1 AA; the kinetic test verifies cursor/tap reactions, cleanup on pause, stopped glyphs/sculpture and direct project navigation. Local runtime recovery data is excluded from lint/type scans.
