import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "TitleRoe 포트폴리오 - AI 웹소설 표지 사례",
  description: "로맨스판타지, 현대로맨스, BL, 무협 등 장르별 웹소설 표지 일러스트와 타이틀 디자인 작업 사례를 모았습니다.",
  alternates: {
    canonical: "/titleroe/portfolio",
  },
  keywords: ["AI 광고사진 사례", "웹소설 표지 사례", "제품사진 레퍼런스", "AI 표지 포트폴리오"],
  openGraph: {
    title: "TitleRoe 포트폴리오 - AI 웹소설 표지 사례",
    description: "로맨스판타지, 현대로맨스, BL, 무협 등 장르별 웹소설 표지 일러스트와 타이틀 디자인 작업 사례를 모았습니다.",
    url: "https://onroe.space/titleroe/portfolio",
  },
}

export default function TitleRoePortfolioLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
