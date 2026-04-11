const fallbackAppUrl = "https://onroe.vercel.app"

export function getAppUrl() {
  const explicitUrl = process.env.ORDER_APP_URL?.trim()
  if (explicitUrl) return ensureHttps(explicitUrl)

  const productionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (productionUrl) return ensureHttps(productionUrl)

  const deploymentUrl = process.env.VERCEL_URL?.trim()
  if (deploymentUrl) return ensureHttps(deploymentUrl)

  return fallbackAppUrl
}

function ensureHttps(value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) return value
  return `https://${value}`
}
