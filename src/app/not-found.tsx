import { Empty } from '@/components/cards';
export default function NotFound() {
  return (
    <main id="main" className="container" style={{ paddingTop: 50 }}>
      <Empty
        level="h1"
        title="This build is off the grid."
        description="The page may have moved, or the project may still be waiting for approval. There’s plenty more to discover."
        href="/discover"
        label="Back to discovery"
      />
    </main>
  );
}
