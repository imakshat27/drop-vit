'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Orbit } from 'lucide-react';

export function MotionControl() {
  const revealed = useRef(new WeakSet<Element>());
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [warped, setWarped] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(preference.matches);
    sync();
    preference.addEventListener('change', sync);
    return () => preference.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      root.dataset.motion = paused || reduced || document.hidden ? 'paused' : 'running';
    };
    update();
    document.addEventListener('visibilitychange', update);
    const scene = document.querySelector<HTMLElement>('.orbit-scene');
    let frame = 0;
    const pointer = (event: PointerEvent) => {
      if (!scene || paused || reduced || event.pointerType !== 'mouse') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = scene.getBoundingClientRect();
        scene.style.setProperty(
          '--tilt-x',
          `${((event.clientY - rect.top) / rect.height - 0.5) * -8}deg`,
        );
        scene.style.setProperty(
          '--tilt-y',
          `${((event.clientX - rect.left) / rect.width - 0.5) * 10}deg`,
        );
      });
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      scene?.style.setProperty('--tilt-x', '0deg');
      scene?.style.setProperty('--tilt-y', '0deg');
    };
    reset();
    scene?.addEventListener('pointermove', pointer);
    scene?.addEventListener('pointerleave', reset);
    const animations: Animation[] = [];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (!paused && !reduced && !revealed.current.has(entry.target)) {
            animations.push(
              entry.target.animate(
                [
                  { opacity: 0.2, transform: 'translateY(28px)' },
                  { opacity: 1, transform: 'translateY(0)' },
                ],
                { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)' },
              ),
            );
          }
          revealed.current.add(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 },
    );
    document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
    return () => {
      document.removeEventListener('visibilitychange', update);
      scene?.removeEventListener('pointermove', pointer);
      scene?.removeEventListener('pointerleave', reset);
      reset();
      observer.disconnect();
      animations.forEach((animation) => animation.cancel());
      root.dataset.motion = 'paused';
    };
  }, [paused, reduced]);

  useEffect(() => {
    document.documentElement.dataset.warp = warped ? 'on' : 'off';
    return () => {
      delete document.documentElement.dataset.warp;
    };
  }, [warped]);

  return (
    <div className="motion-tools">
      <button
        className="motion-control warp-control"
        type="button"
        onClick={() => setWarped(!warped)}
        aria-pressed={warped}
      >
        <Orbit size={15} aria-hidden />
        {warped ? 'Restore orbit' : 'Warp space'}
      </button>
      <button
        className="motion-control"
        type="button"
        onClick={() => setPaused(!paused)}
        disabled={reduced}
        aria-pressed={paused || reduced}
      >
        {paused || reduced ? <Play size={14} aria-hidden /> : <Pause size={14} aria-hidden />}
        {reduced ? 'Reduced motion' : paused ? 'Play motion' : 'Pause motion'}
      </button>
    </div>
  );
}
