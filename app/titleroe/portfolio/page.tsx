"use client"

import { type MouseEvent, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

type PortfolioItem = {
  id: string
  style: string
  styleLabel: string
  src: string
  alt: string
  tag: string
  detail: string
}

type StyleEntry = {
  style: string
  count: number
}

export default function TitleRoePortfolioPage() {
  const router = useRouter()
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [styles, setStyles] = useState<StyleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState("all")
  const [page, setPage] = useState(1)
  const [lightbox, setLightbox] = useState<PortfolioItem | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [checkingAdminSession, setCheckingAdminSession] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [labelOverrides, setLabelOverrides] = useState<Record<string, string>>({})
  const [renamingStyle, setRenamingStyle] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [confirmDeleteStyle, setConfirmDeleteStyle] = useState<string | null>(null)
  const [confirmEditMode, setConfirmEditMode] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const perPage = 40

  useEffect(() => {
    fetch("/api/titleroe-portfolio")
      .then((response) => response.json())
      .then(({ items, styles }) => {
        setItems(items)
        setStyles(styles)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch("/api/admin-session", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => setIsAdminAuthenticated(Boolean(result?.authenticated)))
      .catch(() => setIsAdminAuthenticated(false))
      .finally(() => setCheckingAdminSession(false))
  }, [])

  async function handleDeleteImage(item: PortfolioItem, event: MouseEvent) {
    event.stopPropagation()
    setDeleting(item.id)

    try {
      const response = await fetch("/api/titleroe-portfolio", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath: item.src }),
      })

      if (!response.ok) return

      setItems((previous) => previous.filter((entry) => entry.id !== item.id))
      setStyles((previous) =>
        previous
          .map((entry) => (entry.style === item.style ? { ...entry, count: Math.max(0, entry.count - 1) } : entry))
          .filter((entry) => entry.count > 0)
      )
      setLightbox((current) => (current?.id === item.id ? null : current))
    } finally {
      setDeleting(null)
    }
  }

  async function handleDeleteStyle(style: string) {
    setDeleting(`style:${style}`)

    try {
      const response = await fetch("/api/titleroe-portfolio", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style }),
      })

      if (!response.ok) return

      setItems((previous) => previous.filter((entry) => entry.style !== style))
      setStyles((previous) => previous.filter((entry) => entry.style !== style))
      if (active === style) setActive("all")
      setPage(1)
    } finally {
      setDeleting(null)
      setConfirmDeleteStyle(null)
    }
  }

  function getStyleLabel(style: string) {
    return labelOverrides[style] ?? style
  }

  function startRename(style: string) {
    setRenamingStyle(style)
    setRenameValue(getStyleLabel(style))
    setTimeout(() => renameInputRef.current?.focus(), 30)
  }

  function commitRename() {
    if (renamingStyle && renameValue.trim()) {
      const trimmed = renameValue.trim()
      setLabelOverrides((previous) => ({ ...previous, [renamingStyle]: trimmed }))
      setItems((previous) =>
        previous.map((entry) => (entry.style === renamingStyle ? { ...entry, styleLabel: trimmed } : entry))
      )
    }

    setRenamingStyle(null)
  }

  function handleEditButtonClick() {
    if (!isAdminAuthenticated) {
      router.push("/admin/login?redirect=/titleroe/portfolio")
      return
    }

    if (editMode) {
      setEditMode(false)
      setRenamingStyle(null)
      setConfirmDeleteStyle(null)
      return
    }

    setConfirmEditMode(true)
  }

  function confirmEnterEditMode() {
    setEditMode(true)
    setConfirmEditMode(false)
    setLightbox(null)
    setRenamingStyle(null)
    setConfirmDeleteStyle(null)
  }

  const activeStyles = [{ style: "all", count: items.length }, ...styles]
  const filtered = active === "all" ? items : items.filter((item) => item.style === active)
  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)
  const heroItems = items.filter((item) => item.tag.includes("표지")).slice(0, 3)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.92),_rgba(245,230,231,0.95)_42%,_rgba(244,234,228,1)_100%)] text-[#2c2c2c]">
      <nav className="sticky top-0 z-30 border-b border-[#ead9cf]/80 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-[18px] md:flex-row md:items-center md:justify-between md:px-12 lg:px-20">
          <div className="flex items-center gap-4">
            <Link href="/titleroe" className="text-xs font-bold uppercase tracking-[0.2em] text-[#a48777] transition-colors hover:text-[#2c2c2c]">
              ← TitleRoe
            </Link>
            <span className="h-4 w-px bg-[#ead9cf]" />
            <span className="font-skin-serif text-[24px] tracking-[0] text-[#2c2c2c]">Portfolio</span>
          </div>
          <div className="flex items-center gap-3">
            {!checkingAdminSession && isAdminAuthenticated ? (
              <button
                type="button"
                onClick={handleEditButtonClick}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] shadow-[0_10px_20px_rgba(124,98,81,0.08)] transition-colors ${
                  editMode
                    ? "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                    : "border border-[#934b66]/30 bg-white text-[#934b66] hover:bg-[#fbf4f0]"
                }`}
              >
                {editMode ? "Done" : "Edit"}
              </button>
            ) : null}
            <Link href="/characterroe" className="rounded-full border border-[#ead9cf] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8b7355] shadow-[0_10px_20px_rgba(124,98,81,0.08)] transition-colors hover:border-[#c7a98c]">
              CharacterRoe
            </Link>
            <Link href="/titleroe" className="rounded-full bg-[#934b66] px-5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-[0_14px_28px_rgba(147,75,102,0.22)] transition-colors hover:bg-[#7d3f56]">
              의뢰하기
            </Link>
          </div>
        </div>
      </nav>

      {!checkingAdminSession && editMode ? (
        <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-center text-xs font-semibold text-red-600">
          편집 모드 — 카테고리 탭에 마우스를 올리면 이름 수정·삭제 버튼이 나타납니다.
        </div>
      ) : null}

      <section className="relative mx-auto max-w-5xl overflow-hidden px-6 pb-12 pt-0 md:px-12 lg:px-20">
        <div className="absolute -right-12 -top-24 -z-10 h-64 w-64 rounded-full bg-[#e9d4cf]/60 blur-3xl" />
        <div className="flex items-center justify-between gap-8">
          <div className="min-w-0 flex-1">
            <div className="mb-3 mt-[10px] flex items-center gap-4">
              <span className="rounded-full border border-[#ead9cf] bg-[#f7ede7] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#9b7b68]">
                AI Webnovel Cover
              </span>
            </div>
            <h1 className="font-skin-serif text-4xl leading-tight tracking-[0] text-[#2c2c2c] md:text-5xl">
              TITLE ROE
              <br />
              <span className="bg-gradient-to-r from-[#934b66] to-[#c7a98c] bg-clip-text text-transparent">PORTFOLIO</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#6d5c58]">
              웹소설 표지, 캐릭터 프로필, 장면 컷까지
              <br />
              장르와 톤에 맞춰 제작한 AI 비주얼 샘플입니다.
            </p>
            <div className="mt-8 flex flex-wrap gap-6">
              <Stat num={String(styles.length)} label="Styles" />
              <Stat num={String(items.length)} label="Images" />
              <Stat num="AI" label="Generated" />
            </div>
          </div>

          <div className="hidden flex-shrink-0 select-none md:block">
            <div className="relative h-64 w-56">
              {heroItems.map((item, index) => (
                <Image
                  key={item.id}
                  src={item.src}
                  alt={item.alt}
                  width={360}
                  height={480}
                  className={`absolute h-56 w-40 rounded-[24px] border border-white/80 object-cover shadow-[0_22px_50px_rgba(74,51,45,0.18)] ${
                    index === 0 ? "left-10 top-5 z-20 rotate-3" : index === 1 ? "left-0 top-10 z-10 -rotate-6 opacity-90" : "left-20 top-12 z-0 rotate-8 opacity-80"
                  }`}
                />
              ))}
              <div className="absolute bottom-2 left-1/2 h-10 w-32 -translate-x-1/2 rounded-full bg-[#934b66]/20 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      <div className="sticky top-[73px] z-20 border-b border-[#ead9cf]/80 bg-[#fbf4f0]/92 backdrop-blur-xl md:top-[61px]">
        <div className="mx-auto max-w-5xl px-6 md:px-12 lg:px-20">
          <div className="flex flex-wrap items-center gap-1 py-3">
            {activeStyles.map((entry) => {
              const isActive = active === entry.style
              const label = entry.style === "all" ? "ALL" : getStyleLabel(entry.style)
              const count = entry.style === "all" ? items.length : entry.count
              const isRenaming = renamingStyle === entry.style
              const isDeletingStyle = deleting === `style:${entry.style}`

              return (
                <div key={entry.style} className="group/tab relative flex-shrink-0">
                  {isRenaming ? (
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") commitRename()
                        if (event.key === "Escape") setRenamingStyle(null)
                      }}
                      className="w-52 rounded-full border-2 border-[#934b66] bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActive(entry.style)
                        setPage(1)
                      }}
                      className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition-all ${
                        isActive ? "border-[#d9b8a6] bg-[#f4e3df] text-[#8f695d]" : "border-[#ead9cf] bg-white text-[#7b675d] hover:bg-[#fbf4f0] hover:text-[#5d4c47]"
                      }`}
                    >
                      {isDeletingStyle ? (
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#cdb7ae]/50 border-t-[#934b66]" />
                      ) : (
                        <>
                          {label}
                          <span className={`ml-1.5 text-[10px] ${isActive ? "opacity-60" : "opacity-40"}`}>{count}</span>
                        </>
                      )}
                    </button>
                  )}

                  {editMode && entry.style !== "all" && !isRenaming ? (
                    <div className="absolute -right-1 -top-1 hidden gap-0.5 group-hover/tab:flex">
                      <button
                        type="button"
                        onClick={() => startRename(entry.style)}
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-[#934b66] text-[9px] text-white shadow transition-colors hover:bg-[#7d3f56]"
                        title="이름 수정"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteStyle(entry.style)}
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] text-white shadow transition-colors hover:bg-red-600"
                        title="카테고리 전체 삭제"
                      >
                        ✕
                      </button>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <main ref={mainRef} className="mx-auto max-w-5xl px-6 py-10 md:px-12 lg:px-20">
        {loading ? (
          <div className="py-32 text-center text-sm text-[#b7a59e]">불러오는 중...</div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {paged.map((item) => (
              <div key={item.id} className="group relative">
                <button
                  type="button"
                  onClick={() => !editMode && setLightbox(item)}
                  className={`relative block w-full overflow-hidden rounded-[24px] border border-[#ead9cf] bg-white/92 shadow-[0_16px_32px_rgba(124,98,81,0.08)] focus:outline-none ${editMode ? "cursor-default" : "cursor-pointer"}`}
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    width={600}
                    height={800}
                    className={`aspect-[3/4] w-full object-cover transition-transform duration-700 ${editMode ? "opacity-80" : "group-hover:scale-[1.04]"}`}
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                  {!editMode ? (
                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#4a332d]/80 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <span className="mb-1 inline-block w-fit rounded-full bg-[#934b66] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white">{item.tag}</span>
                      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/65">{item.detail}</p>
                      <p className="mt-0.5 text-xs font-semibold leading-tight text-white">{item.styleLabel}</p>
                    </div>
                  ) : null}
                </button>

                {editMode ? (
                  <>
                    <button
                      type="button"
                      onClick={(event) => handleDeleteImage(item, event)}
                      disabled={deleting === item.id}
                      className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg transition-colors hover:bg-red-600 disabled:opacity-50"
                      aria-label={`${item.alt} 삭제`}
                    >
                      {deleting === item.id ? (
                        <span className="block h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      ) : "✕"}
                    </button>
                    <p className="mt-1 truncate px-1 text-[10px] leading-tight text-[#a28e86]">{item.src.split("/").pop()}</p>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 ? <div className="py-32 text-center text-sm text-[#b7a59e]">No items</div> : null}

        {!loading && totalPages > 1 ? (
          <div className="mt-10 flex items-center justify-center gap-1">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => {
                setPage((value) => Math.max(1, value - 1))
                mainRef.current?.scrollIntoView({ behavior: "smooth" })
              }}
              className="rounded-full px-4 py-2 text-xs font-bold text-[#a28e86] transition-colors hover:text-[#5d4c47] disabled:opacity-30"
            >
              ← Prev
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => {
                  setPage(pageNumber)
                  mainRef.current?.scrollIntoView({ behavior: "smooth" })
                }}
                className={`min-w-[36px] rounded-full border px-3 py-2 text-xs font-bold transition-all ${
                  pageNumber === page ? "border-[#d9b8a6] bg-[#f4e3df] text-[#8f695d]" : "border-[#ead9cf] bg-white text-[#7b675d] hover:bg-[#fbf4f0]"
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => {
                setPage((value) => Math.min(totalPages, value + 1))
                mainRef.current?.scrollIntoView({ behavior: "smooth" })
              }}
              className="rounded-full px-4 py-2 text-xs font-bold text-[#a28e86] transition-colors hover:text-[#5d4c47] disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        ) : null}
      </main>

      <section className="border-t border-[#ead9cf]/80 px-6 py-10 md:px-12 lg:px-20">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-[34px] border border-[#ead9cf] bg-white/92 px-10 py-5 shadow-[0_20px_60px_rgba(124,98,81,0.08)] md:px-16 md:py-8">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-lg">
                <h2 className="font-skin-serif text-[24px] leading-tight text-[#2c2c2c] md:text-[30px]">
                  웹소설 표지, <span className="bg-gradient-to-r from-[#934b66] to-[#c7a98c] bg-clip-text text-transparent">장르감 있게 설계합니다.</span>
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-[#6d5c58]">캐릭터 단독 컷부터 커플 구도, 출간용 커버 무드까지</p>
              </div>
              <Link href="/titleroe" className="inline-flex items-center justify-center rounded-full bg-[#934b66] px-8 py-4 text-sm font-bold text-white shadow-xl shadow-[#934b66]/20 transition-all hover:bg-[#7d3f56]">
                의뢰서 작성하기
              </Link>
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
          2026 <a href="mailto:onroeway@gmail.com" className="transition-colors hover:text-[#5d4c47]">ONROE</a>. All rights reserved.
        </p>
      </footer>

      {confirmEditMode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4a332d]/60 p-4 backdrop-blur-sm" onClick={() => setConfirmEditMode(false)}>
          <div className="w-full max-w-sm rounded-[28px] border border-[#ead9cf] bg-white p-8 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#934b66]">관리자 편집 모드</p>
            <p className="mb-2 text-base font-bold text-[#2c2c2c]">포트폴리오 편집을 시작할까요?</p>
            <p className="mb-6 text-sm leading-relaxed text-[#6d5c58]">
              이미지 삭제 버튼과 카테고리 이름 수정·삭제 버튼이 표시됩니다.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmEditMode(false)} className="flex-1 rounded-full border border-[#ead9cf] py-3 text-sm font-bold text-[#6d5c58] transition-colors hover:bg-[#fbf4f0]">
                취소
              </button>
              <button type="button" onClick={confirmEnterEditMode} className="flex-1 rounded-full bg-[#934b66] py-3 text-sm font-bold text-white transition-colors hover:bg-[#7d3f56]">
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {lightbox ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4a332d]/68 p-4 backdrop-blur-sm" onClick={() => setLightbox(null)}>
          <button type="button" className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-[#6d5c58] shadow transition-colors hover:bg-white" onClick={() => setLightbox(null)}>
            ✕
          </button>
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[28px] border border-[#ead9cf] bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <Image src={lightbox.src} alt={lightbox.alt} width={1200} height={1600} className="h-auto max-h-[80vh] w-full object-contain" />
            <div className="flex items-center gap-3 border-t border-[#efe2db] p-5">
              <span className="rounded-full bg-[#934b66] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">{lightbox.tag}</span>
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-[#a28e86]">{lightbox.detail}</span>
              <span className="truncate text-sm font-semibold text-[#5d4c47]">{lightbox.styleLabel}</span>
            </div>
          </div>
        </div>
      ) : null}

      {confirmDeleteStyle ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4a332d]/60 p-4 backdrop-blur-sm" onClick={() => setConfirmDeleteStyle(null)}>
          <div className="w-full max-w-sm rounded-[28px] border border-[#ead9cf] bg-white p-8 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-red-500">카테고리 전체 삭제</p>
            <p className="mb-2 text-base font-bold text-[#2c2c2c]">{getStyleLabel(confirmDeleteStyle)}</p>
            <p className="mb-6 text-sm leading-relaxed text-[#6d5c58]">
              이 카테고리의 이미지 {items.filter((item) => item.style === confirmDeleteStyle).length}장을 모두 삭제합니다. 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setConfirmDeleteStyle(null)} className="flex-1 rounded-full border border-[#ead9cf] py-3 text-sm font-bold text-[#6d5c58] transition-colors hover:bg-[#fbf4f0]">
                취소
              </button>
              <button
                type="button"
                onClick={() => handleDeleteStyle(confirmDeleteStyle)}
                disabled={deleting === `style:${confirmDeleteStyle}`}
                className="flex-1 rounded-full bg-red-500 py-3 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Stat({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-black text-[#2c2c2c]">{num}</span>
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a28e86]">{label}</span>
    </div>
  )
}
