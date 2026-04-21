"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ChangeEvent, useEffect, useState } from "react"
import { AdminLogoutButton } from "@/components/admin-logout-button"
import { DashboardShell } from "@/components/dashboard-shell"
import { LoadingCard } from "@/components/loading-card"
import { RequestProgress } from "@/components/request-progress"
import { StatusBadge } from "@/components/status-badge"
import {
  formatAdditionalOption,
  formatDate,
  formatKrw,
  getAdditionalOptionPrice,
  getPackagePrice,
  getServiceLabel,
  PreviewImageRow,
  requestStatuses,
  RequestComment,
  RequestRow,
  RequestStatus,
  safeArray,
} from "@/lib/novelcraft"

export default function AdminRequestDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = typeof params.id === "string" ? params.id : ""
  const [request, setRequest] = useState<RequestRow | null>(null)
  const [previewImages, setPreviewImages] = useState<PreviewImageRow[]>([])
  const [status, setStatus] = useState<RequestStatus>("접수")
  const [adminNote, setAdminNote] = useState("")
  const [commentText, setCommentText] = useState("")
  const [commentImage, setCommentImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null)
  const [shareLink, setShareLink] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadDetail() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/admin/requests/${id}`, { cache: "no-store" })
        const result = await safeParseJson(response)

        if (!active) return

        if (!response.ok) {
          setError(result.error ?? "요청을 불러오지 못했습니다.")
          setLoading(false)
          return
        }

        const typedRequest = result.request as RequestRow
        setRequest(typedRequest)
        setPreviewImages((result.previewImages ?? []) as PreviewImageRow[])
        setShareLink(typeof result.shareLink === "string" ? result.shareLink : null)
        setStatus(typedRequest.status)
        setAdminNote(typedRequest.admin_note ?? "")
        setLoading(false)
      } catch (error) {
        if (!active) return
        setError(formatAdminError(error))
        setLoading(false)
      }
    }

    void loadDetail()

    return () => {
      active = false
    }
  }, [id])

  async function updateRequest(patch: Partial<RequestRow>, successMessage: string) {
    if (!request) return

    setWorking(true)
    setFeedback(null)
    setError(null)

    try {
      const response = await fetch(`/api/admin/requests/${request.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      })
      const result = await safeParseJson(response)

      setWorking(false)

      if (!response.ok) {
        setError(result.error ?? "요청 수정에 실패했습니다.")
        return
      }

      const nextRequest = result.request as RequestRow
      setRequest(nextRequest)
      setStatus(nextRequest.status)
      setAdminNote(nextRequest.admin_note ?? "")
      setFeedback(successMessage)
    } catch (error) {
      setWorking(false)
      setError(formatAdminError(error))
    }
  }

  async function handlePreviewUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !request) return

    setWorking(true)
    setFeedback(null)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch(`/api/admin/requests/${request.id}/previews`, {
        method: "POST",
        body: formData,
      })
      const result = await safeParseJson(response)

      setWorking(false)

      if (!response.ok) {
        setError(result.error ?? "미리보기 이미지 업로드에 실패했습니다.")
        return
      }

      setPreviewImages((prev) => [result.previewImage as PreviewImageRow, ...prev])
      setFeedback("미리보기 이미지가 업로드되었습니다.")
      event.target.value = ""
    } catch (error) {
      setWorking(false)
      setError(formatAdminError(error))
    }
  }

  async function handlePreviewDelete(image: PreviewImageRow) {
    setWorking(true)
    setFeedback(null)
    setError(null)

    try {
      const response = await fetch(`/api/admin/previews/${image.id}`, {
        method: "DELETE",
      })
      const result = await safeParseJson(response)
      setWorking(false)

      if (!response.ok) {
        setError(result.error ?? "미리보기 이미지 삭제에 실패했습니다.")
        return
      }

      setPreviewImages((prev) => prev.filter((item) => item.id !== image.id))
      setFeedback("미리보기 이미지가 삭제되었습니다.")
    } catch (error) {
      setWorking(false)
      setError(formatAdminError(error))
    }
  }

  async function handleCommentCreate() {
    if (!request || (!commentText.trim() && !commentImage)) return

    setWorking(true)
    setFeedback(null)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("text", commentText.trim())
      if (commentImage) {
        formData.append("image", commentImage)
      }

      const response = await fetch(`/api/admin/requests/${request.id}/comments`, {
        method: "POST",
        body: formData,
      })
      const result = await safeParseJson(response)
      setWorking(false)

      if (!response.ok) {
        setError(result.error ?? "댓글 등록에 실패했습니다.")
        return
      }

      setRequest(result.request as RequestRow)
      setCommentText("")
      setCommentImage(null)
      setFeedback("댓글이 등록되었습니다.")
    } catch (error) {
      setWorking(false)
      setError(formatAdminError(error))
    }
  }

  async function handleCommentDelete(commentId: string) {
    if (!request) return
    const nextComments = safeArray(request.comments).filter((comment) => comment.id !== commentId)
    await updateRequest({ comments: nextComments }, "댓글이 삭제되었습니다.")
  }

  async function handleDeleteRequest() {
    if (!request) return

    const confirmed = window.confirm("이 요청을 삭제할까요? 관련 미리보기 이미지와 댓글도 함께 삭제됩니다.")
    if (!confirmed) return

    setWorking(true)
    setFeedback(null)
    setError(null)

    try {
      const response = await fetch(`/api/admin/requests/${request.id}`, {
        method: "DELETE",
      })
      const result = await safeParseJson(response)
      setWorking(false)

      if (!response.ok) {
        setError(result.error ?? "요청 삭제에 실패했습니다.")
        return
      }

      router.push("/admin")
    } catch (error) {
      setWorking(false)
      setError(formatAdminError(error))
    }
  }

  if (loading) {
    return (
      <DashboardShell title="요청 상세" subtitle="요청 내용을 불러오는 중입니다.">
        <LoadingCard />
      </DashboardShell>
    )
  }

  if (!request) {
    return (
      <DashboardShell title="요청 상세" subtitle="요청을 찾을 수 없습니다.">
        <div className="rounded-[28px] border border-[#ead9cf] bg-white/92 p-6 text-[#8a7670] shadow-[0_18px_40px_rgba(124,98,81,0.08)]">
          <Link href="/admin" className="text-[#8f695d] hover:underline">
            목록으로 돌아가기
          </Link>
        </div>
      </DashboardShell>
    )
  }

  const comments = safeArray(request.comments)
  const selectedOptionLabels = extractAdminNoteValues(request.admin_note, "추가 옵션")
  const selectedStyleImages = extractAdminNoteValues(request.admin_note, "선호 스타일")
  const referenceItems = extractReferenceItems(request.reference_url)
  const totalPrice = getPackagePrice(request.package) + selectedOptionLabels.reduce((sum, option) => sum + getAdditionalOptionPrice(option), 0)

  return (
    <DashboardShell
      title={request.title || "제목 없음"}
      subtitle={`${request.author || "작가명 없음"} · ${request.client_email}`}
      actions={
        <>
          <StatusBadge status={request.status} />
          <AdminLogoutButton />
          <Link
            href="/admin"
            className="rounded-full border border-[#ead9cf] bg-white px-4 py-2 text-sm text-[#6d5c58] transition hover:bg-[#fbf4f0]"
          >
            목록으로
          </Link>
          <button
            type="button"
            onClick={handleDeleteRequest}
            disabled={working}
            className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
          >
            삭제
          </button>
        </>
      }
    >
      {error ? (
        <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {feedback ? (
        <div className="mb-6 rounded-3xl border border-[#e3c5bd] bg-[#f4e3df] p-4 text-sm text-[#8f695d]">
          {feedback}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6 rounded-[28px] border border-[#ead9cf] bg-white/92 p-6 shadow-[0_18px_40px_rgba(124,98,81,0.08)]">
          <div className="grid gap-4 md:grid-cols-2">
            <ReadOnlyField label="서비스" value={getServiceLabel(request.service_type)} />
            <ReadOnlyField label="작품명" value={request.title} />
            <ReadOnlyField label="작가명" value={request.author} />
            <ReadOnlyField label="장르" value={request.genre} />
            <ReadOnlyField label="시안 방향" value={request.style_direction} />
            <ReadOnlyField label="패키지" value={request.package} />
            <ReadOnlyField label="마감일" value={formatDate(request.deadline)} />
            <ReadOnlyField label="분위기 키워드" value={request.mood_keywords} />
            <ReadOnlyField label="톤/작품 키워드" value={request.color_keywords} />
          </div>

          <ReferenceField
            items={referenceItems}
            onImageClick={(url) => setSelectedPreviewImage(url)}
          />



          {selectedOptionLabels.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9b7b68]">추가 옵션</p>
              <div className="flex flex-wrap gap-2">
                {selectedOptionLabels.map((option) => (
                  <span
                    key={option}
                    className="rounded-full border border-[#e3c5bd] bg-[#f4e3df] px-3 py-1.5 text-xs font-medium text-[#8f695d]"
                  >
                    {option}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {selectedStyleImages.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9b7b68]">선호 스타일</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {selectedStyleImages.map((src) => (
                  <div key={src} className="overflow-hidden rounded-2xl border border-[#ead9cf] bg-[#fbf4f0] p-2">
                    <img src={src} alt="" className="aspect-[2/3] w-full rounded-xl object-cover" />
                    <p className="mt-2 truncate text-xs text-[#8a7670]">{src.split("/").pop()}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="border-t border-[#ead9cf] pt-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9b7b68]">총 결제 금액</p>
            <div className="rounded-3xl border border-[#e3c5bd] bg-[#f4e3df] px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f695d]">패키지 + 추가 옵션 합산</p>
              <p className="mt-2 text-2xl font-black text-[#2c2c2c]">{formatKrw(totalPrice)}</p>
            </div>
          </div>

        </section>

        <section className="space-y-6">
          <div className="rounded-[28px] border border-[#ead9cf] bg-white/92 p-6 shadow-[0_18px_40px_rgba(124,98,81,0.08)]">
            <h2 className="mb-4 font-skin-serif text-[24px] text-[#2c2c2c]">진행 상태</h2>
            <RequestProgress status={request.status} />
            <div className="mt-5 flex flex-col gap-3 md:flex-row">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as RequestStatus)}
                className="rounded-full border border-[#ead9cf] bg-[#fbf4f0] px-4 py-3 text-sm text-[#2c2c2c] outline-none"
              >
                {requestStatuses.map((option) => (
                  <option key={option} value={option} className="bg-white">
                    {option}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => updateRequest({ status }, "상태가 업데이트되었습니다.")}
                disabled={working}
                className="rounded-full bg-[linear-gradient(135deg,#c89f92,#b98677)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                상태 업데이트
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#ead9cf] bg-white/92 p-6 shadow-[0_18px_40px_rgba(124,98,81,0.08)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-skin-serif text-[24px] text-[#2c2c2c]">미리보기 이미지</h2>
              <label className="cursor-pointer rounded-full border border-[#ead9cf] bg-[#fbf4f0] px-4 py-2 text-sm text-[#6d5c58]">
                파일 선택
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={handlePreviewUpload}
                />
              </label>
            </div>

            {previewImages.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#ead9cf] bg-[#fbf4f0] p-6 text-sm text-[#8a7670]">
                아직 업로드된 이미지가 없습니다.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {previewImages.map((image) => (
                  <div key={image.id} className="rounded-3xl border border-[#ead9cf] bg-[#fbf4f0] p-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPreviewImage(image.url)}
                      className="block w-full"
                    >
                      <img src={image.url} alt="" className="aspect-[4/5] w-full rounded-[22px] border border-[#ead9cf] object-cover" />
                    </button>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#8a7670]">
                      <span>{formatDate(image.uploaded_at)}</span>
                      <button
                        type="button"
                        onClick={() => handlePreviewDelete(image)}
                        className="text-red-600 hover:text-red-500"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-[28px] border border-[#ead9cf] bg-white/92 p-6 shadow-[0_18px_40px_rgba(124,98,81,0.08)]">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9b7b68]">클라이언트 확인 링크</p>
            {shareLink ? (
              <div className="rounded-3xl border border-[#ead9cf] bg-[#fbf4f0] p-3">
                <input
                  readOnly
                  value={shareLink}
                  className="w-full bg-transparent px-1 py-2 text-sm text-[#5d4c47] outline-none"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shareLink)
                        setFeedback("클라이언트 링크가 복사되었습니다.")
                        setError(null)
                      } catch {
                        setError("링크 복사에 실패했습니다.")
                        setFeedback(null)
                      }
                    }}
                    className="rounded-full border border-[#ead9cf] bg-white px-4 py-2 text-sm font-semibold text-[#6d5c58] transition hover:bg-[#fff7f3]"
                  >
                    링크 복사
                  </button>
                  <a
                    href={shareLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-[#ead9cf] bg-white px-4 py-2 text-sm font-semibold text-[#6d5c58] transition hover:bg-[#fff7f3]"
                  >
                    열기
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-[#ead9cf] bg-[#fbf4f0] px-4 py-3 text-sm text-[#8a7670]">
                작업 확인용 비밀번호가 없는 예전 요청은 직접 링크를 만들 수 없습니다.
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-[#ead9cf] bg-white/92 p-6 shadow-[0_18px_40px_rgba(124,98,81,0.08)]">
            <label className="mb-2 block text-sm font-semibold text-[#5d4c47]">내부 메모</label>
            <textarea
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              className="min-h-36 w-full rounded-3xl border border-[#ead9cf] bg-[#fbf4f0] px-4 py-3 text-sm text-[#2c2c2c] outline-none transition focus:border-[#c9a897]"
              placeholder="작업 방향, 전달 사항, 내부 메모를 적어두세요."
            />
            <button
              type="button"
              onClick={() => updateRequest({ admin_note: adminNote }, "내부 메모가 저장되었습니다.")}
              disabled={working}
              className="mt-3 rounded-full bg-[linear-gradient(135deg,#c89f92,#b98677)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              메모 저장
            </button>
          </div>

          <div className="rounded-[28px] border border-[#ead9cf] bg-white/92 p-6 shadow-[0_18px_40px_rgba(124,98,81,0.08)]">
            <h2 className="mb-4 font-skin-serif text-[24px] text-[#2c2c2c]">댓글</h2>
            <div className="space-y-3">
              {comments.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#ead9cf] bg-[#fbf4f0] p-5 text-sm text-[#8a7670]">
                  아직 댓글이 없습니다.
                </div>
              ) : (
                comments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    onDelete={() => handleCommentDelete(comment.id)}
                  />
                ))
              )}
            </div>

            <div className="mt-5 space-y-3">
              <textarea
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
                className="min-h-28 w-full rounded-3xl border border-[#ead9cf] bg-[#fbf4f0] px-4 py-3 text-sm text-[#2c2c2c] outline-none transition focus:border-[#c9a897]"
                placeholder="클라이언트에게 전달할 댓글을 입력하세요."
              />
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <label className="cursor-pointer rounded-full border border-[#ead9cf] bg-[#fbf4f0] px-4 py-2 text-sm text-[#6d5c58]">
                  {commentImage ? commentImage.name : "댓글 이미지 첨부"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(event) => setCommentImage(event.target.files?.[0] ?? null)}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleCommentCreate}
                  disabled={working}
                  className="rounded-full bg-[linear-gradient(135deg,#c89f92,#b98677)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  댓글 등록
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {selectedPreviewImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setSelectedPreviewImage(null)}
        >
          <div
            className="relative max-h-full max-w-6xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedPreviewImage(null)}
              className="absolute -right-3 -top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#2c2c2c] shadow-lg"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <img
              src={selectedPreviewImage}
              alt=""
              className="max-h-[90vh] max-w-full rounded-2xl object-contain"
            />
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

function formatAdminError(error: unknown) {
  if (error instanceof Error && error.message) return error.message
  return "네트워크 또는 서버 오류가 발생했습니다."
}

function ReadOnlyField({
  label,
  value,
  full = false,
}: {
  label: string
  value?: string | null
  full?: boolean
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9b7b68]">{label}</p>
      <div className="rounded-3xl border border-[#ead9cf] bg-[#fbf4f0] px-4 py-3 text-sm leading-6 text-[#5d4c47] whitespace-pre-wrap">
        {value || "없음"}
      </div>
    </div>
  )
}

function ReferenceField({
  items,
  onImageClick,
}: {
  items: { label: string; value: string; isImage: boolean }[]
  onImageClick: (url: string) => void
}) {
  return (
    <div className="md:col-span-2">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9b7b68]">참고 자료</p>
      {items.length === 0 ? (
        <div className="rounded-3xl border border-[#ead9cf] bg-[#fbf4f0] px-4 py-3 text-sm leading-6 text-[#5d4c47] whitespace-pre-wrap">
          없음
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <div key={`${item.label}:${item.value}`} className="rounded-3xl border border-[#ead9cf] bg-[#fbf4f0] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#9b7b68]">{item.label}</p>
              <a
                href={item.value}
                target="_blank"
                rel="noreferrer"
                className="break-all text-sm text-[#8f695d] hover:underline"
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

function CommentCard({
  comment,
  onDelete,
}: {
  comment: RequestComment
  onDelete: () => void
}) {
  return (
    <div className="rounded-3xl border border-[#ead9cf] bg-[#fbf4f0] p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f695d]">Admin</span>
        <span className="text-xs text-[#8a7670]">{formatDate(comment.created_at)}</span>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-6 text-[#5d4c47]">{comment.text || "이미지 첨부"}</p>
      {comment.image_url ? (
        <img src={comment.image_url} alt="" className="mt-3 max-h-72 w-full rounded-2xl object-cover" />
      ) : null}
      <button
        type="button"
        onClick={onDelete}
        className="mt-3 text-xs font-medium text-red-600 hover:text-red-500"
      >
        댓글 삭제
      </button>
    </div>
  )
}

function extractAdminNoteValues(note: string | null, label: string) {
  if (!note) return []

  const line = note
    .split("\n")
    .find((entry) => entry.trim().startsWith(`${label}:`))

  if (!line) return []

  const rawValue = line.split(":").slice(1).join(":").trim()
  if (!rawValue) return []

  return rawValue
    .split(",")
    .map((value) => value.trim())
    .map((value) => (label === "추가 옵션" ? formatAdditionalOption(value) : value))
    .filter(Boolean)
}

function extractReferenceItems(referenceUrl: string | null) {
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





