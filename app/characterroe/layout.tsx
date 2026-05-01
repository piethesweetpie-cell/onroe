import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "CharacterRoe — 웹툰·게임 캐릭터 시안",
  description: "웹툰·게임 캐릭터 시안을 빠르고 저렴하게",
  openGraph: {
    title: "CharacterRoe — 웹툰·게임 캐릭터 시안",
    description: "웹툰·게임 캐릭터 시안을 빠르고 저렴하게",
  },
}

export default function CharacterLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
