"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AdminLogoutButton } from "@/components/admin-logout-button"
import { DashboardShell } from "@/components/dashboard-shell"
import { LoadingCard } from "@/components/loading-card"
import { StatusBadge } from "@/components/status-badge"
import {
  formatDate,
  getCommentCount,
  getPackageTone,
  getServiceLabel,
  requestStatuses,
  RequestRow,
  RequestStatus,
  safeArray,
} from "@/lib/novelcraft"

type FilterValue = "전체" | RequestStatus
const pageSize = 24

export default function AdminPage() {
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterValue>("전체")
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workingId, setWorkingId] = useState<string | null>(null)
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([])

  useEffect(() => {
    let active = true

    async function loadRequests() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          page: String(page),
        })
        if (activeFilter !== "전체") {
          params.set("status", activeFilter)
        }

        const response = await fetch(`/api/admin/requests?${params.toString()}`, { cache: "no-store" })
        const result = await safeParseJson(response)

        if (!active) return

        if (!response.ok) {
          setError(result.error ?? "요청 목록을 불러오지 못했습니다.")
          setLoading(false)
          return
        }

        setRequests((result.requests ?? []) as RequestRow[])
        setTotalCount(Number(result.totalCount ?? 0))
        setLoading(false)
      } catch (error) {
        if (!active) return
        setError(formatAdminError(error))
        setLoading(false)
      }
    }

    void loadRequests()

    return () => {
      active = false
    }
  }, [activeFilter, page])

  useEffect(() => {
    setSelectedRequestIds((prev) => prev.filter((id) => requests.some((request) => request.id === id)))
  }, [requests])

  async function deleteRequestById(requestId: string) {
    setWorkingId(requestId)
    setError(null)

    try {
      const response = await fetch("/api/admin/requests", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: [requestId] }),
      })
      const result = await safeParseJson(response)

      setWorkingId(null)

      if (!response.ok) {
        setError(result.error ?? "요청 삭제에 실패했습니다.")
        return
      }

      setRequests((prev) => prev.filter((request) => request.id !== requestId))
      setSelectedRequestIds((prev) => prev.filter((id) => id !== requestId))
      setTotalCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      setWorkingId(null)
      setError(formatAdminError(error))
    }
  }

  async function handleDeleteSelected() {
    if (selectedRequestIds.length === 0) return

    const confirmed = window.confirm(`선택한 ${selectedRequestIds.length}건을 삭제할까요?`)
    if (!confirmed) return

    setWorkingId("bulk")
    setError(null)

    try {
      const response = await fetch("/api/admin/requests", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedRequestIds }),
      })
      const result = await safeParseJson(response)

      setWorkingId(null)

      if (!response.ok) {
        setError(result.error ?? "선택 삭제에 실패했습니다.")
        return
      }

      setRequests((prev) => prev.filter((request) => !selectedRequestIds.includes(request.id)))
      setTotalCount((prev) => Math.max(0, prev - selectedRequestIds.length))
      setSelectedRequestIds([])
    } catch (error) {
      setWorkingId(null)
      setError(formatAdminError(error))
    }
  }

  function toggleSelectedRequest(requestId: string) {
    setSelectedRequestIds((prev) =>
      prev.includes(requestId) ? prev.filter((id) => id !== requestId) : [...prev, requestId]
    )
  }

  function toggleSelectAllVisible() {
    const visibleIds = requests.map((request) => request.id)
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedRequestIds.includes(id))

    setSelectedRequestIds((prev) =>
      allVisibleSelected
        ? prev.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...prev, ...visibleIds]))
    )
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const isFirstPage = page === 1
  const isLastPage = page >= totalPages

  return (
    <DashboardShell
      title="의뢰 관리"
      subtitle="접수된 요청을 확인하고 진행 상태, 미리보기 이미지, 댓글을 관리합니다."
      actions={
        <>
          <div className="rounded-full border border-[#ead9cf] bg-white px-4 py-2 text-sm text-[#6d5c58]">
            총 {totalCount}건
          </div>
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={selectedRequestIds.length === 0 || workingId !== null}
            className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
          >
            선택 삭제 {selectedRequestIds.length > 0 ? `(${selectedRequestIds.length})` : ""}
          </button>
          <AdminLogoutButton />
        </>
      }
    >
      <div className="mb-6 flex flex-wrap gap-3">
        {(["전체", ...requestStatuses] as FilterValue[]).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => {
              setActiveFilter(status)
              setPage(1)
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeFilter === status
                ? "border border-[#d9b8a6] bg-[#f4e3df] text-[#8f695d]"
                : "border border-[#ead9cf] bg-white text-[#6d5c58] hover:bg-[#fbf4f0]"
            }`}
          >
            {status}
          </button>
        ))}
        <button
          type="button"
          onClick={toggleSelectAllVisible}
          className="rounded-full border border-[#ead9cf] bg-white px-4 py-2 text-sm font-semibold text-[#6d5c58] hover:bg-[#fbf4f0]"
        >
          {requests.length > 0 && requests.every((request) => selectedRequestIds.includes(request.id))
            ? "보이는 항목 선택 해제"
            : "보이는 항목 전체 선택"}
        </button>
      </div>

      {error ? (
        <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          요청 목록을 불러오지 못했습니다. {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      ) : null}

      {!loading && requests.length === 0 ? (
        <div className="rounded-[28px] border border-[#ead9cf] bg-white/92 p-8 text-[#8a7670] shadow-[0_18px_40px_rgba(124,98,81,0.08)]">
          해당 상태의 요청이 없습니다.
        </div>
      ) : null}

      {!loading && requests.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {requests.map((request) => {
            const packageTone = getPackageTone(request.package)
            const comments = safeArray(request.comments)

            return (
              <div
                key={request.id}
                className="relative cursor-pointer rounded-[30px] border border-[#ead9cf] bg-white/92 p-6 shadow-[0_18px_40px_rgba(124,98,81,0.08)] transition hover:-translate-y-0.5 hover:border-[#d9b8a6] hover:shadow-[0_24px_48px_rgba(124,98,81,0.12)]"
              >
                <Link
                  href={`/admin/${request.id}`}
                  aria-label={`${request.title || "제목 없음"} 상세 보기`}
                  className="absolute inset-0 z-0 rounded-3xl"
                />
                <div className="pointer-events-none relative z-10 mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <label
                      className="pointer-events-auto mb-2 flex items-center gap-3"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRequestIds.includes(request.id)}
                        onChange={() => toggleSelectedRequest(request.id)}
                        className="h-4 w-4 rounded border-[#d8c3b7] bg-white text-[#b98677] focus:ring-[#d9b8a6]"
                      />
                      <h2 className="truncate font-skin-serif text-[24px] text-[#2c2c2c]">{request.title || "제목 없음"}</h2>
                    </label>
                    <p className="mt-1 text-sm text-[#6d5c58]">
                      {request.author || "작가명 없음"} · {request.genre || "장르 미정"}
                    </p>
                  </div>
                  <div className="pointer-events-none">
                    <StatusBadge status={request.status} />
                  </div>
                </div>

                <div className="pointer-events-none relative z-10 mb-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#fbf4f0] px-3 py-1 text-xs font-semibold text-[#8f695d] ring-1 ring-[#ead9cf]">
                    {getServiceLabel(request.service_type)}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${packageTone}`}>
                    {request.package || "패키지 미정"}
                  </span>
                  <span className="rounded-full bg-[#fbf4f0] px-3 py-1 text-xs text-[#8a7670] ring-1 ring-[#ead9cf]">
                    댓글 {getCommentCount({ comments })}
                  </span>
                </div>

                <div className="pointer-events-none relative z-10 grid gap-3 text-sm text-[#6d5c58]">
                  <div className="flex items-center justify-between">
                    <span>마감일</span>
                    <span>{formatDate(request.deadline)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>접수일</span>
                    <span>{formatDate(request.created_at)}</span>
                  </div>
                </div>
                <div className="pointer-events-none relative z-10 mt-5 flex items-center gap-3">
                  <span className="text-sm text-[#a28e86]">카드를 클릭하면 상세 화면으로 이동합니다.</span>
                </div>
              </div>
            )
            })}
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-[#ead9cf] bg-white/92 px-5 py-4 text-sm text-[#6d5c58] shadow-[0_18px_40px_rgba(124,98,81,0.08)]">
            <span>
              {page} / {totalPages} 페이지
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={isFirstPage || loading}
                className="rounded-full border border-[#ead9cf] bg-[#fbf4f0] px-4 py-2 font-semibold text-[#6d5c58] transition hover:bg-[#f7ede7] disabled:opacity-50"
              >
                이전
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={isLastPage || loading}
                className="rounded-full border border-[#ead9cf] bg-[#fbf4f0] px-4 py-2 font-semibold text-[#6d5c58] transition hover:bg-[#f7ede7] disabled:opacity-50"
              >
                다음
              </button>
            </div>
          </div>
        </>
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

function formatAdminError(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  return "네트워크 또는 서버 오류가 발생했습니다."
}
