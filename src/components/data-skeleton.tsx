export function DataSkeleton({ layout = 'grid' }: { layout?: 'grid' | 'ranking' }) {
  return (
    <section className={`data-loading ${layout}`} aria-busy="true" aria-label="Loading live data">
      <span className="sr-only" role="status">
        Loading live data…
      </span>
      <div className="data-loading-summary" aria-hidden="true" />
      <div className={layout === 'grid' ? 'project-grid' : 'data-loading-rows'} aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div className="loading-skeleton" key={i} />
        ))}
      </div>
    </section>
  );
}
