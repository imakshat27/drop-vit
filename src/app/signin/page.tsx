import { BrandSpark } from '@/components/brand-spark';
import Link from 'next/link';
import { GoogleSignin } from '@/components/google-signin';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { ActionForm } from '@/components/action-form';
import { loginAction } from '../actions';
export const metadata = { title: 'Sign in' };
export default async function Signin({
  searchParams,
}: {
  searchParams: Promise<{ verification?: string; oauth?: string }>;
}) {
  const { verification, oauth } = await searchParams;
  if (await currentUser()) redirect('/me');
  return (
    <main id="main" className="container">
      {verification === 'complete' && (
        <div className="message" role="status">
          Email verified. Sign in to start supporting builds.
        </div>
      )}
      {oauth && (
        <p className="message error" role="alert">
          {oauth === 'vit-only'
            ? 'Use your VIT Google account ending in @vitstudent.ac.in.'
            : oauth === 'cancelled'
              ? 'Google sign-in was cancelled. Try again when you’re ready.'
              : oauth === 'unavailable'
                ? 'Google sign-in is being configured. Use your VIT email and password for now.'
                : 'Google sign-in did not complete. Please try again.'}
        </p>
      )}
      <div className="auth-layout">
        <div className="auth-art">
          <span className="big-asterisk" aria-hidden>
            <BrandSpark className="brand-mark" />
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
          <GoogleSignin />
          <ActionForm action={loginAction} button="Sign in">
            <div className="field">
              <label htmlFor="email">VIT student email</label>
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
                Builder: ananya@vitstudent.ac.in
                <br />
                Curator: admin@vitstudent.ac.in
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
