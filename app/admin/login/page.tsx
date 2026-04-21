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
    <DashboardShell title="관리자 로그인" subtitle="관리자 계정으로만 작업 요청 관리 화면에 접근할 수 있습니다.">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void handleLogin()
        }}
        className="mx-auto max-w-2xl rounded-[34px] border border-[#ead9cf] bg-white/92 p-8 shadow-[0_20px_44px_rgba(124,98,81,0.08)] md:p-10"
      >
        <div className="mb-8 rounded-[28px] border border-[#efe2db] bg-[#fbf4f0] px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a48777]">Admin Access</p>
          <p className="mt-2 text-sm leading-7 text-[#6d5c58]">
            접수된 요청 관리, 시안 업로드, 댓글 전달, 상태 변경은 관리자 계정으로만 접근할 수 있습니다.
          </p>
        </div>
        <p className="mb-6 text-sm leading-7 text-[#6d5c58]">
          관리자 아이디와 비밀번호를 입력해 주세요.
        </p>
        <div className="space-y-4">
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="관리자 아이디"
            className="w-full rounded-[24px] border border-[#e7d8cf] bg-[#fffdfa] px-5 py-4 text-[#2c2c2c] outline-none transition focus:border-[#c9a897]"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="관리자 비밀번호"
            className="w-full rounded-[24px] border border-[#e7d8cf] bg-[#fffdfa] px-5 py-4 text-[#2c2c2c] outline-none transition focus:border-[#c9a897]"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-[24px] bg-[linear-gradient(135deg,#c89f92,#b98677)] px-5 py-4 font-semibold text-white shadow-[0_16px_30px_rgba(185,134,119,0.24)]"
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
