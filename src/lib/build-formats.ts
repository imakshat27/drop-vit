export const buildFormats = [
  ['web', 'Website / web app'],
  ['mobile', 'Mobile app'],
  ['desktop', 'Desktop app'],
  ['cli', 'CLI tool'],
  ['package', 'Package / library'],
  ['api', 'API / developer tool'],
  ['game', 'Game'],
  ['hardware', 'Hardware / physical build'],
  ['design', 'Design / creative work'],
  ['research', 'Research / experiment'],
  ['other', 'Something else'],
] as const;
export type BuildFormat = (typeof buildFormats)[number][0];
export const buildFormatIds = buildFormats.map(([id]) => id) as [BuildFormat, ...BuildFormat[]];
export function formatLabel(format?: string) {
  return buildFormats.find(([id]) => id === format)?.[1];
}
export function buildLinkLabel(format?: string) {
  switch (format) {
    case 'cli':
      return 'Get the CLI';
    case 'package':
      return 'Get the package';
    case 'mobile':
    case 'desktop':
      return 'Get the app';
    case 'api':
      return 'Read the docs';
    case 'game':
      return 'Play the game';
    case 'hardware':
      return 'Explore the build';
    case 'design':
      return 'View the work';
    case 'research':
      return 'Explore the research';
    default:
      return 'Visit the project';
  }
}
export function buildLinkHint(format?: string) {
  switch (format) {
    case 'cli':
      return 'A release page, download, or docs. A hosted website is not required.';
    case 'package':
      return 'Your npm, PyPI, crates.io, or other package page.';
    case 'mobile':
    case 'desktop':
      return 'An app store, download, release page, or project website.';
    case 'api':
      return 'API documentation, a playground, or a developer portal.';
    case 'game':
      return 'A playable build, store page, or download.';
    case 'hardware':
      return 'Build notes, a project log, or a page explaining the prototype.';
    case 'design':
      return 'A portfolio, prototype, or case study.';
    case 'research':
      return 'A paper, notebook, dataset, or experiment write-up.';
    default:
      return 'A project page, download, documentation, or other full https:// link.';
  }
}
