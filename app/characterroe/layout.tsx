import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "CharacterRoe - AI 캐릭터 시안 제작",
  description: "웹툰, 게임, 콘텐츠에 필요한 AI 캐릭터 시안과 캐릭터 설정용 비주얼을 빠르게 제작합니다.",
  alternates: {
    canonical: "/characterroe",
  },
  keywords: ["AI 캐릭터 제작", "캐릭터 시안", "웹툰 캐릭터", "게임 캐릭터", "캐릭터 일러스트"],
  openGraph: {
    title: "CharacterRoe - AI 캐릭터 시안 제작",
    description: "웹툰, 게임, 콘텐츠에 필요한 AI 캐릭터 시안과 캐릭터 설정용 비주얼을 빠르게 제작합니다.",
    url: "https://onroe.space/characterroe",
  },
}

export default function CharacterLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
