import { BrandSpark } from '@/components/brand-spark';
import Link from 'next/link';
import { GoogleSignin } from '@/components/google-signin';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { ActionForm } from '@/components/action-form';
import { signupAction } from '../actions';
export const metadata = { title: 'Join Drop' };
export default async function Signup() {
  if (await currentUser()) redirect('/me');
  return (
    <main id="main" className="container">
      <div className="auth-layout">
        <div className="auth-art lime">
          <span className="big-asterisk" aria-hidden>
            <BrandSpark className="brand-mark" />
          </span>
          <p className="auth-statement">
            You don’t need
            <br />
            permission <em>to build.</em>
          </p>
          <p>
            A rough prototype. A weekend obsession.
            <br />
            Something you wish existed.
            <br />
            It belongs here.
          </p>
        </div>
        <section className="auth-form">
          <span className="eyebrow">COME ON IN</span>
          <h1 style={{ marginTop: 18 }}>Make a little space for your work.</h1>
          <p>Your builder identity starts with what you make.</p>
          <GoogleSignin />
          <ActionForm action={signupAction} button="Create my profile">
            <div className="field">
              <label htmlFor="name">Your name</label>
              <input
                id="name"
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={80}
              />
            </div>
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
              <small>
                Use your @vitstudent.ac.in email. Google sign-in verifies it automatically; password
                signup needs email verification.
              </small>
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                maxLength={128}
              />
              <small>At least 10 characters. Password managers and paste welcome.</small>
            </div>
          </ActionForm>
          <p className="form-links">
            Already a builder? <Link href="/signin">Sign in →</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
