# Drop — campus poster wall

Branch: `design/maximalist`. Product rules in docs/PRODUCT_RULES.md remain authoritative.

UI UX Pro Max searches: design-system recommendations were reviewed twice; generic developer-demo/Swiss layouts did not fit this request. Focused style search returned Gen Z Chaos / Maximalism and Memphis Design. This direction takes their collage, sticker layering, clashing brights, geometric patterns and asymmetric composition, with accessible static layouts instead of jitter/GIF overload.

Dials: visual variance 9, motion 2, content density 5. Builds remain primary. Recruitment stays below discovery; all supports, curation, verification, period locking and normalized honors are unchanged.

Palette: warm paper #FFFBEA; ink #191919; acid yellow #E3FF54; lilac #C5ABFF; pink #FF9FC6; coral #FF683D; teal #8DDEDB. Body text uses ink or dark muted #494438. Fonts remain local Arial/Georgia/monospace: heavy grotesque headlines, italic sticker emphasis, utilitarian labels. No remote font dependencies.

Composition: dark navigation, editorial hero plus linked project collage, static exhibition ribbon, pink champion poster, outlined rankings, alternating rotated category tiles, framed build cards, restrained role cards, acid award display. Global visual treatment is in src/app/maximalist.css; existing behavioral/responsive primitives remain in globals.css.

Accessibility: meaningful heading hierarchy, labeled links, dark text on brights, visible blue focus, 44px controls, mobile collage stacking, no autoplay, reduced-motion transition suppression. Validate real production rendering across widths and routes with existing Playwright/Axe suite.

Validation: production build, lint, typecheck, format check, seven domain tests, and eleven end-to-end flows. The public-route suite checks 375/768/1024/1440px layouts with Axe WCAG 2 A/AA and 2.1 AA; mobile menu, reduced motion, and landscape navigation are covered. Visual review includes desktop and mobile hero, Weekly Drop, and full homepage. Lilac honors text contrast and nested mockup typography were corrected during review.
