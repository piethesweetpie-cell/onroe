import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "STUDIO ROE",
  description: "제품 연출 비주얼 제작 의뢰를 접수하는 STUDIO ROE 전용 프로젝트입니다.",
}

export default function ProductRoeLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
