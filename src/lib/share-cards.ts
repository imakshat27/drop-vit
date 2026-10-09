export type ShareCard = {
  kind: 'build' | 'builder' | 'pick' | 'award';
  title: string;
  description: string;
  path: string;
  tags: string[];
  credit?: string;
  distinction?: string;
  period?: string;
};
export type ShareFormat = 'portrait' | 'story' | 'square';
export const shareFormats = {
  portrait: { label: 'Portrait', width: 1080, height: 1350 },
  story: { label: 'Story', width: 1080, height: 1920 },
  square: { label: 'Square', width: 1080, height: 1080 },
} as const;
export const shareLabels = {
  build: 'The build',
  builder: 'Builder card',
  pick: 'Curator pick',
  award: 'Earned award',
};
export function shareUrl(card: ShareCard) {
  return `https://droppp.tech${card.path}`;
}
export function shareCaption(card: ShareCard, owner = false) {
  const intro =
    card.kind === 'builder'
      ? owner
        ? 'A little look at what I’m building.'
        : `Meet ${card.title}, a builder on Drop.`
      : card.kind === 'award'
        ? `${card.title} earned ${card.distinction}${card.period ? ` · ${card.period}` : ''} on Drop.`
        : card.kind === 'pick'
          ? `${card.title} is a curator pick on Drop.`
          : owner
            ? `I’ve been building ${card.title}.`
            : `Worth a look: ${card.title}.`;
  const credit = card.credit && !owner ? `\nBuilt by ${card.credit}.` : '';
  return `${intro}\n\n${card.description}${credit}\n\n${shareUrl(card)}\n\nBuilt here. Dropped weekly. #Drop #StudentBuilders`;
}
export function projectShareCards(
  p: {
    title: string;
    tagline: string;
    slug: string;
    tech: string[];
    featured: boolean;
  },
  credit?: string,
): ShareCard[] {
  const build: ShareCard = {
    kind: 'build',
    title: p.title,
    description: p.tagline,
    path: `/projects/${p.slug}`,
    tags: p.tech.slice(0, 3),
    credit,
  };
  return p.featured ? [build, { ...build, kind: 'pick', distinction: 'Curator pick' }] : [build];
}
export function builderShareCard(u: {
  id: string;
  name: string;
  bio: string;
  skills: string[];
}): ShareCard {
  return {
    kind: 'builder',
    title: u.name,
    description: u.bio || 'Building something worth sharing.',
    path: `/builders/${u.id}`,
    tags: u.skills.slice(0, 3),
  };
}
