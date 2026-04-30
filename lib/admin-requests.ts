import crypto from "crypto"
import { getAppUrl } from "@/lib/app-url"
import { extractStoragePath, PreviewImageRow, RequestComment, RequestRow, ServiceType } from "@/lib/novelcraft"
import { createClientDirectAccessToken } from "@/lib/server-auth"
import { getServerSupabase } from "@/lib/server-supabase"

const adminListColumns = [
  "id",
  "created_at",
  "service_type",
  "title",
  "author",
  "genre",
  "package",
  "deadline",
  "status",
  "comments",
].join(", ")

export async function listAdminRequests({
  status,
  serviceType,
  page,
  pageSize,
}: {
  status?: RequestRow["status"]
  serviceType?: ServiceType
  page: number
  pageSize: number
}) {
  const supabase = getServerSupabase()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("requests")
    .select(adminListColumns, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (status) {
    query = query.eq("status", status)
  }

  if (serviceType) {
    query = query.eq("service_type", serviceType)
  }

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  return {
    requests: (data ?? []) as unknown as RequestRow[],
    totalCount: count ?? 0,
  }
}

export async function getAdminRequestDetail(id: string) {
  const supabase = getServerSupabase()
  const [{ data: requestData, error: requestError }, { data: previewData, error: previewError }] = await Promise.all([
    supabase.from("requests").select("*").eq("id", id).maybeSingle(),
    supabase.from("preview_images").select("*").eq("request_id", id).order("uploaded_at", { ascending: false }),
  ])

  if (requestError) throw new Error(requestError.message)
  if (previewError) throw new Error(previewError.message)

  return {
    request: (requestData ?? null) as RequestRow | null,
    previewImages: (previewData ?? []) as PreviewImageRow[],
  }
}

export async function getAdminClientShareLink(id: string) {
  const supabase = getServerSupabase()
  const { data, error } = await supabase
    .from("requests")
    .select("id, client_email, client_password_hash")
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  if (!data.client_email || !data.client_password_hash) return null

  const token = createClientDirectAccessToken(data.client_email, data.id, data.client_password_hash)
  return `${getAppUrl()}/client/access?token=${encodeURIComponent(token)}`
}

export async function updateAdminRequest(
  id: string,
  patch: Partial<Pick<RequestRow, "status" | "admin_note" | "comments">>
) {
  const supabase = getServerSupabase()
  const { data, error } = await supabase.from("requests").update(patch).eq("id", id).select("*").single()

  if (error) throw new Error(error.message)
  return data as RequestRow
}

export async function deleteAdminRequest(id: string) {
  const supabase = getServerSupabase()
  const { request, previewImages } = await getAdminRequestDetail(id)
  if (!request) throw new Error("삭제할 요청을 찾을 수 없습니다.")

  const previewPaths = previewImages
    .map((preview) => extractStoragePath(preview.url, "previews"))
    .filter((path): path is string => Boolean(path))

  if (previewPaths.length > 0) {
    const { error: storageError } = await supabase.storage.from("previews").remove(previewPaths)
    if (storageError) throw new Error(storageError.message)
  }

  const commentImagePaths = collectCommentImagePaths(request.comments)
  if (commentImagePaths.length > 0) {
    const { error: commentStorageError } = await supabase.storage.from("previews").remove(commentImagePaths)
    if (commentStorageError) throw new Error(commentStorageError.message)
  }

  const { error: deleteError } = await supabase.from("requests").delete().eq("id", id)
  if (deleteError) throw new Error(deleteError.message)
}

export async function uploadAdminPreview(requestId: string, file: File) {
  const supabase = getServerSupabase()
  const fileName = `${requestId}/${Date.now()}-${sanitizeFileName(file.name)}`
  const arrayBuffer = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from("previews")
    .upload(fileName, arrayBuffer, { contentType: file.type || "application/octet-stream" })

  if (uploadError) throw new Error(uploadError.message)

  const { data: urlData } = supabase.storage.from("previews").getPublicUrl(fileName)
  const { data, error } = await supabase
    .from("preview_images")
    .insert({ request_id: requestId, url: urlData.publicUrl })
    .select("*")
    .single()

  if (error) throw new Error(error.message)
  return data as PreviewImageRow
}

export async function deleteAdminPreview(imageId: string) {
  const supabase = getServerSupabase()
  const { data, error } = await supabase.from("preview_images").select("*").eq("id", imageId).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error("삭제할 이미지를 찾을 수 없습니다.")

  const preview = data as PreviewImageRow
  const storagePath = extractStoragePath(preview.url, "previews")

  if (storagePath) {
    const { error: storageError } = await supabase.storage.from("previews").remove([storagePath])
    if (storageError) throw new Error(storageError.message)
  }

  const { error: deleteError } = await supabase.from("preview_images").delete().eq("id", imageId)
  if (deleteError) throw new Error(deleteError.message)
}

export async function appendAdminComment(requestId: string, text: string, imageFile?: File | null) {
  const supabase = getServerSupabase()
  const { data: requestData, error: requestError } = await supabase
    .from("requests")
    .select("comments")
    .eq("id", requestId)
    .single()

  if (requestError) throw new Error(requestError.message)

  let imageUrl: string | undefined

  if (imageFile) {
    const fileName = `${requestId}/comments/${Date.now()}-${sanitizeFileName(imageFile.name)}`
    const arrayBuffer = await imageFile.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from("previews")
      .upload(fileName, arrayBuffer, { contentType: imageFile.type || "application/octet-stream" })

    if (uploadError) throw new Error(uploadError.message)

    const { data: urlData } = supabase.storage.from("previews").getPublicUrl(fileName)
    imageUrl = urlData.publicUrl
  }

  const currentComments = Array.isArray(requestData.comments) ? (requestData.comments as RequestComment[]) : []
  const nextComments: RequestComment[] = [
    ...currentComments,
    {
      id: crypto.randomUUID(),
      author: "admin" as const,
      text,
      created_at: new Date().toISOString(),
      ...(imageUrl ? { image_url: imageUrl } : {}),
    },
  ]

  return updateAdminRequest(requestId, { comments: nextComments })
}

export async function replaceAdminComments(requestId: string, comments: RequestComment[]) {
  return updateAdminRequest(requestId, { comments })
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/\s+/g, "-")
}

function collectCommentImagePaths(comments: RequestComment[] | null | undefined) {
  if (!Array.isArray(comments)) return []

  return comments
    .map((comment) => extractStoragePath(comment.image_url ?? "", "previews"))
    .filter((path): path is string => Boolean(path))
}
