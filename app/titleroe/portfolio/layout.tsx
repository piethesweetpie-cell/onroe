import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "TitleRoe 포트폴리오 — 웹소설 표지 일러스트 사례",
  description: "로맨스판타지, 현대로맨스, BL, 무협 등 장르별 웹소설 표지 일러스트와 타이틀 디자인 작업 사례를 모았습니다.",
  openGraph: {
    title: "TitleRoe 포트폴리오 — 웹소설 표지 일러스트 사례",
    description: "로맨스판타지, 현대로맨스, BL, 무협 등 장르별 웹소설 표지 일러스트와 타이틀 디자인 작업 사례를 모았습니다.",
  },
}

export default function TitleRoePortfolioLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
