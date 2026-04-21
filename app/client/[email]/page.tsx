"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { LoadingCard } from "@/components/loading-card"
import { StatusBadge } from "@/components/status-badge"
import {
  ClientSafeRequestRow,
  decodeEmailPath,
  encodeEmailPath,
  formatDate,
  getPackageTone,
} from "@/lib/novelcraft"

export default function ClientRequestsPage() {
  const params = useParams<{ email: string }>()
  const encodedEmail = typeof params.email === "string" ? params.email : ""
  const email = decodeEmailPath(encodedEmail)
  const [requests, setRequests] = useState<ClientSafeRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadRequests() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/client-requests?email=${encodeURIComponent(email)}`, {
          cache: "no-store",
        })
        const result = await safeParseJson(response)

        if (!active) return

        if (!response.ok) {
          setError(result.error ?? "요청 목록을 불러오지 못했습니다.")
          setLoading(false)
          return
        }

        setRequests((result.requests ?? []) as ClientSafeRequestRow[])
        setLoading(false)
      } catch (error) {
        if (!active) return
        setError(formatClientError(error))
        setLoading(false)
      }
    }

    void loadRequests()

    return () => {
      active = false
    }
  }, [email])

  return (
    <DashboardShell
      title="작업 현황"
      subtitle={`조회 계정 · ${email}`}
      actions={
        <Link
          href="/client"
          className="rounded-full border border-[#ead9cf] bg-white px-4 py-2 text-sm text-[#6d5c58] transition hover:bg-[#fbf4f0]"
        >
          뒤로가기
        </Link>
      }
    >
      {error ? (
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          요청 목록을 불러오지 못했습니다. {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          <LoadingCard />
          <LoadingCard />
        </div>
      ) : null}

      {!loading && requests.length === 0 ? (
        <div className="rounded-[28px] border border-[#ead9cf] bg-white/92 p-8 text-[#8a7670] shadow-[0_18px_40px_rgba(124,98,81,0.08)]">
          입력한 이메일로 접수된 요청이 없습니다.
        </div>
      ) : null}

      {!loading && requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <Link
              key={request.id}
              href={`/client/${encodeEmailPath(email)}/${request.id}`}
              className="block rounded-[30px] border border-[#ead9cf] bg-white/92 p-6 shadow-[0_18px_40px_rgba(124,98,81,0.08)] transition hover:-translate-y-0.5 hover:border-[#d9b8a6] hover:shadow-[0_24px_48px_rgba(124,98,81,0.12)]"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#a48777]">Studio Roe Request</p>
                  <h2 className="font-skin-serif text-[24px] leading-tight text-[#2c2c2c]">{request.title || "제목 없음"}</h2>
                  <p className="mt-2 text-sm text-[#6d5c58]">{request.style_direction || "시안 방향 미정"}</p>
                </div>
                <StatusBadge status={request.status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPackageTone(request.package)}`}>
                  {request.package || "패키지 미정"}
                </span>
                <span className="rounded-full bg-[#fbf4f0] px-3 py-1 text-xs text-[#8a7670] ring-1 ring-[#ead9cf]">
                  접수일 {formatDate(request.created_at)}
                </span>
                <span className="rounded-full bg-[#fbf4f0] px-3 py-1 text-xs text-[#8a7670] ring-1 ring-[#ead9cf]">
                  마감일 {formatDate(request.deadline)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
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
