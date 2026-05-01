import { NextResponse } from "next/server"
import { RequestStatus, requestStatuses, ServiceType } from "@/lib/novelcraft"
import { deleteAdminRequest, listAdminRequests } from "@/lib/admin-requests"
import { requireAdminSession } from "@/lib/admin-api"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  const unauthorized = await requireAdminSession()
  if (unauthorized) return unauthorized

  try {
    const { searchParams } = new URL(request.url)
    const rawStatus = searchParams.get("status")?.trim()
    const rawServiceType = searchParams.get("service_type")?.trim()
    const rawPage = Number(searchParams.get("page") ?? "1")
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
    const status =
      rawStatus && rawStatus !== "전체" && requestStatuses.includes(rawStatus as RequestStatus)
        ? (rawStatus as RequestStatus)
        : undefined
    const serviceTypes: ServiceType[] = ["onsu", "studio_roe", "character_roe", "character", "title"]
    const serviceType =
      rawServiceType && rawServiceType !== "전체" && serviceTypes.includes(rawServiceType as ServiceType)
        ? (rawServiceType as ServiceType)
        : undefined

    const { requests, totalCount } = await listAdminRequests({
      status,
      serviceType,
      page,
      pageSize: 24,
    })

    return NextResponse.json(
      { requests, totalCount, page, pageSize: 24 },
      { status: 200, headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : "요청 목록을 불러오지 못했습니다."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdminSession()
  if (unauthorized) return unauthorized

  try {
    const { ids } = (await request.json()) as { ids?: string[] }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "삭제할 요청을 선택해 주세요." }, { status: 400 })
    }

    for (const id of ids) {
      await deleteAdminRequest(id)
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "요청 삭제에 실패했습니다."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
