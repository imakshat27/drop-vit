'use client';
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, X } from 'lucide-react';
import { parseProjectMedia, MAX_PROJECT_IMAGES } from '@/lib/project-media';
import { optimizeImage } from '@/lib/optimize-image';
export function ImageUploader({
  value,
  onChange,
  onBusy,
}: {
  value: string;
  onChange: (value: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const images = parseProjectMedia(value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const locked = useRef(false);
  async function add(files: FileList | File[]) {
    if (locked.current) return;
    if (images.length + files.length > MAX_PROJECT_IMAGES) {
      setError('You can add up to four images. Remove one first.');
      return;
    }
    locked.current = true;
    setBusy(true);
    onBusy(true);
    setError('');
    const next = [...images];
    try {
      for (const [index, file] of Array.from(files).entries()) {
        setStatus(`Preparing image ${index + 1} of ${files.length}…`);
        const blob = await optimizeImage(file);
        const response = await fetch('/api/media/upload', { method: 'POST' });
        const ticket = await response.json();
        if (!response.ok) throw new Error(ticket.error || 'Could not start upload.');
        const data = new FormData();
        for (const [key, value] of Object.entries(ticket.fields)) data.append(key, String(value));
        data.append('file', blob, 'project.webp');
        setStatus(`Uploading image ${index + 1} of ${files.length}…`);
        const uploaded = await fetch(ticket.url, { method: 'POST', body: data });
        if (!uploaded.ok) throw new Error('Upload did not finish. Please try again.');
        next.push(ticket.media);
        onChange(JSON.stringify(next));
      }
      setStatus(
        `${next.length} image${next.length === 1 ? '' : 's'} ready. The first is your cover.`,
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not upload this image.');
      setStatus('');
    } finally {
      locked.current = false;
      setBusy(false);
      onBusy(false);
      if (input.current) input.current.value = '';
    }
  }
  function move(index: number, direction: number) {
    const next = [...images];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(JSON.stringify(next));
  }
  function remove(index: number) {
    onChange(JSON.stringify(images.filter((_, i) => i !== index)));
    if (images[index].startsWith('/api/media/'))
      void fetch(images[index], { method: 'DELETE' }).catch(() => {});
  }
  return (
    <section id="media" tabIndex={-1} className="image-upload" aria-labelledby="image-upload-title">
      <div className="image-upload-heading">
        <label id="image-upload-title" htmlFor="project-images">
          Show your build (optional)
        </label>
        <span>{images.length} / 4</span>
      </div>
      <p id="project-images-help">
        Add up to four screenshots, terminal captures, photos, or diagrams. First image = cover. We
        resize and compress them on your device.
      </p>
      <input
        ref={input}
        tabIndex={-1}
        id="project-images"
        className="image-file-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={busy || images.length === 4}
        onChange={(event) => event.target.files && void add(event.target.files)}
        aria-describedby="project-images-help"
      />
      <ol className="image-upload-list">
        {images.map((url, i) => (
          <li key={url}>
            {/* Private uploads are served through the authorized same-origin media route. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Project screenshot ${i + 1}`} />
            <span className="image-cover-label">{i === 0 ? 'COVER' : `IMAGE ${i + 1}`}</span>
            <div className="image-upload-controls">
              <button
                type="button"
                disabled={busy || i === 0}
                onClick={() => move(i, -1)}
                aria-label={`Move image ${i + 1} earlier`}
              >
                <ArrowLeft size={17} aria-hidden />
              </button>
              <button
                type="button"
                disabled={busy || i === images.length - 1}
                onClick={() => move(i, 1)}
                aria-label={`Move image ${i + 1} later`}
              >
                <ArrowRight size={17} aria-hidden />
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(i)}
                aria-label={`Remove image ${i + 1}`}
              >
                <X size={17} aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ol>
      {images.length < 4 && (
        <button
          className="image-upload-add"
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void add(event.dataTransfer.files);
          }}
        >
          <ImagePlus size={24} aria-hidden />
          {busy ? 'Preparing your images…' : 'Choose images or drop them here'}
          <small>JPG, PNG or WebP · up to 10 MB each before compression</small>
        </button>
      )}
      <p role="status" className="understated">
        {status}
      </p>
      {error && (
        <p role="alert" className="message error">
          {error}
        </p>
      )}
    </section>
  );
}
