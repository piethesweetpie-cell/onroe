"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { LoadingCard } from "@/components/loading-card"
import { RequestProgress } from "@/components/request-progress"
import {
  ClientSafeRequestRow,
  decodeEmailPath,
  encodeEmailPath,
  formatDate,
  PreviewImageRow,
  safeArray,
} from "@/lib/novelcraft"

export default function ClientRequestDetailPage() {
  const params = useParams<{ email: string; id: string }>()
  const encodedEmail = typeof params.email === "string" ? params.email : ""
  const id = typeof params.id === "string" ? params.id : ""
  const email = decodeEmailPath(encodedEmail)
  const [request, setRequest] = useState<ClientSafeRequestRow | null>(null)
  const [previewImages, setPreviewImages] = useState<PreviewImageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadDetail() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/client-requests?email=${encodeURIComponent(email)}&id=${encodeURIComponent(id)}`,
          { cache: "no-store" }
        )
        const result = await safeParseJson(response)

        if (!active) return

        if (!response.ok) {
          setError(result.error ?? "해당 요청을 불러오지 못했습니다.")
          setLoading(false)
          return
        }

        setRequest(result.request as ClientSafeRequestRow)
        setPreviewImages((result.previewImages ?? []) as PreviewImageRow[])
        setLoading(false)
      } catch (error) {
        if (!active) return
        setError(formatClientError(error))
        setLoading(false)
      }
    }

    void loadDetail()

    return () => {
      active = false
    }
  }, [email, id])

  return (
    <DashboardShell
      title={request?.title || "요청 상세"}
      subtitle={request?.author || email}
      actions={
        <Link
          href={`/client/${encodeEmailPath(email)}`}
          className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50"
        >
          목록으로
        </Link>
      }
    >
      {loading ? <LoadingCard /> : null}
      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!loading && request ? (
        <div className="space-y-6">
          <section className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <h2 className="mb-4 text-lg font-bold text-zinc-900">진행 상태</h2>
            <RequestProgress status={request.status} />
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6 rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <ClientField label="작품명" value={request.title} />
              <ClientField label="장르" value={request.genre} />
              <ClientField label="시안 방향" value={request.style_direction} />
              <ClientField label="패키지" value={request.package} />
              <ClientField label="분위기 키워드" value={request.mood_keywords} />
              <ClientField label="톤/작품 키워드" value={request.color_keywords} />
              <ReferenceField
                value={request.reference_url}
                onImageClick={(url) => setSelectedImage(url)}
              />
              <ClientField label="마감일" value={formatDate(request.deadline)} />
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <h2 className="mb-4 text-lg font-bold text-zinc-900">미리보기 이미지</h2>
                {previewImages.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-zinc-200 p-5 text-sm text-zinc-500">
                    아직 등록된 미리보기 이미지가 없습니다.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {previewImages.map((image) => (
                      <button key={image.id} type="button" onClick={() => setSelectedImage(image.url)}>
                        <img
                          src={image.url}
                          alt=""
                          className="aspect-[4/5] w-full rounded-2xl object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                <h2 className="mb-4 text-lg font-bold text-zinc-900">댓글</h2>
                <div className="space-y-3">
                  {safeArray(request.comments).length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-zinc-200 p-5 text-sm text-zinc-500">
                      아직 전달된 댓글이 없습니다.
                    </div>
                  ) : (
                    safeArray(request.comments).map((comment) => (
                      <div key={comment.id} className="rounded-3xl border border-zinc-200 bg-[#fbfaf7] p-4">
                        <div className="mb-2 text-xs text-zinc-500">{formatDate(comment.created_at)}</div>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700">{comment.text}</p>
                        {comment.image_url ? (
                          <button type="button" onClick={() => setSelectedImage(comment.image_url!)}>
                            <img
                              src={comment.image_url}
                              alt=""
                              className="mt-3 max-h-72 w-full rounded-2xl object-cover"
                            />
                          </button>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {selectedImage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6" onClick={() => setSelectedImage(null)}>
          <div className="relative max-h-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute -right-3 -top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-900 shadow-lg"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <img src={selectedImage} alt="" className="max-h-[90vh] max-w-full rounded-2xl object-contain" />
          </div>
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

function ClientField({
  label,
  value,
}: {
  label: string
  value?: string | null
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <div className="rounded-3xl border border-zinc-200 bg-[#fbfaf7] px-4 py-3 text-sm leading-6 text-zinc-700 whitespace-pre-wrap">
        {value || "없음"}
      </div>
    </div>
  )
}

function ReferenceField({
  value,
  onImageClick,
}: {
  value?: string | null
  onImageClick: (url: string) => void
}) {
  const items = extractReferenceItems(value)

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">참고 자료</p>
      {items.length === 0 ? (
        <div className="rounded-3xl border border-zinc-200 bg-[#fbfaf7] px-4 py-3 text-sm leading-6 text-zinc-700 whitespace-pre-wrap">
          없음
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={`${item.label}:${item.value}`} className="rounded-3xl border border-zinc-200 bg-[#fbfaf7] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{item.label}</p>
              <a
                href={item.value}
                target="_blank"
                rel="noreferrer"
                className="break-all text-sm text-teal-700 hover:underline"
              >
                {item.value}
              </a>
              {item.isImage ? (
                <button type="button" onClick={() => onImageClick(item.value)} className="mt-3 block w-full">
                  <img src={item.value} alt="" className="max-h-64 w-full rounded-2xl object-cover" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function extractReferenceItems(referenceUrl: string | null | undefined) {
  if (!referenceUrl) return []

  return referenceUrl
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(":")
      const label = separatorIndex >= 0 ? line.slice(0, separatorIndex).trim() : "참고 자료"
      const value = separatorIndex >= 0 ? line.slice(separatorIndex + 1).trim() : line
      return {
        label,
        value,
        isImage: /\.(png|jpe?g|webp|gif)$/i.test(value),
      }
    })
}
