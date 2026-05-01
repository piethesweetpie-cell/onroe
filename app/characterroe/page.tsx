"use client"

import type { ReactNode, RefObject } from "react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { extractStoragePath } from "@/lib/novelcraft"
import { supabase } from "@/lib/supabase"

type UploadedFile = { url: string; name: string }

const heroImages = [
  {
    src: "/images/characterroe/roe.png",
    alt: "Character Roe 캐릭터 라인업",
    width: 1124,
    height: 490,
    visualClassName:
      "bottom-[69px] right-[-12px] w-[82%] max-w-[420px] sm:bottom-[65px] sm:right-[-12px] sm:w-[72%] md:bottom-[-9px] md:right-[4px] md:w-[70%] md:max-w-[720px] lg:bottom-[-15px] lg:right-[32px] lg:w-[68%]",
  },
  {
    src: "/images/characterroe/roe2.png",
    alt: "Character Roe 캐릭터 라인업",
    width: 989,
    height: 710,
    visualClassName:
      "bottom-[52px] right-0 w-[76%] max-w-[390px] sm:right-0 sm:w-[68%] md:bottom-[-66px] md:right-4 md:w-[58%] md:max-w-[600px] lg:right-8 lg:w-[56%]",
  },
] as const

const inputClassName =
  "w-full rounded-[24px] border-2 border-[#e8dcd5] bg-white px-5 py-4 text-[15px] text-[#2c2c2c] outline-none transition focus:border-[#b8967e]"

const textAreaClassName = `${inputClassName} min-h-[130px] resize-y`

const styleOptions = [
  {
    label: "반실사 로맨스 표지풍",
    icon: "🌸",
    detail: "여성향 로판·현로에 가장 많이 쓰이는 안정적 스타일",
  },
  {
    label: "프리미엄 반실사",
    icon: "⭐",
    detail: "대표작·키비주얼용 고급 스타일 (여성향·남성향 모두 적합)",
  },
  {
    label: "다크 반실사",
    icon: "🖤",
    detail: "빌런·집착남주·다크 판타지·헌터물 빌런",
  },
  {
    label: "클린 반실사 페인티드",
    icon: "✨",
    detail: "설정화·내부자료용 깔끔한 스타일",
  },
  {
    label: "페인티드 로맨스풍",
    icon: "💗",
    detail: "여성향 감성·무드 중심 (BL·현로 추천)",
  },
  {
    label: "남성향 무협·현판풍",
    icon: "⚔️",
    detail: "무협·헌터물·현판 표지에 최적화된 강렬한 스타일",
  },
  {
    label: "추천받기",
    icon: "💬",
    detail: "장르와 목적에 맞춰 제안받기",
  },
]

const steps = [
  { index: "01", title: "의뢰 목적" },
  { index: "02", title: "캐릭터 정보" },
  { index: "03", title: "비주얼 방향" },
  { index: "04", title: "패키지 & 연락처" },
]

const packageOptions = [
  {
    id: "cover",
    icon: "👤",
    title: "표지 일러스트",
    price: "220,000원",
    amount: 220000,
    subtitle: "인물 1인 표지 일러스트 단독 제작 (타이포 미포함)",
    description: "직접 타이포 작업 가능한 작가용 / 일러스트만 필요한 경우",
    bullets: ["표지 일러스트 1장 (여성향 / 남성향)", "인물 1인 + 의상·소품·배경 디테일", "시안 2개 → 1개 선택 후 진행", "후보정 포함 (손·디테일 보정)", "수정 2회"],
  },
  {
    id: "full-cover",
    icon: "👤 + ✍️",
    title: "표지 풀패키지",
    price: "350,000원",
    amount: 350000,
    subtitle: "인물 1인 + 타이틀 디자인까지 완성된 표지",
    description: "연재·출간·플랫폼 업로드용 완성형 표지",
    bullets: ["표지 일러스트 1장 (여성향 / 남성향)", "인물 1인 + 의상·소품·배경 디테일", "타이틀 타이포그래피 디자인", "표지 최종 합본 (플랫폼 사이즈별 조정 포함)", "시안 3개 → 1개 선택 후 진행", "후보정 + 색감 보정", "수정 3회"],
    badge: "BEST",
    emphasized: true,
  },
  {
    id: "two-person-cover",
    icon: "👥 + ✍️",
    title: "2인 표지 풀패키지",
    price: "480,000원",
    amount: 480000,
    subtitle: "남녀주·커플 구도 + 타이틀까지 완성된 프리미엄 표지",
    description: "로맨스 메인 키비주얼 / 남녀주 합본 표지 / 출간용 대표 비주얼",
    bullets: ["표지 일러스트 1장 (여성향 / 남성향)", "인물 2인 (남녀주 / 라이벌 / 커플 구도) + 의상·소품·배경 디테일", "인물 간 관계성·구도 연출", "타이틀 타이포그래피 디자인", "표지 최종 합본 (플랫폼 사이즈별 조정 포함)", "시안 3개 → 1개 선택 후 진행", "후보정 + 색감 보정", "수정 3회"],
    badge: "PREMIUM",
    note: "1인 풀패키지 대비 +130,000원 / 인물 추가 옵션보다 저렴",
  },
]

const addOnOptions = [
  {
    id: "extra-person",
    title: "인물 추가",
    priceLabel: "+80,000원",
    amount: 80000,
    detail: "서브 캐릭터, 3인 이상 구도 등",
  },
  {
    id: "mood-cut",
    title: "무드컷 / 장면컷 추가",
    priceLabel: "+30,000원/장",
    amount: 30000,
    detail: "표지 외 추가 비주얼",
  },
  {
    id: "character-sheet",
    title: "캐릭터 설정 시트",
    priceLabel: "+40,000원",
    amount: 40000,
    detail: "외형·의상·표정 정리 시트",
  },
  {
    id: "extra-revision",
    title: "수정 횟수 추가",
    priceLabel: "+20,000원/회",
    amount: 20000,
    detail: "기본 수정 횟수 외 추가 조정",
  },
  {
    id: "rush",
    title: "러시 작업",
    priceLabel: "+30%",
    amount: 0,
    percentage: 0.3,
    detail: "3일 이내 납품",
  },
  {
    id: "psd",
    title: "PSD 원본 파일 제공",
    priceLabel: "+50,000원",
    amount: 50000,
    detail: "레이어 분리된 작업 원본",
  },
] as const

const formSections = [
  {
    index: "01",
    title: "의뢰 목적",
    body: "제작하려는 웹소설 표지의 용도를 선택해 주세요.",
  },
  {
    index: "02",
    title: "캐릭터 정보",
    body: "캐릭터의 기본 인상과 핵심 분위기를 간단히 정리해 주세요.",
  },
  {
    index: "03",
    title: "비주얼 방향",
    body: "외형과 스타일에서 꼭 필요한 방향만 알려주세요.",
  },
  {
    index: "04",
    title: "패키지 & 연락처",
    body: "필요한 패키지와 추가 옵션, 연락 정보를 남겨 주세요.",
  },
]

const checkboxGroups = {
  personality: [
    "차분한 / 지적인",
    "다정한 / 따뜻한",
    "도도한 / 카리스마",
    "밝은 / 순수한",
    "퇴폐적인 / 위험한",
    "비밀스러운 / 미스터리",
    "고급스러운 / 우아한",
    "강인한 / 거친",
    "로맨틱 / 애틋한",
    "집착 / 광기",
  ],
}

const radioGroups = {
  purpose: ["웹소설 표지 (여성향) — 로판 / 현로 / BL", "웹소설 표지 (남성향) — 현판 / 무협 / 헌터물", "웹소설 삽화 / 일러스트 — 본문 삽화 / 캐릭터 단독 컷", "e-book / 단행본 표지 — 출간·인쇄용", "기타 — 위에 해당하지 않는 표지 의뢰"],
  gender: ["여성", "남성"],
  age: ["10대 후반 ~ 20대 초반", "20대 중후반", "30대", "40대 이상", "미정"],
}

const initialTextValues = {
  projectTitle: "",
  characterName: "",
  appearance: "",
  avoid: "",
  clientName: "",
  deadline: "",
  email: "",
  secondaryEmail: "",
  request: "",
  password: "",
}

const initialSingleValues = {
  package: "full-cover",
  purpose: "",
  gender: "",
  age: "미정",
  style: "추천받기",
}

const initialMultiValues = Object.fromEntries(Object.keys(checkboxGroups).map((key) => [key, [] as string[]])) as Record<
  keyof typeof checkboxGroups,
  string[]
>

export default function CharacterRoePage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const logoGlowRef = useRef<HTMLDivElement>(null)
  const pointerTargetRef = useRef({ x: 0, y: 0 })
  const pointerCurrentRef = useRef({ x: 0, y: 0 })
  const [textValues, setTextValues] = useState(initialTextValues)
  const [singleValues, setSingleValues] = useState(initialSingleValues)
  const [multiValues, setMultiValues] = useState(initialMultiValues)
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [referenceLinks, setReferenceLinks] = useState(["", ""])
  const [heroImageIndex, setHeroImageIndex] = useState<number | null>(null)
  const [heroImageLoaded, setHeroImageLoaded] = useState(false)
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([])
  const [showAddOns, setShowAddOns] = useState(false)

  const selectedPackage = packageOptions.find((option) => option.id === singleValues.package) ?? packageOptions[1]
  const selectedAddOnOptions = addOnOptions.filter((option) => selectedAddOns.includes(option.id))
  const subtotalBeforeRush =
    selectedPackage.amount + selectedAddOnOptions.reduce((sum, option) => sum + ("percentage" in option ? 0 : option.amount), 0)
  const rushAmount = selectedAddOnOptions.some((option) => option.id === "rush") ? Math.round(subtotalBeforeRush * 0.3) : 0
  const totalEstimate = subtotalBeforeRush + rushAmount
  const isLastStep = activeStep === steps.length - 1
  const selectedHeroImage = heroImageIndex === null ? null : heroImages[heroImageIndex]

  useEffect(() => {
    setHeroImageLoaded(false)
    setHeroImageIndex(Math.floor(Math.random() * heroImages.length))
  }, [])

  useEffect(() => {
    if (heroImageIndex === null) return
    const timer = window.setTimeout(() => setHeroImageLoaded(true), 120)
    return () => window.clearTimeout(timer)
  }, [heroImageIndex])

  useEffect(() => {
    let frameId = 0
    let dirty = false

    const animate = () => {
      const cur = pointerCurrentRef.current
      const tgt = pointerTargetRef.current

      cur.x += (tgt.x - cur.x) * 0.08
      cur.y += (tgt.y - cur.y) * 0.08

      if (logoRef.current) {
        logoRef.current.style.transform = `translate(calc(-50% + ${cur.x * 22}px), calc(-50% - 32px + ${cur.y * 14}px)) rotate(${cur.x * 7}deg)`
      }

      if (logoGlowRef.current) {
        logoGlowRef.current.style.transform = `translate(calc(-50% + ${cur.x * 14}px), calc(-50% + ${cur.y * 10}px)) scale(${1 + Math.abs(cur.x) * 0.05})`
        logoGlowRef.current.style.opacity = (0.5 + Math.abs(cur.x) * 0.08 + Math.abs(cur.y) * 0.05).toFixed(3)
      }

      const settled = Math.abs(tgt.x - cur.x) < 0.001 && Math.abs(tgt.y - cur.y) < 0.001
      if (settled) {
        dirty = false
      } else {
        frameId = requestAnimationFrame(animate)
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = heroRef.current?.getBoundingClientRect()
      if (!bounds) return

      const normalizedX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2
      const normalizedY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2

      pointerTargetRef.current = {
        x: Math.max(-1, Math.min(1, normalizedX)),
        y: Math.max(-1, Math.min(1, normalizedY)),
      }

      if (!dirty) {
        dirty = true
        frameId = requestAnimationFrame(animate)
      }
    }

    const handlePointerLeave = () => {
      pointerTargetRef.current = { x: 0, y: 0 }
      if (!dirty) {
        dirty = true
        frameId = requestAnimationFrame(animate)
      }
    }

    const hero = heroRef.current
    if (!hero) return

    hero.addEventListener("pointermove", handlePointerMove, { passive: true })
    hero.addEventListener("pointerleave", handlePointerLeave)

    return () => {
      hero.removeEventListener("pointermove", handlePointerMove)
      hero.removeEventListener("pointerleave", handlePointerLeave)
      cancelAnimationFrame(frameId)
    }
  }, [])

  function updateText(key: keyof typeof initialTextValues, value: string) {
    setTextValues((prev) => ({ ...prev, [key]: value }))
  }

  function updateSingle(key: keyof typeof initialSingleValues, value: string) {
    setSingleValues((prev) => ({ ...prev, [key]: value }))
  }

  function toggleMulti(key: keyof typeof checkboxGroups, value: string) {
    setMultiValues((prev) => {
      const current = prev[key]
      if (key === "personality" && !current.includes(value) && current.length >= 3) return prev
      return {
        ...prev,
        [key]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
      }
    })
  }

  function toggleAddOn(value: string) {
    setSelectedAddOns((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  function handleReferenceLinkChange(index: number, value: string) {
    setReferenceLinks((prev) => prev.map((link, currentIndex) => (currentIndex === index ? value : link)))
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = event.target.files
    if (!selectedFiles?.length) return

    setUploadError(null)
    setIsUploading(true)

    const nextFiles: UploadedFile[] = []
    for (const file of Array.from(selectedFiles)) {
      if (file.size > 20 * 1024 * 1024) {
        setUploadError("파일은 1개당 20MB 이하로 업로드해 주세요.")
        continue
      }

      const fileExt = file.name.split(".").pop()
      const fileName = `character-roe/references/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`
      const { error } = await supabase.storage.from("order-references").upload(fileName, file)

      if (error) {
        setUploadError(error.message)
        continue
      }

      const { data } = supabase.storage.from("order-references").getPublicUrl(fileName)
      nextFiles.push({ url: data.publicUrl, name: file.name })
    }

    setFiles((prev) => [...prev, ...nextFiles])
    setIsUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function removeFile(fileUrl: string) {
    const path = extractStoragePath(fileUrl, "order-references")
    if (path) await supabase.storage.from("order-references").remove([path])
    setFiles((prev) => prev.filter((file) => file.url !== fileUrl))
  }

  function resetForm() {
    setTextValues(initialTextValues)
    setSingleValues(initialSingleValues)
    setMultiValues(initialMultiValues)
    setFiles([])
    setUploadError(null)
    setActiveStep(0)
    setReferenceLinks(["", ""])
    setSelectedAddOns([])
    setShowAddOns(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function validateStep(stepIndex: number) {
    if (stepIndex === 0) {
      if (!singleValues.purpose) return "어떤 용도인지 선택해 주세요."
    }

    if (stepIndex === 3) {
      if (!textValues.clientName.trim()) return "이름 또는 담당자명을 입력해 주세요."
      if (!textValues.deadline.trim()) return "희망 완료일을 선택해 주세요."
      if (!textValues.email.trim()) return "이메일을 입력해 주세요."
      if (textValues.password.trim().length < 4) return "작업 확인용 비밀번호는 4자리 이상 입력해 주세요."
      if (isUploading) return "참고자료 업로드가 끝난 뒤 다시 제출해 주세요."
    }

    return null
  }

  function goToNextStep() {
    const error = validateStep(activeStep)
    if (error) {
      setSubmitSuccess(null)
      setSubmitError(error)
      return
    }

    setSubmitError(null)
    setSubmitSuccess(null)
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  function goToPrevStep() {
    setSubmitError(null)
    setSubmitSuccess(null)
    setActiveStep((prev) => Math.max(prev - 1, 0))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(null)

    if (!isLastStep) return goToNextStep()

    for (let index = 0; index < steps.length; index += 1) {
      const error = validateStep(index)
      if (error) {
        setActiveStep(index)
        return setSubmitError(error)
      }
    }

    const formattedLinks = referenceLinks.map((link) => link.trim()).filter(Boolean)
    const referenceNotes = [
      ...files.map((file, index) => `참고자료 ${index + 1} (${file.name}): ${file.url}`),
      ...formattedLinks.map((link, index) => `레퍼런스 링크 ${index + 1}: ${link}`),
    ]
      .filter(Boolean)
      .join("\n")

    const adminNote = [
      "serviceType: CharacterRoe",
      `의뢰 목적: ${singleValues.purpose}`,
      textValues.projectTitle.trim() ? `제목: ${textValues.projectTitle.trim()}` : "",
      textValues.characterName.trim() ? `캐릭터 이름: ${textValues.characterName.trim()}` : "",
      `성별: ${singleValues.gender}`,
      `나이대: ${singleValues.age}`,
      `분위기/성격 키워드: ${multiValues.personality.join(", ") || "미정"}`,
      textValues.appearance.trim() ? `외형 희망사항: ${textValues.appearance.trim()}` : "",
      textValues.avoid.trim() ? `피하고 싶은 요소: ${textValues.avoid.trim()}` : "",
      `원하는 그림체: ${singleValues.style}`,
      `패키지: ${selectedPackage.title} (${selectedPackage.price})`,
      `추가 옵션: ${selectedAddOnOptions.map((option) => `${option.title} ${option.priceLabel}`).join(", ") || "없음"}`,
      `예상 합계: ${formatWon(totalEstimate)}`,
      textValues.deadline.trim() ? `희망 완료일: ${textValues.deadline.trim()}` : "",
      textValues.secondaryEmail.trim() ? `보조 이메일: ${textValues.secondaryEmail.trim()}` : "",
      textValues.request.trim() ? `추가 요청사항: ${textValues.request.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n")

    const requestPayload = {
      service_type: "character_roe" as const,
      serviceType: "CharacterRoe" as const,
      client_email: textValues.email.trim(),
      client_password: textValues.password.trim(),
      title: textValues.projectTitle.trim() || textValues.characterName.trim() || "CharacterRoe 캐릭터 비주얼 제작 의뢰",
      author: textValues.clientName.trim(),
      genre: singleValues.purpose || "캐릭터 비주얼 제작",
      style_direction: singleValues.style,
      package: `${selectedPackage.title} - ${selectedPackage.price} / 옵션: ${selectedAddOnOptions.map((option) => option.title).join(", ") || "없음"} / 예상 합계: ${formatWon(totalEstimate)}`,
      mood_keywords: multiValues.personality.join(", ") || "미정",
      color_keywords:
        textValues.appearance.trim() ||
        "캐릭터 비주얼 제작 상담",
      reference_url: referenceNotes || null,
      deadline: textValues.deadline.trim() || "상담 후 결정",
      comments: [],
      admin_note: adminNote,
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      })
      const result = await safeParseJson(response)
      setIsSubmitting(false)

      if (!response.ok) {
        return setSubmitError(`제출 중 문제가 발생했습니다. ${result.error ?? "잠시 후 다시 시도하거나 이메일로 문의해주세요."}`)
      }

      resetForm()
      if (result.warning) {
        setSubmitSuccess(`의뢰서가 접수되었습니다. (알림: ${result.warning})`)
      } else {
        setSubmitSuccess(
          "의뢰서가 접수되었습니다. 작성해주신 내용을 확인한 뒤 제작 가능 여부와 예상 견적을 안내드리겠습니다. 입력하신 이메일과 비밀번호로 Client 페이지에서 진행 상태를 확인해 주세요.",
        )
      }
    } catch (error) {
      setIsSubmitting(false)
      setSubmitError(`제출 중 문제가 발생했습니다. ${formatClientError(error)}`)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fdf8f5] text-[#2c2c2c] font-skin-sans">
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
        }}
      />

      <nav className="relative z-40 border-b border-[#eadfd8] bg-[#fdf8f5]/92 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1580px] items-center justify-between px-6 py-4 md:px-10 md:py-5">
          <Link href="/characterroe" className="text-[12px] font-semibold uppercase tracking-[0.42em] text-[#9d7f67]">
            CHARACTER ROE
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/"
              className="rounded-full border border-[#eadfd8] bg-white px-5 py-2.5 text-[12px] font-medium text-[#4a4a4a] shadow-[0_7px_14px_rgba(90,70,50,0.06)] transition-all hover:-translate-y-0.5 hover:border-[#c7a98c] md:px-7 md:py-3 md:text-base"
            >
              Studio Roe
            </Link>
            <Link
              href="/portfolio"
              className="rounded-full bg-[#934b66] px-5 py-2.5 text-[12px] font-semibold text-white shadow-[0_14px_30px_rgba(147,75,102,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#7d3f56] md:px-7 md:py-3 md:text-base"
            >
              포트폴리오
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <div className="relative overflow-hidden bg-[#fdf8f5]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),rgba(253,248,245,0.95)_36%,rgba(245,233,226,0.85)_74%,rgba(253,248,245,0.98)_100%)]" />
          <div
            className="pointer-events-none absolute inset-0 opacity-60 blur-[90px]"
            style={{ background: "radial-gradient(circle at 50% 24%, rgba(235, 214, 199, 0.75), transparent 40%)" }}
          />
          <div className="pointer-events-none absolute left-[10%] top-[10%] h-28 w-28 rounded-full bg-[#efe4dd] opacity-55 blur-3xl" />
          <div className="pointer-events-none absolute right-[12%] top-[12%] h-28 w-28 rounded-full bg-[#efe4dd] opacity-50 blur-3xl" />

          <section ref={heroRef} className="relative z-50 flex min-h-[400px] items-start justify-center px-6 pb-8 pt-8 md:min-h-[520px] md:px-10 md:pb-24 md:pt-10">
            <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center">
              <div className="relative flex min-h-[300px] w-full items-start justify-start md:min-h-[360px]">
                <div
                  ref={logoGlowRef}
                  className="pointer-events-none absolute left-[62%] top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2"
                  style={{ willChange: "transform, opacity" }}
                >
                  <div className="h-full w-full rounded-full bg-[radial-gradient(circle,rgba(219,192,175,0.28),rgba(255,255,255,0)_66%)] blur-[68px] hero-logo-glow-enter" />
                </div>

                <div className="relative z-10 pt-[38px] text-left hero-copy-enter hero-copy-enter-delay-2 md:pt-[52px]">
                  <h1 className="font-skin-serif text-[50px] leading-[0.88] tracking-[-0.05em] text-[#252525] md:text-[78px] lg:text-[100px]">
                    CharacterRoe
                  </h1>
                  <p className="mt-[-4px] font-skin-serif text-[40px] italic leading-none tracking-[-0.05em] text-[#c7a98c] md:mt-[-10px] md:text-[62px] lg:text-[78px]">
                    Request Form
                  </p>
                </div>

                {selectedHeroImage ? (
                  <div
                    className={`pointer-events-none absolute z-[80] transition-all duration-1000 ease-out ${selectedHeroImage.visualClassName} ${
                      heroImageLoaded ? "translate-y-0 opacity-100 blur-0" : "translate-y-5 opacity-0 blur-sm"
                    }`}
                  >
                    <Image
                      src={selectedHeroImage.src}
                      alt={selectedHeroImage.alt}
                      width={selectedHeroImage.width}
                      height={selectedHeroImage.height}
                      priority
                      className="h-auto w-full object-contain drop-shadow-[0_24px_38px_rgba(80,68,62,0.12)]"
                    />
                  </div>
                ) : null}

                <p className="relative z-30 mt-[220px] hidden font-skin-serif text-[24px] leading-tight text-[#2a2a2a] sm:mt-[240px] sm:text-[30px] md:absolute md:bottom-[14px] md:left-0 md:mt-0 md:block md:text-[34px]">
                  캐릭터 비주얼 제작 상담 폼
                </p>
              </div>
            </div>
          </section>

          <section className="sticky top-0 z-30 -mt-24 px-6 pb-8 pt-0 md:-mt-20">
            <div className="mx-auto max-w-5xl">
              <StepProgress steps={steps} activeStep={activeStep} />
            </div>
          </section>

          <form id="request-form" onSubmit={handleSubmit} className="relative z-10 px-6 pb-16 pt-0 md:pb-24">
          <div className="mx-auto max-w-5xl">
            <div className="relative">
              <div className="absolute inset-0 translate-x-3 translate-y-4 rounded-[32px] bg-[#d9ccc4]/85 shadow-[0_26px_60px_rgba(120,96,78,0.14)]" />
              <div
                className="relative rounded-[32px] bg-white p-8 shadow-[0_24px_50px_rgba(108,84,64,0.12)] md:p-12"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 29px, #f5f0eb 30px)",
                }}
              >
                <div className="absolute right-7 top-7 hidden h-20 w-20 rotate-[15deg] items-center justify-center rounded-[28px] border-[3px] border-[#cdb5a2] bg-white/25 opacity-75 md:flex">
                  <span className="text-center text-[11px] font-bold leading-[1.15] tracking-[0.08em] text-[#b8967e]">
                    CA
                    <span className="block">ROE</span>
                  </span>
                </div>

            {activeStep === 0 ? (
              <FormCard section={formSections[0]}>
                <Field label="제목">
                  <input className={inputClassName} value={textValues.projectTitle} onChange={(event) => updateText("projectTitle", event.target.value)} placeholder="예: 폭군의 계약 황후 / 회귀한 검신은 멈추지 않는다" />
                </Field>
                <Field label="어떤 용도인가요? *">
                  <RadioGroup options={radioGroups.purpose} value={singleValues.purpose} onChange={(value) => updateSingle("purpose", value)} />
                </Field>
              </FormCard>
            ) : null}

            {activeStep === 1 ? (
              <FormCard section={formSections[1]}>
                <Field label="캐릭터 이름">
                  <input className={inputClassName} value={textValues.characterName} onChange={(event) => updateText("characterName", event.target.value)} placeholder="예: 서이현 / 미정" />
                </Field>
                <Field label="성별 인상">
                  <RadioGroup options={radioGroups.gender} value={singleValues.gender} onChange={(value) => updateSingle("gender", value)} />
                </Field>
                <Field label="나이대">
                  <RadioGroup options={radioGroups.age} value={singleValues.age} onChange={(value) => updateSingle("age", value)} />
                </Field>
                <Field label="분위기 키워드">
                  <ChipGroup options={checkboxGroups.personality} values={multiValues.personality} onToggle={(value) => toggleMulti("personality", value)} />
                  <p className="mt-2 text-xs text-[#8a6c5b]">최대 3개까지 선택할 수 있습니다.</p>
                </Field>
              </FormCard>
            ) : null}

            {activeStep === 2 ? (
              <FormCard section={formSections[2]}>
                <Field label="외형 희망사항">
                  <textarea className={textAreaClassName} value={textValues.appearance} onChange={(event) => updateText("appearance", event.target.value)} placeholder="예: 은발 긴머리, 보라빛 눈동자, 황실 드레스" />
                </Field>
                <Field label="피하고 싶은 요소">
                  <textarea className={textAreaClassName} value={textValues.avoid} onChange={(event) => updateText("avoid", event.target.value)} placeholder="예: 어려 보이는 얼굴, 양산형 그림체, 과한 보정" />
                </Field>
                <Field label="원하는 스타일">
                  <div className="grid gap-4 md:grid-cols-2">
                    {styleOptions.map((option) => {
                      const active = singleValues.style === option.label
                      return (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => updateSingle("style", option.label)}
                          className={`rounded-[22px] border p-5 text-left transition-all ${
                            active ? "border-[#d9b7c0] bg-[#f7e7eb] shadow-[0_16px_30px_rgba(148,106,120,0.12)]" : "border-[#ead9cf] bg-white hover:border-[#d9b8a6]"
                          }`}
                        >
                          <span className="flex items-center gap-2 text-sm font-semibold text-[#2c2c2c]">
                            <span aria-hidden="true">{option.icon}</span>
                            {option.label}
                          </span>
                          <span className="mt-2 block text-sm leading-6 text-[#6b6b6b]">{option.detail}</span>
                        </button>
                      )
                    })}
                  </div>
                </Field>
              </FormCard>
            ) : null}

            {activeStep === 3 ? (
              <FormCard section={formSections[3]}>
                <section id="packages" className="relative overflow-hidden rounded-[28px] bg-[#f5e6e7] px-5 py-8 md:px-7">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.88),rgba(245,230,231,0.95)_34%,rgba(239,219,222,0.9)_70%,rgba(245,230,231,0.98)_100%)]" />
                  <div className="relative z-10">
                    <div className="mb-7 text-center">
                      <h4 className="font-skin-serif text-[20px] text-[#2c2c2c] md:text-[25px]">패키지 선택</h4>
                    </div>

                    <div className="grid items-stretch gap-4 md:grid-cols-3 md:gap-6">
                      {packageOptions.map((option) => {
                        const active = singleValues.package === option.id

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => updateSingle("package", option.id)}
                            aria-pressed={active}
                            className={`relative flex h-full min-h-[520px] origin-top cursor-pointer flex-col items-start justify-start rounded-[28px] px-6 pb-7 pt-7 text-left align-top transition-all duration-300 md:px-7 ${
                              active || option.emphasized
                                ? "border-2 border-[#8b475d] bg-[linear-gradient(180deg,#fffaf8_0%,#f7e7eb_100%)] shadow-[0_24px_46px_rgba(148,106,120,0.16)]"
                                : "border border-[#ead9cf] bg-white/92 shadow-[0_18px_38px_rgba(124,98,81,0.08)] hover:-translate-y-1 hover:border-[#d9b8a6] hover:shadow-[0_22px_42px_rgba(124,98,81,0.12)]"
                            }`}
                          >
                            {active ? (
                              <span className="absolute left-4 top-4 rounded-full bg-[#8b475d] px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-white shadow-[0_8px_16px_rgba(139,71,93,0.16)]">
                                선택됨
                              </span>
                            ) : null}
                            {option.badge ? (
                              <span className="absolute right-4 top-4 rounded-full border border-[#d9b7c0] bg-white/90 px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-[#8b475d] shadow-[0_8px_16px_rgba(139,71,93,0.10)]">
                                {option.badge}
                              </span>
                            ) : null}
                            <div className="mb-5 min-h-[170px] w-full pr-12 pt-8">
                              <div className="mb-4 text-2xl" aria-hidden="true">{option.icon}</div>
                              <p className={`text-sm font-semibold tracking-[0.08em] ${active ? "text-[#8b475d]" : "text-[#b8967e]"}`}>{option.title}</p>
                              <p className={`mt-2 font-skin-serif text-[31px] leading-tight lg:text-4xl ${active ? "text-[#2c2c2c]" : "text-[#3c322f]"}`}>{option.price}</p>
                              <p className={`mt-3 text-sm leading-6 ${active ? "text-[#5f4c45]" : "text-[#6f6159]"}`}>{option.subtitle}</p>
                              {option.note ? (
                                <p className="mt-3 rounded-[16px] bg-white/75 px-3 py-2 text-xs leading-5 text-[#8b475d]">{option.note}</p>
                              ) : null}
                            </div>
                            <ul className="space-y-3">
                              {option.bullets.map((bullet) => (
                                <li key={bullet} className={`flex items-start gap-3 text-sm leading-6 ${active ? "text-[#4a4a4a]" : "text-[#554640]"}`}>
                                  <span className="mt-0.5 text-[#8b475d]">✓</span>
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                            <p className={`mt-auto pt-6 text-sm leading-6 ${active ? "text-[#8b475d]" : "text-[#8a6c5b]"}`}>활용: {option.description}</p>
                          </button>
                        )
                      })}
                    </div>

                    <div className="mt-6 rounded-[24px] border border-white/75 bg-white/75 p-5 shadow-[0_14px_30px_rgba(124,98,81,0.08)]">
                      <button
                        type="button"
                        onClick={() => setShowAddOns((prev) => !prev)}
                        className="flex min-h-[44px] w-full items-center justify-between gap-4 text-left text-sm font-semibold text-[#4a332d]"
                        aria-expanded={showAddOns}
                      >
                        <span>옵션 추가하기</span>
                        <span className="text-[#8b475d]">{showAddOns ? "닫기" : "열기"}</span>
                      </button>

                      {showAddOns ? (
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {addOnOptions.map((option) => {
                            const active = selectedAddOns.includes(option.id)
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => toggleAddOn(option.id)}
                                aria-pressed={active}
                                className={`min-h-[76px] rounded-[20px] border px-4 py-3 text-left transition-all ${
                                  active ? "border-[#8b475d] bg-[#f7e7eb] shadow-[0_12px_24px_rgba(139,71,93,0.12)]" : "border-[#ead9cf] bg-white hover:border-[#d9b8a6]"
                                }`}
                              >
                                <span className="flex items-center justify-between gap-4 text-sm font-semibold text-[#2c2c2c]">
                                  <span>{option.title}</span>
                                  <span className="shrink-0 text-[#8b475d]">{option.priceLabel}</span>
                                </span>
                                <span className="mt-1 block text-sm leading-6 text-[#6b6b6b]">{option.detail}</span>
                              </button>
                            )
                          })}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </section>

                <div className="grid gap-6 md:grid-cols-2">
                  <UploadCard inputRef={fileInputRef} files={files} error={uploadError} isUploading={isUploading} onChange={handleFileUpload} onRemove={removeFile} />

                  <div className="rounded-[28px] border border-[#ead9cf] bg-white/85 p-8 shadow-[0_18px_40px_rgba(124,98,81,0.08)]">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-medium text-[#2c2c2c]">레퍼런스 링크</h4>
                        <p className="mt-1 text-sm leading-7 text-[#6b6b6b]">
                          핀터레스트, 상세페이지, 광고 레퍼런스 링크가 있다면 함께 남겨 주세요.
                        </p>
                      </div>
                      <div className="rounded-full bg-[#f5e6e8] px-4 py-2 text-xs font-semibold tracking-[0.16em] text-[#8b475d]">
                        OPTIONAL
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <input
                        value={referenceLinks[0]}
                        onChange={(event) => handleReferenceLinkChange(0, event.target.value)}
                        className={inputClassName}
                        placeholder="https://..."
                      />
                      <input
                        value={referenceLinks[1]}
                        onChange={(event) => handleReferenceLinkChange(1, event.target.value)}
                        className={inputClassName}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                <Field label="이름 / 담당자명 *">
                  <input className={inputClassName} value={textValues.clientName} onChange={(event) => updateText("clientName", event.target.value)} />
                </Field>
                <div className="grid gap-5 md:grid-cols-3">
                  <Field label="이메일 *">
                    <input type="email" className={inputClassName} value={textValues.email} onChange={(event) => updateText("email", event.target.value)} />
                  </Field>
                  <Field label="희망 완료일 *">
                    <input type="date" className={inputClassName} value={textValues.deadline} onChange={(event) => updateText("deadline", event.target.value)} />
                  </Field>
                  <Field label="작업 확인용 비밀번호 *">
                    <input type="password" className={inputClassName} value={textValues.password} onChange={(event) => updateText("password", event.target.value)} placeholder="4자리 이상" />
                  </Field>
                </div>
                <Field label="보조 이메일">
                  <input type="email" className={inputClassName} value={textValues.secondaryEmail} onChange={(event) => updateText("secondaryEmail", event.target.value)} placeholder="알림 누락 방지용 이메일" />
                </Field>
                <Field label="추가 요청사항">
                  <textarea className={textAreaClassName} value={textValues.request} onChange={(event) => updateText("request", event.target.value)} placeholder="꼭 고려해야 할 점이 있다면 적어주세요" />
                </Field>
              </FormCard>
            ) : null}

            {submitError ? (
              <div className="mt-6 rounded-[22px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">{submitError}</div>
            ) : null}

            {submitSuccess ? (
              <div className="mt-6 rounded-[22px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-7 text-emerald-700">
                {submitSuccess}
              </div>
            ) : null}

            {isLastStep ? (
              <div className="sticky bottom-4 z-30 mt-8 rounded-[26px] border border-[#ead9cf] bg-white/94 p-5 shadow-[0_18px_42px_rgba(90,64,54,0.18)] backdrop-blur-md">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7355]">Estimate</p>
                    <p className="mt-1 text-sm leading-6 text-[#6b6b6b]">
                      {selectedPackage.title}
                      {selectedAddOnOptions.length ? ` + 옵션 ${selectedAddOnOptions.length}개` : ""}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="mb-3 space-y-1 text-sm text-[#6b6b6b]">
                      <p>패키지 {formatWon(selectedPackage.amount)}</p>
                      {selectedAddOnOptions.filter((option) => option.id !== "rush").length ? (
                        <p>추가 옵션 {formatWon(subtotalBeforeRush - selectedPackage.amount)}</p>
                      ) : null}
                      {rushAmount > 0 ? <p className="font-semibold text-[#8b475d]">러시 작업 +30% {formatWon(rushAmount)}</p> : null}
                    </div>
                    <p className="font-skin-serif text-[30px] leading-none text-[#2c2c2c]">{formatWon(totalEstimate)}</p>
                    <p className="mt-2 text-xs text-[#8a6c5b]">옵션 선택 시 합계 금액이 실시간 업데이트됩니다.</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goToPrevStep}
                disabled={activeStep === 0 || isSubmitting}
                className="rounded-full border border-[#ead9cf] bg-white px-8 py-4 text-sm font-semibold text-[#4a4a4a] transition-all hover:-translate-y-0.5 hover:border-[#b8967e] disabled:cursor-not-allowed disabled:opacity-45"
              >
                이전
              </button>
              {isLastStep ? (
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="rounded-full bg-[#934b66] px-8 py-4 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(147,75,102,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#7d3f56] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "제출 중..." : "제출하기"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goToNextStep}
                  disabled={isSubmitting}
                  className="rounded-full bg-[#934b66] px-8 py-4 text-sm font-semibold text-white shadow-[0_18px_34px_rgba(147,75,102,0.24)] transition-all hover:-translate-y-0.5 hover:bg-[#7d3f56] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  다음
                </button>
              )}
            </div>

            {isLastStep ? (
              <div className="mt-8 rounded-[28px] border border-[#ead9cf] bg-white p-7 shadow-[0_18px_38px_rgba(124,98,81,0.08)]">
                <h3 className="font-skin-serif text-[24px] text-[#2c2c2c]">안내사항</h3>
                <p className="mt-3 text-sm leading-7 text-[#6b6b6b]">
                  CharacterRoe는 웹소설 표지 일러스트 제작 전문 서비스입니다. 여성향·남성향 웹소설 연재·출간·플랫폼 업로드용 표지에 특화되어 있습니다.
                </p>
                <p className="text-sm leading-7 text-[#6b6b6b]">
                  다음 작업은 진행하지 않습니다: 로고형 마스코트 / 유아 대상 캐릭터 / 인쇄용 벡터 / 특정 작가 그림체 복제
                </p>
              </div>
            ) : null}
              </div>
            </div>
          </div>
        </form>
        </div>
      </main>
    </div>
  )
}

function FormCard({
  section,
  children,
}: {
  section: { index: string; title: string; body: string }
  children: ReactNode
}) {
  return (
    <section className="mb-8">
      <div className="mb-6">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#8b7355]">{section.index}</p>
        <h3 className="font-skin-serif text-[20px] leading-tight text-[#2c2c2c] md:text-[25px]">{section.title}</h3>
        <p className="mt-4 max-w-2xl text-[#6b6b6b]">{section.body}</p>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  )
}

function StepProgress({
  steps,
  activeStep,
}: {
  steps: { index: string; title: string }[]
  activeStep: number
}) {
  const progressColors = [
    "bg-[linear-gradient(90deg,#f0d9df_0%,#d9a8b8_100%)]",
    "bg-[linear-gradient(90deg,#d9a8b8_0%,#be7890_100%)]",
    "bg-[linear-gradient(90deg,#be7890_0%,#9e526e_100%)]",
    "bg-[linear-gradient(90deg,#9e526e_0%,#743149_100%)]",
  ]

  return (
    <div className="rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-[0_18px_40px_rgba(124,98,81,0.08)] backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between text-xs font-semibold text-[#8a6c5b]">
        <span>
          Step {activeStep + 1}/{steps.length}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        {steps.map((step, index) => {
          const active = index === activeStep
          const completed = index < activeStep
          return (
            <div key={step.index} className="min-w-0">
              <div className={`h-2 rounded-full ${active || completed ? progressColors[index] : "bg-[#eadfd8]"}`} />
              <p className={`mt-2 truncate text-xs font-semibold ${active ? "text-[#8b475d]" : "text-[#8a6c5b]"}`}>
                {step.index} {step.title}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="block">
      <span className="mb-2 block text-sm font-medium text-[#4a4a4a]">{label}</span>
      {children}
    </div>
  )
}

function ChipGroup({
  options,
  values,
  onToggle,
}: {
  options: string[]
  values: string[]
  onToggle: (option: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = values.includes(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-medium transition-all ${
              active ? "bg-[#8b475d] text-white" : "bg-[#f5f0eb] text-[#4a4a4a] hover:bg-[#e8dcd5]"
            }`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

function RadioGroup({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-medium transition-all ${
              active ? "bg-[#8b475d] text-white" : "bg-[#f5f0eb] text-[#4a4a4a] hover:bg-[#e8dcd5]"
            }`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

function UploadCard({
  inputRef,
  files,
  error,
  isUploading,
  onChange,
  onRemove,
}: {
  inputRef: RefObject<HTMLInputElement | null>
  files: UploadedFile[]
  error: string | null
  isUploading: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: (fileUrl: string) => void
}) {
  return (
    <div className="rounded-[28px] border border-[#ead9cf] bg-white p-8 shadow-[0_18px_40px_rgba(124,98,81,0.08)]">
      <div className="mb-5">
        <h4 className="text-lg font-medium text-[#2c2c2c]">참고자료 업로드</h4>
        <p className="mt-2 text-sm leading-7 text-[#6b6b6b]">
          참고 이미지, 기존 프로필, 기획서, 무드보드가 있다면 업로드해주세요.
        </p>
      </div>
      <label className={`block rounded-[22px] border-2 border-dashed border-[#e8dcd5] p-6 text-center transition-colors ${isUploading ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-[#b8967e]"}`}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf,.zip,application/zip,application/x-zip-compressed"
          multiple
          className="hidden"
          onChange={onChange}
          disabled={isUploading}
        />
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f5e6e8] text-xl text-[#8b475d]">↑</div>
        <p className="font-medium text-[#2c2c2c]">{isUploading ? "업로드 중..." : "파일 선택"}</p>
        <p className="mt-1 text-sm text-[#6b6b6b]">이미지, PDF, ZIP 파일을 업로드할 수 있습니다. 파일당 최대 20MB</p>
      </label>

      {error ? <div className="mt-4 rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div> : null}

      {files.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-3">
          {files.map((file) => (
            <div key={file.url} className="group relative">
              {isPreviewableImage(file.name) ? (
                <img src={file.url} alt={file.name} className="h-24 w-24 rounded-[18px] border border-[#e8dcd5] object-cover" />
              ) : (
                <div className="flex h-24 w-24 flex-col items-center justify-center rounded-[18px] border border-[#e8dcd5] bg-[#fbf4f0] px-2 text-center">
                  <span className="rounded-full bg-[#f5e6e8] px-2 py-1 text-[10px] font-bold tracking-[0.14em] text-[#8b475d]">FILE</span>
                  <span className="mt-2 overflow-hidden text-[11px] font-medium leading-4 text-[#6b6b6b]">{file.name}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => onRemove(file.url)}
                className="absolute -right-2 -top-2 rounded-full bg-[#8b475d] px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function isPreviewableImage(fileName: string) {
  const normalizedName = fileName.toLowerCase()
  return normalizedName.endsWith(".jpg") || normalizedName.endsWith(".jpeg") || normalizedName.endsWith(".png") || normalizedName.endsWith(".webp")
}

function formatWon(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`
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
  return "잠시 후 다시 시도하거나 이메일로 문의해주세요."
}
