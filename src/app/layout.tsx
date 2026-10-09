import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { BrandSpark } from '@/components/brand-spark';
import { ArrowUpRight } from 'lucide-react';
import { Nav } from '@/components/nav';
import { RecoveryToast } from '@/components/recovery-toast';
import { currentUser } from '@/lib/auth';
import './globals.css';
import './maximalist.css';
import './otherworld.css';
import './kinetic.css';
import './share.css';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: { default: 'Drop — What VIT is building.', template: '%s · Drop' },
  description: 'Discover the projects, open source, and startups built between lectures at VIT.',
  metadataBase: new URL(process.env.APP_URL || 'https://droppp.tech'),
};
async function AccountNav() {
  const user = await currentUser();
  return <Nav user={user ? { name: user.name, role: user.role } : null} />;
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Suspense fallback={<Nav user={null} pending />}>
          <AccountNav />
        </Suspense>
        {children}
        <RecoveryToast />
        <footer className="site-footer">
          <div className="container footer-top">
            <div>
              <Link href="/" className="wordmark" aria-label="Drop home">
                drop
                <BrandSpark />
              </Link>
              <p>Built here. Dropped weekly.</p>
            </div>
            <p>
              A little corner of the internet
              <br />
              for the things we make.
            </p>
            <Link href="/submit" prefetch={false} className="text-link">
              Your idea belongs here <ArrowUpRight size={20} aria-hidden />
            </Link>
          </div>
          <div className="container footer-bottom">
            <span>VIT, India · Independent student community</span>
            <span>Curated projects. Real builders.</span>
            {!process.env.DATABASE_URL && (
              <span className="demo-label">Fictional sample exhibition</span>
            )}
          </div>
        </footer>
      </body>
    </html>
  );
}
