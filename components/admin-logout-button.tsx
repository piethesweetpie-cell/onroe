"use client"

import { useRouter } from "next/navigation"

export function AdminLogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/admin-session", { method: "DELETE" })
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50"
    >
      로그아웃
    </button>
  )
}
