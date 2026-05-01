"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface PortfolioItem {
  id: string
  brand: string
  brandLabel: string
  src: string
  alt: string
  tag: string
}

interface BrandEntry {
  id: string
  label: string
}

export default function PortfolioPage() {
  const router = useRouter()
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [brands, setBrands] = useState<BrandEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState("all")
  const [page, setPage] = useState(1)
  const [lightbox, setLightbox] = useState<PortfolioItem | null>(null)
  const PER_PAGE = 40
  const mainRef = useRef<HTMLDivElement>(null)
  const [editMode, setEditMode] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [labelOverrides, setLabelOverrides] = useState<Record<string, string>>({})
  const [renamingBrand, setRenamingBrand] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const renameInputRef = useRef<HTMLInputElement>(null)
  const [confirmDeleteBrand, setConfirmDeleteBrand] = useState<string | null>(null)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [checkingAdminSession, setCheckingAdminSession] = useState(true)
  const heroRef = useRef<HTMLElement>(null)
  const bookRef = useRef<HTMLDivElement>(null)
  const bookShadowRef = useRef<HTMLDivElement>(null)
  const pointerTargetRef = useRef({ x: 0, y: 0 })
  const pointerCurrentRef = useRef({ x: 0, y: 0 })

  // Load from disk on mount
  useEffect(() => {
    fetch("/api/portfolio")
      .then((r) => r.json())
      .then(({ items, brands }) => {
        setItems(items)
        setBrands(brands)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch("/api/admin-session", { cache: "no-store" })
      .then((r) => r.json())
      .then((result) => setIsAdminAuthenticated(Boolean(result?.authenticated)))
      .catch(() => setIsAdminAuthenticated(false))
      .finally(() => setCheckingAdminSession(false))
  }, [])

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

  function getLabel(brandId: string, fallback: string) {
    return labelOverrides[brandId] ?? fallback
  }

  function handleEditButtonClick() {
    if (!isAdminAuthenticated) {
      router.push("/admin/login?redirect=/portfolio")
      return
    }

    setEditMode((value) => !value)
    setRenamingBrand(null)
    setConfirmDeleteBrand(null)
  }

  const activeBrands: BrandEntry[] = [
    { id: "all", label: "ALL" },
    ...brands,
  ]

  const filtered = active === "all" ? items : items.filter((i) => i.brand === active)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  // ── Image delete ──────────────────────────────────────────
  async function handleDeleteImage(item: PortfolioItem, e: React.MouseEvent) {
    e.stopPropagation()
    setDeleting(item.id)
    try {
      const res = await fetch("/api/portfolio", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: item.src }),
      })
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== item.id))
    } finally {
      setDeleting(null)
    }
  }

  // ── Brand delete ──────────────────────────────────────────
  async function handleDeleteBrand(brandId: string) {
    setDeleting(`brand:${brandId}`)
    try {
      const res = await fetch("/api/portfolio", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: brandId }),
      })
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.brand !== brandId))
        setBrands((prev) => prev.filter((b) => b.id !== brandId))
        if (active === brandId) setActive("all")
        setPage(1)
      }
    } finally {
      setDeleting(null)
      setConfirmDeleteBrand(null)
    }
  }

  // ── Brand rename ──────────────────────────────────────────
  function startRename(brandId: string, currentLabel: string) {
    setRenamingBrand(brandId)
    setRenameValue(currentLabel)
    setTimeout(() => renameInputRef.current?.focus(), 30)
  }

  function commitRename() {
    if (renamingBrand && renameValue.trim()) {
      const trimmed = renameValue.trim()
      setLabelOverrides((prev) => ({ ...prev, [renamingBrand]: trimmed }))
      setBrands((prev) => prev.map((b) => b.id === renamingBrand ? { ...b, label: trimmed } : b))
      setItems((prev) => prev.map((i) => i.brand === renamingBrand ? { ...i, brandLabel: trimmed } : i))
    }
    setRenamingBrand(null)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.92),_rgba(245,230,231,0.95)_42%,_rgba(244,234,228,1)_100%)] text-[#2c2c2c]">
      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b border-[#ead9cf]/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-[18px] md:px-12 lg:px-20">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs font-bold uppercase tracking-[0.2em] text-[#a48777] hover:text-[#2c2c2c] transition-colors">
              ← ProductRoe
            </Link>
            <span className="h-4 w-px bg-[#ead9cf]" />
            <span className="font-skin-serif text-[24px] tracking-[0] text-[#2c2c2c]">Portfolio</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/characterroe" className="rounded-full border border-[#ead9cf] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8b7355] shadow-[0_10px_20px_rgba(124,98,81,0.08)] transition-colors hover:border-[#c7a98c]">
              CharacterRoe
            </Link>
            <Link href="/titleroe" className="rounded-full border border-[#ead9cf] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8b7355] shadow-[0_10px_20px_rgba(124,98,81,0.08)] transition-colors hover:border-[#c7a98c]">
              TitleRoe
            </Link>
            <Link href="/" className="rounded-full bg-[linear-gradient(135deg,#c89f92,#b98677)] px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-[0_14px_28px_rgba(185,134,119,0.20)] transition-colors hover:opacity-95">
              의뢰하기
            </Link>
          </div>
        </div>
      </nav>

      {editMode && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-center text-xs font-semibold text-red-600">
          편집 모드 — 카테고리 탭에 마우스를 올리면 이름 수정·삭제 버튼이 나타납니다.
        </div>
      )}

      {/* Hero */}
      <section
        ref={heroRef}
        className="relative overflow-hidden px-6 pb-12 pt-0 md:px-12 lg:px-20 max-w-5xl mx-auto"
        onMouseMove={handleHeroPointerMove}
        onMouseLeave={handleHeroPointerLeave}
      >
        <div className="absolute -top-24 -right-12 h-64 w-64 rounded-full bg-[#e9d4cf]/60 blur-3xl -z-10" />
        <div className="flex items-center justify-between gap-8">
          <div className="min-w-0 flex-1">
            <div className="mt-[10px] flex items-center gap-4 mb-3">
              <span className="rounded-full border border-[#ead9cf] bg-[#f7ede7] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#9b7b68]">AI Product Visual</span>
            </div>
            <h1 className="font-skin-serif text-4xl leading-tight tracking-[0] text-[#2c2c2c] md:text-5xl">
              STUDIO ROE
              <br />
              <span className="bg-gradient-to-r from-[#b98677] to-[#8f695d] bg-clip-text text-transparent">PORTFOLIO</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#6d5c58]">
              모든 이미지는 실제 브랜드 제품을 AI 합성한 샘플이며,
              <br />
              제품의 저작권은 해당 브랜드에 있습니다.
            </p>
            <div className="mt-8 flex flex-wrap gap-6">
              {[
                { num: String(brands.length), label: "Brands" },
                { num: String(items.length), label: "Images" },
                { num: "AI", label: "Generated" },
              ].map(({ num, label }) => (
                <div key={label} className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[#2c2c2c]">{num}</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a28e86]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden md:block flex-shrink-0 select-none pointer-events-none mt-[40px]">
            <div className="book-float relative h-56 w-56 lg:h-64 lg:w-64 flex items-center justify-center">
              <div
                ref={bookShadowRef}
                className="absolute left-1/2 top-[72%] h-10 w-28 -translate-x-1/2 rounded-full bg-[#b98677]/20 blur-2xl"
                style={{ willChange: "transform, opacity" }}
              />
              <div
                ref={bookRef}
                className="relative flex h-full w-full items-center justify-center"
                style={{ willChange: "transform" }}
              >
                <Image
                  src="/images/logo.png"
                  alt="Studio Roe logo"
                  fill
                  className="object-contain drop-shadow-[0_10px_18px_rgba(15,23,42,0.12)]"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter bar */}
      <div className="sticky top-[61px] z-20 border-b border-[#ead9cf]/80 bg-[#fbf4f0]/92 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-6 md:px-12 lg:px-20">
          <div className="flex flex-wrap gap-1 py-3 items-center">
            {activeBrands.map((brand) => {
              const count = brand.id === "all" ? items.length : items.filter((i) => i.brand === brand.id).length
              const label = brand.id === "all" ? "ALL" : getLabel(brand.id, brand.label)
              const isRenaming = renamingBrand === brand.id
              const isDeletingBrand = deleting === `brand:${brand.id}`

              return (
                <div key={brand.id} className="relative flex-shrink-0 group/tab">
                  {isRenaming ? (
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingBrand(null) }}
                      className="w-36 rounded-full border-2 border-[#b98677] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => { setActive(brand.id); setPage(1) }}
                      className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-all ${
                        active === brand.id ? "border border-[#d9b8a6] bg-[#f4e3df] text-[#8f695d]" : "border border-[#ead9cf] bg-white text-[#7b675d] hover:bg-[#fbf4f0] hover:text-[#5d4c47]"
                      }`}
                    >
                      {isDeletingBrand ? (
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#cdb7ae]/50 border-t-[#a48777]" />
                      ) : (
                        <>
                          {label}
                          <span className={`ml-1.5 text-[10px] ${active === brand.id ? "opacity-60" : "opacity-40"}`}>{count}</span>
                        </>
                      )}
                    </button>
                  )}

                  {editMode && brand.id !== "all" && !isRenaming && (
                    <div className="absolute -top-1 -right-1 hidden group-hover/tab:flex gap-0.5">
                      <button
                        onClick={() => startRename(brand.id, label)}
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-[#b98677] text-[9px] text-white shadow transition-colors hover:bg-[#a87567]"
                        title="이름 수정"
                      >✎</button>
                      <button
                        onClick={() => setConfirmDeleteBrand(brand.id)}
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[9px] shadow hover:bg-red-600 transition-colors"
                        title="카테고리 전체 삭제"
                      >✕</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <main ref={mainRef} className="mx-auto max-w-5xl px-6 py-10 md:px-12 lg:px-20">
        {loading ? (
          <div className="py-32 text-center text-sm text-[#b7a59e]">불러오는 중...</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {paged.map((item) => (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => !editMode && setLightbox(item)}
                  className={`relative block w-full overflow-hidden rounded-[24px] border border-[#ead9cf] bg-white/92 shadow-[0_16px_32px_rgba(124,98,81,0.08)] focus:outline-none ${!editMode ? "cursor-pointer" : "cursor-default"}`}
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    width={600}
                    height={600}
                    className={`w-full object-cover transition-transform duration-700 ${!editMode ? "group-hover:scale-[1.04]" : "opacity-80"}`}
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                  {!editMode && (
                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#4a332d]/80 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <span className="mb-1 inline-block w-fit rounded-full bg-[#b98677] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">{item.tag}</span>
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/65">{item.brandLabel}</p>
                      <p className="mt-0.5 text-xs font-semibold text-white leading-tight">{item.alt}</p>
                    </div>
                  )}
                </button>

                {editMode && (
                  <>
                    <button
                      onClick={(e) => handleDeleteImage(item, e)}
                      disabled={deleting === item.id}
                      className="absolute top-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold shadow-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {deleting === item.id ? (
                        <span className="block h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      ) : "✕"}
                    </button>
                    <p className="mt-1 truncate px-1 text-[10px] leading-tight text-[#a28e86]">{item.src.split("/").pop()}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="py-32 text-center text-sm text-[#b7a59e]">No items</div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-1">
            <button
              onClick={() => { setPage((p) => Math.max(1, p - 1)); mainRef.current?.scrollIntoView({ behavior: "smooth" }) }}
              disabled={page === 1}
              className="rounded-full px-4 py-2 text-xs font-bold text-[#a28e86] transition-colors hover:text-[#5d4c47] disabled:opacity-30"
            >
              ← Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => {
              const isActive = n === page
              const show = n === 1 || n === totalPages || Math.abs(n - page) <= 2
              const showDotsBefore = n === page - 3 && page - 3 > 1
              const showDotsAfter = n === page + 3 && page + 3 < totalPages
              if (!show && !showDotsBefore && !showDotsAfter) return null
              if (showDotsBefore || showDotsAfter) return (
                <span key={`dots-${n}`} className="px-1 text-sm text-[#c8b7b0]">…</span>
              )
              return (
                <button
                  key={n}
                  onClick={() => { setPage(n); mainRef.current?.scrollIntoView({ behavior: "smooth" }) }}
                  className={`min-w-[36px] rounded-full px-3 py-2 text-xs font-bold transition-all ${
                    isActive ? "border border-[#d9b8a6] bg-[#f4e3df] text-[#8f695d]" : "border border-[#ead9cf] bg-white text-[#7b675d] hover:bg-[#fbf4f0]"
                  }`}
                >
                  {n}
                </button>
              )
            })}

            <button
              onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); mainRef.current?.scrollIntoView({ behavior: "smooth" }) }}
              disabled={page === totalPages}
              className="rounded-full px-4 py-2 text-xs font-bold text-[#a28e86] transition-colors hover:text-[#5d4c47] disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {/* CTA footer */}
      <section className="border-t border-[#ead9cf]/80 px-6 py-10 md:px-12 lg:px-20">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[34px] border border-[#ead9cf] bg-white/92 px-10 py-5 shadow-[0_20px_60px_rgba(124,98,81,0.08)] md:px-16 md:py-8">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-lg">
                <h2 className="font-skin-serif text-[24px] leading-tight text-[#2c2c2c] md:text-[30px]">
                  브랜드 비주얼, <span className="bg-gradient-to-r from-[#b98677] to-[#8f695d] bg-clip-text text-transparent">AI로 설계합니다.</span>
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[#6d5c58]">
                  제품 단독 컷부터 모델 합성, 캠페인 비주얼까지
                </p>
              </div>
              <div className="md:flex-shrink-0">
                <Link href="/" className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#c89f92,#b98677)] px-8 py-4 text-sm font-bold text-white shadow-xl shadow-[#b98677]/20 transition-all hover:opacity-95">
                  의뢰서 작성하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-6 pb-10 text-center md:px-12 lg:px-20">
        <p className="text-xs text-[#a28e86]">
          {!checkingAdminSession ? (
            <button
              type="button"
              onClick={handleEditButtonClick}
              aria-label={isAdminAuthenticated ? (editMode ? "편집 종료" : "편집 모드") : "관리자 로그인"}
              className="cursor-default text-xs text-[#a28e86] focus:outline-none"
            >
              ©
            </button>
          ) : (
            <span>©</span>
          )}{" "}
          2026{" "}
          <a href="mailto:onroeway@gmail.com" className="transition-colors hover:text-[#5d4c47]">
            ONROE
          </a>
          . All rights reserved.
        </p>
      </footer>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4a332d]/68 backdrop-blur-sm p-4" onClick={() => setLightbox(null)}>
          <button className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#6d5c58] transition-colors hover:bg-white text-sm font-bold shadow" onClick={() => setLightbox(null)}>✕</button>
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[28px] border border-[#ead9cf] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <Image src={lightbox.src} alt={lightbox.alt} width={1200} height={1200} className="w-full h-auto max-h-[80vh] object-contain" />
            <div className="flex items-center gap-3 border-t border-[#efe2db] p-5">
              <span className="rounded-full bg-[#b98677] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">{lightbox.tag}</span>
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-[#a28e86]">{lightbox.brandLabel}</span>
              <span className="truncate text-sm font-semibold text-[#5d4c47]">{lightbox.alt}</span>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete brand modal */}
      {confirmDeleteBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4a332d]/60 backdrop-blur-sm p-4" onClick={() => setConfirmDeleteBrand(null)}>
          <div className="w-full max-w-sm rounded-[28px] border border-[#ead9cf] bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-500 mb-3">카테고리 전체 삭제</p>
            <p className="mb-2 text-base font-bold text-[#2c2c2c]">
              {getLabel(confirmDeleteBrand, brands.find((b) => b.id === confirmDeleteBrand)?.label ?? confirmDeleteBrand)}
            </p>
            <p className="mb-6 text-sm text-[#6d5c58]">
              이 카테고리의 이미지 {items.filter((i) => i.brand === confirmDeleteBrand).length}장을 모두 삭제합니다. 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteBrand(null)} className="flex-1 rounded-full border border-[#ead9cf] py-3 text-sm font-bold text-[#6d5c58] transition-colors hover:bg-[#fbf4f0]">취소</button>
              <button
                onClick={() => handleDeleteBrand(confirmDeleteBrand)}
                disabled={deleting === `brand:${confirmDeleteBrand}`}
                className="flex-1 rounded-full bg-red-500 py-3 text-sm font-bold text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
