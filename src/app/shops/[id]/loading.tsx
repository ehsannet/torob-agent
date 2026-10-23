export default function ShopLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 pb-10 pt-5">
      <div className="h-11 animate-pulse rounded-2xl bg-line/70" />
      <div className="rounded-card border border-line bg-surface p-4">
        <div className="h-5 w-28 animate-pulse rounded bg-line" />
        <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-line" />
        <div className="mt-3 h-3 w-full animate-pulse rounded bg-line/70" />
        <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-line/70" />
        <div className="mt-4 flex gap-2">
          <div className="h-8 w-24 animate-pulse rounded-xl bg-line/70" />
          <div className="h-8 w-24 animate-pulse rounded-xl bg-line/70" />
        </div>
      </div>
      <div className="rounded-card border border-line bg-surface p-4">
        <div className="h-4 w-24 animate-pulse rounded bg-line" />
        <div className="mt-3 h-3 w-full animate-pulse rounded bg-line/70" />
        <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-line/70" />
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-32 animate-pulse rounded-2xl border border-line bg-surface"
          />
        ))}
      </div>
    </main>
  );
}
