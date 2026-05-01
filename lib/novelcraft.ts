export const requestStatuses = ["접수", "작업중", "수정중", "완료"] as const

export type RequestStatus = (typeof requestStatuses)[number]
export type ServiceType = "onsu" | "studio_roe" | "character_roe" | "character" | "title"

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
  접수: "bg-[#f7efe8] text-[#7b675d] ring-1 ring-[#ead9cf]",
  작업중: "bg-[#f4e3df] text-[#9f6f66] ring-1 ring-[#e3c5bd]",
  수정중: "bg-[#f3e8db] text-[#9b7657] ring-1 ring-[#e3cdb7]",
  완료: "bg-[#ebf0e8] text-[#66745f] ring-1 ring-[#cfd8c9]",
}

export const packageClassNames = {
  basic: "bg-[#f7efe8] text-[#7b675d] ring-1 ring-[#ead9cf]",
  standard: "bg-[#f4e3df] text-[#9f6f66] ring-1 ring-[#e3c5bd]",
  premium: "bg-[#f3e8db] text-[#9b7657] ring-1 ring-[#e3cdb7]",
}

export const additionalOptionLabels: Record<string, string> = {
  background: "배경 추가",
  "extra-person": "인물 추가",
  "extra-revision": "수정 횟수 추가",
  rush: "급행 마감",
  series: "시리즈 권별 컬러 변경",
  private: "포트폴리오 비공개",
  model: "모델 1인 추가",
  detail: "상세페이지 제작",
  retouch: "추가 리터칭",
}

export const packagePrices = {
  characterBasic: 19000,
  characterStandard: 49000,
  characterDeluxe: 99000,
  titleCover: 220000,
  titleFullCover: 350000,
  titleTwoPersonCover: 480000,
  basic: 99000,
  standard: 149000,
  studioBasic: 59000,
  studioStandard: 120000,
  legacyCharacterBasic: 99000,
  legacyCharacterStandard: 179000,
  legacyCharacterPremium: 490000,
  premium: 220000,
} as const

export const additionalOptionPrices: Record<string, number> = {
  background: 30000,
  "extra-person": 30000,
  "extra-revision": 10000,
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
  const normalizedValue = packageValue?.toUpperCase() ?? ""

  if (packageValue?.includes("캐릭터 베이직")) return packagePrices.characterBasic
  if (packageValue?.includes("캐릭터 스탠다드")) return packagePrices.characterStandard
  if (packageValue?.includes("캐릭터 디럭스")) return packagePrices.characterDeluxe
  if (packageValue?.includes("2인 표지 풀패키지")) return packagePrices.titleTwoPersonCover
  if (packageValue?.includes("표지 풀패키지")) return packagePrices.titleFullCover
  if (packageValue?.includes("표지 일러스트")) return packagePrices.titleCover
  if (packageValue?.includes("캐릭터 기본")) return packagePrices.legacyCharacterBasic
  if (packageValue?.includes("캐릭터 비쥬얼")) return packagePrices.legacyCharacterStandard
  if (packageValue?.includes("프로젝트 캐릭터")) return packagePrices.legacyCharacterPremium
  if (packageValue?.includes("초단편")) return packagePrices.basic
  if (packageValue?.includes("스탠다드")) return packagePrices.standard
  if (normalizedValue.includes("BASIC")) return packagePrices.studioBasic
  if (normalizedValue.includes("STANDARD")) return packagePrices.studioStandard
  if (normalizedValue.includes("PREMIUM")) return packagePrices.premium
  return 0
}

export function getAdditionalOptionPrice(optionValue: string) {
  const directPrice = additionalOptionPrices[optionValue]
  if (typeof directPrice === "number") return directPrice

  if (optionValue.includes("배경 추가")) return 30000
  if (optionValue.includes("인물 추가")) return optionValue.includes("80,000") ? 80000 : 30000
  if (optionValue.includes("수정 횟수 추가")) return optionValue.includes("20,000") ? 20000 : 10000
  if (optionValue.includes("러시 작업")) return 0

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
  const normalizedValue = value?.toUpperCase() ?? ""

  if (value?.includes("초단편")) return packageClassNames.basic
  if (value?.includes("캐릭터 베이직")) return packageClassNames.basic
  if (value?.includes("캐릭터 디럭스")) return packageClassNames.premium
  if (value?.includes("2인 표지 풀패키지")) return packageClassNames.premium
  if (value?.includes("표지 풀패키지")) return packageClassNames.premium
  if (value?.includes("캐릭터 기본")) return packageClassNames.basic
  if (value?.includes("프로젝트 캐릭터")) return packageClassNames.premium
  if (normalizedValue.includes("PREMIUM")) return packageClassNames.premium
  if (normalizedValue.includes("BASIC")) return packageClassNames.basic
  return packageClassNames.standard
}

export function getServiceLabel(value?: ServiceType | null) {
  if (value === "character") return "CharacterRoe"
  if (value === "title") return "TitleRoe"
  if (value === "character_roe") return "CharacterRoe"
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
