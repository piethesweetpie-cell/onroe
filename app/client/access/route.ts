import { NextResponse } from "next/server"
import { encodeEmailPath } from "@/lib/novelcraft"
import { createClientAccessToken, parseClientDirectAccessToken } from "@/lib/server-auth"
import { getServerSupabase } from "@/lib/server-supabase"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")?.trim()
  const session = parseClientDirectAccessToken(token)

  if (!session) {
    return NextResponse.redirect(new URL("/client", request.url))
  }

  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from("requests")
    .select("id")
    .eq("id", session.requestId)
    .eq("client_email", session.email)
    .eq("client_password_hash", session.passwordHash)
    .maybeSingle()

  if (error || !data) {
    return NextResponse.redirect(new URL("/client", request.url))
  }

  const accessToken = createClientAccessToken(session.email, session.passwordHash)
  const response = NextResponse.redirect(
    new URL(`/client/${encodeEmailPath(session.email)}/${session.requestId}`, request.url)
  )

  response.cookies.set("client_access", accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  })

  return response
}
