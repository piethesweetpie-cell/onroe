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
      title="Client Lookup"
      subtitle="주문 시 입력한 이메일로 현재 진행 중인 작업을 조회할 수 있습니다."
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void handleLookup()
        }}
        className="mx-auto max-w-xl rounded-[32px] border border-zinc-200 bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
      >
        <p className="mb-6 text-sm leading-7 text-zinc-600">
          주문 시 입력한 이메일을 입력하면 작업 진행 상황을 확인할 수 있습니다.
        </p>
        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            className="w-full rounded-2xl border border-zinc-200 bg-[#fbfaf7] px-5 py-4 text-zinc-900 outline-none transition focus:border-teal-300"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="작업 확인용 비밀번호"
            className="w-full rounded-2xl border border-zinc-200 bg-[#fbfaf7] px-5 py-4 text-zinc-900 outline-none transition focus:border-teal-300"
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-2xl bg-teal-400 px-5 py-4 font-semibold text-white"
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
