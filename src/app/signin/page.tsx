import { BrandSpark } from '@/components/brand-spark';
import Link from 'next/link';
import { ArrowUpRight, Code2, Users, ArrowUp } from 'lucide-react';
import { GoogleSignin } from '@/components/google-signin';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
export const metadata = { title: 'Join the workshop' };
export default async function Signin({
  searchParams,
}: {
  searchParams: Promise<{ oauth?: string }>;
}) {
  const { oauth } = await searchParams;
  if (await currentUser()) redirect('/me');
  return (
    <main id="main" className="container google-auth-page">
      <div className="google-auth-shell">
        <aside className="google-auth-poster" aria-label="The Drop workshop">
          <span className="eyebrow">BUILT BETWEEN CLASSES</span>
          <BrandSpark className="google-auth-spark" />
          <p className="google-auth-statement">
            A little obsession.
            <br />A lot of <em>possibility.</em>
          </p>
          <p>The things you make deserve a place in the world.</p>
          <span className="google-auth-poster-note">
            YOUR WORK. YOUR PEOPLE. YOUR NEXT WHAT IF.
          </span>
        </aside>
        <section className="google-auth-entry" aria-labelledby="auth-title">
          <span className="eyebrow">COME ON IN</span>
          <h1 id="auth-title">
            Welcome to
            <br />
            the workshop.
          </h1>
          <p className="google-auth-intro">
            Your Google account. Your place in VIT’s builder community.
          </p>
          <ul className="google-auth-benefits">
            <li>
              <Code2 size={20} aria-hidden />
              <span>Give your build a place to shine.</span>
            </li>
            <li>
              <ArrowUp size={20} aria-hidden />
              <span>Back the projects you believe in.</span>
            </li>
            <li>
              <Users size={20} aria-hidden />
              <span>Find your next collaborator.</span>
            </li>
          </ul>
          {oauth && (
            <p className="message error" role="alert">
              {oauth === 'cancelled'
                ? 'Google sign-in was cancelled. You can try again below.'
                : oauth === 'unavailable'
                  ? 'Google sign-in is temporarily unavailable. Please try again later.'
                  : 'Google sign-in did not complete. Please try again.'}
            </p>
          )}
          <GoogleSignin />
          <p className="google-auth-note">
            New here? We’ll create your builder profile. Already part of Drop? You’ll pick up where
            you left off.
          </p>
          <Link href="/discover" className="text-link google-auth-browse">
            Just looking? Explore the builds <ArrowUpRight size={18} aria-hidden />
          </Link>
        </section>
      </div>
    </main>
  );
}
