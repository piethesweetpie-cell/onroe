import path from "node:path"
import { fileURLToPath } from "node:url"

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: projectRoot,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/portfolio",
        destination: "https://productroe-portfolio.piethesweetpie.workers.dev",
        permanent: true,
      },
      {
        source: "/portfolio/:path*",
        destination: "https://productroe-portfolio.piethesweetpie.workers.dev/:path*",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
