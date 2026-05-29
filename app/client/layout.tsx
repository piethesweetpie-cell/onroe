import type { Metadata } from "next"

// 클라이언트 전용 영역은 검색엔진에 노출되지 않도록 차단합니다.
export const metadata: Metadata = {
  title: "Client",
  robots: { index: false, follow: false },
}

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
