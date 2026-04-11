import { NextResponse, type NextRequest } from "next/server"

const adminSessionValue = process.env.ADMIN_ACCESS_SECRET?.trim() ?? ""

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get("admin_session")?.value
  const isLoginPage = pathname === "/admin/login"
  const isAuthenticated = Boolean(adminSessionValue) && session === adminSessionValue

  if (isLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  if (!isLoginPage && !isAuthenticated) {
    return NextResponse.redirect(new URL("/admin/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
