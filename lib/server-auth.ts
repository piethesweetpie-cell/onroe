import crypto from "crypto"

const accessSecret = process.env.CLIENT_ACCESS_SECRET ?? "local-dev-client-access-secret"
const adminAccessSecret =
  process.env.ADMIN_ACCESS_SECRET ??
  process.env.CLIENT_ACCESS_SECRET ??
  "local-dev-admin-access-secret"

const adminUsername = process.env.ADMIN_USERNAME?.trim() ?? ""
const adminPassword = process.env.ADMIN_PASSWORD?.trim() ?? ""

export function hashClientPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex")
}

export function createClientAccessToken(email: string, passwordHash: string) {
  const payload = `${email}:${passwordHash}`
  const signature = crypto.createHmac("sha256", accessSecret).update(payload).digest("hex")
  return Buffer.from(`${payload}:${signature}`).toString("base64url")
}

export function createClientDirectAccessToken(email: string, requestId: string, passwordHash: string) {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 7
  const payload = `${email}:${requestId}:${passwordHash}:${expiresAt}`
  const signature = crypto.createHmac("sha256", accessSecret).update(payload).digest("hex")
  return Buffer.from(`${payload}:${signature}`).toString("base64url")
}

export function parseClientAccessToken(token?: string) {
  if (!token) return null

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8")
    const [email, passwordHash, signature] = decoded.split(":")
    if (!email || !passwordHash || !signature) return null

    const expected = crypto.createHmac("sha256", accessSecret).update(`${email}:${passwordHash}`).digest("hex")
    if (signature !== expected) return null

    return { email, passwordHash }
  } catch {
    return null
  }
}

export function parseClientDirectAccessToken(token?: string) {
  if (!token) return null

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8")
    const [email, requestId, passwordHash, expiresAt, signature] = decoded.split(":")
    if (!email || !requestId || !passwordHash || !expiresAt || !signature) return null

    const payload = `${email}:${requestId}:${passwordHash}:${expiresAt}`
    const expected = crypto.createHmac("sha256", accessSecret).update(payload).digest("hex")
    if (signature !== expected) return null
    if (Number.isNaN(Number(expiresAt)) || Number(expiresAt) < Date.now()) return null

    return { email, requestId, passwordHash }
  } catch {
    return null
  }
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) return false

  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

export function isAdminConfigured() {
  return Boolean(adminUsername && adminPassword)
}

export function verifyAdminCredentials(username: string, password: string) {
  if (!isAdminConfigured()) return false

  return safeEqual(username.trim(), adminUsername) && safeEqual(password.trim(), adminPassword)
}

export function isAdminSessionValid(token?: string) {
  if (!adminAccessSecret) return false
  if (!token) return false
  return safeEqual(token, adminAccessSecret)
}

export function createAdminSessionToken(username: string) {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 12
  const payload = `${username}:${expiresAt}`
  const signature = crypto.createHmac("sha256", adminAccessSecret).update(payload).digest("hex")
  return Buffer.from(`${payload}:${signature}`).toString("base64url")
}

export function parseAdminSessionToken(token?: string) {
  if (!token) return null

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8")
    const [username, expiresAt, signature] = decoded.split(":")

    if (!username || !expiresAt || !signature) return null

    const payload = `${username}:${expiresAt}`
    const expected = crypto.createHmac("sha256", adminAccessSecret).update(payload).digest("hex")

    if (signature !== expected) return null
    if (Number.isNaN(Number(expiresAt)) || Number(expiresAt) < Date.now()) return null
    if (!adminUsername || username !== adminUsername) return null

    return { username }
  } catch {
    return null
  }
}
