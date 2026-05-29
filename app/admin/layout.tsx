import type { Metadata } from "next"

// 관리자 영역은 검색엔진에 노출되지 않도록 차단합니다.
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
}

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
