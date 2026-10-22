import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  doublePrecision,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/pg-core';
export const users = pgTable('users', {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
  googleSubject: text().unique(),
  role: text().notNull().default('user'),
  verified: boolean().notNull().default(false),
  bio: text().notNull().default(''),
  skills: text().array().notNull().default([]),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
export const sessions = pgTable('sessions', {
  tokenHash: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
});
export const verificationTokens = pgTable('verification_tokens', {
  tokenHash: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp({ withTimezone: true }).notNull(),
});
export type ProjectDetails = {
  buildFormat?: import('./build-formats').BuildFormat;
  problem?: string;
  solution?: string;
  stage?: string;
  traction?: string;
  language?: string;
  license?: string;
  difficulty?: string;
  areas?: string;
  setup?: string;
  contributors?: number;
  launchDate?: string;
  whatsNew?: string;
  media?: string[];
};
export const projects = pgTable('projects', {
  id: text().primaryKey(),
  slug: text().notNull().unique(),
  title: text().notNull(),
  tagline: text().notNull(),
  description: text().notNull(),
  category: text().notNull(),
  ownerId: text()
    .notNull()
    .references(() => users.id),
  status: text().notNull().default('pending'),
  feedback: text().notNull().default(''),
  openSource: boolean().notNull().default(false),
  startup: boolean().notNull().default(false),
  launched: boolean().notNull().default(false),
  featured: boolean().notNull().default(false),
  website: text().notNull().default(''),
  github: text().notNull().default(''),
  demo: text().notNull().default(''),
  tech: text().array().notNull().default([]),
  color: text().notNull().default('lilac'),
  symbol: text().notNull().default('orbit'),
  details: jsonb().$type<ProjectDetails>().notNull().default({}),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
export const members = pgTable(
  'members',
  {
    projectId: text()
      .notNull()
      .references(() => projects.id),
    userId: text()
      .notNull()
      .references(() => users.id),
    role: text().notNull().default('Maker'),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.userId] })],
);
export const periods = pgTable('periods', {
  id: text().primaryKey(),
  label: text().notNull(),
  kind: text().notNull(),
  startsAt: timestamp({ withTimezone: true }).notNull(),
  endsAt: timestamp({ withTimezone: true }).notNull(),
  lockedAt: timestamp({ withTimezone: true }),
  formula: text().notNull().default('weekly-share-v1'),
});
export const entries = pgTable(
  'entries',
  {
    periodId: text()
      .notNull()
      .references(() => periods.id),
    projectId: text()
      .notNull()
      .references(() => projects.id),
  },
  (t) => [primaryKey({ columns: [t.periodId, t.projectId] })],
);
export const supports = pgTable(
  'supports',
  {
    id: text().primaryKey(),
    periodId: text()
      .notNull()
      .references(() => periods.id),
    projectId: text()
      .notNull()
      .references(() => projects.id),
    userId: text()
      .notNull()
      .references(() => users.id),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('one_support_per_project_week').on(t.periodId, t.projectId, t.userId)],
);
export const results = pgTable(
  'results',
  {
    id: text().primaryKey(),
    periodId: text()
      .notNull()
      .references(() => periods.id),
    projectId: text()
      .notNull()
      .references(() => projects.id),
    category: text().notNull(),
    rank: integer().notNull(),
    supportCount: integer().notNull(),
    score: doublePrecision().notNull(),
    titleSnapshot: text().notNull(),
    taglineSnapshot: text().notNull(),
    colorSnapshot: text().notNull(),
    symbolSnapshot: text().notNull(),
  },
  (t) => [
    uniqueIndex('one_result').on(t.periodId, t.category, t.projectId),
    uniqueIndex('one_rank').on(t.periodId, t.category, t.rank),
  ],
);
export const awards = pgTable(
  'awards',
  {
    id: text().primaryKey(),
    title: text().notNull(),
    description: text().notNull(),
    type: text().notNull(),
    rarity: text().notNull().default('rare'),
    projectId: text()
      .notNull()
      .references(() => projects.id),
    periodId: text().references(() => periods.id),
    icon: text().notNull().default('star'),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('unique_project_award').on(t.projectId, t.title)],
);
export const recruitments = pgTable('recruitments', {
  id: text().primaryKey(),
  projectId: text()
    .notNull()
    .references(() => projects.id),
  role: text().notNull(),
  description: text().notNull(),
  skills: text().array().notNull(),
  commitment: text().notNull(),
  compensation: text().notNull(),
  location: text().notNull().default('VIT Vellore / Remote'),
  openings: integer().notNull().default(1),
  applicationUrl: text().notNull(),
  status: text().notNull().default('open'),
});
export const audit = pgTable('audit', {
  id: text().primaryKey(),
  actorId: text()
    .notNull()
    .references(() => users.id),
  action: text().notNull(),
  targetId: text().notNull(),
  note: text().notNull().default(''),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
export const rateLimits = pgTable('rate_limits', {
  key: text().primaryKey(),
  attempts: integer().notNull(),
  resetAt: timestamp({ withTimezone: true }).notNull(),
});
export type Project = typeof projects.$inferSelect;
export type User = typeof users.$inferSelect;
export type Period = typeof periods.$inferSelect;
export type Result = typeof results.$inferSelect;
