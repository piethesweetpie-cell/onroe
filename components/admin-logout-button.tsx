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
      className="rounded-full border border-[#ead9cf] bg-white px-4 py-2 text-sm text-[#6d5c58] transition hover:bg-[#fbf4f0]"
    >
      로그아웃
    </button>
  )
}
