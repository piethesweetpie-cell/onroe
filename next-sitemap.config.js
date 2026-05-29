/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || "https://onroe.space",
  generateRobotsTxt: true,
  sitemapSize: 7000,
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
  transform: async (config, path) => {
    const priorityMap = {
      "/": 1.0,
      "/productroe": 0.9,
      "/characterroe": 0.8,
      "/titleroe": 0.8,
      "/titleroe/portfolio": 0.7,
    }

    return {
      loc: path,
      changefreq: path === "/" ? "weekly" : "monthly",
      priority: priorityMap[path] ?? 0.5,
      lastmod: new Date().toISOString(),
      alternateRefs: config.alternateRefs ?? [],
    }
  },
}
