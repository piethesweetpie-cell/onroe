import { NextResponse } from "next/server"
import { isAdminConfigured, verifyAdminCredentials } from "@/lib/server-auth"

const adminSessionValue = process.env.ADMIN_ACCESS_SECRET?.trim() ?? ""

export async function GET(request: Request) {
  const session = request.headers.get("cookie")?.match(/(?:^|;\s*)admin_session=([^;]+)/)?.[1]
  const isAuthenticated = Boolean(adminSessionValue) && session === adminSessionValue

  return NextResponse.json(
    {
      ok: true,
      authenticated: isAuthenticated,
      configured: isAdminConfigured() && Boolean(adminSessionValue),
    },
    { status: 200 }
  )
}

export async function POST(request: Request) {
  try {
    const { username, password } = (await request.json()) as {
      username?: string
      password?: string
    }

    if (!isAdminConfigured() || !adminSessionValue) {
      return NextResponse.json(
        {
          error:
            "관리자 계정이 설정되지 않았습니다. ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_ACCESS_SECRET를 확인해 주세요.",
        },
        { status: 500 }
      )
    }

    if (!username?.trim() || !password?.trim()) {
      return NextResponse.json({ error: "아이디와 비밀번호를 입력해 주세요." }, { status: 400 })
    }

    if (!verifyAdminCredentials(username, password)) {
      return NextResponse.json({ error: "관리자 아이디 또는 비밀번호가 올바르지 않습니다." }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true }, { status: 200 })
    response.cookies.set("admin_session", adminSessionValue, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    })
    return response
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true }, { status: 200 })
  response.cookies.set("admin_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
  return response
}
