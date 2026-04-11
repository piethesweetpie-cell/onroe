export const requestStatuses = ["접수", "작업중", "수정중", "완료"] as const

export type RequestStatus = (typeof requestStatuses)[number]
export type ServiceType = "onsu" | "studio_roe"

export type RequestComment = {
  id: string
  author: "admin"
  text: string
  created_at: string
  image_url?: string
}

export type RequestRow = {
  id: string
  created_at: string
  client_email: string
  service_type?: ServiceType | null
  title: string | null
  author: string | null
  genre: string | null
  style_direction: string | null
  package: string | null
  mood_keywords: string | null
  color_keywords: string | null
  reference_url: string | null
  deadline: string | null
  status: RequestStatus
  admin_note: string | null
  comments: RequestComment[] | null
}

export type ClientSafeRequestRow = Omit<RequestRow, "admin_note">

export type PreviewImageRow = {
  id: string
  request_id: string
  url: string
  uploaded_at: string
}

export const statusClassNames: Record<RequestStatus, string> = {
  접수: "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200",
  작업중: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  수정중: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  완료: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
}

export const packageClassNames = {
  basic: "bg-zinc-100 text-zinc-700",
  standard: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  premium: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
}

export const additionalOptionLabels: Record<string, string> = {
  rush: "급행 마감",
  series: "시리즈 권별 컬러 변경",
  private: "포트폴리오 비공개",
  model: "모델 1인 추가",
  detail: "상세페이지 제작",
  retouch: "추가 리터칭",
}

export const packagePrices = {
  basic: 99000,
  standard: 149000,
  studioBasic: 59000,
  studioStandard: 120000,
  premium: 220000,
} as const

export const additionalOptionPrices: Record<string, number> = {
  rush: 20000,
  series: 20000,
  private: 50000,
  model: 50000,
  detail: 100000,
  retouch: 30000,
}

export function formatAdditionalOption(value: string) {
  return additionalOptionLabels[value] ?? value
}

export function getPackagePrice(packageValue?: string | null) {
  if (packageValue?.includes("초단편")) return packagePrices.basic
  if (packageValue?.includes("스탠다드")) return packagePrices.standard
  if (packageValue?.includes("BASIC")) return packagePrices.studioBasic
  if (packageValue?.includes("STANDARD")) return packagePrices.studioStandard
  if (packageValue?.includes("PREMIUM")) return packagePrices.premium
  return 0
}

export function getAdditionalOptionPrice(optionValue: string) {
  const directPrice = additionalOptionPrices[optionValue]
  if (typeof directPrice === "number") return directPrice

  const matchedEntry = Object.entries(additionalOptionLabels).find(([, label]) => label === optionValue)
  if (!matchedEntry) return 0
  return additionalOptionPrices[matchedEntry[0]] ?? 0
}

export function formatKrw(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`
}

export function formatDate(value?: string | null) {
  if (!value) return "미정"
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}

export function getPackageTone(value?: string | null) {
  if (value?.includes("초단편")) return packageClassNames.basic
  if (value?.includes("PREMIUM")) return packageClassNames.premium
  if (value?.includes("BASIC")) return packageClassNames.basic
  return packageClassNames.standard
}

export function getServiceLabel(value?: ServiceType | null) {
  if (value === "studio_roe") return "STUDIO ROE"
  return "ONSU"
}

export function getCommentCount(request: Pick<RequestRow, "comments">) {
  return request.comments?.length ?? 0
}

export function encodeEmailPath(email: string) {
  return encodeURIComponent(email)
}

export function decodeEmailPath(email: string) {
  return decodeURIComponent(email)
}

export function extractStoragePath(publicUrl: string, bucket: string) {
  const marker = `/object/public/${bucket}/`
  const markerIndex = publicUrl.indexOf(marker)
  if (markerIndex === -1) return null
  return publicUrl.slice(markerIndex + marker.length)
}

export function createComment(text: string, imageUrl?: string): RequestComment {
  return {
    id: crypto.randomUUID(),
    author: "admin",
    text,
    created_at: new Date().toISOString(),
    ...(imageUrl ? { image_url: imageUrl } : {}),
  }
}

export function safeArray<T>(value: T[] | null | undefined) {
  return Array.isArray(value) ? value : []
}

export const clientRequestColumns = [
  "id",
  "created_at",
  "client_email",
  "service_type",
  "title",
  "author",
  "genre",
  "style_direction",
  "package",
  "mood_keywords",
  "color_keywords",
  "reference_url",
  "deadline",
  "status",
  "comments",
].join(", ")
