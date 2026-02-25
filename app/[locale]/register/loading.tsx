export default function Loading() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm animate-pulse space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-surface-hover" />
          <div className="h-7 w-28 rounded bg-surface-hover" />
        </div>
        {/* Welcome bonus banner */}
        <div className="h-12 w-full rounded-xl bg-surface-hover" />
        {/* OAuth buttons */}
        <div className="space-y-3">
          <div className="h-10 w-full rounded-xl bg-surface-hover" />
          <div className="h-10 w-full rounded-xl bg-surface-hover" />
        </div>
        {/* Divider */}
        <div className="h-4 w-40 mx-auto rounded bg-surface-hover" />
        {/* Form fields */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="h-4 w-12 rounded bg-surface-hover" />
            <div className="h-10 w-full rounded-xl bg-surface-hover" />
          </div>
          <div className="space-y-1.5">
            <div className="h-4 w-12 rounded bg-surface-hover" />
            <div className="h-10 w-full rounded-xl bg-surface-hover" />
          </div>
          <div className="space-y-1.5">
            <div className="h-4 w-16 rounded bg-surface-hover" />
            <div className="h-10 w-full rounded-xl bg-surface-hover" />
          </div>
          <div className="space-y-1.5">
            <div className="h-4 w-28 rounded bg-surface-hover" />
            <div className="h-10 w-full rounded-xl bg-surface-hover" />
          </div>
          <div className="h-10 w-full rounded-xl bg-surface-hover" />
        </div>
        {/* Footer link */}
        <div className="h-4 w-48 mx-auto rounded bg-surface-hover" />
      </div>
    </div>
  );
}
