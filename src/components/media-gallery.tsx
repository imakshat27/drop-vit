'use client';
import Image from 'next/image';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
export function MediaGallery({ urls, title }: { urls: string[]; title: string }) {
  const [failed, setFailed] = useState<string[]>([]);
  return (
    <div className="media-gallery">
      {urls.map((url, i) => (
        <a href={url} target="_blank" rel="noopener noreferrer" key={url}>
          {failed.includes(url) ? (
            <div className="media-fallback">
              This preview couldn’t load.
              <br />
              Open the original image <ArrowUpRight size={18} aria-hidden />
            </div>
          ) : (
            <Image
              src={url}
              alt={`${title} — screenshot ${i + 1}`}
              width={1200}
              height={675}
              unoptimized
              referrerPolicy="no-referrer"
              onError={() => setFailed((list) => [...list, url])}
            />
          )}
        </a>
      ))}
    </div>
  );
}
