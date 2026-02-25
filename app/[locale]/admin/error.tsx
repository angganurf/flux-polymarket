"use client";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
      <p className="text-muted">{error.message || "An unexpected error occurred"}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
