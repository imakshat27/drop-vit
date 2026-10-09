import { randomUUID, randomBytes } from 'node:crypto';
import { db, database } from '../src/lib/db';
import {
  users,
  projects,
  members,
  periods,
  entries,
  supports,
  results,
  awards,
  recruitments,
} from '../src/lib/schema';
import { hashPassword } from '../src/lib/password';
import { weekBounds } from '../src/lib/constants';
const fixtures = [
  {
    id: 'canvas',
    title: 'Canvas Club',
    tagline: 'Your next great idea starts with a messy canvas.',
    category: 'Projects',
    color: 'peach',
    symbol: 'canvas',
    ownerId: 'ananya',
    tech: ['React', 'Excalidraw', 'WebSockets'],
    description:
      'A collaborative thinking space for student teams. Sketch the rough idea, map the next step, and turn late-night conversations into something you can build. Canvas Club brings whiteboards, notes, and tasks into one shared room.',
    details: {
      problem: 'Project ideas disappear between group chats and scattered notes.',
      solution: 'A shared, multiplayer canvas where every sticky note can become a task.',
    },
  },
  {
    id: 'patchwork',
    title: 'Patchwork',
    tagline: 'Your first open-source contribution, minus the overwhelm.',
    category: 'Open Source',
    color: 'lilac',
    symbol: 'patch',
    ownerId: 'arjun',
    tech: ['TypeScript', 'Next.js', 'GitHub API'],
    openSource: true,
    description:
      'Patchwork matches first-time contributors with approachable issues. Every issue includes a little context, an estimated effort, and a human who can help. Built by students who remember how intimidating that first pull request felt.',
    details: {
      language: 'TypeScript',
      license: 'MIT',
      difficulty: 'Beginner friendly',
      areas: 'Accessibility, issue matching, documentation',
      setup: 'Clone the repository, run npm install, copy .env.example, then npm run dev.',
      contributors: 14,
      problem: 'Finding a genuinely approachable first issue takes longer than solving one.',
    },
  },
  {
    id: 'afterhours',
    title: 'Afterhours',
    tagline: 'Find your people. Make something after class.',
    category: 'Startups',
    color: 'lime',
    symbol: 'orbit',
    ownerId: 'diya',
    tech: ['Flutter', 'Supabase'],
    startup: true,
    description:
      'Small, intentional coworking circles for campus makers. Afterhours helps you find three people with complementary skills and one evening a week to build together. No networking theatre, just shared momentum.',
    details: {
      stage: 'Early beta',
      traction: '42 student teams in a fictional campus pilot',
      problem: 'Good collaborators are hard to find outside your department.',
      solution: 'Skill-based matching and recurring small-group build sessions.',
    },
  },
  {
    id: 'folio',
    title: 'Folio',
    tagline: 'A portfolio that shows the work behind the work.',
    category: 'Launches',
    color: 'sky',
    symbol: 'folio',
    ownerId: 'ishaan',
    tech: ['Next.js', 'MDX', 'Tailwind'],
    launched: true,
    description:
      'A beautifully simple portfolio kit for student builders. Show the problem, the experiments, and the thing you shipped. Folio turns your project folder into a story worth sharing.',
    details: {
      launchDate: '2026-10-06',
      whatsNew: 'Version 1.0 adds case-study templates, custom domains, and accessible themes.',
    },
  },
  {
    id: 'messmate',
    title: 'Messmate',
    tagline: 'Less food waste. More good meals.',
    category: 'Startups',
    color: 'peach',
    symbol: 'meal',
    ownerId: 'ananya',
    tech: ['Python', 'FastAPI', 'PostgreSQL'],
    startup: true,
    description:
      'A demand forecasting tool for campus kitchens. Anonymous meal intentions help kitchens prepare the right amount, while students see menus and dietary information before they walk over.',
    details: {
      stage: 'Prototype',
      problem: 'Kitchens plan for fixed headcounts while student attendance varies.',
      solution: 'Simple meal intentions and aggregate demand forecasting.',
    },
  },
  {
    id: 'tinyml',
    title: 'TinyML Lab',
    tagline: 'Big machine-learning ideas. Very small devices.',
    category: 'Open Source',
    color: 'lime',
    symbol: 'chip',
    ownerId: 'arjun',
    tech: ['C++', 'TensorFlow Lite', 'ESP32'],
    openSource: true,
    description:
      'A collection of reproducible edge-ML experiments for the ESP32. Each experiment includes a bill of materials, training notebooks, and a documented failure or two.',
    details: {
      language: 'C++',
      license: 'Apache-2.0',
      difficulty: 'Intermediate',
      areas: 'Sensor drivers, model compression, tutorial writing',
      setup: 'Install PlatformIO, connect an ESP32, and run pio run for the selected example.',
      contributors: 8,
    },
  },
  {
    id: 'signal',
    title: 'Signal',
    tagline: 'Campus events, without the twenty group chats.',
    category: 'Projects',
    color: 'sky',
    symbol: 'signal',
    ownerId: 'diya',
    tech: ['React Native', 'Node.js'],
    description:
      'One calm place to discover workshops, exhibitions, and student-run events. Save what interests you, see venue accessibility, and get a reminder before it starts.',
  },
  {
    id: 'tabzero',
    title: 'Tab Zero',
    tagline: 'A fresh start for your very chaotic browser.',
    category: 'Launches',
    color: 'lilac',
    symbol: 'tabs',
    ownerId: 'ishaan',
    tech: ['TypeScript', 'Chrome Extensions'],
    launched: true,
    description:
      'A tiny extension that groups your tabs by project and gives you a quiet new-tab page. Built during a weekend, shipped before Monday.',
    details: {
      launchDate: '2026-10-07',
      whatsNew: 'Workspace snapshots, keyboard shortcuts, and local-only storage.',
    },
  },
];
async function main() {
  if ((await db().select().from(users).limit(1)).length) {
    console.log('Seed skipped: database already contains users');
    await database().close();
    return;
  }
  if (process.env.NODE_ENV === 'production')
    throw new Error('Fictional seed data is development-only');
  const password = process.env.SEED_DEMO_PASSWORD || randomBytes(32).toString('hex');
  const hash = await hashPassword(password);
  await db().transaction(async (tx) => {
    await tx.insert(users).values([
      {
        id: 'ananya',
        name: 'Ananya Rao',
        email: 'ananya@vitstudent.ac.in',
        passwordHash: hash,
        verified: true,
        bio: 'Making tools for people with too many ideas. CSE · VIT Vellore, 2027.',
        skills: ['Product design', 'React', 'Creative coding'],
      },
      {
        id: 'arjun',
        name: 'Arjun Mehta',
        email: 'arjun@vitstudent.ac.in',
        passwordHash: hash,
        verified: true,
        bio: 'Open-source enthusiast. Learning in public, one pull request at a time.',
        skills: ['TypeScript', 'C++', 'Open source'],
      },
      {
        id: 'diya',
        name: 'Diya Menon',
        email: 'diya@vitstudent.ac.in',
        passwordHash: hash,
        verified: true,
        bio: 'Finding small solutions to everyday campus problems. ECE · Class of 2027.',
        skills: ['Flutter', 'Research', 'Prototyping'],
      },
      {
        id: 'ishaan',
        name: 'Ishaan Shah',
        email: 'ishaan@vitstudent.ac.in',
        passwordHash: hash,
        verified: true,
        bio: 'Shipping small things that make the internet a little nicer.',
        skills: ['Next.js', 'Design', 'TypeScript'],
      },
      {
        id: 'admin',
        name: 'Drop Curator',
        email: 'admin@vitstudent.ac.in',
        passwordHash: hash,
        role: 'admin',
        verified: true,
        bio: 'The people behind the weekly exhibition.',
      },
      ...Array.from({ length: 132 }, (_, i) => ({
        id: `supporter-${i}`,
        name: `Sample builder ${i + 1}`,
        email: `builder-${i}@vitstudent.ac.in`,
        passwordHash: hash,
        verified: true,
      })),
    ]);
    await tx.insert(projects).values(
      fixtures.map((p, index) => ({
        ...p,
        createdAt: new Date(Date.now() - (12 - index) * 86400000),
        slug: p.id,
        status: 'approved',
        featured: p.id === 'canvas',
        github: p.openSource ? 'https://github.com/topics/good-first-issue' : '',
        details: p.details || {},
      })),
    );
    await tx
      .insert(members)
      .values(fixtures.map((p) => ({ projectId: p.id, userId: p.ownerId, role: 'Creator' })));
    await tx.insert(members).values([
      { projectId: 'canvas', userId: 'ishaan', role: 'Engineer' },
      { projectId: 'patchwork', userId: 'ananya', role: 'Designer' },
    ]);
    const { start, end } = weekBounds();
    const previousStart = new Date(start.getTime() - 7 * 86400000);
    const monthStart = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1) - 330 * 60000,
    );
    const monthEnd = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1) - 330 * 60000,
    );
    await tx.insert(periods).values([
      {
        id: 'week-18',
        label: 'Drop #18',
        kind: 'weekly',
        startsAt: start,
        endsAt: end,
        formula: 'weekly-support-v1',
      },
      {
        id: 'week-17',
        label: 'Drop #17',
        kind: 'weekly',
        startsAt: previousStart,
        endsAt: start,
        formula: 'weekly-support-v1',
      },
      {
        id: 'week-19',
        label: 'Drop #19',
        kind: 'weekly',
        startsAt: end,
        endsAt: new Date(end.getTime() + 7 * 86400000),
        formula: 'weekly-support-v1',
      },
      {
        id: 'month-current',
        label: monthStart.toLocaleDateString('en-IN', {
          month: 'long',
          year: 'numeric',
          timeZone: 'Asia/Kolkata',
        }),
        kind: 'monthly',
        startsAt: monthStart,
        endsAt: monthEnd,
      },
      {
        id: 'month-september',
        label: 'September 2026',
        kind: 'monthly',
        startsAt: new Date('2026-08-31T18:30:00Z'),
        endsAt: new Date('2026-09-30T18:30:00Z'),
      },
      {
        id: 'year-2026',
        label: '2026',
        kind: 'yearly',
        startsAt: new Date('2025-12-31T18:30:00Z'),
        endsAt: new Date('2026-12-31T18:30:00Z'),
      },
      {
        id: 'all-time',
        label: 'All time',
        kind: 'all-time',
        startsAt: new Date('2025-01-01T00:00:00Z'),
        endsAt: new Date('2100-01-01T00:00:00Z'),
      },
    ]);
    await tx
      .insert(entries)
      .values(
        fixtures
          .filter((p) => p.id !== 'canvas')
          .map((p) => ({ periodId: 'week-18', projectId: p.id })),
      );
    for (const [index, p] of fixtures.filter((p) => p.id !== 'canvas').entries()) {
      const count = [128, 96, 84, 63, 48, 32, 21][index];
      await tx.insert(supports).values(
        Array.from({ length: count }, (_, i) => ({
          id: randomUUID(),
          projectId: p.id,
          periodId: 'week-18',
          userId: `supporter-${i}`,
        })),
      );
    }
    for (const periodId of ['week-17', 'month-september']) {
      const winners = [fixtures[0], fixtures[1], fixtures[2]];
      await tx.insert(results).values(
        winners.flatMap((p, i) => [
          {
            id: randomUUID(),
            periodId,
            projectId: p.id,
            category: 'Overall',
            rank: i + 1,
            supportCount: [246, 182, 121][i],
            score: [44.81, 33.15, 22.04][i],
            titleSnapshot: p.title,
            taglineSnapshot: p.tagline,
            colorSnapshot: p.color,
            symbolSnapshot: p.symbol,
          },
          {
            id: randomUUID(),
            periodId,
            projectId: p.id,
            category: p.category,
            rank: 1,
            supportCount: [246, 182, 121][i],
            score: 100,
            titleSnapshot: p.title,
            taglineSnapshot: p.tagline,
            colorSnapshot: p.color,
            symbolSnapshot: p.symbol,
          },
        ]),
      );
      const { eq } = await import('drizzle-orm');
      await tx
        .update(periods)
        .set({ lockedAt: new Date(periodId === 'week-17' ? start : '2026-09-30T18:30:00Z') })
        .where(eq(periods.id, periodId));
    }
    await tx.insert(awards).values([
      {
        id: 'award-canvas',
        projectId: 'canvas',
        periodId: 'week-17',
        title: 'Project of the Week — Drop #17',
        description: 'First place in the seventeenth weekly exhibition.',
        type: 'earned',
        rarity: 'gold',
      },
      {
        id: 'award-patch',
        projectId: 'patchwork',
        periodId: 'month-september',
        title: 'Open Source Winner — Sep ’26',
        description: 'First place in the locked September open-source rankings.',
        type: 'earned',
        rarity: 'gold',
      },
      {
        id: 'award-canvas-month',
        projectId: 'canvas',
        periodId: 'month-september',
        title: 'Project of the Month — Sep ’26',
        description: 'September’s standout student project.',
        type: 'earned',
        rarity: 'gold',
      },
      {
        id: 'award-diya',
        projectId: 'afterhours',
        title: 'Faculty Pick',
        description: 'Selected by the curation team for thoughtful campus impact.',
        type: 'special',
      },
      ...fixtures.map((p) => ({
        id: `first-${p.id}`,
        projectId: p.id,
        title: 'First Project',
        description: 'Made something and shared it with the world.',
        type: 'earned',
        rarity: 'common',
      })),
    ]);
    await tx.insert(recruitments).values([
      {
        id: 'role-patch',
        projectId: 'patchwork',
        role: 'Frontend collaborator',
        description:
          'Help make the first-contribution experience more welcoming. Work on accessible issue cards and matching flows.',
        skills: ['React', 'Accessibility'],
        commitment: '4–6 hours / week',
        compensation: 'Unpaid · learning collaboration',
        applicationUrl: 'mailto:arjun@vitstudent.ac.in',
      },
      {
        id: 'role-after',
        projectId: 'afterhours',
        role: 'Product designer',
        description:
          'Shape a calmer way for students to find their next collaborator. From user interviews to the very first prototype.',
        skills: ['Figma', 'User research'],
        commitment: '6–8 hours / week',
        compensation: 'Equity discussion',
        applicationUrl: 'mailto:diya@vitstudent.ac.in',
      },
      {
        id: 'role-tiny',
        projectId: 'tinyml',
        role: 'Embedded tinkerer',
        description:
          'Bring a sensor, a curious mind, and a willingness to document the things that break.',
        skills: ['C++', 'ESP32'],
        commitment: '3–5 hours / week',
        compensation: 'Unpaid · open source',
        applicationUrl: 'mailto:arjun@vitstudent.ac.in',
      },
    ]);
  });
  console.log('Seeded fictional projects, builders, supports, and locked archive.');
  if (process.env.SEED_DEMO_PASSWORD)
    console.log(
      'Demo sign-in: ananya@vitstudent.ac.in / admin@vitstudent.ac.in with SEED_DEMO_PASSWORD',
    );
  await database().close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
