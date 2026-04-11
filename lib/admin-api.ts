import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { isAdminSessionValid } from "@/lib/server-auth"

export async function requireAdminSession() {
  const session = (await cookies()).get("admin_session")?.value

  if (!isAdminSessionValid(session)) {
    return NextResponse.json({ error: "관리자 권한이 없습니다." }, { status: 401 })
  }

  return null
}
