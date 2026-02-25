export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="animate-pulse space-y-6">
        {/* Back button */}
        <div className="h-4 w-36 rounded bg-surface-hover" />
        {/* Title */}
        <div className="h-7 w-3/4 rounded bg-surface-hover" />
        {/* Status badge + category */}
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-surface-hover" />
          <div className="h-6 w-20 rounded-full bg-surface-hover" />
        </div>
        {/* Probability bar */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex justify-between mb-2">
            <div className="h-4 w-20 rounded bg-surface-hover" />
            <div className="h-4 w-20 rounded bg-surface-hover" />
          </div>
          <div className="h-3 w-full rounded-full bg-surface-hover" />
        </div>
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-4">
              <div className="h-3 w-16 rounded bg-surface-hover mb-2" />
              <div className="h-6 w-12 rounded bg-surface-hover" />
            </div>
          ))}
        </div>
        {/* Bet form */}
        <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
          <div className="h-5 w-28 rounded bg-surface-hover" />
          <div className="h-10 w-full rounded-xl bg-surface-hover" />
          <div className="h-10 w-full rounded-xl bg-surface-hover" />
        </div>
      </div>
    </div>
  );
}
