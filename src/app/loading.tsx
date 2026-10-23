export default function Loading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 pb-10 pt-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-11 animate-pulse rounded-2xl bg-line" />
          <div className="space-y-2">
            <div className="h-4 w-20 animate-pulse rounded bg-line" />
            <div className="h-3 w-28 animate-pulse rounded bg-line" />
          </div>
        </div>
        <div className="h-6 w-16 animate-pulse rounded-full bg-line" />
      </div>
      <div className="h-64 animate-pulse rounded-card border border-line bg-surface" />
      <div className="rounded-card border border-line bg-surface px-3 py-2">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="flex items-center gap-2.5 border-b border-line py-2 first:pt-0 last:border-0 last:pb-0"
          >
            <div className="size-7 animate-pulse rounded-lg bg-line/70" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 animate-pulse rounded bg-line" />
              <div className="h-2.5 w-3/4 animate-pulse rounded bg-line/70" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-16 animate-pulse rounded-2xl border border-line bg-surface" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-card border border-line bg-surface" />
    </main>
  );
}
