export function LoadingCard({ label = "불러오는 중..." }: { label?: string }) {
  return (
    <div className="rounded-[28px] border border-[#ead9cf] bg-white/90 p-6 text-sm text-[#8a7670] shadow-[0_18px_40px_rgba(124,98,81,0.08)]">
      {label}
    </div>
  )
}
