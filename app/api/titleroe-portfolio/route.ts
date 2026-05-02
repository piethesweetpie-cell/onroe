import fs from "fs"
import path from "path"
import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/admin-api"

type ManifestRecord = {
  file: string
  style: string
  usage: string
  detail?: string
  id?: string
}

type ManifestSummary = {
  style: string
  count: number
}

type PortfolioManifest = {
  count: number
  summary: ManifestSummary[]
  records: ManifestRecord[]
}

const portfolioRoot = path.join(process.cwd(), "public", "images", "titleroe-portfolio")

const styleFolders: Record<string, string> = {
  "현대 로맨스 웹툰체": "01_현대 로맨스 웹툰체",
  "순정만화체": "02_순정만화체",
  "라노벨 애니체": "03_라노벨 애니체",
  "여성향 게임풍": "05_여성향 게임풍",
  "반실사 로맨스 표지풍": "06_반실사 로맨스 표지풍",
  "프리미엄 반실사 표지풍": "07_프리미엄 반실사 표지풍",
  "클린 반실사 페인티드풍": "08_클린 반실사 페인티드풍",
  "페인티드 로맨스 표지풍": "09_페인티드 로맨스 표지풍",
  "다크 반실사 로맨스 표지풍": "10_다크 반실사 로맨스 표지풍",
  "느와르 스릴러풍": "90_느와르 스릴러풍",
  "로판 웹툰체": "91_로판 웹툰체",
  "미니멀 캐릭터 시트": "92_미니멀 캐릭터 시트",
  "사극/동양 채색화": "93_사극_동양 채색화",
  "시네마틱 드라마 포스터": "94_시네마틱 드라마 포스터",
  "실사풍 화보": "95_실사풍 화보",
  "에디토리얼 화보": "96_에디토리얼 화보",
  "클린 반실사 프로필풍": "97_클린 반실사 프로필풍",
}

function toAssetPath(record: ManifestRecord) {
  const folder = styleFolders[record.style] ?? record.style
  return `/images/titleroe-portfolio/${folder}/${record.file}`
}

function safeAbsolute(filePath: unknown): string | null {
  if (typeof filePath !== "string") return null

  let decoded = filePath
  try {
    decoded = decodeURIComponent(filePath)
  } catch {
    return null
  }

  const normalized = decoded.replace(/\\/g, "/")
  if (!normalized.startsWith("/images/titleroe-portfolio/")) return null

  const absolute = path.resolve(process.cwd(), "public", normalized.slice(1))
  const root = path.resolve(portfolioRoot)
  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) return null

  return absolute
}

function removeFromManifest(fileName: string) {
  const manifestPath = path.join(portfolioRoot, "classification_manifest.json")
  if (!fs.existsSync(manifestPath)) return

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as PortfolioManifest
  const previousRecords = manifest.records
  const nextRecords = previousRecords.filter((record) => record.file !== fileName)

  if (nextRecords.length === previousRecords.length) return

  writeManifest(manifest, nextRecords)
}

function writeManifest(manifest: PortfolioManifest, records: ManifestRecord[]) {
  const manifestPath = path.join(portfolioRoot, "classification_manifest.json")

  const summary = new Map<string, number>()
  for (const record of records) {
    summary.set(record.style, (summary.get(record.style) ?? 0) + 1)
  }

  manifest.records = records
  manifest.count = records.length
  manifest.summary = Array.from(summary.entries()).map(([style, count]) => ({ style, count }))

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8")
}

function safeStyleFolder(style: string) {
  const folder = styleFolders[style] ?? style
  const absolute = path.resolve(portfolioRoot, folder)
  const root = path.resolve(portfolioRoot)

  if (absolute === root || !absolute.startsWith(`${root}${path.sep}`)) return null

  return absolute
}

export async function GET() {
  try {
    const manifestPath = path.join(portfolioRoot, "classification_manifest.json")
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as PortfolioManifest

    const items = manifest.records.map((record, index) => ({
      id: record.id ?? `${record.style}-${record.file}-${index}`,
      style: record.style,
      styleLabel: record.style,
      src: toAssetPath(record),
      alt: `${record.style} ${record.usage} 샘플 ${String(index + 1).padStart(3, "0")}`,
      tag: record.usage || "Sample",
      detail: record.detail ?? "Sample",
    }))

    return NextResponse.json({ items, styles: manifest.summary })
  } catch {
    return NextResponse.json({ items: [], styles: [] })
  }
}

export async function DELETE(request: NextRequest) {
  const unauthorized = await requireAdminSession()
  if (unauthorized) return unauthorized

  try {
    const body = (await request.json()) as { filePath?: string; style?: string }

    if (body.style) {
      const manifestPath = path.join(portfolioRoot, "classification_manifest.json")
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as PortfolioManifest
      const recordsToDelete = manifest.records.filter((record) => record.style === body.style)
      const styleFolder = safeStyleFolder(body.style)

      if (!styleFolder) {
        return NextResponse.json({ error: "Invalid style" }, { status: 400 })
      }

      for (const record of recordsToDelete) {
        const absolute = path.resolve(styleFolder, record.file)
        if (!absolute.startsWith(`${styleFolder}${path.sep}`)) continue
        if (fs.existsSync(absolute)) fs.unlinkSync(absolute)
      }

      try {
        if (fs.existsSync(styleFolder) && fs.readdirSync(styleFolder).length === 0) fs.rmdirSync(styleFolder)
      } catch {
        // The folder can remain when it contains files not tracked by the manifest.
      }

      writeManifest(manifest, manifest.records.filter((record) => record.style !== body.style))

      return NextResponse.json({ ok: true, deleted: recordsToDelete.length })
    }

    const absolute = safeAbsolute(body.filePath)

    if (!absolute) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 })
    }

    if (!fs.existsSync(absolute)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    fs.unlinkSync(absolute)
    removeFromManifest(path.basename(absolute))

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
