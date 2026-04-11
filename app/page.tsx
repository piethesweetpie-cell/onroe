"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import {
  extractStoragePath,
  formatAdditionalOption,
  formatKrw,
  getAdditionalOptionPrice,
  getPackagePrice,
} from "@/lib/novelcraft"

const shootTypes = ["제품 단독", "모델 합성", "상세페이지", "광고 컷", "SNS 콘텐츠", "브랜딩 컷"]

const directionOptions = [
  { id: 1, label: "1안", title: "Clean Commerce", description: "흰 배경, 깔끔한 조명. 제품 자체가 주인공인 커머스 기본 컷입니다. 쿠팡·스마트스토어·올리브영 등 쇼핑몰 메인 이미지에 적합해요." },
  { id: 2, label: "2안", title: "Editorial Mood", description: "브랜드 감성과 세계관을 담은 무드 컷입니다. 제품보다 분위기가 먼저 눈에 들어옵니다. 인스타그램 피드, 브랜드 룩북, 신제품 론칭 이미지에 적합해요." },
  { id: 3, label: "3안", title: "Soft Lifestyle", description: "제품을 실제로 사용하는 장면처럼 자연스럽게 연출합니다. 따뜻하고 생활감 있는 분위기입니다. SNS 콘텐츠, 상세페이지 중간 컷, 감성 브랜드 이미지에 적합해요." },
  { id: 4, label: "4안", title: "Bold Campaign", description: "강한 색감과 임팩트 있는 구성으로 광고 메인 비주얼처럼 제작합니다. 배너 광고, 옥외 광고, 시즌 캠페인 이미지에 적합해요." },
]

const additionalOptions = [
  { id: "rush", title: "급행 마감", description: "영업일 2일 이내 1차 결과물 전달", price: "+20,000" },
  { id: "model", title: "모델 1인 추가", description: "프리미엄에서 다른 타입의 모델 필요시, 2인 모델샷 필요시 선택", price: "+50,000" },
  { id: "detail", title: "상세페이지 제작", description: "제작한 AI 사진을 바탕으로 상세페이지 제작 세로 10,000px", price: "+100,000" },
  { id: "retouch", title: "추가 리터칭", description: "기본 1회 수정 이후 추가 수정 요청시", price: "+30,000" },
  { id: "private", title: "포트폴리오 비공개", description: "작업물 외부 공개를 제한합니다", price: "+20만" },
]

const toneColorOptions = ["화이트", "밝은 웜톤", "따뜻한 쿨톤", "차가운 다크", "어두운 파스텔", "연한"]

const styleOptions = ["미니멀", "럭셔리", "내추럴", "모던", "빈티지", "키치/팝", "시크", "소프트", "강렬한", "캐주얼"]

type PackageType = "basic" | "standard" | "premium"

const inputClassName =
  "w-full bg-surface-container-low border-0 rounded-xl py-4 px-6 inner-shadow-field focus:ring-2 focus:ring-[#2054dc] transition-all text-on-surface placeholder:text-outline/60"

export default function StudioRoePage() {
  const uploadFolder = "studio-roe"
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedDirection, setSelectedDirection] = useState<number | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<PackageType>("standard")
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [selectedToneColors, setSelectedToneColors] = useState<string[]>([])
  const [selectedStyles, setSelectedStyles] = useState<string[]>([])
  const [workKeywords, setWorkKeywords] = useState("")
  const [usageChannel, setUsageChannel] = useState("")
  const [referenceLinks, setReferenceLinks] = useState(["", ""])
  const [uploadedImages, setUploadedImages] = useState<{ url: string; name: string }[]>([])
  const [deadline, setDeadline] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientPassword, setClientPassword] = useState("")
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const bookRef = useRef<HTMLDivElement>(null)
  const bookShadowRef = useRef<HTMLDivElement>(null)
  const pointerTargetRef = useRef({ x: 0, y: 0 })
  const pointerCurrentRef = useRef({ x: 0, y: 0 })

  const packageLabel =
    selectedPackage === "basic"
      ? "BASIC 59,000원"
      : selectedPackage === "standard"
        ? "STANDARD 120,000원"
        : "PREMIUM 220,000원"

  const totalPrice =
    getPackagePrice(packageLabel) +
    selectedOptions.reduce((sum, option) => sum + getAdditionalOptionPrice(option), 0)

  useEffect(() => {
    let frameId = 0
    let dirty = false

    const animate = () => {
      const cur = pointerCurrentRef.current
      const tgt = pointerTargetRef.current

      cur.x += (tgt.x - cur.x) * 0.08
      cur.y += (tgt.y - cur.y) * 0.08

      if (bookRef.current) {
        bookRef.current.style.transform = `translate3d(${cur.x * 18}px, ${cur.y * 12}px, 0) rotateX(${cur.y * -10}deg) rotateY(${cur.x * 14}deg)`
      }

      if (bookShadowRef.current) {
        bookShadowRef.current.style.transform = `translateX(${cur.x * 10}px) scale(${1 - Math.abs(cur.y) * 0.08})`
        bookShadowRef.current.style.opacity = (0.22 + Math.abs(cur.x) * 0.08 + Math.abs(cur.y) * 0.06).toFixed(3)
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

  function toggleSelection(value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  function handleReferenceLinkChange(index: number, value: string) {
    setReferenceLinks((prev) => prev.map((link, currentIndex) => (currentIndex === index ? value : link)))
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files
    if (!files || files.length === 0) return
    setUploadError(null)
    if (uploadedImages.length + files.length > 3) return setUploadError("최대 3장까지만 업로드할 수 있습니다.")
    setIsUploading(true)

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`${file.name}: 파일 크기가 5MB를 초과합니다.`)
        continue
      }
      const fileExt = file.name.split(".").pop()
      const fileName = `${uploadFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`
      const { error } = await supabase.storage.from("order-references").upload(fileName, file)
      if (error) {
        setUploadError(`${file.name}: 업로드 실패 - ${error.message}`)
        continue
      }
      const { data: urlData } = supabase.storage.from("order-references").getPublicUrl(fileName)
      setUploadedImages((prev) => [...prev, { url: urlData.publicUrl, name: file.name }])
    }

    setIsUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleRemoveImage(imageUrl: string) {
    const fileName = extractStoragePath(imageUrl, "order-references")
    if (fileName) await supabase.storage.from("order-references").remove([fileName])
    setUploadedImages((prev) => prev.filter((image) => image.url !== imageUrl))
  }

  function resetForm() {
    setTitle("")
    setAuthor("")
    setSelectedType(null)
    setSelectedDirection(null)
    setSelectedPackage("standard")
    setSelectedOptions([])
    setSelectedToneColors([])
    setSelectedStyles([])
    setWorkKeywords("")
    setUsageChannel("")
    setReferenceLinks(["", ""])
    setUploadedImages([])
    setDeadline("")
    setClientEmail("")
    setClientPassword("")
    setAgreeTerms(false)
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    setSubmitSuccess(null)

    const moodList = [...selectedToneColors.map((value) => `톤&컬러: ${value}`), ...selectedStyles.map((value) => `스타일&분위기: ${value}`)]
    const direction = directionOptions.find((item) => item.id === selectedDirection)
    const formattedLinks = referenceLinks.map((link) => link.trim()).filter(Boolean)
    const referenceNotes = [
      ...formattedLinks.map((link, index) => `참고 링크 ${index + 1}: ${link}`),
      ...uploadedImages.map((image, index) => `업로드 이미지 ${index + 1}: ${image.url}`),
    ].join("\n")

    if (!title.trim()) return setSubmitError("제품명 또는 프로젝트명을 입력해 주세요.")
    if (!author.trim()) return setSubmitError("브랜드명 또는 담당자명을 입력해 주세요.")
    if (!selectedType) return setSubmitError("연출 유형을 선택해 주세요.")
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
      genre: selectedType,
      style_direction: direction.title,
      package: packageLabel,
      mood_keywords: moodList.join(", "),
      color_keywords: workKeywords.trim(),
      reference_url: referenceNotes || null,
      deadline,
      comments: [],
      admin_note:
        [
          usageChannel.trim() ? `활용 채널: ${usageChannel.trim()}` : "",
          selectedOptions.length > 0
            ? `추가 옵션: ${selectedOptions.map((option) => formatAdditionalOption(option)).join(", ")}`
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
      if (!response.ok) return setSubmitError(`제출에 실패했습니다. ${result.error ?? "알 수 없는 오류"}`)
      resetForm()
      setSubmitSuccess("요청이 정상적으로 접수되었습니다. 입력하신 이메일과 비밀번호로 Client 페이지에서 진행 상태를 확인해 주세요.")
    } catch (error) {
      setIsSubmitting(false)
      setSubmitError(`제출에 실패했습니다. ${formatClientError(error)}`)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <main className="pt-10 pb-24 px-6 md:px-12 lg:px-20 max-w-5xl mx-auto">
          <header
            ref={heroRef}
            className="mb-16 relative flex items-center justify-between gap-8"
            onMouseMove={handleHeroPointerMove}
            onMouseLeave={handleHeroPointerLeave}
          >
            <div className="absolute -top-24 -right-12 w-64 h-64 bg-[#2054dc]/5 rounded-full blur-3xl -z-10" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-6">
                <div className="text-xl font-extrabold tracking-[0] text-zinc-900 font-headline uppercase">STUDIO ROE</div>
                <div className="h-[1px] flex-grow bg-outline-variant/30" />
              </div>
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2054dc] bg-[#2054dc]/10 px-3 py-1 rounded-full">New Request</span>
                <Link href="/" className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-700 bg-zinc-100 px-3 py-1 rounded-full hover:bg-zinc-200 transition-colors">Home</Link>
                <Link href="/client" className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-700 bg-zinc-100 px-3 py-1 rounded-full hover:bg-zinc-200 transition-colors">Client</Link>
              </div>
              <h1 className="text-4xl md:text-5xl font-satoshi font-black text-on-surface tracking-[0] leading-tight">
                AI STUDIO SHOOT
                <br />
                <span className="bg-gradient-to-r from-[#2f9cf3] to-[#2054dc] bg-clip-text text-transparent">REQUEST FORM</span>
              </h1>
              <p className="mt-6 text-base font-satoshi font-normal text-on-surface-variant max-w-2xl leading-relaxed">
                STUDIO ROE는 전달받은 상품 사진을 바탕으로 AI 합성과 연출을 더해
                브랜드 무드를 극대화한 비주얼을 제작합니다. 필요한 결과물의 용도와 무드를 남겨주시면
                브랜드에 맞는 연출 방향과 구성안을 제안합니다.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a href="#request-form" className="inline-flex items-center justify-center px-8 py-4 bg-[#2054dc] text-white rounded-full font-bold hover:bg-[#2054dc]/90 shadow-xl transition-all">의뢰서 작성</a>
                <Link href="/portfolio" className="inline-flex items-center justify-center px-8 py-4 border-2 border-zinc-300 rounded-full font-bold text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 transition-all">포트폴리오 →</Link>
              </div>
            </div>

            <div className="hidden md:block flex-shrink-0 select-none pointer-events-none mt-[40px]">
              <div className="book-float relative h-56 w-56 lg:h-64 lg:w-64 flex items-center justify-center">
                <div
                  ref={bookShadowRef}
                  className="absolute left-1/2 top-[72%] h-10 w-28 -translate-x-1/2 rounded-full bg-[#2054dc]/15 blur-2xl"
                  style={{ willChange: "transform, opacity" }}
                />
                <div
                  ref={bookRef}
                  className="relative flex h-full w-full items-center justify-center"
                  style={{ willChange: "transform" }}
                >
                  <Image
                    src="/images/item.png"
                    alt="decorative item"
                    fill
                    className="object-contain drop-shadow-[0_10px_18px_rgba(15,23,42,0.12)]"
                    priority
                  />
                </div>
              </div>
            </div>

          </header>

          <section className="mb-20" id="request-form">
            <div className="border-t-8 border-[#2054dc] w-24 mb-8" />
            <SectionHeading index="01." title="브랜드 연출을 위한 기본 정보" body="프로젝트 이름, 담당자, 사용 채널과 제품의 핵심 특징을 먼저 정리해 주세요." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Field label="제품명 또는 프로젝트명 *"><input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClassName} placeholder="예: 24SS 립밤 런칭 비주얼" /></Field>
              <Field label="브랜드명 또는 담당자명 *"><input value={author} onChange={(event) => setAuthor(event.target.value)} className={inputClassName} placeholder="예: STUDIO ROE / 홍길동" /></Field>
            </div>
          </section>

          <section className="mb-20">
            <SectionHeading index="02." title="어떤 연출 결과물이 필요한지 선택하세요." body="선택한 용도에 맞춰 이후 패키지와 연출 제안이 정리됩니다." />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {shootTypes.map((type) => (
                <label key={type} className="group cursor-pointer">
                  <input type="radio" name="shootType" className="hidden peer" checked={selectedType === type} onChange={() => setSelectedType(type)} />
                  <div className="h-full p-4 rounded-2xl bg-surface-container-low border-2 border-transparent peer-checked:border-[#2054dc] peer-checked:bg-white transition-all hover:bg-white text-center">
                    <p className="font-headline font-bold text-zinc-900">{type}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="mb-20">
            <SectionHeading index="03." title="브랜드 무드 방향을 선택하세요" body="제품에 어떤 분위기와 인상을 입힐지, 가장 잘 맞는 무드 방향을 골라 주세요." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {directionOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedDirection(option.id)}
                  className={`rounded-3xl bg-white p-6 text-left shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                    selectedDirection === option.id ? "ring-4 ring-[#2054dc]" : "ring-1 ring-black/5"
                  }`}
                >
                  <p className="text-xs text-on-surface-variant mb-1">{option.label}</p>
                  <h4 className="font-headline font-extrabold text-on-surface text-lg mb-2">{option.title}</h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{option.description}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="mb-20">
            <SectionHeading index="04." title="무드 및 요청사항" body="원하는 결과물의 톤과 스타일을 주제별로 선택해 주세요. 추가 요청은 아래에 함께 남겨주시면 됩니다." />
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                  <label className="font-label text-sm font-semibold text-on-surface">톤 & 컬러 <span className="text-[#2054dc]">*</span></label>
                  <p className="mt-2 text-sm text-on-surface-variant">원하는 전체 색감과 온도를 골라 주세요.</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {toneColorOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleSelection(option, setSelectedToneColors)}
                        className={`px-5 py-2.5 rounded-full border-2 text-sm font-medium transition-all ${
                          selectedToneColors.includes(option)
                            ? "border-[#2054dc] bg-[#2054dc] text-white"
                            : "border-outline-variant bg-white text-on-surface hover:border-[#2054dc]/50"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
                  <label className="font-label text-sm font-semibold text-on-surface">스타일 & 분위기 <span className="text-[#2054dc]">*</span></label>
                  <p className="mt-2 text-sm text-on-surface-variant">브랜드가 보여야 하는 무드와 표현 방식을 함께 선택해 주세요.</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {styleOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggleSelection(option, setSelectedStyles)}
                        className={`px-5 py-2.5 rounded-full border-2 text-sm font-medium transition-all ${
                          selectedStyles.includes(option)
                            ? "border-[#2054dc] bg-[#2054dc] text-white"
                            : "border-outline-variant bg-white text-on-surface hover:border-[#2054dc]/50"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Field label="활용 채널"><textarea value={usageChannel} onChange={(event) => setUsageChannel(event.target.value)} className={`${inputClassName} min-h-[160px] resize-y`} placeholder="예: 자사몰 메인, 인스타그램 광고, 상세페이지" /></Field>
                <Field label="추가 요청사항 *"><textarea value={workKeywords} onChange={(event) => setWorkKeywords(event.target.value)} className={`${inputClassName} min-h-[160px] resize-y`} placeholder="예: 제품 로고는 선명하게 유지해 주세요. 메인 이미지는 여백감 있게, 상세페이지용 이미지는 정보 전달이 잘 되도록 정리되면 좋겠습니다." /></Field>
              </div>
            </div>
          </section>

          <section className="mb-20" id="packages">
            <SectionHeading index="05." title="패키지 선택" body="필요한 결과물 수와 연출 밀도에 맞춰 패키지를 선택해 주세요." />
            <div className="relative flex items-center gap-6 bg-zinc-900 rounded-2xl pl-0 pr-8 py-5 mb-8 overflow-visible">
              <div className="relative flex-shrink-0 -ml-[6px]">
                <div className="bg-[#2054dc] text-white font-black text-xs tracking-widest px-5 py-2 rounded-sm relative" style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)" }}>PACKAGE</div>
                <div className="absolute -bottom-1.5 left-0 w-0 h-0" style={{ borderRight: "6px solid #007a82", borderBottom: "6px solid transparent" }} />
              </div>
              <div className="relative -top-[6px] flex items-baseline gap-x-3 gap-y-1 flex-wrap">
                <span className="text-white font-bold text-lg">오픈 기념 50% 할인 중</span>
                <span className="text-zinc-400 text-sm">추가 옵션과 함께 총액이 자동으로 계산됩니다.</span>
              </div>
              <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 bg-[#2054dc] opacity-10 blur-[40px] pointer-events-none" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <PackageCard active={selectedPackage === "basic"} title="BASIC" price="59,000원" description="상품 사진 두 장으로 빠르게 브랜드 무드 컷을 구성하는 기본 패키지" bullets={["메인 비주얼 2종", "기본 합성 및 리터칭", "인물 미포함"]} onClick={() => setSelectedPackage("basic")} />
              <PackageCard active={selectedPackage === "standard"} title="STANDARD" price="120,000원" description="상세페이지와 광고 운영용으로 가장 많이 선택하는 구성" bullets={["메인 비주얼 4종", "배경 연출 포함, 인물 미포함", "요청 시 손동작 포함 가능"]} onClick={() => setSelectedPackage("standard")} highlighted />
              <PackageCard active={selectedPackage === "premium"} title="PREMIUM" price="220,000원" description="브랜드 무드와 캠페인 톤까지 확장하는 상위 구성" bullets={["메인 비주얼 5종", "요청시 인물 1인 포함", "브랜드 무드 중심 아트디렉션"]} onClick={() => setSelectedPackage("premium")} />
            </div>
          </section>

          <section className="mb-20">
            <SectionHeading index="06." title="추가 옵션" body="원하는 결과물 성격이 분명하다면 기본 패키지 위에 옵션만 더하는 편이 효율적입니다." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {additionalOptions.map((option) => (
                <label key={option.id} className={`flex items-center gap-4 p-5 rounded-2xl cursor-pointer transition-all ${selectedOptions.includes(option.id) ? "bg-white ring-2 ring-[#2054dc] shadow-sm" : "bg-surface-container-low hover:bg-white"}`}>
                  <input type="checkbox" className="w-6 h-6 text-[#2054dc] rounded-md border-outline focus:ring-[#2054dc]" checked={selectedOptions.includes(option.id)} onChange={() => toggleOption(option.id)} />
                  <div>
                    <p className="font-bold">{option.title}<span className="text-[#2054dc] ml-2">{option.price}</span></p>
                    <p className="text-xs text-zinc-500">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="mb-20">
            <SectionHeading index="07." title="레퍼런스와 연락처" body="상품 사진과 레퍼런스가 구체적일수록 더 정확하게 무드 방향을 설계할 수 있습니다." />
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="font-label text-sm font-semibold uppercase tracking-widest text-on-surface-variant">이미지 업로드</label>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-grow space-y-4">
                    <label className={`flex items-center justify-center p-8 bg-zinc-50 border-2 border-dashed border-outline-variant rounded-2xl cursor-pointer hover:border-[#2054dc] transition-all group ${uploadedImages.length >= 3 ? "opacity-50 cursor-not-allowed" : ""}`}>
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={handleFileUpload} disabled={uploadedImages.length >= 3 || isUploading} />
                      <div className="text-center">
                        <p className="font-bold text-sm">{isUploading ? "업로드 중..." : "이미지 파일 선택"}</p>
                        <p className="text-xs text-zinc-400 mt-1">최대 3장 · JPG, PNG · 각 5MB 이하</p>
                      </div>
                    </label>
                    {uploadError ? <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{uploadError}</div> : null}
                    {uploadedImages.length > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        {uploadedImages.map((image) => (
                          <div key={image.url} className="relative group">
                            <img src={image.url} alt={image.name} className="w-24 h-24 object-cover rounded-xl border-2 border-zinc-200" />
                            <button type="button" onClick={() => handleRemoveImage(image.url)} className="absolute -top-2 -right-2 px-2 py-1 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">삭제</button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex-grow space-y-2">
                    <p className="text-xs font-bold text-on-surface-variant">링크 입력</p>
                    <input value={referenceLinks[0]} onChange={(event) => handleReferenceLinkChange(0, event.target.value)} className={inputClassName} placeholder="https://..." />
                    <input value={referenceLinks[1]} onChange={(event) => handleReferenceLinkChange(1, event.target.value)} className={inputClassName} placeholder="https://..." />
                  </div>
                </div>
                <p className="text-sm text-on-surface-variant mt-2">상품 사진 원본, 패키지 이미지, 기존 상세페이지, 무드보드, 원하는 광고 비주얼 예시를 첨부해 주세요.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Field label="희망 완료일 *"><input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} className={inputClassName} /></Field>
                <Field label="이메일 *"><input type="email" value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} className={inputClassName} placeholder="name@example.com" /></Field>
                <Field label="작업 확인용 비밀번호 *"><input type="password" value={clientPassword} onChange={(event) => setClientPassword(event.target.value)} className={inputClassName} placeholder="조회 시 사용할 비밀번호" /></Field>
              </div>
            </div>
          </section>

          <div className="flex flex-col md:flex-row items-center justify-between p-8 bg-zinc-900 rounded-[2rem] text-white shadow-2xl relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#2054dc] opacity-10 blur-[80px] pointer-events-none" />
            <div className="mb-6 md:mb-0">
              <h4 className="text-2xl font-headline font-bold mb-1">총 결제 금액 {formatKrw(totalPrice)}</h4>
              <p className="text-zinc-400">제출하기를 누르면 AI 비주얼 연출 요청이 접수됩니다.</p>
              <label className="flex items-center gap-3 cursor-pointer mt-4">
                <input type="checkbox" className="w-5 h-5 text-[#2054dc] rounded border-[#2054dc]/30 focus:ring-[#2054dc]" checked={agreeTerms} onChange={(event) => setAgreeTerms(event.target.checked)} />
                <span className="text-sm font-medium">작업 전 취소 시 전액 환불 가능, 1차 시안 전달 후에는 환불이 어렵습니다.</span>
              </label>
              {submitError ? <p className="mt-3 text-sm text-red-300">{submitError}</p> : null}
              {submitSuccess ? <p className="mt-3 text-sm text-[#2054dc]/80">{submitSuccess}</p> : null}
            </div>
            <div className="w-full md:w-auto">
              <button type="submit" disabled={isSubmitting || isUploading} className="w-full md:w-auto px-12 py-5 text-white font-headline font-extrabold rounded-full flex items-center justify-center gap-3 bg-[#2054dc] hover:bg-[#2054dc]/90 shadow-xl transition-all">
                {isSubmitting ? "제출 중..." : "제출하기"}
              </button>
            </div>
          </div>
        </main>
      </form>
      <footer className="px-6 pb-10 text-center md:px-12 lg:px-20">
        <p className="text-xs text-zinc-400">
          <Link href="/admin" aria-label="관리자 페이지" className="text-xs text-zinc-400 transition-colors hover:text-zinc-400">
            ©
          </Link>{" "}
          2026{" "}
          <a href="mailto:onroeway@gmail.com" className="transition-colors hover:text-zinc-700">
            ONROE
          </a>
          . All rights reserved.
        </p>
      </footer>
    </>
  )
}

function SectionHeading({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <div>
      <h2 className="text-2xl font-headline font-bold mb-2 flex items-center gap-3">
        <span className="text-[#2054dc]">{index}</span> {title}
      </h2>
      <p className="text-sm text-on-surface-variant font-normal mb-8">{body}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2 block">
      <span className="font-label text-sm font-semibold uppercase tracking-widest text-on-surface-variant">{label}</span>
      {children}
    </label>
  )
}

function PackageCard({
  active,
  title,
  price,
  description,
  bullets,
  onClick,
  highlighted = false,
}: {
  active: boolean
  title: string
  price: string
  description: string
  bullets: string[]
  onClick: () => void
  highlighted?: boolean
}) {
  return (
    <div
      onClick={onClick}
      className={`p-8 rounded-3xl flex flex-col cursor-pointer transition-all relative ${
        highlighted ? "z-10" : ""
      } bg-white shadow-sm border ${active ? "border-[#2054dc] border-2 shadow-lg" : "border-zinc-100 hover:shadow-lg hover:-translate-y-1"}`}
    >
      {active ? <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#2054dc] text-white text-[10px] px-4 py-1.5 rounded-full font-bold uppercase tracking-widest">SELECT</div> : null}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2054dc]">{title}</p>
        <p className="mt-3 text-4xl font-headline font-extrabold text-zinc-900">{price}</p>
        <p className="mt-3 text-sm leading-6 text-zinc-600">{description}</p>
      </div>
      <ul className="space-y-4 mb-10 flex-grow text-sm text-zinc-700">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#2054dc] text-lg">check_circle</span>
            {bullet}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={`w-full py-4 rounded-full font-bold transition-all ${
          active
            ? "bg-[#2054dc] text-white border-2 border-[#2054dc]"
            : "border-2 border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white"
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
