import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

const portfolioRoot = path.join(process.cwd(), "public", "images", "portfolio")

const brandLabels: Record<string, string> = {
  "29cm": "29CM", amoremall: "AMOREMALL", amuse: "AMUSE", brand: "BRAND",
  dasique: "DASIQUE", fwee: "FWEE", hanssem: "HANSSEM", kolonmall: "KOLONMALL",
  kurly: "KURLY", lamuse: "LAMUSE", m: "M", mamonde: "MAMONDE",
  "muzigae-mansion": "MUZIGAE MANSION", romand: "ROMAND", store: "STORE",
  www: "WWW", onroestudio: "ONROE STUDIO",
}

function getTag(f: string) {
  f = f.toLowerCase()
  if (f.includes("model") || f.includes("cyber-model") || f.includes("inhand")) return "Model"
  if (f.includes("pedestal") || f.includes("floating") || f.includes("hero") || f.includes("cinematic")) return "Hero"
  if (f.includes("packshot") || f.includes("three-quarter") || f.includes("soft-shadow") || f.includes("clean-stand")) return "Packshot"
  if (f.includes("neon") || f.includes("cyber") || f.includes("orbit") || f.includes("glass-tray") || f.includes("acrylic") || f.includes("editorial") || f.includes("graphic") || f.includes("overhead")) return "Editorial"
  if (f.includes("safezone") || f.includes("-ad-") || f.includes("campaign") || f.includes("spotlight") || f.includes("dramatic") || f.includes("premium")) return "Campaign"
  if (f.includes("social") || f.includes("reels") || f.includes("stories") || f.includes("vertical-social") || f.includes("surface-story")) return "Social"
  if (f.includes("hand-") || f.includes("offering") || f.includes("bedside") || f.includes("countertop") || f.includes("ritual") || f.includes("linen") || f.includes("windowlight") || f.includes("bathroom") || f.includes("shelf") || f.includes("home-mood") || f.includes("everyday")) return "Lifestyle"
  if (f.includes("detail") || f.includes("smudge") || f.includes("focus") || f.includes("touch")) return "Detail"
  if (f.includes("flatlay")) return "Commerce"
  return "Commerce"
}

function toAlt(filename: string) {
  return filename
    .replace(/\.(png|jpg|webp)$/i, "")
    .replace(/_v\d+$/, "")
    .replace(/^[a-f0-9]{8}-/, "")
    .replace(/^brand-/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

// GET — read current files from disk
export async function GET() {
  const items: object[] = []
  let brands: string[] = []

  try {
    brands = fs.readdirSync(portfolioRoot).filter((b) =>
      fs.statSync(path.join(portfolioRoot, b)).isDirectory()
    ).sort()
  } catch {
    return NextResponse.json({ items: [], brands: [] })
  }

  const activeBrands: { id: string; label: string }[] = []

  for (const brand of brands) {
    const brandDir = path.join(portfolioRoot, brand)
    let files: string[] = []
    try {
      files = fs.readdirSync(brandDir).filter((f) => /\.(png|jpg|webp)$/i.test(f)).sort()
    } catch { continue }
    if (!files.length) continue

    activeBrands.push({ id: brand, label: brandLabels[brand] ?? brand.toUpperCase() })

    for (const file of files) {
      items.push({
        id: `${brand}-${file.replace(/[^a-z0-9]/gi, "-").toLowerCase().replace(/-+/g, "-")}`,
        brand,
        brandLabel: brandLabels[brand] ?? brand.toUpperCase(),
        src: `/images/portfolio/${brand}/${file}`,
        alt: toAlt(file),
        tag: getTag(file),
      })
    }
  }

  return NextResponse.json({ items, brands: activeBrands })
}

function safeAbsolute(filePath: string): string | null {
  if (!filePath.startsWith("/images/portfolio/")) return null
  const absolute = path.join(process.cwd(), "public", filePath)
  return absolute.startsWith(portfolioRoot) ? absolute : null
}

// DELETE single file: { filePath: "/portfolio/brand/file.png" }
// DELETE brand folder: { brand: "brand-id" }
export async function DELETE(req: NextRequest) {
  const body = await req.json()

  if (body.brand) {
    const brandDir = path.join(portfolioRoot, body.brand)
    if (!brandDir.startsWith(portfolioRoot) || brandDir === portfolioRoot) {
      return NextResponse.json({ error: "Invalid brand" }, { status: 400 })
    }
    try {
      const files = fs.readdirSync(brandDir)
      for (const file of files) fs.unlinkSync(path.join(brandDir, file))
      fs.rmdirSync(brandDir)
      return NextResponse.json({ ok: true, deleted: files.length })
    } catch (err: unknown) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 })
    }
  }

  const absolute = safeAbsolute(body.filePath)
  if (!absolute) return NextResponse.json({ error: "Invalid path" }, { status: 400 })
  try {
    fs.unlinkSync(absolute)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 })
  }
}
