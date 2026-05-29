import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "TitleRoe - AI 웹소설 표지 일러스트 제작",
  description: "로맨스판타지, 현대로맨스, BL, 무협 등 장르에 맞는 AI 웹소설 표지와 타이틀 디자인을 제작합니다.",
  alternates: {
    canonical: "/titleroe",
  },
  keywords: ["웹소설 표지", "AI 표지 일러스트", "로맨스판타지 표지", "웹소설 일러스트", "타이틀 디자인"],
  openGraph: {
    title: "TitleRoe - AI 웹소설 표지 일러스트 제작",
    description: "로맨스판타지, 현대로맨스, BL, 무협 등 장르에 맞는 AI 웹소설 표지와 타이틀 디자인을 제작합니다.",
    url: "https://onroe.space/titleroe",
  },
}

export default function TitleRoeLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
