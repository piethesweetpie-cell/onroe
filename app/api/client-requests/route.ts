import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { clientRequestColumns } from "@/lib/novelcraft"
import { parseClientAccessToken } from "@/lib/server-auth"
import { getServerSupabase } from "@/lib/server-supabase"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")?.trim()
  const id = searchParams.get("id")?.trim()
  const token = (await cookies()).get("client_access")?.value
  const session = parseClientAccessToken(token)

  if (!email || !session || session.email !== email) {
    return NextResponse.json(
      { error: "접근 권한이 없습니다." },
      { status: 401, headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } }
    )
  }

  const supabase = getServerSupabase()

  if (id) {
    const [{ data: requestData, error: requestError }, { data: previewData, error: previewError }] =
      await Promise.all([
        supabase
          .from("requests")
          .select(clientRequestColumns)
          .eq("id", id)
          .eq("client_email", email)
          .eq("client_password_hash", session.passwordHash)
          .maybeSingle(),
        supabase.from("preview_images").select("*").eq("request_id", id).order("uploaded_at", { ascending: false }),
      ])

    if (requestError) {
      return NextResponse.json(
        { error: requestError.message },
        { status: 400, headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } }
      )
    }

    if (previewError) {
      return NextResponse.json(
        { error: previewError.message },
        { status: 400, headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } }
      )
    }

    if (!requestData) {
      return NextResponse.json(
        { error: "요청을 찾을 수 없습니다." },
        { status: 404, headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } }
      )
    }

    return NextResponse.json(
      { request: requestData, previewImages: previewData ?? [] },
      { status: 200, headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } }
    )
  }

  const { data, error } = await supabase
    .from("requests")
    .select(clientRequestColumns)
    .eq("client_email", email)
    .eq("client_password_hash", session.passwordHash)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400, headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } }
    )
  }

  return NextResponse.json(
    { requests: data ?? [] },
    { status: 200, headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" } }
  )
}
