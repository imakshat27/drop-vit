import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Drop — What VIT is building.', description: 'A curated exhibition of projects, open source, and startups built by VIT students.' };
export default function Layout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
