# MVP verification

Automated database checks cover curation, verified/unique/windowed support, locking, immutable results and awards, snapshot titles after project edits, normalized scoring, private discovery, private recruitment, expiring/single-use verification tokens, and completed monthly rankings.

Browser checks exercise a production build with a freshly migrated and seeded local PostgreSQL engine. Public routes are checked at 375, 768, 1024, and 1440px for horizontal overflow and Axe WCAG A/AA violations. Landscape, reduced motion, mobile menu, and empty discovery are also covered.

The end-to-end review flow asserts that reaching the preview does not submit, pending projects return a not-found page to visitors, curator changes reach the builder, resubmission returns to the queue, approval becomes discoverable, the next weekly edition receives an entry, and support remains unavailable before opening. Separate flows cover persistent unique support, locked historical results, unverified signup, curator awards on projects and profiles, role closure/reopening, profile editing, and invalid verification links.

A browser walkthrough also verified the local exhibition. Two decorative overlaps on small screens, premature preview submission, mobile ranking contrast, and Hall of Fame label contrast were found and corrected.

Run the commands in README.md for reproducible checks. Automated accessibility checks complement keyboard, responsive screenshot, and visual review; they do not certify every possible assistive-technology interaction. SMTP delivery and a remote PostgreSQL provider require deployment credentials and have not been exercised against a real external service.
