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
    <main className="min-h-screen bg-[#f6f2eb] px-6 py-8 text-zinc-900 md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 border-b border-zinc-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-400">
              NovelCraft Agency
            </Link>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm text-zinc-600">{subtitle}</p> : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://ooonsuuu.vercel.app/"
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50"
            >
              메인으로
            </a>
            {actions}
          </div>
        </header>
        {children}
      </div>
    </main>
  )
}

