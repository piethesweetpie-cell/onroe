import type { Metadata } from "next"
import { Inter, Noto_Sans_KR, Playfair_Display, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
})

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-noto-sans-kr",
  weight: ["300", "400", "500", "700", "900"],
})

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800"],
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
})

const siteDescription =
  "ONROE는 AI 제품사진, 상세페이지 이미지, 캐릭터 시안, 웹소설 표지를 제작하는 AI 비주얼 스튜디오입니다."

const structuredData = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "ONROE",
  url: "https://onroe.space",
  logo: "https://onroe.space/images/logo.png",
  description: siteDescription,
  email: "onroeway@gmail.com",
  areaServed: "KR",
  serviceType: [
    "AI 제품사진 제작",
    "상세페이지 이미지 제작",
    "AI 캐릭터 시안 제작",
    "웹소설 표지 일러스트 제작",
  ],
  sameAs: ["https://onroe.space"],
}

export const metadata: Metadata = {
  metadataBase: new URL("https://onroe.space"),
  title: {
    default: "ONROE - AI 제품사진·캐릭터·웹소설 표지 전문 스튜디오",
    template: "%s | ONROE",
  },
  description: siteDescription,
  keywords: [
    "AI 제품사진",
    "AI 상품 이미지",
    "상세페이지 이미지",
    "AI 캐릭터 제작",
    "웹소설 표지",
    "AI 비주얼 스튜디오",
    "ONROE",
  ],
  applicationName: "ONROE",
  creator: "ONROE",
  publisher: "ONROE",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "ONROE",
    title: "ONROE - AI 제품사진·캐릭터·웹소설 표지 전문 스튜디오",
    description: siteDescription,
    url: "https://onroe.space",
    locale: "ko_KR",
    images: [{ url: "/images/logo.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ONROE - AI 제품사진·캐릭터·웹소설 표지 전문 스튜디오",
    description: siteDescription,
    images: ["/images/logo.png"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
    other: {
      "naver-site-verification": "d09ad68ee22005e31f6e42a9b7c966cb76df31e0",
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body
        className={`${plusJakartaSans.variable} ${notoSansKR.variable} ${playfairDisplay.variable} ${inter.variable} bg-background font-body text-on-surface antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  )
}
