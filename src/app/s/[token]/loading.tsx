export default function SellerLoading() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-4 px-4 pb-10 pt-5">
      <div className="h-11 animate-pulse rounded-2xl bg-line" />
      <div className="h-44 animate-pulse rounded-card border border-line bg-surface" />
      <div className="h-32 animate-pulse rounded-card border border-line bg-surface" />
      <div className="h-64 animate-pulse rounded-card border border-line bg-surface" />
    </main>
  );
}
