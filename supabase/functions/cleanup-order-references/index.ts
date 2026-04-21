// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const DEFAULT_BUCKET = "order-references"
const DEFAULT_DAYS_OLD = 3
const DEFAULT_PREFIXES = ["studio-roe/product-originals/", "studio-roe/reference-images/"]
const MAX_DELETE_BATCH = 1000
const MAX_QUERY_BATCH = 1000

type CleanupRequest = {
  bucket?: string
  daysOld?: number
  dryRun?: boolean
  prefixes?: string[]
}

type StorageObjectRow = {
  name: string
  created_at: string
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Missing Supabase environment variables" }, 500)
  }

  let payload: CleanupRequest = {}

  try {
    payload = await request.json()
  } catch {
    payload = {}
  }

  const bucket = payload.bucket ?? DEFAULT_BUCKET
  const daysOld = payload.daysOld ?? DEFAULT_DAYS_OLD
  const dryRun = payload.dryRun ?? false
  const prefixes = payload.prefixes?.length ? payload.prefixes : DEFAULT_PREFIXES

  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
  const cutoffIso = cutoffDate.toISOString()
  const publicBaseUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/`
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const [expiredRequestRows, activeRequestRows, oldObjects] = await Promise.all([
      fetchRequestReferenceNotes(supabase, cutoffIso, true),
      fetchRequestReferenceNotes(supabase, cutoffIso, false),
      fetchOldBucketObjects(supabase, bucket, cutoffIso),
    ])

    const expiredRequestPaths = extractBucketPaths(expiredRequestRows, publicBaseUrl, prefixes)
    const activeRequestPaths = extractBucketPaths(activeRequestRows, publicBaseUrl, prefixes)
    const candidatePaths = oldObjects
      .map((row) => row.name)
      .filter((name) => prefixes.some((prefix) => name.startsWith(prefix)))

    const deleteSet = new Set<string>([...expiredRequestPaths])
    for (const path of candidatePaths) {
      if (!activeRequestPaths.has(path)) {
        deleteSet.add(path)
      }
    }

    const deletePaths = Array.from(deleteSet)
    if (!dryRun && deletePaths.length > 0) {
      for (let index = 0; index < deletePaths.length; index += MAX_DELETE_BATCH) {
        const chunk = deletePaths.slice(index, index + MAX_DELETE_BATCH)
        const { error } = await supabase.storage.from(bucket).remove(chunk)
        if (error) throw error
      }
    }

    const orphanedPaths = deletePaths.filter((path) => !expiredRequestPaths.has(path))

    return jsonResponse({
      bucket,
      daysOld,
      dryRun,
      cutoffIso,
      prefixes,
      expiredRequestReferenceCount: expiredRequestPaths.size,
      activeProtectedReferenceCount: activeRequestPaths.size,
      orphanedObjectCount: orphanedPaths.length,
      deletedObjectCount: deletePaths.length,
      deletedPathsPreview: deletePaths.slice(0, 20),
    })
  } catch (error) {
    console.error("cleanup-order-references failed", error)
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown cleanup error" },
      500,
    )
  }
})

async function fetchRequestReferenceNotes(
  supabase: ReturnType<typeof createClient>,
  cutoffIso: string,
  expired: boolean,
) {
  const query = supabase
    .from("requests")
    .select("reference_url")
    .eq("service_type", "studio_roe")
    .not("reference_url", "is", null)
  const { data, error } = expired
    ? await query.lt("created_at", cutoffIso)
    : await query.gte("created_at", cutoffIso)

  if (error) throw error

  return (data ?? [])
    .map((row) => row.reference_url)
    .filter((value): value is string => typeof value === "string" && value.length > 0)
}

async function fetchOldBucketObjects(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  cutoffIso: string,
) {
  const rows: StorageObjectRow[] = []

  for (let offset = 0; ; offset += MAX_QUERY_BATCH) {
    const { data, error } = await supabase
      .schema("storage")
      .from("objects")
      .select("name, created_at")
      .eq("bucket_id", bucket)
      .lt("created_at", cutoffIso)
      .order("created_at", { ascending: true })
      .range(offset, offset + MAX_QUERY_BATCH - 1)

    if (error) throw error
    if (!data || data.length === 0) break

    rows.push(...(data as StorageObjectRow[]))
    if (data.length < MAX_QUERY_BATCH) break
  }

  return rows
}

function extractBucketPaths(referenceNotes: string[], publicBaseUrl: string, prefixes: string[]) {
  const paths = new Set<string>()

  for (const note of referenceNotes) {
    const matches = note.match(/https?:\/\/[^\s]+/g) ?? []
    for (const match of matches) {
      const withoutQuery = match.split("?")[0]
      if (!withoutQuery.startsWith(publicBaseUrl)) continue

      const objectPath = decodeURIComponent(withoutQuery.slice(publicBaseUrl.length))
      if (!prefixes.some((prefix) => objectPath.startsWith(prefix))) continue
      paths.add(objectPath)
    }
  }

  return paths
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}
