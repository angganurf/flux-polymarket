export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="animate-pulse space-y-6">
        {/* Back button */}
        <div className="h-4 w-32 rounded bg-surface-hover" />
        {/* Title */}
        <div className="h-8 w-3/4 rounded bg-surface-hover" />
        {/* Probability bar */}
        <div className="flex gap-4">
          <div className="h-12 w-32 rounded-xl bg-surface-hover" />
          <div className="h-12 w-32 rounded-xl bg-surface-hover" />
        </div>
        {/* Chart area */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="h-5 w-28 rounded bg-surface-hover mb-4" />
          <div className="h-64 w-full rounded bg-surface-hover" />
        </div>
        {/* Info cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="h-5 w-24 rounded bg-surface-hover mb-4" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded bg-surface-hover" />
              <div className="h-4 w-2/3 rounded bg-surface-hover" />
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="h-5 w-24 rounded bg-surface-hover mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-20 rounded bg-surface-hover" />
                  <div className="h-4 w-16 rounded bg-surface-hover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
