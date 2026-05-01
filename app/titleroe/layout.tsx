import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "TitleRoe — 웹소설 표지 일러스트",
  description: "웹소설 연재·출간용 표지 일러스트와 타이틀 디자인 의뢰",
  openGraph: {
    title: "TitleRoe — 웹소설 표지 일러스트",
    description: "웹소설 연재·출간용 표지 일러스트와 타이틀 디자인 의뢰",
  },
}

export default function TitleRoeLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}