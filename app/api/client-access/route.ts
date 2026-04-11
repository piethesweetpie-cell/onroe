import { NextResponse } from "next/server"
import { getServerSupabase } from "@/lib/server-supabase"
import { createClientAccessToken, hashClientPassword } from "@/lib/server-auth"

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as {
      email?: string
      password?: string
    }

    if (!email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "이메일과 비밀번호를 입력해 주세요." }, { status: 400 })
    }

    const passwordHash = hashClientPassword(password.trim())
    const supabase = getServerSupabase()
    const { data, error } = await supabase
      .from("requests")
      .select("id")
      .eq("client_email", email.trim())
      .eq("client_password_hash", passwordHash)
      .limit(1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 })
    }

    const token = createClientAccessToken(email.trim(), passwordHash)
    const response = NextResponse.json({ ok: true }, { status: 200 })
    response.cookies.set("client_access", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    })
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
