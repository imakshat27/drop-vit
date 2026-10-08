# Drop

What VIT is building. A curated builder exhibition for VIT students.

Next.js App Router + TypeScript + Tailwind + Drizzle + PostgreSQL. Development uses a persistent PGlite PostgreSQL engine; production uses `DATABASE_URL`.

Product invariants: only approved projects enter discovery; projects compete, people do not; recruitment never competes; one support per verified user per project per weekly period; locked results and legitimately earned awards are immutable.

## Development

`npm install`, then `npm run db:migrate`, `npm run db:seed`, and `npm run dev`.
See `.env.example` for deployment configuration. Design decisions live in `design-system/drop/MASTER.md`.
