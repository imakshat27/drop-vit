import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { ActionForm } from '@/components/action-form';
import { loginAction } from '../actions';
export const metadata = { title: 'Sign in' };
export default async function Signin({
  searchParams,
}: {
  searchParams: Promise<{ verification?: string }>;
}) {
  const { verification } = await searchParams;
  if (await currentUser()) redirect('/me');
  return (
    <main id="main" className="container">
      {verification === 'complete' && (
        <div className="message" role="status">
          Email verified. Sign in to start supporting builds.
        </div>
      )}
      <div className="auth-layout">
        <div className="auth-art">
          <span className="big-asterisk" aria-hidden>
            ✳
          </span>
          <p className="auth-statement">
            Your next great thing
            <br />
            starts <em>right here.</em>
          </p>
          <p>
            Back a build. Find your people.
            <br />
            Share something you’re proud of.
          </p>
        </div>
        <section className="auth-form">
          <span className="eyebrow">GOOD TO HAVE YOU BACK</span>
          <h1 style={{ marginTop: 18 }}>Welcome to the workshop.</h1>
          <p>Sign in to build, share, and support.</p>
          <ActionForm action={loginAction} button="Sign in">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={128}
              />
            </div>
          </ActionForm>
          <p className="form-links">
            New around here? <Link href="/signup">Create your builder profile →</Link>
          </p>
          {!process.env.DATABASE_URL && (
            <div className="message">
              <b>Trying the sample exhibition?</b>
              <p>
                Builder: ananya@demo.drop.test
                <br />
                Curator: admin@demo.drop.test
              </p>
              <p className="understated">
                Use the password supplied to SEED_DEMO_PASSWORD when seeding.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
