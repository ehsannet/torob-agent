export default function CompareLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 pt-5">
      <div className="flex items-center justify-between">
        <div className="h-10 w-32 animate-pulse rounded-2xl bg-line" />
        <div className="h-5 w-12 animate-pulse rounded-full bg-line" />
      </div>
      <div className="h-24 animate-pulse rounded-card border border-line bg-surface" />
      <div className="flex gap-3 overflow-hidden">
        <div className="h-72 min-w-[230px] animate-pulse rounded-card border border-line bg-surface" />
        <div className="h-72 min-w-[230px] animate-pulse rounded-card border border-line bg-surface" />
      </div>
      <div className="h-80 animate-pulse rounded-card border border-line bg-surface" />
    </main>
  );
}
