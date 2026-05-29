import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "ProductRoe — 제품 비주얼·상세페이지 이미지 제작",
  description: "촬영 없이 제품 사진을 상세페이지 컷, 브랜드 무드 화보, AI 모델 비주얼로 제작하는 AI 상품 이미지 서비스입니다.",
  openGraph: {
    title: "ProductRoe — 제품 비주얼·상세페이지 이미지 제작",
    description: "촬영 없이 제품 사진을 상세페이지 컷, 브랜드 무드 화보, AI 모델 비주얼로 제작하는 AI 상품 이미지 서비스입니다.",
  },
}

export default function ProductRoeLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
