'use client';

import { useEffect } from 'react';
import { createBrandMarkElement } from '@/lib/brand-mark';

/** Decorative reactions use delegated listeners; ordinary links keep their native behavior. */
export function KineticEffects({ paused }: { paused: boolean }) {
  useEffect(() => {
    if (paused) return;
    const hero = document.querySelector<HTMLElement>('.hero');
    const layer = document.querySelector<HTMLElement>('.reaction-layer');
    const touched = new Set<HTMLElement>();
    const particles = new Set<HTMLElement>();
    const animations = new Set<Animation>();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let lastTrail = 0;
    let frame = 0;
    let scrollFrame = 0;
    let active: HTMLElement | null = null;
    const enabled = () =>
      !document.hidden && !reduced.matches && document.documentElement.dataset.motion === 'running';
    const reset = (element: HTMLElement | null) => {
      element?.style.setProperty('--mx', '0px');
      element?.style.setProperty('--my', '0px');
      element?.style.setProperty('--rx', '0deg');
    };
    const spawn = (x: number, y: number, burst = false) => {
      if (!layer || !enabled() || particles.size > 45) return;
      const particle = document.createElement('span');
      particle.className = burst ? 'click-spark' : 'cursor-stamp';
      particle.append(createBrandMarkElement());
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      layer.appendChild(particle);
      particles.add(particle);
      const animation = particle.animate(
        [
          { transform: 'translate(-50%,-50%) rotate(0deg) scale(.35)', opacity: 1 },
          {
            transform: `translate(calc(-50% + ${Math.random() * 90 - 45}px),calc(-50% - ${burst ? 110 : 45}px)) rotate(${Math.random() * 180 - 90}deg) scale(${burst ? 1.8 : 1})`,
            opacity: 0,
          },
        ],
        { duration: burst ? 850 : 600, easing: 'cubic-bezier(.16,1,.3,1)' },
      );
      animations.add(animation);
      animation.onfinish = () => {
        particle.remove();
        particles.delete(particle);
        animations.delete(animation);
      };
    };
    const move = (event: PointerEvent) => {
      if (!enabled() || event.pointerType !== 'mouse') return;
      const target = (event.target as Element).closest<HTMLElement>(
        '.button,.nav-links a,.project-card,.category-tile,.role-card,.ranking-row,.hall-card',
      );
      if (active !== target) reset(active);
      active = target;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (target) {
          const rect = target.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;
          target.style.setProperty('--mx', `${x * 10}px`);
          target.style.setProperty('--my', `${y * 8}px`);
          target.style.setProperty('--rx', `${x * 3}deg`);
          touched.add(target);
        }
        if (hero && layer && hero.contains(event.target as Node)) {
          const rect = hero.getBoundingClientRect();
          layer.style.setProperty('--cursor-x', `${event.clientX - rect.left}px`);
          layer.style.setProperty('--cursor-y', `${event.clientY - rect.top}px`);
          layer.classList.add('cursor-active');
          if (performance.now() - lastTrail > 85) {
            spawn(event.clientX - rect.left, event.clientY - rect.top);
            lastTrail = performance.now();
          }
        } else layer?.classList.remove('cursor-active');
      });
    };
    const out = (event: PointerEvent) => {
      if (!event.relatedTarget) {
        reset(active);
        layer?.classList.remove('cursor-active');
      }
    };
    const click = (event: MouseEvent) => {
      if (!hero || !enabled()) return;
      const rect = hero.getBoundingClientRect();
      for (let i = 0; i < 7; i++) spawn(event.clientX - rect.left, event.clientY - rect.top, true);
      const target = (event.target as Element).closest<HTMLElement>('.button,.motion-control');
      if (target) {
        const animation = target.animate(
          [
            { scale: '1' },
            { scale: '.91', offset: 0.25 },
            { scale: '1.06', offset: 0.65 },
            { scale: '1' },
          ],
          { duration: 450, easing: 'cubic-bezier(.16,1,.3,1)' },
        );
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      }
    };
    const scroll = () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        const champion = document.querySelector<HTMLElement>('.champion');
        if (champion) {
          const bounds = champion.getBoundingClientRect();
          // Zero degrees exactly when the card's center reaches the viewport's center.
          // Keep the signed distance unclamped so the stamp continues turning past it.
          const offset = innerHeight / 2 - (bounds.top + bounds.height / 2);
          document.documentElement.style.setProperty(
            '--winner-rotation',
            `${(offset / innerHeight) * 120}deg`,
          );
        }
        const distance = document.documentElement.scrollHeight - innerHeight;
        const progress = distance > 0 ? Math.min(1, Math.max(0, scrollY / distance)) : 1;
        document.documentElement.style.setProperty(
          '--scroll-rotation',
          `${-90 * (1 - progress)}deg`,
        );
      });
    };
    scroll();
    // Streamed data and responsive reflow can move the card without a scroll event.
    const layoutObserver = new ResizeObserver(scroll);
    const main = document.querySelector('main');
    if (main) layoutObserver.observe(main);
    document.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerout', out, { passive: true });
    hero?.addEventListener('click', click);
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', scroll);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(scrollFrame);
      layoutObserver.disconnect();
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerout', out);
      hero?.removeEventListener('click', click);
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('resize', scroll);
      touched.forEach(reset);
      animations.forEach((animation) => animation.cancel());
      particles.forEach((particle) => particle.remove());
      layer?.classList.remove('cursor-active');
      document.documentElement.style.removeProperty('--scroll-rotation');
      document.documentElement.style.removeProperty('--winner-rotation');
    };
  }, [paused]);
  return null;
}
