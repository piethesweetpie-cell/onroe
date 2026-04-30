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
  title: "STUDIO ROE",
  description: "제품 연출 비주얼 제작 의뢰를 접수하는 STUDIO ROE 전용 프로젝트입니다.",
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
