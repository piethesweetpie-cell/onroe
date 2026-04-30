"use client"

import type { ReactNode, RefObject } from "react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { extractStoragePath } from "@/lib/novelcraft"
import { supabase } from "@/lib/supabase"

type UploadedFile = { url: string; name: string }

const inputClassName =
  "w-full rounded-[24px] border-2 border-[#e8dcd5] bg-white px-5 py-4 text-[15px] text-[#2c2c2c] outline-none transition focus:border-[#b8967e]"

const textAreaClassName = `${inputClassName} min-h-[130px] resize-y`

const styleOptions = [
  {
    label: "반실사 로맨스 표지풍",
    detail: "대중적이고 안정적인 인물 비주얼",
  },
  {
    label: "프리미엄 반실사",
    detail: "대표 캐릭터·키비주얼용 고급 스타일",
  },
  {
    label: "클린 반실사 페인티드",
    detail: "깔끔하고 정돈된 설정화 스타일",
  },
  {
    label: "페인티드 로맨스풍",
    detail: "감정선과 분위기 중심의 무드 비주얼",
  },
  {
    label: "다크 반실사",
    detail: "빌런·라이벌·다크 판타지에 적합",
  },
  {
    label: "추천받기",
    detail: "목적에 맞춰 제안받기",
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
    id: "basic",
    title: "Basic",
    price: "99,000원",
    subtitle: "캐릭터 기본 시안",
    description: "캐릭터 1명의 기본 방향 확인용",
    bullets: ["프로필 1장 + 전신 설정화 1장", "캐릭터 방향 요약", "수정 1회"],
  },
  {
    id: "standard",
    title: "Standard",
    price: "179,000원",
    subtitle: "캐릭터 비쥬얼",
    description: "실제 프로젝트 활용 가능한 비주얼 세트",
    bullets: ["캐릭터 1명, 총 5장 (프로필·전신·단독·무드컷·대표비주얼)", "캐릭터 요약", "수정 2회"],
    setIcon: true,
  },
  {
    id: "premium",
    title: "Premium",
    price: "490,000원",
    subtitle: "프로젝트 캐릭터",
    description: "주요 캐릭터 다수를 한 번에 정리",
    bullets: ["캐릭터 3명 (프로필·전신·무드컷 3장·키비주얼 1장)", "캐릭터별 요약", "수정 3회"],
    setIcon: true,
  },
]

const formSections = [
  {
    index: "01",
    title: "의뢰 목적",
    body: "캐릭터 사용 계획을 알려주세요.",
  },
  {
    index: "02",
    title: "캐릭터 정보",
    body: "캐릭터의 역할과 핵심 분위기를 간단히 정리해 주세요.",
  },
  {
    index: "03",
    title: "비주얼 방향",
    body: "외형과 스타일에서 꼭 필요한 방향만 알려주세요.",
  },
  {
    index: "04",
    title: "패키지 & 연락처",
    body: "구매하신 패키지를 알려주세요.",
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
    "고급스러운 / 프로페셔널",
    "강인한 / 거친",
  ],
}

const radioGroups = {
  purpose: ["웹툰 / 웹소설 캐릭터", "게임 / 비주얼노벨 캐릭터", "브랜드 / SNS 페르소나", "기타"],
  usageScope: ["내부 검토 / 피칭용", "SNS·콘텐츠 공개용", "상업 프로젝트 사용", "미정"],
  gender: ["여성", "남성", "중성적"],
  age: ["10대 후반 ~ 20대 초반", "20대 중후반", "30대", "40대 이상", "미정"],
  role: ["주연", "라이벌 / 빌런", "조연 / NPC", "브랜드 캐릭터"],
}

const initialTextValues = {
  projectTitle: "",
  characterName: "",
  oneLine: "",
  appearance: "",
  avoid: "",
  clientName: "",
  deadline: "",
  email: "",
  messenger: "",
  request: "",
  password: "",
}

const initialSingleValues = {
  package: "standard",
  purpose: "",
  usageScope: "",
  gender: "여성",
  age: "미정",
  role: "",
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

  const selectedPackage = packageOptions.find((option) => option.id === singleValues.package) ?? packageOptions[1]
  const isLastStep = activeStep === steps.length - 1

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
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function validateStep(stepIndex: number) {
    if (stepIndex === 0) {
      if (!singleValues.purpose) return "어떤 용도인지 선택해 주세요."
      if (!singleValues.usageScope) return "사용 범위를 선택해 주세요."
    }

    if (stepIndex === 1) {
      if (!singleValues.role) return "캐릭터 역할을 선택해 주세요."
      if (!textValues.oneLine.trim()) return "캐릭터 한 줄 소개를 입력해 주세요."
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
      `사용 범위: ${singleValues.usageScope}`,
      textValues.characterName.trim() ? `캐릭터 이름: ${textValues.characterName.trim()}` : "",
      `성별: ${singleValues.gender}`,
      `나이대: ${singleValues.age}`,
      `캐릭터 역할: ${singleValues.role}`,
      textValues.oneLine.trim() ? `한 줄 소개: ${textValues.oneLine.trim()}` : "",
      `분위기/성격 키워드: ${multiValues.personality.join(", ") || "미정"}`,
      textValues.appearance.trim() ? `외형 희망사항: ${textValues.appearance.trim()}` : "",
      textValues.avoid.trim() ? `피하고 싶은 요소: ${textValues.avoid.trim()}` : "",
      `원하는 그림체: ${singleValues.style}`,
      `패키지: ${selectedPackage.title} - ${selectedPackage.subtitle}`,
      textValues.deadline.trim() ? `희망 완료일: ${textValues.deadline.trim()}` : "",
      textValues.messenger.trim() ? `연락 가능한 메신저: ${textValues.messenger.trim()}` : "",
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
      package: `${selectedPackage.title} - ${selectedPackage.subtitle}`,
      mood_keywords: multiValues.personality.join(", ") || "미정",
      color_keywords:
        textValues.oneLine.trim() ||
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

      <nav className="fixed inset-x-0 top-0 z-40 border-b border-[#eadfd8] bg-[#fdf8f5]/92 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1580px] items-center justify-between px-6 py-4 md:px-10 md:py-5">
          <Link href="/characterroe" className="text-[12px] font-semibold uppercase tracking-[0.42em] text-[#9d7f67]">
            Character Roe
          </Link>
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/"
              className="rounded-full border border-[#eadfd8] bg-white px-5 py-2.5 text-[15px] font-medium text-[#4a4a4a] shadow-[0_7px_14px_rgba(90,70,50,0.06)] transition-all hover:-translate-y-0.5 hover:border-[#c7a98c] md:px-7 md:py-3 md:text-base"
            >
              Studio Roe
            </Link>
            <Link
              href="/portfolio"
              className="rounded-full bg-[#934b66] px-5 py-2.5 text-[15px] font-semibold text-white shadow-[0_14px_30px_rgba(147,75,102,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#7d3f56] md:px-7 md:py-3 md:text-base"
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

          <section ref={heroRef} className="relative flex min-h-[400px] items-start justify-center px-6 pb-8 pt-24 md:min-h-[520px] md:px-10 md:pb-24 md:pt-28">
            <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col items-center">
              <div className="-mt-2 mb-1 flex w-full max-w-[1360px] justify-start invisible md:visible">
                <div className="relative inline-block hero-copy-enter hero-copy-enter-delay-1">
                  <div className="flex h-[37px] w-[37px] rotate-[-10deg] items-center justify-center rounded-full border-[2px] border-[#c7a98c] md:h-[92px] md:w-[92px] md:border-[3px]">
                    <span className="text-[5px] font-semibold uppercase tracking-[0.12em] text-[#c7a98c] md:text-[12px]">ONROE</span>
                  </div>
                  <div className="absolute -right-1 top-0 h-[10px] w-[10px] rounded-full bg-[#d9a9ac] md:h-6 md:w-6" />
                </div>
              </div>

              <div className="relative -mt-[19px] flex min-h-[220px] w-full max-w-[1360px] items-start justify-center">
                <div
                  ref={logoGlowRef}
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[380px] -translate-x-1/2 -translate-y-1/2"
                  style={{ willChange: "transform, opacity" }}
                >
                  <div className="h-full w-full rounded-full bg-[radial-gradient(circle,rgba(219,192,175,0.28),rgba(255,255,255,0)_66%)] blur-[68px] hero-logo-glow-enter" />
                </div>

                <div className="relative pt-[60px] text-center hero-copy-enter hero-copy-enter-delay-2 md:pt-0">
                  <h1 className="font-skin-serif text-[54px] leading-[0.88] tracking-[-0.05em] text-[#2a2a2a] md:text-[84px] lg:text-[112px]">
                    CharacterRoe
                  </h1>
                  <p className="mt-[-6px] font-skin-serif text-[44px] italic leading-none tracking-[-0.05em] text-[#c7a98c] md:mt-[-14px] md:text-[70px] lg:text-[92px]">
                    Request Form
                  </p>
                </div>

                <div ref={logoRef} className="pointer-events-none absolute left-1/2 top-1/2 w-[120px] -translate-x-1/2 -translate-y-[calc(50%+62px)] md:w-[175px] md:-translate-y-[calc(50%+32px)] lg:w-[224px]">
                  <div className="hero-logo-enter">
                    <Image
                      src="/images/logo.png"
                      alt="Studio Roe logo"
                      width={900}
                      height={900}
                      priority
                      className="h-auto w-full object-contain opacity-[0.94] drop-shadow-[0_20px_40px_rgba(173,149,166,0.22)]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

        <form id="request-form" onSubmit={handleSubmit} className="relative z-10 -mt-24 px-6 pb-16 pt-0 md:-mt-20 md:pb-24">
          <div className="mx-auto max-w-5xl">
            <div className="relative">
              <div className="absolute inset-0 translate-x-3 translate-y-4 rounded-[32px] bg-[#d9ccc4]/85 shadow-[0_26px_60px_rgba(120,96,78,0.14)]" />
              <div
                className="relative rounded-[32px] bg-white p-8 shadow-[0_24px_50px_rgba(108,84,64,0.12)] md:p-12"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 29px, #f5f0eb 30px)",
                }}
              >
                <div className="absolute right-8 top-8 hidden h-20 w-20 rotate-[15deg] items-center justify-center rounded-[28px] border-[3px] border-[#cdb5a2] opacity-70 md:flex">
                  <span className="text-center text-[11px] font-bold leading-[1.15] tracking-[0.08em] text-[#b8967e]">
                    CHARACTER
                    <span className="block">ROE</span>
                  </span>
                </div>

                <div className="mb-8">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#8b7355]">REQUEST</p>
                  <h2 className="font-skin-serif text-[20px] leading-tight text-[#2c2c2c] md:text-[25px]">캐릭터 비주얼 제작 상담 폼</h2>
                  <p className="mt-4 max-w-2xl text-[#6b6b6b]">
                    간단한 목적과 캐릭터 방향만 알려주시면 제작 가능 여부와 예상 견적을 안내드립니다.
                  </p>
                </div>

            <StepProgress steps={steps} activeStep={activeStep} />

            {activeStep === 0 ? (
              <FormCard section={formSections[0]}>
                <Field label="프로젝트명 또는 의뢰 제목">
                  <input className={inputClassName} value={textValues.projectTitle} onChange={(event) => updateText("projectTitle", event.target.value)} placeholder="예: 판타지 RPG 주연 캐릭터" />
                </Field>
                <Field label="어떤 용도인가요? *">
                  <RadioGroup options={radioGroups.purpose} value={singleValues.purpose} onChange={(value) => updateSingle("purpose", value)} />
                </Field>
                <Field label="사용 범위 *">
                  <RadioGroup options={radioGroups.usageScope} value={singleValues.usageScope} onChange={(value) => updateSingle("usageScope", value)} />
                </Field>
              </FormCard>
            ) : null}

            {activeStep === 1 ? (
              <FormCard section={formSections[1]}>
                <Field label="캐릭터 이름">
                  <input className={inputClassName} value={textValues.characterName} onChange={(event) => updateText("characterName", event.target.value)} placeholder="예: 서이현 / 미정" />
                </Field>
                <Field label="성별">
                  <RadioGroup options={radioGroups.gender} value={singleValues.gender} onChange={(value) => updateSingle("gender", value)} />
                </Field>
                <Field label="나이대">
                  <RadioGroup options={radioGroups.age} value={singleValues.age} onChange={(value) => updateSingle("age", value)} />
                </Field>
                <Field label="캐릭터 역할 *">
                  <RadioGroup options={radioGroups.role} value={singleValues.role} onChange={(value) => updateSingle("role", value)} />
                </Field>
                <Field label="캐릭터를 한 줄로 소개해주세요 *">
                  <textarea className={textAreaClassName} value={textValues.oneLine} onChange={(event) => updateText("oneLine", event.target.value)} placeholder="예: 겉은 냉정하지만 자기 사람에겐 끝까지 책임지는 젊은 CEO" />
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
                  <textarea className={textAreaClassName} value={textValues.appearance} onChange={(event) => updateText("appearance", event.target.value)} placeholder="예: 흑발 긴 웨이브, 날카로운 눈매, 세련된 오피스룩" />
                </Field>
                <Field label="피하고 싶은 요소">
                  <textarea className={textAreaClassName} value={textValues.avoid} onChange={(event) => updateText("avoid", event.target.value)} placeholder="예: 어려 보이는 얼굴, 과한 노출, 유광 피부" />
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
                          <span className="text-sm font-semibold text-[#2c2c2c]">{option.label}</span>
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

                    <div className="grid gap-6 md:grid-cols-3">
                      {packageOptions.map((option) => {
                        const active = singleValues.package === option.id

                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => updateSingle("package", option.id)}
                            aria-pressed={active}
                            className={`relative cursor-pointer rounded-[28px] p-8 text-left transition-all duration-300 ${
                              active
                                ? "scale-[1.03] border border-[#d9b7c0] bg-[linear-gradient(180deg,#fffaf8_0%,#f7e7eb_100%)] shadow-[0_24px_46px_rgba(148,106,120,0.16)]"
                                : "border border-[#ead9cf] bg-white/92 shadow-[0_18px_38px_rgba(124,98,81,0.08)] hover:-translate-y-1 hover:border-[#d9b8a6] hover:shadow-[0_22px_42px_rgba(124,98,81,0.12)]"
                            }`}
                          >
                            {option.setIcon ? (
                              <span className="absolute right-4 top-4 rounded-full border border-[#d9b7c0] bg-white/90 px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-[#8b475d] shadow-[0_8px_16px_rgba(139,71,93,0.10)]">
                                SET
                              </span>
                            ) : null}
                            <div className={`mb-5 ${option.setIcon ? "pr-12" : ""}`}>
                              <p className={`text-sm font-semibold tracking-[0.12em] ${active ? "text-[#8b475d]" : "text-[#b8967e]"}`}>{option.title}</p>
                              <h5 className={`mt-1 whitespace-nowrap font-skin-serif text-[18px] leading-tight md:text-[21px] ${active ? "text-[#2c2c2c]" : "text-[#3c322f]"}`}>{option.subtitle}</h5>
                              <p className={`mt-2 font-skin-serif text-4xl leading-tight ${active ? "text-[#2c2c2c]" : "text-[#3c322f]"}`}>{option.price}</p>
                            </div>
                            <p className={`mb-5 text-sm leading-7 ${active ? "text-[#6b6b6b]" : "text-[#6f6159]"}`}>{option.description}</p>
                            <ul className="space-y-3">
                              {option.bullets.map((bullet) => (
                                <li key={bullet} className={`flex items-start gap-3 text-sm leading-6 ${active ? "text-[#4a4a4a]" : "text-[#554640]"}`}>
                                  <span className="mt-0.5 text-[#8b475d]">✓</span>
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          </button>
                        )
                      })}
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
                  <Field label="희망 완료일 *">
                    <input type="date" className={inputClassName} value={textValues.deadline} onChange={(event) => updateText("deadline", event.target.value)} />
                  </Field>
                  <Field label="이메일 *">
                    <input type="email" className={inputClassName} value={textValues.email} onChange={(event) => updateText("email", event.target.value)} />
                  </Field>
                  <Field label="작업 확인용 비밀번호 *">
                    <input type="password" className={inputClassName} value={textValues.password} onChange={(event) => updateText("password", event.target.value)} placeholder="4자리 이상" />
                  </Field>
                </div>
                <Field label="연락 가능한 메신저">
                  <input className={inputClassName} value={textValues.messenger} onChange={(event) => updateText("messenger", event.target.value)} placeholder="카카오톡 ID, 디스코드 등" />
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
                  CharacterRoe는 인물형 캐릭터 시안 제작 전문 서비스입니다. 초기 컨셉, 내부자료, 피칭, 외주 전달용 레퍼런스에 적합합니다.
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
    <div className="mb-8 rounded-[28px] border border-[#ead9cf] bg-white/85 p-5 shadow-[0_18px_40px_rgba(124,98,81,0.08)]">
      <div className="mb-4 flex items-center justify-between text-xs font-semibold text-[#8a6c5b]">
        <span>
          Step {activeStep + 1}/{steps.length}
        </span>
        <span>{steps[activeStep].title}</span>
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
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
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
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
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
