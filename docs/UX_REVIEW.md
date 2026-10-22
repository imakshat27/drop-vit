# Product flow review · 22 October 2026

The visual direction and existing category/ranking rules are preserved.

## Changes shipped

- **Navigation:** Discover opens `/discover`; the brand goes home. Active navigation and accessible current-page state agree.
- **Submission:** build format is independent of category. Websites, mobile and desktop apps, CLI tools, packages, APIs, games, hardware, design, research and other work fit the same flow. Choosing Open Source still requires a repository; other builds do not require a website, demo or public source code.
- **Links:** the project link can lead to a registry, download, documentation, store, prototype, paper or project log. Demo links can be videos or walkthroughs. Repository links support hosts beyond GitHub and are available without declaring a project open source.
- **Trying a build:** installation, prerequisites and usage instructions are available for every format, including closed-source work. Instructions are displayed as escaped text; Drop does not execute commands. Project actions use format-specific labels.
- **Images:** guidance includes terminal captures, photos and diagrams. Uploads remain up to four optimized images; binaries and arbitrary files are not accepted.
- **Discovery:** formats have their own filter and search vocabulary. Format, category and text search combine, survive category changes, and can be cleared. Filtered public responses remain eligible for the existing edge cache.
- **Release privacy:** new formats use the same release policy. Approval schedules a build; it stays private until its first Drop opens.

Existing builds keep their data and remain discoverable in All formats. They are not silently guessed into a format; format-specific filters show explicitly classified builds. New submissions and editable submissions store the choice in the existing project details JSON, with no database migration.

## Useful next improvements

1. **Resume an interrupted submission.** Drafts currently survive step changes but not leaving the page. An explicit save/restore draft action would help longer submissions; avoid silently retaining private work on shared devices.
2. **Return to the original task after Google login.** Sign-in currently goes to the workshop. Submitting or supporting should eventually return to the intended build or page, with a validated local destination and no automatic replay of a support action.
3. **Format-specific discovery examples.** Use real terminal captures, hardware photos, package docs and prototypes in the launch catalogue. Do not make every project look like a SaaS landing page.
4. **Structured compatibility information when demand warrants it.** Platforms, package versions, licenses, hardware requirements and accessibility information can become optional fields. The getting-started instructions handle these today without overwhelming every submitter with a long form.

Do not accept executable uploads or run a contributor's installation commands to preview their build. External release/registry links and user-supplied image previews are sufficient for this iteration.
