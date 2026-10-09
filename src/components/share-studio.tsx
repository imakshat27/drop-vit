'use client';
import { useEffect, useRef, useState } from 'react';
import { Download, X, Copy, Share2 } from 'lucide-react';
import {
  shareCaption,
  shareFormats,
  shareLabels,
  shareUrl,
  type ShareCard,
  type ShareFormat,
} from '@/lib/share-cards';
import { renderSharePoster } from '@/lib/share-poster';

export default function ShareStudio({
  cards,
  owner,
  onClose,
}: {
  cards: ShareCard[];
  owner: boolean;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const [format, setFormat] = useState<ShareFormat>('portrait');
  const [image, setImage] = useState<{ blob: Blob; url: string; key: string }>();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const card = cards[index];
  const key = `${index}:${format}`;
  const ready = image?.key === key;
  const caption = shareCaption(card, owner);
  const file = ready
    ? new File([image.blob], `drop-${card.kind}-${format}.png`, { type: 'image/png' })
    : undefined;
  const canShare =
    !!file && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    let url: string | undefined;
    renderSharePoster(card, format)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setImage({ blob, url, key });
      })
      .catch(() => {
        if (!cancelled)
          setError('Couldn’t make the image. Change the format or reopen Share to try again.');
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [card, format, key]);
  async function copy(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(message);
    } catch {
      setError('Copy is unavailable here. Select the caption below and copy it manually.');
    }
  }
  async function share() {
    if (!file) return;
    try {
      await navigator.share({ files: [file], title: card.title });
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError'))
        setError('Sharing isn’t available here. Download the image instead.');
    }
  }
  function download() {
    if (!ready) return;
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `drop-${card.kind}-${format}.png`;
    link.click();
    setStatus('Image downloaded. Copy the caption, then add both to your post.');
  }
  return (
    <dialog
      ref={dialog}
      className="share-dialog"
      aria-labelledby="share-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="share-dialog-head">
        <div>
          <span className="eyebrow">MADE TO BE SHARED</span>
          <h2 id="share-title">Take your work places.</h2>
        </div>
        <button className="share-close" onClick={onClose} aria-label="Close share studio">
          <X size={22} aria-hidden />
        </button>
      </div>
      <div className="share-studio-grid">
        <div className="share-preview" aria-busy={!ready && !error}>
          {ready ? (
            // Locally generated Blob URL; Next Image would add unnecessary infrastructure.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image.url}
              alt={`${shareLabels[card.kind]} poster for ${card.title}. ${card.distinction || card.description}`}
              width={shareFormats[format].width}
              height={shareFormats[format].height}
            />
          ) : (
            <p role="status">Making your poster…</p>
          )}
        </div>
        <div className="share-controls">
          <fieldset>
            <legend>The moment</legend>
            <div className="share-options">
              {cards.map((option, i) => (
                <button
                  key={`${option.kind}:${i}`}
                  aria-pressed={index === i}
                  onClick={() => {
                    setError('');
                    setStatus('');
                    setIndex(i);
                  }}
                >
                  {shareLabels[option.kind]}
                  {option.kind === 'award' ? ` · ${option.distinction}` : ''}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>The format</legend>
            <div className="share-options">
              {(Object.keys(shareFormats) as ShareFormat[]).map((value) => (
                <button
                  key={value}
                  aria-pressed={format === value}
                  onClick={() => {
                    setError('');
                    setStatus('');
                    setFormat(value);
                  }}
                >
                  {shareFormats[value].label}
                  <small>
                    {shareFormats[value].width} × {shareFormats[value].height}
                  </small>
                </button>
              ))}
            </div>
          </fieldset>
          <p className="share-note">
            For Instagram or LinkedIn. Download the image and copy the caption, or use your phone’s
            share menu.
          </p>
          <div className="share-export-actions">
            <button className="button" disabled={!ready} onClick={download}>
              <Download size={17} aria-hidden /> Download PNG
            </button>
            {canShare && (
              <button className="button secondary" onClick={share}>
                <Share2 size={17} aria-hidden /> Share image
              </button>
            )}
          </div>
          <label htmlFor="share-caption">Your caption</label>
          <textarea id="share-caption" readOnly value={caption} rows={7} />
          <div className="share-export-actions">
            <button className="button secondary" onClick={() => copy(caption, 'Caption copied.')}>
              <Copy size={16} aria-hidden /> Copy caption
            </button>
            <button className="text-link" onClick={() => copy(shareUrl(card), 'Link copied.')}>
              Copy link ↗
            </button>
          </div>
          {status && (
            <p role="status" className="share-feedback">
              {status}
            </p>
          )}
          {error && (
            <p role="alert" className="message error">
              {error}
            </p>
          )}
        </div>
      </div>
    </dialog>
  );
}
