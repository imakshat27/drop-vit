'use client';
import { useState } from 'react';
import { ProjectArt } from './art';
export function ProjectCover({
  url,
  title,
  symbol,
  color,
}: {
  url?: string;
  title: string;
  symbol: string;
  color: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) return <ProjectArt symbol={symbol} color={color} title={title} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="project-cover-image"
      src={url}
      alt={`${title} project cover`}
      loading="lazy"
      width={720}
      height={450}
      onError={() => setFailed(true)}
    />
  );
}
