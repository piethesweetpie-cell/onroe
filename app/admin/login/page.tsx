"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"

export default function AdminLoginPage() {
  return (
    <Suspense>
      <AdminLoginContent />
    </Suspense>
  )
}

function AdminLoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError(null)

    if (!username.trim() || !password.trim()) {
      setError("관리자 아이디와 비밀번호를 입력해 주세요.")
      return
    }

    try {
      setLoading(true)
      const response = await fetch("/api/admin-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      })

      const result = await safeParseJson(response)
      setLoading(false)

      if (!response.ok) {
        setError(result.error ?? "로그인에 실패했습니다.")
        return
      }

      const redirectTarget = searchParams.get("redirect")?.trim()
      router.push(redirectTarget || "/admin")
      router.refresh()
    } catch (error) {
      setLoading(false)
      setError(error instanceof Error ? error.message : "로그인 중 오류가 발생했습니다.")
    }
  }

  return (
    <DashboardShell title="Admin Login" subtitle="관리자 계정으로만 작업 요청 관리 화면에 접근할 수 있습니다.">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void handleLogin()
        }}
        className="mx-auto max-w-xl rounded-[32px] border border-zinc-200 bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
      >
        <p className="mb-6 text-sm leading-7 text-zinc-600">
          관리자 아이디와 비밀번호를 입력해 주세요.
        </p>
        <div className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="관리자 아이디"
            className="w-full rounded-2xl border border-zinc-200 bg-[#fbfaf7] px-5 py-4 text-zinc-900 outline-none transition focus:border-teal-300"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="관리자 비밀번호"
            className="w-full rounded-2xl border border-zinc-200 bg-[#fbfaf7] px-5 py-4 text-zinc-900 outline-none transition focus:border-teal-300"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-2xl bg-teal-400 px-5 py-4 font-semibold text-white"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </div>
      </form>
    </DashboardShell>
  )
}

async function safeParseJson(response: Response) {
  const contentType = response.headers.get("content-type") ?? ""
  if (!contentType.includes("application/json")) {
    const text = await response.text()
    return { error: text || "서버 응답을 해석할 수 없습니다." }
  }

  return response.json()
}
