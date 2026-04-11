export function LoadingCard({ label = "불러오는 중..." }: { label?: string }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      {label}
    </div>
  )
}
