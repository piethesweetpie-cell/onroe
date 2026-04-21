"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { encodeEmailPath } from "@/lib/novelcraft"

export default function ClientLookupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleLookup() {
    setError(null)

    if (!email.trim() || !password.trim()) {
      setError("이메일과 비밀번호를 입력해 주세요.")
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch("/api/client-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      })
      const result = await safeParseJson(response)
      setIsLoading(false)

      if (!response.ok) {
        setError(result.error ?? "조회에 실패했습니다.")
        return
      }

      router.push(`/client/${encodeEmailPath(email.trim())}`)
    } catch (error) {
      setIsLoading(false)
      setError(formatClientError(error))
    }
  }

  return (
    <DashboardShell
      title="클라이언트 조회"
      subtitle="주문 시 입력한 이메일과 확인용 비밀번호로 현재 진행 중인 작업을 확인할 수 있습니다."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void handleLookup()
        }}
        className="mx-auto max-w-2xl rounded-[34px] border border-[#ead9cf] bg-white/92 p-8 shadow-[0_20px_44px_rgba(124,98,81,0.08)] md:p-10"
      >
        <div className="mb-8 rounded-[28px] border border-[#efe2db] bg-[#fbf4f0] px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a48777]">Client Access</p>
          <p className="mt-2 text-sm leading-7 text-[#6d5c58]">
            접수 시 입력한 이메일과 비밀번호를 입력하면 작업 진행 상태와 전달된 시안을 확인할 수 있습니다.
          </p>
        </div>
        <p className="mb-6 text-sm leading-7 text-[#6d5c58]">
          주문 시 입력한 이메일을 입력하면 작업 진행 상황을 확인할 수 있습니다.
        </p>
        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            className="w-full rounded-[24px] border border-[#e7d8cf] bg-[#fffdfa] px-5 py-4 text-[#2c2c2c] outline-none transition focus:border-[#c9a897]"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="작업 확인용 비밀번호"
            className="w-full rounded-[24px] border border-[#e7d8cf] bg-[#fffdfa] px-5 py-4 text-[#2c2c2c] outline-none transition focus:border-[#c9a897]"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-[24px] bg-[linear-gradient(135deg,#c89f92,#b98677)] px-5 py-4 font-semibold text-white shadow-[0_16px_30px_rgba(185,134,119,0.24)]"
          >
            {isLoading ? "조회 중..." : "조회하기"}
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

function formatClientError(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  return "네트워크 또는 서버 오류가 발생했습니다."
}
