export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-40 rounded bg-surface-hover" />
        <div className="h-10 w-64 rounded-lg bg-surface-hover" />
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-4 border-b border-border px-4 py-3">
            <div className="h-4 w-12 rounded bg-surface-hover" />
            <div className="h-4 w-32 rounded bg-surface-hover" />
            <div className="ml-auto h-4 w-20 rounded bg-surface-hover" />
            <div className="h-4 w-20 rounded bg-surface-hover" />
          </div>
          {/* Table rows */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-b-0">
              <div className="h-4 w-8 rounded bg-surface-hover" />
              <div className="h-8 w-8 rounded-full bg-surface-hover" />
              <div className="h-4 w-28 rounded bg-surface-hover" />
              <div className="ml-auto h-4 w-16 rounded bg-surface-hover" />
              <div className="h-4 w-16 rounded bg-surface-hover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
