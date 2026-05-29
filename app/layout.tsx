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

export const metadata: Metadata = {
  metadataBase: new URL("https://onroe.space"),
  title: {
    default: "ONROE - AI Studio for Brand & Story",
    template: "%s | ONROE",
  },
  description: "ONROE는 상품 이미지, 캐릭터 시안, 웹소설 표지를 제작하는 AI 비주얼 스튜디오입니다.",
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
    title: "ONROE - AI Studio for Brand & Story",
    description: "ONROE는 상품 이미지, 캐릭터 시안, 웹소설 표지를 제작하는 AI 비주얼 스튜디오입니다.",
    url: "https://onroe.space",
    locale: "ko_KR",
    images: [{ url: "/images/logo.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ONROE - AI Studio for Brand & Story",
    description: "ONROE는 상품 이미지, 캐릭터 시안, 웹소설 표지를 제작하는 AI 비주얼 스튜디오입니다.",
    images: ["/images/logo.png"],
  },
  // 사이트 소유 확인용 verification 코드 자리.
  // 발급받은 코드를 아래 따옴표 안에 넣으세요. (현재는 빈 값이라 태그가 출력되지 않습니다)
  verification: {
    // 구글 서치 콘솔: HTML 태그 방식에서 content 값만 입력
    google: "",
    other: {
      // 네이버 서치 어드바이저: 사이트 소유 확인 > HTML 태그의 content 값만 입력
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
        {children}
      </body>
    </html>
  )
}
