'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Expand, X } from 'lucide-react';
export function MediaGallery({ urls, title }: { urls: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const start = useRef<number | null>(null);
  const image = urls[active] || urls[0];
  function next(direction: number) {
    setActive((index) => (index + direction + urls.length) % urls.length);
  }
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  function picture(full = false) {
    return failed.includes(image) ? (
      <div className="media-unavailable">This screenshot couldn’t load. Try another image.</div>
    ) : (
      // External legacy images and authorized private uploads cannot use a public optimizer.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={`${title} — screenshot ${active + 1} of ${urls.length}`}
        className={full ? 'media-lightbox-image' : 'media-cover-image'}
        onError={() => setFailed((items) => [...items, image])}
      />
    );
  }
  return (
    <div className="project-gallery">
      <button
        className="media-cover"
        type="button"
        aria-label={`View ${title} screenshots full screen`}
        onClick={() => setOpen(true)}
      >
        {picture()}
        <span className="media-expand">
          <Expand size={17} aria-hidden /> {active + 1} / {urls.length}
        </span>
      </button>
      {urls.length > 1 && (
        <div className="media-thumbnails" role="group" aria-label="Project screenshots">
          {urls.map((url, index) => (
            <button
              key={url}
              type="button"
              aria-label={`Show screenshot ${index + 1}${index === 0 ? ', cover' : ''}`}
              aria-pressed={active === index}
              onClick={() => setActive(index)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <dialog
        ref={dialog}
        className="media-lightbox"
        aria-label={`${title} screenshots`}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            next(event.key === 'ArrowRight' ? 1 : -1);
          }
        }}
        onTouchStart={(event) => {
          start.current = event.touches[0].clientX;
        }}
        onTouchEnd={(event) => {
          if (start.current !== null) {
            const delta = event.changedTouches[0].clientX - start.current;
            if (Math.abs(delta) > 50) next(delta < 0 ? 1 : -1);
            start.current = null;
          }
        }}
      >
        <div className="media-lightbox-toolbar">
          <span aria-live="polite">
            {active + 1} / {urls.length}
          </span>
          <button
            autoFocus
            type="button"
            aria-label="Close screenshots"
            onClick={() => setOpen(false)}
          >
            <X size={24} aria-hidden />
          </button>
        </div>
        {picture(true)}
        {urls.length > 1 && (
          <div className="media-lightbox-navigation">
            <button type="button" aria-label="Previous screenshot" onClick={() => next(-1)}>
              <ArrowLeft aria-hidden />
            </button>
            <button type="button" aria-label="Next screenshot" onClick={() => next(1)}>
              <ArrowRight aria-hidden />
            </button>
          </div>
        )}
      </dialog>
    </div>
  );
}
