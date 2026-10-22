export default function SearchLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 pt-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-11 animate-pulse rounded-2xl bg-line" />
          <div className="space-y-2">
            <div className="h-4 w-20 animate-pulse rounded bg-line" />
            <div className="h-2.5 w-24 animate-pulse rounded bg-line" />
          </div>
        </div>
        <div className="h-5 w-12 animate-pulse rounded-full bg-line" />
      </div>
      <div className="h-11 animate-pulse rounded-2xl bg-line" />
      <div className="flex gap-2">
        <div className="h-10 w-24 animate-pulse rounded-xl bg-line" />
        <div className="h-10 flex-1 animate-pulse rounded-xl bg-line" />
      </div>
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-72 animate-pulse rounded-card border border-line bg-surface"
        />
      ))}
    </main>
  );
}
