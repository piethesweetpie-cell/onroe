import { NextResponse } from "next/server"
import { uploadAdminPreview } from "@/lib/admin-requests"
import { requireAdminSession } from "@/lib/admin-api"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminSession()
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "업로드할 파일이 없습니다." }, { status: 400 })
    }

    const previewImage = await uploadAdminPreview(id, file)
    return NextResponse.json({ previewImage }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "미리보기 업로드에 실패했습니다."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
