# Drop — design system

Applied UI UX Pro Max: bold/asymmetric composition, spacious density, restrained motion.
The generated developer-tool demo pattern was reviewed and adapted to a curated student exhibition: product discovery is the primary action, rather than a marketing video.

## Art direction
Warm editorial exhibition. Paper #f8f7f2, ink #20221f, orange #fd542f, lilac #dcd3f7, lime #dcebab, peach #f4d1bf. Orange surfaces use dark ink for accessible small text. White on ink. Muted text #62665b. Borders #dedfd6. Error #a32b21. Small orange text uses #b73518; labels on colored honors panels use #45493f. Contrast was checked using Axe at four responsive widths.

## Type and rhythm
System grotesk sans (Arial fallback) with Georgia italic editorial accents. Body 17px / 1.6; metadata 12–14px / 1.5; headings 28–72px; display clamp(56px, 7vw, 104px). Mono metadata for editions and ranks. 8px base spacing, 24/32px gaps, 64/96px sections, max width 1280px. Radius 12px for media, 8px controls, pill tags. No floating dashboard chrome.

## Composition and navigation
Discover is home; Weekly Drop is the signature competition; Honors contains leaderboards and Hall of Fame; Recruit is unranked. Categories are browsable filters rather than six primary navigation items. Submit and builder profile are utility actions. Admin is role-gated.
Home: asymmetrical editorial hero, last champion as illustrated feature, live ranked list plus open-source callout, visual category directory, recruitment, honors archive.

## Components
One ink primary action per context. Secondary bordered/text buttons. 44px minimum targets. Illustrated media uses CSS/SVG native product compositions, not stock pictures. Project cards have discrete project links and support controls. Rankings use large tabular numbers. Achievements resemble restrained award seals; locked periods explicitly labelled with dates and score formula.

## Interaction and accessibility
180ms color/opacity/transform changes; support feedback announces full context. No autoplay, no animation required to reveal content. Reduced motion disables transitions. Focus ring 3px ink with 4px offset, skip link, semantic landmarks, labelled fields, inline errors and focused form summary. Responsive recompose at 640/900px. No horizontal viewport scrolling. Every public surface filters for approved project content.
