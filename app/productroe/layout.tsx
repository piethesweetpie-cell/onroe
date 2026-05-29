import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "ProductRoe - AI 제품사진·상세페이지 이미지 제작",
  description: "제품 사진 한 장으로 상세페이지 컷, 브랜드 화보, AI 모델 비주얼을 제작하는 AI 상품 이미지 서비스입니다.",
  alternates: {
    canonical: "/productroe",
  },
  keywords: ["AI 제품사진", "AI 상품 이미지", "상세페이지 이미지", "제품 촬영 대체", "AI 모델 화보"],
  openGraph: {
    title: "ProductRoe - AI 제품사진·상세페이지 이미지 제작",
    description: "제품 사진 한 장으로 상세페이지 컷, 브랜드 화보, AI 모델 비주얼을 제작하는 AI 상품 이미지 서비스입니다.",
    url: "https://onroe.space/productroe",
  },
}

export default function ProductRoeLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
