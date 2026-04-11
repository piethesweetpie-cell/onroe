import { NextResponse } from "next/server"
import {
  deleteAdminRequest,
  getAdminClientShareLink,
  getAdminRequestDetail,
  updateAdminRequest,
} from "@/lib/admin-requests"
import { RequestComment, RequestStatus, requestStatuses } from "@/lib/novelcraft"
import { requireAdminSession } from "@/lib/admin-api"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminSession()
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const [{ request, previewImages }, shareLink] = await Promise.all([
      getAdminRequestDetail(id),
      getAdminClientShareLink(id),
    ])

    if (!request) {
      return NextResponse.json({ error: "요청을 찾을 수 없습니다." }, { status: 404 })
    }

    return NextResponse.json(
      { request, previewImages, shareLink },
      { status: 200, headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "요청 상세를 불러오지 못했습니다."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminSession()
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    const body = (await request.json()) as {
      status?: RequestStatus
      admin_note?: string
      comments?: RequestComment[]
    }

    const patch: {
      status?: RequestStatus
      admin_note?: string
      comments?: RequestComment[]
    } = {}

    if (typeof body.admin_note === "string") {
      patch.admin_note = body.admin_note
    }

    if (body.status) {
      if (!requestStatuses.includes(body.status)) {
        return NextResponse.json({ error: "유효하지 않은 상태값입니다." }, { status: 400 })
      }
      patch.status = body.status
    }

    if (body.comments) {
      patch.comments = Array.isArray(body.comments) ? body.comments : []
    }

    const nextRequest = await updateAdminRequest(id, patch)
    return NextResponse.json({ request: nextRequest }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "요청 수정에 실패했습니다."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdminSession()
  if (unauthorized) return unauthorized

  try {
    const { id } = await context.params
    await deleteAdminRequest(id)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "요청 삭제에 실패했습니다."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
