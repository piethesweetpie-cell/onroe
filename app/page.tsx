"use client"

import type { Dispatch, ReactNode, RefObject, SetStateAction } from "react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { extractStoragePath } from "@/lib/novelcraft"

type TrackType = "product" | "model"
type PackageType = "starter" | "standard" | "brand-set" | "look" | "editorial" | "campaign"
type UploadKind = "product" | "reference"
type UploadedImage = { url: string; name: string }

const directionOptions = [
  {
    id: 1,
    label: "01",
    title: "깔끔하고 세련되게",
    description: "올리브영 느낌의 정돈된 상품 비주얼",
    cardClassName: "bg-gradient-to-br from-[#f7efe8] to-[#f2e2d6]",
  },
  {
    id: 2,
    label: "02",
    title: "잡지 화보처럼",
    description: "럭셔리하고 고급스러운 에디토리얼 무드",
    cardClassName: "bg-gradient-to-br from-[#f7e7ea] to-[#efd7df]",
  },
  {
    id: 3,
    label: "03",
    title: "따뜻하고 자연스럽게",
    description: "일상감, 풀밭, 린넨 같은 생활 무드",
    cardClassName: "bg-gradient-to-br from-[#ebf1e7] to-[#dde7d8]",
  },
  {
    id: 4,
    label: "04",
    title: "강렬하고 시선을 끄는",
    description: "SNS 광고컷처럼 주목도 높은 캠페인 비주얼",
    cardClassName: "bg-gradient-to-br from-[#ece9f2] to-[#deddeb]",
  },
]

const trackOptions = [
  {
    id: "product" as const,
    badge: "TRACK A",
    emoji: "🧴",
    title: "AI PRODUCT VISUAL",
    description: "내 제품 사진 → 브랜드 화보급 상품이미지",
  },
  {
    id: "model" as const,
    badge: "TRACK B",
    emoji: "🧑",
    title: "AI MODEL VISUAL",
    description: "모델 없이 → 브랜드 핏 맞는 AI 인물 화보",
  },
]

const toneColorOptions = ["화이트", "밝은 웜톤", "따뜻한 쿨톤", "차가운 다크", "어두운 파스텔", "연한"]

const styleOptions = ["미니멀", "럭셔리", "내추럴", "모던", "빈티지", "키치/팝", "시크", "소프트", "강렬한", "캐주얼"]

const packageOptionsByTrack: Record<
  TrackType,
  { id: PackageType; title: string; price: string; priceValue: number; description: string; bullets: string[] }[]
> = {
  product: [
    {
      id: "starter",
      title: "STARTER",
      price: "59,000원",
      priceValue: 59000,
      description: "단품 1컷 연출, 배경 무드 변환, 2시안",
      bullets: ["단품 1컷", "배경 무드 변환", "2시안 제공"],
    },
    {
      id: "standard",
      title: "STANDARD",
      price: "110,000원",
      priceValue: 110000,
      description: "4컷 구성",
      bullets: [
        "1차. 컬러가 다른 시안 2종 제공, 이후 선택한 컬러로 4컷 제공",
        "상세페이지에 바로 적용할 수 있는 제품의 무드를 적용한 컨셉 시안 제공",
      ],
    },
    {
      id: "brand-set",
      title: "BRAND SET",
      price: "180,000원",
      priceValue: 180000,
      description: "10컷",
      bullets: [
        "1차. 스타일이 다른 컨셉 2종 시안 제공, 택 1",
        "상세페이지에 바로 적용할 수 있는 제품의 무드를 적용한 컨셉 시안 제공",
      ],
    },
  ],
  model: [
    {
      id: "look",
      title: "LOOK",
      price: "35,000원",
      priceValue: 35000,
      description: "인물 1컷, 무드/색상 설정",
      bullets: ["인물 1컷", "무드 설정", "색상 톤 제안"],
    },
    {
      id: "editorial",
      title: "EDITORIAL",
      price: "79,000원",
      priceValue: 79000,
      description: "인물 3컷, 연출컷 포함, 스타일링 제안",
      bullets: ["인물 3컷", "연출컷 포함", "스타일링 제안"],
    },
    {
      id: "campaign",
      title: "CAMPAIGN",
      price: "129,000원",
      priceValue: 129000,
      description: "5컷 + 제품 혼합 컷, 광고 소재 활용 가능",
      bullets: ["인물 5컷", "제품 혼합 컷", "광고 소재 활용"],
    },
  ],
}

const additionalOptionsByTrack: Record<
  TrackType,
  { id: string; title: string; description: string; price: string; priceValue: number }[]
> = {
  product: [
    {
      id: "rush-delivery",
      title: "급행 마감",
      description: "영업일 2일 이내 1차 결과물 전달",
      price: "+30,000",
      priceValue: 30000,
    },
    {
      id: "same-mood-extra",
      title: "동일 무드 추가컷 1장",
      description: "선택한 무드를 유지한 채 추가 장면을 확장합니다.",
      price: "+30,000",
      priceValue: 30000,
    },
    {
      id: "extra-retouch",
      title: "추가 리터칭",
      description: "기본 1회 수정 이후 추가 수정 요청시",
      price: "+30,000",
      priceValue: 30000,
    },
    {
      id: "private-portfolio",
      title: "포트폴리오 비공개",
      description: "작업물 외부 공개를 제한합니다",
      price: "+90,000",
      priceValue: 90000,
    },
  ],
  model: [
    {
      id: "rush-delivery",
      title: "급행 마감",
      description: "영업일 2일 이내 1차 결과물 전달",
      price: "+30,000",
      priceValue: 30000,
    },
    {
      id: "same-mood-extra",
      title: "동일 무드 추가컷 1장",
      description: "선택한 무드를 유지한 채 추가 장면을 확장합니다.",
      price: "+30,000",
      priceValue: 30000,
    },
    {
      id: "extra-retouch",
      title: "추가 리터칭",
      description: "기본 1회 수정 이후 추가 수정 요청시",
      price: "+30,000",
      priceValue: 30000,
    },
    {
      id: "private-portfolio",
      title: "포트폴리오 비공개",
      description: "작업물 외부 공개를 제한합니다",
      price: "+90,000",
      priceValue: 90000,
    },
    {
      id: "extra-model",
      title: "모델 1인 추가",
      description: "기본 모델 외에 AI모델 1명 추가 제작",
      price: "+49,000",
      priceValue: 49000,
    },
  ],
}

const inputClassName =
  "w-full rounded-[24px] border-2 border-[#e8dcd5] bg-white px-5 py-4 text-[15px] text-[#2c2c2c] outline-none transition focus:border-[#b8967e]"

const textAreaClassName = `${inputClassName} min-h-[160px] resize-y`

export default function StudioRoePage() {
  const uploadFolder = "studio-roe"
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [selectedTrack, setSelectedTrack] = useState<TrackType>("product")
  const [selectedDirection, setSelectedDirection] = useState<number | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<PackageType>("standard")
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [selectedToneColors, setSelectedToneColors] = useState<string[]>([])
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [workKeywords, setWorkKeywords] = useState("")
  const [usageChannel, setUsageChannel] = useState("")
  const [referenceLinks, setReferenceLinks] = useState(["", ""])
  const [productImages, setProductImages] = useState<UploadedImage[]>([])
  const [referenceImages, setReferenceImages] = useState<UploadedImage[]>([])
  const [deadline, setDeadline] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientPassword, setClientPassword] = useState("")
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [uploadingKinds, setUploadingKinds] = useState<Record<UploadKind, boolean>>({
    product: false,
    reference: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadErrors, setUploadErrors] = useState<Record<UploadKind, string | null>>({
    product: null,
    reference: null,
  })
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const productFileInputRef = useRef<HTMLInputElement>(null)
  const referenceFileInputRef = useRef<HTMLInputElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const logoGlowRef = useRef<HTMLDivElement>(null)
  const pointerTargetRef = useRef({ x: 0, y: 0 })
  const pointerCurrentRef = useRef({ x: 0, y: 0 })

  const activeTrack = trackOptions.find((track) => track.id === selectedTrack) ?? trackOptions[0]
  const activePackageOptions = packageOptionsByTrack[selectedTrack]
  const activeAdditionalOptions = additionalOptionsByTrack[selectedTrack]
  const activePackage =
    activePackageOptions.find((option) => option.id === selectedPackage) ?? activePackageOptions[0]
  const optionMap = new Map(activeAdditionalOptions.map((option) => [option.id, option]))
  const packageLabel = `${selectedTrack === "product" ? "상품" : "모델"} | ${activePackage.title}`
  const isUploading = uploadingKinds.product || uploadingKinds.reference

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

  function handleTrackChange(track: TrackType) {
    setSelectedTrack(track)
    setSelectedPackage(track === "product" ? "standard" : "editorial")
    setSelectedOptions([])
  }

  function handleHeroPointerMove(event: React.MouseEvent<HTMLElement>) {
    const bounds = heroRef.current?.getBoundingClientRect()
    if (!bounds) return

    const normalizedX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2
    const normalizedY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2

    pointerTargetRef.current = {
      x: Math.max(-1, Math.min(1, normalizedX)),
      y: Math.max(-1, Math.min(1, normalizedY)),
    }
  }

  function handleHeroPointerLeave() {
    pointerTargetRef.current = { x: 0, y: 0 }
  }

  function toggleOption(id: string) {
    setSelectedOptions((prev) => (prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]))
  }

  function toggleSelection(value: string, setter: Dispatch<SetStateAction<string[]>>) {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  function handleReferenceLinkChange(index: number, value: string) {
    setReferenceLinks((prev) => prev.map((link, currentIndex) => (currentIndex === index ? value : link)))
  }

  async function handleFileUpload(kind: UploadKind, event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files || files.length === 0) return

    const currentImages = kind === "product" ? productImages : referenceImages
    const setImages = kind === "product" ? setProductImages : setReferenceImages
    const inputRef = kind === "product" ? productFileInputRef : referenceFileInputRef
    const folderName = kind === "product" ? "product-originals" : "reference-images"
    const maxFileSize = kind === "product" ? 100 * 1024 * 1024 : 5 * 1024 * 1024
    const maxFileSizeLabel = kind === "product" ? "100MB" : "5MB"

    setUploadErrors((prev) => ({ ...prev, [kind]: null }))

    if (currentImages.length + files.length > 3) {
      setUploadErrors((prev) => ({ ...prev, [kind]: "최대 3장까지만 업로드할 수 있습니다." }))
      return
    }

    setUploadingKinds((prev) => ({ ...prev, [kind]: true }))

    for (const file of Array.from(files)) {
      if (file.size > maxFileSize) {
        setUploadErrors((prev) => ({ ...prev, [kind]: `${file.name}: 파일 크기가 ${maxFileSizeLabel}를 초과합니다.` }))
        continue
      }

      const fileExt = file.name.split(".").pop()
      const fileName = `${uploadFolder}/${folderName}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`
      const { error } = await supabase.storage.from("order-references").upload(fileName, file)

      if (error) {
        setUploadErrors((prev) => ({ ...prev, [kind]: `${file.name}: 업로드 실패 - ${error.message}` }))
        continue
      }

      const { data: urlData } = supabase.storage.from("order-references").getPublicUrl(fileName)
      setImages((prev) => [...prev, { url: urlData.publicUrl, name: file.name }])
    }

    setUploadingKinds((prev) => ({ ...prev, [kind]: false }))

    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  async function handleRemoveImage(kind: UploadKind, imageUrl: string) {
    const fileName = extractStoragePath(imageUrl, "order-references")
    if (fileName) {
      await supabase.storage.from("order-references").remove([fileName])
    }

    if (kind === "product") {
      setProductImages((prev) => prev.filter((image) => image.url !== imageUrl))
      return
    }

    setReferenceImages((prev) => prev.filter((image) => image.url !== imageUrl))
  }

  function resetForm() {
    setTitle("")
    setAuthor("")
    setSelectedTrack("product")
    setSelectedDirection(null)
    setSelectedPackage("standard")
    setSelectedOptions([])
    setSelectedToneColors([])
    setSelectedStyles([])
    setWorkKeywords("")
    setUsageChannel("")
    setReferenceLinks(["", ""])
    setProductImages([])
    setReferenceImages([])
    setDeadline("")
    setClientEmail("")
    setClientPassword("")
    setAgreeTerms(false)
    setUploadErrors({ product: null, reference: null })

    if (productFileInputRef.current) productFileInputRef.current.value = ""
    if (referenceFileInputRef.current) referenceFileInputRef.current.value = ""
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(null)

    const moodList = [
      ...selectedToneColors.map((value) => `톤&컬러: ${value}`),
      ...selectedStyles.map((value) => `스타일&분위기: ${value}`),
    ]
    const direction = directionOptions.find((item) => item.id === selectedDirection)
    const formattedLinks = referenceLinks.map((link) => link.trim()).filter(Boolean)
    const referenceNotes = [
      ...productImages.map((image, index) => `상품 원본 이미지 ${index + 1}: ${image.url}`),
      ...referenceImages.map((image, index) => `레퍼런스 이미지 ${index + 1}: ${image.url}`),
      ...formattedLinks.map((link, index) => `레퍼런스 링크 ${index + 1}: ${link}`),
    ].join("\n")

    if (!title.trim()) return setSubmitError("제품명 또는 프로젝트명을 입력해 주세요.")
    if (!author.trim()) return setSubmitError("브랜드명 또는 담당자명을 입력해 주세요.")
    if (!direction) return setSubmitError("연출 방향을 선택해 주세요.")
    if (moodList.length === 0) return setSubmitError("톤&컬러 또는 스타일&분위기 항목을 1개 이상 선택해 주세요.")
    if (!workKeywords.trim()) return setSubmitError("제품 특징과 요청사항을 입력해 주세요.")
    if (!deadline) return setSubmitError("희망 완료일을 선택해 주세요.")
    if (!clientEmail.trim()) return setSubmitError("이메일을 입력해 주세요.")
    if (!clientPassword.trim()) return setSubmitError("작업 확인용 비밀번호를 입력해 주세요.")
    if (!agreeTerms) return setSubmitError("환불 및 사용 조건 동의가 필요합니다.")
    if (isUploading) return setSubmitError("이미지 업로드가 끝난 뒤 다시 제출해 주세요.")

    setIsSubmitting(true)

    const requestPayload = {
      service_type: "studio_roe" as const,
      client_email: clientEmail.trim(),
      client_password: clientPassword.trim(),
      title: title.trim(),
      author: author.trim(),
      genre: activeTrack.title,
      style_direction: direction.title,
      package: packageLabel,
      mood_keywords: moodList.join(", "),
      color_keywords: workKeywords.trim(),
      reference_url: referenceNotes || null,
      deadline,
      comments: [],
      admin_note:
        [
          `선택 트랙: ${activeTrack.title}`,
          usageChannel.trim() ? `활용 채널: ${usageChannel.trim()}` : "",
          selectedOptions.length > 0
            ? `추가 옵션: ${selectedOptions.map((option) => optionMap.get(option)?.title ?? option).join(", ")}`
            : "",
        ]
          .filter(Boolean)
          .join("\n") || null,
    }

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      })
      const result = await safeParseJson(response)
      setIsSubmitting(false)

      if (!response.ok) {
        return setSubmitError(`제출에 실패했습니다. ${result.error ?? "알 수 없는 오류"}`)
      }

      resetForm()

      if (result.warning) {
        setSubmitSuccess(`요청이 접수되었습니다. (알림: ${result.warning})`)
      } else {
        setSubmitSuccess(
          "요청이 정상적으로 접수되었습니다.\n입력하신 이메일과 비밀번호로 Client 페이지에서 진행 상태를 확인해 주세요.",
        )
      }
    } catch (error) {
      setIsSubmitting(false)
      setSubmitError(`제출에 실패했습니다. ${formatClientError(error)}`)
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
        <div className="mx-auto flex max-w-[1580px] items-center justify-between px-6 py-5 md:px-10">
          <span className="text-[12px] font-semibold uppercase tracking-[0.42em] text-[#9d7f67]">Studio Roe</span>
          <div className="flex items-center gap-3">
            <Link
              href="/client"
              className="flex items-center justify-center gap-3 rounded-full border border-[#eadfd8] bg-white px-7 py-3 text-base font-medium text-[#4a4a4a] shadow-[0_7px_14px_rgba(90,70,50,0.06)] transition-all hover:-translate-y-0.5 hover:border-[#c7a98c]"
            >
              Client
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/portfolio"
              className="rounded-full bg-[#934b66] px-7 py-3 text-base font-semibold text-white shadow-[0_14px_30px_rgba(147,75,102,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#7d3f56]"
            >
              Portfolio
            </Link>
          </div>
        </div>
      </nav>

      <form onSubmit={handleSubmit}>
        <main>
          <div className="relative overflow-hidden bg-[#fdf8f5]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),rgba(253,248,245,0.95)_36%,rgba(245,233,226,0.85)_74%,rgba(253,248,245,0.98)_100%)]" />
            <div
              className="pointer-events-none absolute inset-0 opacity-60 blur-[90px]"
              style={{ background: "radial-gradient(circle at 50% 24%, rgba(235, 214, 199, 0.75), transparent 40%)" }}
            />
            <div className="pointer-events-none absolute left-[10%] top-[10%] h-28 w-28 rounded-full bg-[#efe4dd] opacity-55 blur-3xl" />
            <div className="pointer-events-none absolute right-[12%] top-[12%] h-28 w-28 rounded-full bg-[#efe4dd] opacity-50 blur-3xl" />

            <section
              ref={heroRef}
              className="relative flex min-h-[520px] items-start justify-center px-6 pb-16 pt-24 md:px-10 md:pb-24 md:pt-28"
              onMouseMove={handleHeroPointerMove}
              onMouseLeave={handleHeroPointerLeave}
            >
              <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col items-center">
                <div className="-mt-2 mb-1 flex w-full max-w-[1360px] justify-start">
                  <div className="relative inline-block hero-copy-enter hero-copy-enter-delay-1">
                    <div className="flex h-[92px] w-[92px] rotate-[-10deg] items-center justify-center rounded-full border-[3px] border-[#c7a98c]">
                      <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#c7a98c]">ONROE</span>
                    </div>
                    <div className="absolute -right-1 top-0 h-6 w-6 rounded-full bg-[#d9a9ac]" />
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

                  <div className="relative pt-0 text-center hero-copy-enter hero-copy-enter-delay-2">
                    <h1 className="font-skin-serif text-[54px] leading-[0.88] tracking-[-0.05em] text-[#2a2a2a] md:text-[84px] lg:text-[112px]">
                      AI Studio
                    </h1>
                    <p className="mt-[-6px] font-skin-serif text-[44px] italic leading-none tracking-[-0.05em] text-[#c7a98c] md:mt-[-14px] md:text-[70px] lg:text-[92px]">
                      Request Form
                    </p>
                  </div>

                  <div
                    ref={logoRef}
                    className="pointer-events-none absolute left-1/2 top-1/2 w-[120px] -translate-x-1/2 -translate-y-1/2 md:w-[175px] lg:w-[224px]"
                    style={{ transform: "translate(-50%, calc(-50% - 32px))" }}
                  >
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

            <section id="story" className="relative -mt-14 px-6 pb-12 pt-0 md:-mt-20">
              <div className="relative z-10 mx-auto max-w-5xl">
              <div className="relative">
                <div className="absolute inset-0 translate-x-3 translate-y-4 rounded-[32px] bg-[#d9ccc4]/85 shadow-[0_26px_60px_rgba(120,96,78,0.14)]" />
                <div
                  id="request-form"
                  className="relative rounded-[32px] bg-white p-8 shadow-[0_24px_50px_rgba(108,84,64,0.12)] md:p-12"
                  style={{
                    backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 29px, #f5f0eb 30px)",
                  }}
                >
                  <div className="absolute right-8 top-8 flex h-20 w-20 rotate-[15deg] items-center justify-center rounded-[28px] border-[3px] border-[#cdb5a2] opacity-70">
                    <span className="text-center text-[11px] font-bold leading-[1.15] tracking-[0.08em] text-[#b8967e]">
                      AI{" "}
                      <span className="block">STUDIO</span>
                    </span>
                  </div>

                  <SectionHeading
                    index="01"
                    title="브랜드 연출을 위한 기본 정보"
                    body="프로젝트 이름, 담당자, 사용 채널과 제품의 핵심 특징을 먼저 정리해 주세요."
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="제품명 또는 프로젝트명 *">
                      <input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        className={inputClassName}
                        placeholder="예: 24SS 립밤 런칭 비주얼"
                      />
                    </Field>
                    <Field label="브랜드명 또는 담당자명 *">
                      <input
                        value={author}
                        onChange={(event) => setAuthor(event.target.value)}
                        className={inputClassName}
                        placeholder="예: STUDIO ROE / 홍길동"
                      />
                    </Field>
                  </div>
                </div>
              </div>
              </div>
            </section>
          </div>

          <section id="offer" className="bg-[#fdf8f5] px-6 py-12">
            <div className="mx-auto max-w-5xl">
              <CenteredHeading
                index="02"
                title="어떤 비주얼 트랙이 필요한지 선택하세요"
                body="상품 중심 연출인지, AI 인물 화보가 필요한지 먼저 고르면 패키지와 제안 구성이 그에 맞게 바뀝니다."
                badgeClassName="bg-[#f5e6e8] text-[#8b475d]"
              />

              <div className="grid gap-6 md:grid-cols-2">
                {trackOptions.map((track) => {
                  const active = selectedTrack === track.id

                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => handleTrackChange(track.id)}
                      aria-pressed={active}
                      className={`relative rounded-[28px] p-8 text-left transition-all duration-300 ${
                        active
                          ? "bg-[#8b475d] text-white shadow-xl"
                          : "border-2 border-[#e8dcd5] bg-white text-[#4a4a4a] hover:border-[#b8967e] hover:shadow-lg"
                      }`}
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold tracking-[0.18em] ${active ? "bg-white/20 text-white" : "bg-[#f5e6e8] text-[#8b475d]"}`}>
                          {track.badge}
                        </span>
                        <span className="text-2xl" aria-hidden>{track.emoji}</span>
                      </div>
                      <h3 className={`font-skin-serif text-[28px] ${active ? "text-white" : "text-[#2c2c2c]"}`}>
                        {track.title}
                      </h3>
                      <p className={`mt-3 text-base leading-7 ${active ? "text-white/80" : "text-[#6b6b6b]"}`}>
                        {track.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="bg-[#f5e6e8] px-6 py-12">
            <div className="mx-auto max-w-5xl">
              <CenteredHeading
                index="03"
                title="브랜드 무드 방향을 선택하세요"
                body=""
                badgeClassName="bg-white text-[#8b475d]"
              />

              <div className="grid gap-4 md:grid-cols-4">
                {directionOptions.map((option) => {
                  const active = selectedDirection === option.id

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedDirection(option.id)}
                      className={`relative rounded-[24px] p-5 text-left transition-all duration-300 ${
                        active ? "scale-[1.02] bg-white shadow-2xl" : `${option.cardClassName} hover:shadow-xl`
                      }`}
                    >
                      <div className="absolute right-0 top-0 h-12 w-12 rounded-tr-[24px] bg-gradient-to-bl from-black/5 to-transparent" />
                      <div className="mb-3 inline-block rounded-full bg-[#8b475d] px-2.5 py-1 text-[11px] font-bold text-white">
                        {option.label}
                      </div>
                      <h3 className="font-skin-serif text-[20px] leading-tight text-[#2c2c2c]">{option.title}</h3>
                      <p className="mt-2 text-xs leading-5 text-[#6b6b6b]">{option.description}</p>
                      {active ? (
                        <div className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-[#8b475d] text-sm text-white">
                          ✓
                        </div>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="bg-[#fdf8f5] px-6 py-12">
            <div className="mx-auto max-w-5xl">
              <CenteredHeading
                index="04"
                title="무드 및 요청사항"
                body="원하는 결과물의 톤과 스타일을 주제별로 선택해 주세요. 추가 요청은 아래에 함께 남겨주시면 됩니다."
                badgeClassName="bg-[#f5e6e8] text-[#8b475d]"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <NoteCard tapeClassName="left-8 rotate-[-2deg] bg-[#a5b8d4]/60" title="톤 & 컬러 *" body="원하는 전체 색감과 온도를 골라 주세요.">
                  <ChipGroup
                    options={toneColorOptions}
                    values={selectedToneColors}
                    onToggle={(option) => toggleSelection(option, setSelectedToneColors)}
                  />
                </NoteCard>

                <NoteCard tapeClassName="right-8 rotate-[2deg] bg-[#d4a5a5]/60" title="스타일 & 분위기 *" body="브랜드가 보여야 하는 무드와 표현 방식을 함께 선택해 주세요.">
                  <ChipGroup
                    options={styleOptions}
                    values={selectedStyles}
                    onToggle={(option) => toggleSelection(option, setSelectedStyles)}
                  />
                </NoteCard>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="활용 채널">
                  <textarea
                    value={usageChannel}
                    onChange={(event) => setUsageChannel(event.target.value)}
                    className={textAreaClassName}
                    placeholder="예: 자사몰 메인, 인스타그램 광고, 상세페이지"
                  />
                </Field>
                <Field label="추가 요청사항 *">
                  <textarea
                    value={workKeywords}
                    onChange={(event) => setWorkKeywords(event.target.value)}
                    className={textAreaClassName}
                    placeholder="예: 제품 로고는 선명하게 유지해 주세요. 메인 이미지는 여백감 있게, 상세페이지용 이미지는 정보 전달이 잘 되도록 정리되면 좋겠습니다."
                  />
                </Field>
              </div>
            </div>
          </section>

          <section id="pricing" className="relative overflow-hidden bg-[#f5e6e7] px-6 py-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.88),rgba(245,230,231,0.95)_34%,rgba(239,219,222,0.9)_70%,rgba(245,230,231,0.98)_100%)]" />
            <div
              className="pointer-events-none absolute inset-0 opacity-60 blur-[90px]"
              style={{ background: "radial-gradient(circle at 50% 18%, rgba(214, 173, 182, 0.46), transparent 34%)" }}
            />
            <div className="pointer-events-none absolute left-[8%] top-[18%] h-32 w-32 rounded-full bg-[#efd8dc] opacity-50 blur-3xl" />
            <div className="pointer-events-none absolute right-[10%] top-[14%] h-32 w-32 rounded-full bg-[#ecd5da] opacity-45 blur-3xl" />

            <div className="relative z-10 mx-auto max-w-5xl">
              <div className="mb-8 text-center">
                <span className="mb-4 inline-block rounded-full bg-[#f5e6e8] px-4 py-2 text-sm font-medium text-[#8b475d]">05</span>
                <h2 className="font-skin-serif text-[20px] text-[#2c2c2c] md:text-[25px]">패키지 선택</h2>
                <p className="mx-auto mt-4 max-w-xl text-[#6b6b6b]">
                  크몽에서 미리 구매하신 상품을 선택해 주세요.
                </p>
              </div>

              <div className="mb-10 flex justify-center">
                <div className="inline-flex rounded-full border border-[#e2d2c8] bg-white/85 p-1.5 shadow-[0_12px_30px_rgba(138,103,83,0.08)] backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={() => handleTrackChange("product")}
                    className={`rounded-full px-6 py-3 text-sm font-semibold transition-all ${
                      selectedTrack === "product"
                        ? "bg-[#8b475d] text-white shadow-[0_12px_24px_rgba(139,71,93,0.22)]"
                        : "text-[#8a6c5b] hover:text-[#2c2c2c]"
                    }`}
                  >
                    상품
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTrackChange("model")}
                    className={`rounded-full px-6 py-3 text-sm font-semibold transition-all ${
                      selectedTrack === "model"
                        ? "bg-[#8b475d] text-white shadow-[0_12px_24px_rgba(139,71,93,0.22)]"
                        : "text-[#8a6c5b] hover:text-[#2c2c2c]"
                    }`}
                  >
                    모델
                  </button>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {activePackageOptions.map((option) => (
                  <PackageCard
                    key={option.id}
                    active={selectedPackage === option.id}
                    title={option.title}
                    price={option.price}
                    description={option.description}
                    bullets={option.bullets}
                    onClick={() => setSelectedPackage(option.id)}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="bg-[#fdf8f5] px-6 py-12">
            <div className="mx-auto max-w-5xl">
              <CenteredHeading
                index="06"
                title="추가 옵션"
                body="구매시 옵션을 선택하지 않았다면 스킵하세요!"
                badgeClassName="bg-[#f5e6e8] text-[#8b475d]"
              />

              {activeAdditionalOptions.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {activeAdditionalOptions.map((option) => {
                    const active = selectedOptions.includes(option.id)

                    return (
                      <label
                        key={option.id}
                        className={`flex cursor-pointer items-center gap-4 rounded-[24px] border-2 p-6 transition-all ${
                          active
                            ? "border-[#8b475d] bg-[#f5e6e8]"
                            : "border-[#e8dcd5] bg-white hover:border-[#b8967e]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleOption(option.id)}
                          className="h-5 w-5 rounded border-[#d7c5bb] text-[#8b475d] focus:ring-[#8b475d]"
                        />
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="font-medium text-[#2c2c2c]">{option.title}</span>
                            <span className="text-sm font-bold text-[#8b475d]">{option.price}</span>
                          </div>
                          <p className="text-sm text-[#6b6b6b]">{option.description}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-[28px] border border-[#e8dcd5] bg-white px-8 py-10 text-center shadow-sm">
                  <p className="font-skin-serif text-[28px] text-[#2c2c2c]">모델 비주얼은 기본 패키지 중심으로 운영합니다.</p>
                  <p className="mt-3 text-sm leading-7 text-[#6b6b6b]">
                    스타일링, 표정, 제품 혼합 컷 같은 세부 요청은 아래 요청사항에 남겨 주시면 패키지 범위 안에서 맞춰 제안합니다.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-[#f5e6e8] px-6 py-12">
            <div className="mx-auto max-w-5xl">
              <CenteredHeading
                index="07"
                title="레퍼런스와 연락처"
                body="상품 사진과 레퍼런스가 구체적일수록 더 정확하게 무드 방향을 설계할 수 있습니다."
                badgeClassName="bg-white text-[#8b475d]"
              />

              <div className="mb-12">
                <h3 className="mb-4 text-lg font-medium text-[#4a4a4a]">이미지 업로드</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <UploadCard
                    title="상품 원본 이미지 업로드"
                    description="실제 상품 사진, 패키지 정면컷, 로고가 보이는 원본 이미지나 ZIP 압축 파일을 올려 주세요."
                    inputRef={productFileInputRef}
                    images={productImages}
                    error={uploadErrors.product}
                    isUploading={uploadingKinds.product}
                    disabled={productImages.length >= 3 || isUploading}
                    accept="image/jpeg,image/png,.zip,application/zip,application/x-zip-compressed"
                    helperText="최대 3개 · JPG, PNG, ZIP · 각 100MB 이하"
                    onChange={(event) => handleFileUpload("product", event)}
                    onRemove={(imageUrl) => handleRemoveImage("product", imageUrl)}
                    cardClassName="md:rotate-[-2deg]"
                  />

                  <UploadCard
                    title="레퍼런스 이미지 업로드"
                    description="원하는 무드보드, 광고 컷, 상세페이지 예시 이미지를 올려 주세요."
                    inputRef={referenceFileInputRef}
                    images={referenceImages}
                    error={uploadErrors.reference}
                    isUploading={uploadingKinds.reference}
                    disabled={referenceImages.length >= 3 || isUploading}
                    accept="image/jpeg,image/png"
                    helperText="최대 3장 · JPG, PNG · 각 5MB 이하"
                    onChange={(event) => handleFileUpload("reference", event)}
                    onRemove={(imageUrl) => handleRemoveImage("reference", imageUrl)}
                    cardClassName="md:rotate-[2deg]"
                  />
                </div>

                <div className="mt-6 rounded-[28px] border border-[#ead9cf] bg-white/85 p-8 shadow-[0_18px_40px_rgba(124,98,81,0.08)]">
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

                  <div className="grid gap-4 md:grid-cols-2">
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

              <div className="grid gap-6 md:grid-cols-3">
                <Field label="희망 완료일 *">
                  <input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} className={inputClassName} />
                </Field>
                <Field label="이메일 *">
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(event) => setClientEmail(event.target.value)}
                    className={inputClassName}
                    placeholder="name@example.com"
                  />
                </Field>
                <Field label="작업 확인용 비밀번호 *">
                  <input
                    type="password"
                    value={clientPassword}
                    onChange={(event) => setClientPassword(event.target.value)}
                    className={inputClassName}
                    placeholder="조회 시 사용할 비밀번호"
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className="bg-[#2c2c2c] px-6 py-12">
            <div className="mx-auto max-w-4xl">
              <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#3a3a3a] to-[#2c2c2c] p-8 shadow-2xl md:p-12">
                <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[#8b475d]/10 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[#b8967e]/10 blur-3xl" />

                <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="max-w-2xl">
                    <p className="font-skin-serif text-[18px] text-[#fdf8f5] md:text-[22px]">
                      선택 패키지 {packageLabel}
                    </p>
                    <p className="mt-3 text-sm text-[#f5e6e8]/70">
                      제출하기를 누르면 AI 비주얼 연출 요청이 접수됩니다.
                    </p>
                    <label className="mt-5 flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(event) => setAgreeTerms(event.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-[#e8dcd5] text-[#8b475d] focus:ring-[#8b475d]"
                      />
                      <span className="text-sm leading-7 text-[#f5e6e8]/70">
                        작업 전 취소 시 전액 환불 가능, 1차 시안 전달 후에는 환불이 어렵습니다.
                      </span>
                    </label>

                    {submitError ? (
                      <p className="mt-4 rounded-[20px] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                        {submitError}
                      </p>
                    ) : null}

                    {submitSuccess ? (
                      <p className="mt-4 rounded-[20px] border border-[#b8967e]/30 bg-white/5 px-4 py-3 text-sm text-[#f9dfc7]">
                        {submitSuccess.split("\n").map((line, index) => (
                          <span key={`${line}-${index}`} className="block">
                            {line}
                          </span>
                        ))}
                      </p>
                    ) : null}
                  </div>

                  <div className="md:flex-shrink-0">
                    <button
                      type="submit"
                      disabled={isSubmitting || isUploading}
                      className="rounded-full bg-[#8b475d] px-12 py-5 text-lg font-medium text-white shadow-xl transition-all hover:-translate-y-1 hover:bg-[#6b3447] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? "제출 중..." : "제출하기"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </form>

      <footer className="border-t border-[#2c2c2c] bg-[#1a1a1a] px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 md:flex-row">
          <span className="text-sm uppercase tracking-[0.24em] text-[#6b6b6b]">Studio Roe</span>
          <p className="text-sm text-[#6b6b6b]">
            <Link href="/admin" className="cursor-default text-inherit focus:outline-none">
              ©
            </Link>{" "}
            {new Date().getFullYear()}{" "}
            <a href="mailto:onroeway@gmail.com" className="transition-colors hover:text-[#b8967e]">
              ONROE
            </a>
            . All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function CenteredHeading({
  index,
  title,
  body,
  badgeClassName,
}: {
  index: string
  title: string
  body: string
  badgeClassName: string
}) {
  return (
    <div className="mb-8 text-center">
      <span className={`mb-4 inline-block rounded-full px-4 py-2 text-sm font-medium ${badgeClassName}`}>{index}</span>
      <h2 className="font-skin-serif text-[20px] text-[#2c2c2c] md:text-[25px]">{title}</h2>
      {body ? <p className="mx-auto mt-4 max-w-2xl text-[#6b6b6b]">{body}</p> : null}
    </div>
  )
}

function SectionHeading({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <div className="mb-6">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-[#8b7355]">{index}</p>
      <h2 className="font-skin-serif text-[20px] leading-tight text-[#2c2c2c] md:text-[25px]">{title}</h2>
      <p className="mt-4 max-w-2xl text-[#6b6b6b]">{body}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[#4a4a4a]">{label}</span>
      {children}
    </label>
  )
}

function UploadCard({
  title,
  description,
  inputRef,
  images,
  error,
  isUploading,
  disabled,
  accept,
  helperText,
  onChange,
  onRemove,
  cardClassName,
}: {
  title: string
  description: string
  inputRef: RefObject<HTMLInputElement | null>
  images: UploadedImage[]
  error: string | null
  isUploading: boolean
  disabled: boolean
  accept: string
  helperText: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: (imageUrl: string) => void
  cardClassName?: string
}) {
  return (
    <div
      className={`rounded-[28px] border border-[#ead9cf] bg-white p-8 shadow-[0_18px_40px_rgba(124,98,81,0.08)] ${
        cardClassName ?? ""
      }`}
    >
      <div className="mb-5">
        <h4 className="text-lg font-medium text-[#2c2c2c]">{title}</h4>
        <p className="mt-2 text-sm leading-7 text-[#6b6b6b]">{description}</p>
      </div>

      <label
        className={`block rounded-[22px] border-2 border-dashed border-[#e8dcd5] p-8 text-center transition-colors ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:border-[#b8967e]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={onChange}
          disabled={disabled}
        />
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f5e6e8] text-2xl text-[#8b475d]">
          ↑
        </div>
        <p className="font-medium text-[#2c2c2c]">{isUploading ? "업로드 중..." : "이미지 파일 선택"}</p>
        <p className="mt-1 text-sm text-[#6b6b6b]">{helperText}</p>
      </label>

      {error ? (
        <div className="mt-4 rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      ) : null}

      {images.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-3">
          {images.map((image) => (
            <div key={image.url} className="group relative">
              {isPreviewableImage(image.name) ? (
                <img
                  src={image.url}
                  alt={image.name}
                  className="h-24 w-24 rounded-[18px] border border-[#e8dcd5] object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 flex-col items-center justify-center rounded-[18px] border border-[#e8dcd5] bg-[#fbf4f0] px-2 text-center">
                  <span className="rounded-full bg-[#f5e6e8] px-2 py-1 text-[10px] font-bold tracking-[0.14em] text-[#8b475d]">
                    ZIP
                  </span>
                  <span className="mt-2 overflow-hidden text-[11px] font-medium leading-4 text-[#6b6b6b]">{image.name}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => onRemove(image.url)}
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
  return normalizedName.endsWith(".jpg") || normalizedName.endsWith(".jpeg") || normalizedName.endsWith(".png")
}

function NoteCard({
  tapeClassName,
  title,
  body,
  children,
}: {
  tapeClassName: string
  title: string
  body: string
  children: ReactNode
}) {
  return (
    <div className="relative rounded-[28px] bg-white p-8 shadow-xl">
      <div className={`absolute top-[-12px] h-5 w-20 shadow-sm ${tapeClassName}`} />
      <h3 className="font-skin-serif text-[28px] text-[#2c2c2c]">{title}</h3>
      <p className="mb-6 mt-2 text-sm text-[#6b6b6b]">{body}</p>
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

function PackageCard({
  active,
  title,
  price,
  description,
  bullets,
  onClick,
}: {
  active: boolean
  title: string
  price: string
  description: string
  bullets: string[]
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer rounded-[28px] p-8 transition-all duration-300 ${
        active
          ? "scale-[1.03] border border-[#d9b7c0] bg-[linear-gradient(180deg,#fffaf8_0%,#f7e7eb_100%)] shadow-[0_24px_46px_rgba(148,106,120,0.16)]"
          : "border border-[#ead9cf] bg-white/92 shadow-[0_18px_38px_rgba(124,98,81,0.08)] hover:-translate-y-1 hover:border-[#d9b8a6] hover:shadow-[0_22px_42px_rgba(124,98,81,0.12)]"
      }`}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 rounded-t-[28px] ${active ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0))]" : "bg-[linear-gradient(180deg,rgba(247,238,233,0.7),rgba(255,255,255,0))]"} `} />

      {active ? (
        <div className="absolute left-1/2 top-[-16px] -translate-x-1/2 rounded-full bg-[#8b475d] px-4 py-1 text-xs font-bold text-white shadow-[0_10px_22px_rgba(139,71,93,0.22)]">
          SELECT
        </div>
      ) : null}

      <div className="relative mb-6 text-center">
        <p className={`text-sm font-medium tracking-[0.12em] ${active ? "text-[#8b475d]" : "text-[#b8967e]"}`}>{title}</p>
        <p className={`font-skin-serif text-4xl ${active ? "text-[#2c2c2c]" : "text-[#3c322f]"}`}>{price}</p>
      </div>

      <p className={`mb-6 text-sm leading-7 ${active ? "text-[#6b6b6b]" : "text-[#6f6159]"}`}>{description}</p>

      <ul className="mb-8 space-y-3">
        {bullets.map((bullet) => (
          <li
            key={bullet}
            className={`flex items-center gap-3 text-sm ${active ? "text-[#4a4a4a]" : "text-[#554640]"}`}
          >
            <span className="text-[#8b475d]">✓</span>
            {bullet}
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={`w-full rounded-full py-3 text-sm font-medium transition-all ${
          active
            ? "bg-[#8b475d] text-white shadow-[0_12px_24px_rgba(139,71,93,0.2)]"
            : "border border-[#ead9cf] bg-[#fbf4f0] text-[#2c2c2c] hover:bg-[#f5e6e8]"
        }`}
      >
        {active ? "선택됨" : "선택하기"}
      </button>
    </div>
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
