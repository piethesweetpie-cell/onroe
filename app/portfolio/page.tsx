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
    <div className="min-h-screen bg-[#f9fafb] text-zinc-900">
      {/* Nav */}
      <nav className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-[18px] md:px-12 lg:px-20">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-900 transition-colors">
              ← Studio Roe
            </Link>
            <span className="h-4 w-px bg-zinc-200" />
            <span className="text-xl font-extrabold tracking-[0] text-zinc-900 uppercase">Portfolio</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="rounded-full bg-[#2054dc] px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-[#2054dc]/90 transition-colors">
              의뢰하기
            </Link>
          </div>
        </div>
      </nav>

      {editMode && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 text-center text-xs font-semibold text-red-600">
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
        <div className="absolute -top-24 -right-12 w-64 h-64 bg-[#2054dc]/5 rounded-full blur-3xl -z-10" />
        <div className="flex items-center justify-between gap-8">
          <div className="min-w-0 flex-1">
            <div className="mt-[10px] flex items-center gap-4 mb-3">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#2054dc] bg-[#2054dc]/10 px-3 py-1 rounded-full">AI Product Visual</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-satoshi font-black text-zinc-900 tracking-[0] leading-tight">
              STUDIO ROE
              <br />
              <span className="bg-gradient-to-r from-[#2f9cf3] to-[#2054dc] bg-clip-text text-transparent">PORTFOLIO</span>
            </h1>
            <p className="mt-6 text-base text-zinc-500 max-w-xl leading-relaxed">
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
                  <span className="font-satoshi text-2xl font-black text-zinc-900">{num}</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">{label}</span>
                </div>
              ))}
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
        </div>
      </section>

      {/* Filter bar */}
      <div className="sticky top-[61px] z-20 border-b border-zinc-200/70 bg-[#f9fafb]/95 backdrop-blur-xl">
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
                      className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] bg-white border-2 border-[#2054dc] outline-none w-36"
                    />
                  ) : (
                    <button
                      onClick={() => { setActive(brand.id); setPage(1) }}
                      className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-all ${
                        active === brand.id ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700"
                      }`}
                    >
                      {isDeletingBrand ? (
                        <span className="inline-block h-3 w-3 rounded-full border-2 border-zinc-400/40 border-t-zinc-400 animate-spin" />
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
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2054dc] text-white text-[9px] shadow hover:bg-[#1a44c2] transition-colors"
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
          <div className="py-32 text-center text-zinc-300 text-sm">불러오는 중...</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {paged.map((item) => (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => !editMode && setLightbox(item)}
                  className={`relative block w-full overflow-hidden rounded-2xl bg-zinc-100 focus:outline-none border border-zinc-200/60 ${!editMode ? "cursor-pointer" : "cursor-default"}`}
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
                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <span className="mb-1 inline-block w-fit rounded-full bg-[#2054dc] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">{item.tag}</span>
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/60">{item.brandLabel}</p>
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
                    <p className="mt-1 px-1 text-[10px] text-zinc-400 leading-tight truncate">{item.src.split("/").pop()}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="py-32 text-center text-zinc-300 text-sm">No items</div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-1">
            <button
              onClick={() => { setPage((p) => Math.max(1, p - 1)); mainRef.current?.scrollIntoView({ behavior: "smooth" }) }}
              disabled={page === 1}
              className="rounded-full px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-700 disabled:opacity-30 transition-colors"
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
                <span key={`dots-${n}`} className="px-1 text-zinc-300 text-sm">…</span>
              )
              return (
                <button
                  key={n}
                  onClick={() => { setPage(n); mainRef.current?.scrollIntoView({ behavior: "smooth" }) }}
                  className={`min-w-[36px] rounded-full px-3 py-2 text-xs font-bold transition-all ${
                    isActive ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                  }`}
                >
                  {n}
                </button>
              )
            })}

            <button
              onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); mainRef.current?.scrollIntoView({ behavior: "smooth" }) }}
              disabled={page === totalPages}
              className="rounded-full px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-700 disabled:opacity-30 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {/* CTA footer */}
      <section className="border-t border-zinc-200/70 px-6 py-10 md:px-12 lg:px-20">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl bg-white border border-zinc-200 px-10 py-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:px-16 md:py-8">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-lg">
                <h2 className="font-satoshi text-[24px] font-black leading-tight text-zinc-900 md:text-[30px]">
                  브랜드 비주얼, <span className="bg-gradient-to-r from-[#2f9cf3] to-[#2054dc] bg-clip-text text-transparent">AI로 설계합니다.</span>
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-zinc-500">
                  제품 단독 컷부터 모델 합성, 캠페인 비주얼까지
                </p>
              </div>
              <div className="md:flex-shrink-0">
                <Link href="/" className="inline-flex items-center justify-center rounded-full bg-[#2054dc] px-8 py-4 text-sm font-bold text-white shadow-xl shadow-[#2054dc]/20 hover:bg-[#2054dc]/90 transition-all">
                  의뢰서 작성하기
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-6 pb-10 text-center md:px-12 lg:px-20">
        <p className="text-xs text-zinc-400">
          {!checkingAdminSession ? (
            <button
              type="button"
              onClick={handleEditButtonClick}
              aria-label={isAdminAuthenticated ? (editMode ? "편집 종료" : "편집 모드") : "관리자 로그인"}
              className="text-xs text-zinc-400 transition-colors hover:text-zinc-400 focus:outline-none"
            >
              ©
            </button>
          ) : (
            <span>©</span>
          )}{" "}
          2026{" "}
          <a href="mailto:onroeway@gmail.com" className="transition-colors hover:text-zinc-700">
            ONROE
          </a>
          . All rights reserved.
        </p>
      </footer>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/70 backdrop-blur-sm p-4" onClick={() => setLightbox(null)}>
          <button className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-zinc-700 hover:bg-white transition-colors text-sm font-bold shadow" onClick={() => setLightbox(null)}>✕</button>
          <div className="relative max-h-[90vh] max-w-3xl w-full overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <Image src={lightbox.src} alt={lightbox.alt} width={1200} height={1200} className="w-full h-auto max-h-[80vh] object-contain" />
            <div className="p-5 border-t border-zinc-100 flex items-center gap-3">
              <span className="rounded-full bg-[#2054dc] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">{lightbox.tag}</span>
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-400">{lightbox.brandLabel}</span>
              <span className="text-sm font-semibold text-zinc-700 truncate">{lightbox.alt}</span>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete brand modal */}
      {confirmDeleteBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4" onClick={() => setConfirmDeleteBrand(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-500 mb-3">카테고리 전체 삭제</p>
            <p className="text-base font-bold text-zinc-900 mb-2">
              {getLabel(confirmDeleteBrand, brands.find((b) => b.id === confirmDeleteBrand)?.label ?? confirmDeleteBrand)}
            </p>
            <p className="text-sm text-zinc-500 mb-6">
              이 카테고리의 이미지 {items.filter((i) => i.brand === confirmDeleteBrand).length}장을 모두 삭제합니다. 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteBrand(null)} className="flex-1 rounded-full border border-zinc-200 py-3 text-sm font-bold text-zinc-500 hover:bg-zinc-50 transition-colors">취소</button>
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
