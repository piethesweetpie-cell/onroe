/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://onroe.space",
  generateRobotsTxt: true,
  // 비공개/리다이렉트 경로는 sitemap에서 제외
  exclude: [
    "/admin",
    "/admin/*",
    "/client",
    "/client/*",
    "/portfolio", // next.config.mjs에서 외부 포트폴리오로 영구 리다이렉트됨
    "/portfolio/*",
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/client", "/api"],
      },
    ],
  },
}
