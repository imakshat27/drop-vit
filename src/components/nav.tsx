'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
const links = [
  ['Discover', '/'],
  ['Weekly Drop', '/weekly'],
  ['Honors', '/honors'],
  ['Recruit', '/recruit'],
];
export function Nav({ user }: { user: { name: string; role: string } | null }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container nav">
        <Link href="/" className="wordmark" aria-label="Drop home">
          drop<span className="brand-spark">✳</span>
        </Link>
        <span className="campus-label">VIT EDITION</span>
        <button
          className="menu-toggle"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav className={open ? 'nav-links open' : 'nav-links'} aria-label="Main navigation">
          {links.map(([name, href]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={
                (
                  href === '/'
                    ? path === '/' || path.startsWith('/discover')
                    : path.startsWith(href)
                )
                  ? 'active'
                  : ''
              }
              aria-current={
                (href === '/' ? path === '/' : path.startsWith(href)) ? 'page' : undefined
              }
            >
              {name}
              {name === 'Weekly Drop' && <span className="live-dot" />}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link href="/admin" onClick={() => setOpen(false)}>
              Curate
            </Link>
          )}
          <Link
            className="account-link"
            href={user ? '/me' : '/signin'}
            onClick={() => setOpen(false)}
          >
            {user ? user.name.split(' ')[0] : 'Sign in'}
          </Link>
          <Link className="button small" href="/submit" onClick={() => setOpen(false)}>
            Submit a build <ArrowUpRight size={16} aria-hidden />
          </Link>
        </nav>
      </div>
    </header>
  );
}
