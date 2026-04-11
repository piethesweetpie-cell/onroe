import { NextResponse } from "next/server"
import { appendAdminComment } from "@/lib/admin-requests"
import { requireAdminSession } from "@/lib/admin-api"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminSession()
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const formData = await request.formData()
    const text = String(formData.get("text") ?? "").trim()
    const image = formData.get("image")

    if (!text && !(image instanceof File)) {
      return NextResponse.json({ error: "댓글 내용 또는 이미지를 추가해 주세요." }, { status: 400 })
    }

    const nextRequest = await appendAdminComment(id, text, image instanceof File ? image : null)
    return NextResponse.json({ request: nextRequest }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "댓글 등록에 실패했습니다."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
