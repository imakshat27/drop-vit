'use client';
import { BrandSpark } from '@/components/brand-spark';
import Link from 'next/link';
export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main id="main" className="container" style={{ paddingTop: 50 }}>
      <div className="empty">
        <span className="empty-spark" aria-hidden>
          <BrandSpark className="brand-mark" />
        </span>
        <h1 style={{ fontSize: 42 }}>A little workshop hiccup.</h1>
        <p>We couldn’t load this part of Drop. Give it another try.</p>
        <button className="button" onClick={retry}>
          Try again
        </button>
        <br />
        <Link className="text-link" href="/">
          Back to discovery →
        </Link>
      </div>
    </main>
  );
}
