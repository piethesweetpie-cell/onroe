import Link from "next/link"
import { ReactNode } from "react"

type DashboardShellProps = {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
}

export function DashboardShell({
  title,
  subtitle,
  actions,
  children,
}: DashboardShellProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.92),_rgba(245,230,231,0.95)_42%,_rgba(244,234,228,1)_100%)] px-5 py-6 text-[#2c2c2c] md:px-8 md:py-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.85),transparent_44%),radial-gradient(circle_at_80%_10%,rgba(240,217,210,0.34),transparent_38%)]" />
      <div className="relative mx-auto max-w-6xl">
        <header className="mb-8 rounded-[40px] border border-white/70 bg-white/70 px-6 py-6 shadow-[0_24px_60px_rgba(124,98,81,0.10)] backdrop-blur-xl md:px-8 md:py-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <Link href="/" className="inline-flex rounded-full border border-[#ead9cf] bg-[#f7ede7] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9b7b68] transition hover:bg-[#f4e4e1]">
                Studio Roe
              </Link>
              <h1 className="mt-4 font-skin-serif text-[30px] leading-tight text-[#2c2c2c] md:text-[40px]">{title}</h1>
              {subtitle ? <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6d5c58]">{subtitle}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-full border border-[#ead9cf] bg-white px-4 py-2 text-sm text-[#6d5c58] transition hover:bg-[#fbf4f0]"
              >
                메인으로
              </Link>
              {actions}
            </div>
          </div>
        </header>
        <div className="relative rounded-[40px] border border-white/60 bg-white/52 p-3 shadow-[0_18px_50px_rgba(124,98,81,0.08)] backdrop-blur-[2px] md:p-4">
          <div className="rounded-[32px] border border-[#ead9cf] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(252,247,243,0.95))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] md:p-7">
            {children}
          </div>
        </div>
      </div>
    </main>
  )
}

