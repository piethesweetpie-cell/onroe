import { NextResponse } from "next/server"
import { deleteAdminPreview } from "@/lib/admin-requests"
import { requireAdminSession } from "@/lib/admin-api"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function DELETE(_: Request, context: { params: Promise<{ imageId: string }> }) {
  const unauthorized = await requireAdminSession()
  if (unauthorized) return unauthorized

  try {
    const { imageId } = await context.params
    await deleteAdminPreview(imageId)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "미리보기 삭제에 실패했습니다."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
