'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
const links = [
  ['Discover', '/'],
  ['Weekly Drop', '/weekly'],
  ['Honors', '/honors'],
  ['Recruit', '/recruit'],
];
export function Nav({
  user,
  pending = false,
}: {
  user: { name: string; role: string } | null;
  pending?: boolean;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const background = () => {
      const footer = document.querySelector('.site-footer');
      const atBottom =
        scrollY > 0 && scrollY + innerHeight >= document.documentElement.scrollHeight - 2;
      document.documentElement.style.setProperty(
        '--viewport-background',
        atBottom && footer
          ? getComputedStyle(footer).backgroundColor
          : path === '/'
            ? 'var(--hero-surface)'
            : 'var(--paper)',
      );
    };
    background();
    window.addEventListener('scroll', background, { passive: true });
    window.addEventListener('resize', background);
    return () => {
      window.removeEventListener('scroll', background);
      window.removeEventListener('resize', background);
      document.documentElement.style.removeProperty('--viewport-background');
    };
  }, [path]);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', outside);
    return () => {
      document.removeEventListener('keydown', escape);
      document.removeEventListener('pointerdown', outside);
    };
  }, [open]);
  return (
    <header
      className="site-header"
      ref={header}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <div className="container nav">
        <Link href="/" className="wordmark" aria-label="Drop home">
          drop<span className="brand-spark">✳</span>
        </Link>
        <span className="campus-label">VIT EDITION</span>
        <button
          className="menu-toggle"
          ref={toggle}
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls="main-navigation"
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav
          id="main-navigation"
          className={open ? 'nav-links open' : 'nav-links'}
          aria-label="Main navigation"
        >
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
              {name === 'Weekly Drop' && <span className="live-dot" aria-hidden="true" />}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link href="/admin" prefetch={false} onClick={() => setOpen(false)}>
              Curate
            </Link>
          )}
          {pending ? (
            <span className="nav-account-loading" aria-label="Loading account" />
          ) : (
            <Link
              className="account-link"
              href={user ? '/me' : '/signin'}
              prefetch={false}
              onClick={() => setOpen(false)}
            >
              {user ? user.name.split(' ')[0] : 'Sign in'}
            </Link>
          )}
          <Link
            className="button small"
            href="/submit"
            prefetch={false}
            onClick={() => setOpen(false)}
          >
            Submit a build <ArrowUpRight size={16} aria-hidden />
          </Link>
        </nav>
      </div>
    </header>
  );
}
