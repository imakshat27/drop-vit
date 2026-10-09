'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Share2 } from 'lucide-react';
import type { ShareCard } from '@/lib/share-cards';
const ShareStudio = dynamic(() => import('./share-studio'), { ssr: false });

export function ShareButton({
  cards,
  owner = false,
  label = 'Share',
}: {
  cards: ShareCard[];
  owner?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!cards.length) return null;
  return (
    <>
      <button
        type="button"
        className="button secondary share-trigger"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <Share2 size={17} aria-hidden /> {label}
      </button>
      {open && <ShareStudio cards={cards} owner={owner} onClose={() => setOpen(false)} />}
    </>
  );
}
