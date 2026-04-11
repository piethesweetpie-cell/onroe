import { NextResponse } from "next/server"
import { Resend } from "resend"
import { getAppUrl } from "@/lib/app-url"
import {
  formatAdditionalOption,
  formatKrw,
  getAdditionalOptionPrice,
  getPackagePrice,
} from "@/lib/novelcraft"
import { hashClientPassword } from "@/lib/server-auth"
import { getServerSupabase } from "@/lib/server-supabase"

type RequestPayload = {
  client_email: string
  client_password: string
  service_type?: "onsu" | "studio_roe"
  title: string
  author: string
  genre: string
  style_direction: string
  package: string
  mood_keywords: string
  color_keywords: string
  reference_url: string | null
  deadline: string
  comments: []
  admin_note: string | null
}

const appUrl = getAppUrl()

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as RequestPayload
    const password = payload.client_password?.trim()
    const serviceType = payload.service_type === "studio_roe" ? "studio_roe" : "onsu"
    const mailConfig = getMailConfig(serviceType)

    if (!password) {
      return NextResponse.json({ error: "작업 확인용 비밀번호를 입력해 주세요." }, { status: 400 })
    }

    const { client_password: _clientPassword, ...requestData } = payload

    const supabase = getServerSupabase()
    const { data, error } = await supabase
      .from("requests")
      .insert({
        ...requestData,
        service_type: serviceType,
        client_password_hash: hashClientPassword(password),
      })
      .select("id")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!mailConfig.apiKey) {
      return NextResponse.json(
        {
          warning: "요청은 저장되었지만 메일 환경변수(RESEND_API_KEY)가 없어 알림 메일을 보내지 못했습니다.",
          id: data.id,
        },
        { status: 200 }
      )
    }

    const resend = new Resend(mailConfig.apiKey)

    try {
      await resend.emails.send({
        from: mailConfig.adminFrom,
        to: [mailConfig.adminTo],
        subject: `[${getServiceName(serviceType)}] 새 디자인 의뢰 - ${payload.title}`,
        html: buildOrderEmailHtml(payload, serviceType, mailConfig.adminTo),
        text: buildOrderEmailText(payload, serviceType),
      })
    } catch {
      // 관리자 메일 실패해도 접수는 성공으로 처리
    }

    return NextResponse.json({ id: data.id }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function getMailConfig(serviceType: "onsu" | "studio_roe") {
  if (serviceType === "studio_roe") {
    return {
      apiKey: process.env.RESEND_API_KEY_STUDIO_ROE ?? process.env.RESEND_API_KEY ?? "",
      adminFrom: process.env.ORDER_MAIL_FROM_STUDIO_ROE ?? "STUDIO ROE <onboarding@resend.dev>",
      adminTo: process.env.ORDER_NOTIFICATION_TO_STUDIO_ROE ?? "onroeway@gmail.com",
      clientFrom: process.env.CLIENT_CONFIRMATION_MAIL_FROM_STUDIO_ROE ?? "STUDIO ROE <onboarding@resend.dev>",
      clientUrl: process.env.CLIENT_CONFIRMATION_URL_STUDIO_ROE ?? "https://onroe.vercel.app/client",
    }
  }

  return {
    apiKey: process.env.RESEND_API_KEY_ONSU ?? process.env.RESEND_API_KEY ?? "",
    adminFrom: process.env.ORDER_MAIL_FROM_ONSU ?? process.env.ORDER_MAIL_FROM ?? "ONSU <onboarding@resend.dev>",
    adminTo: process.env.ORDER_NOTIFICATION_TO_ONSU ?? process.env.ORDER_NOTIFICATION_TO ?? "ooonsuuu@gmail.com",
    clientFrom:
      process.env.CLIENT_CONFIRMATION_MAIL_FROM_ONSU ??
      process.env.CLIENT_CONFIRMATION_MAIL_FROM ??
      "ONSU <onboarding@resend.dev>",
    clientUrl: process.env.CLIENT_CONFIRMATION_URL_ONSU ?? "https://ooonsuuu.vercel.app/",
  }
}

function buildOrderEmailText(payload: RequestPayload, serviceType: "onsu" | "studio_roe") {
  const selectedOptions = extractLabeledList(payload.admin_note, "추가 옵션")
  const selectedStyles = extractLabeledList(payload.admin_note, "선호 스타일")
  const originalMemo = extractOriginalMemo(payload.admin_note)
  const totalPrice = calculateTotalPrice(payload.package, selectedOptions)
  const adminUrl = `${appUrl}/admin`

  return [
    `새 ${getServiceName(serviceType)} 디자인 의뢰가 접수되었습니다.`,
    "",
    `작품명: ${payload.title}`,
    `작가명: ${payload.author}`,
    `이메일: ${payload.client_email}`,
    `작업 확인용 비밀번호: 입력됨`,
    `장르: ${payload.genre}`,
    `시안 방향: ${payload.style_direction}`,
    `패키지: ${payload.package}`,
    `분위기 키워드: ${payload.mood_keywords}`,
    `작품 키워드: ${payload.color_keywords}`,
    `희망 완료일: ${payload.deadline}`,
    `서비스: ${getServiceName(serviceType)}`,
    `참고 자료:\n${payload.reference_url || "없음"}`,
    `추가 옵션: ${selectedOptions.join(", ") || "없음"}`,
    `선호 스타일: ${selectedStyles.join(", ") || "없음"}`,
    `총액: ${formatKrw(totalPrice)}`,
    `추가 메모:\n${originalMemo || "없음"}`,
    `Admin 바로가기: ${adminUrl}`,
  ].join("\n")
}

function buildOrderEmailHtml(
  payload: RequestPayload,
  serviceType: "onsu" | "studio_roe",
  adminRecipient: string
) {
  const selectedOptions = extractLabeledList(payload.admin_note, "추가 옵션")
  const selectedStylePaths = extractLabeledList(payload.admin_note, "선호 스타일")
  const referenceItems = extractReferenceItems(payload.reference_url)
  const originalMemo = extractOriginalMemo(payload.admin_note)
  const totalPrice = calculateTotalPrice(payload.package, selectedOptions)
  const adminUrl = `${appUrl}/admin`
  const fields = [
    ["작품명", payload.title],
    ["작가명", payload.author],
    ["이메일", payload.client_email],
    ["작업 확인용 비밀번호", "입력됨"],
    ["장르", payload.genre],
    ["시안 방향", payload.style_direction],
    ["패키지", payload.package],
    ["분위기 키워드", payload.mood_keywords],
    ["작품 키워드", payload.color_keywords],
    ["희망 완료일", payload.deadline],
    ["서비스", getServiceName(serviceType)],
  ]

  return `
    <div style="font-family: Arial, sans-serif; background:#f5f5f5; padding:24px;">
      <div style="max-width:680px; margin:0 auto; background:white; border-radius:16px; padding:24px;">
        <h1 style="margin:0 0 20px; font-size:24px;">새 ${escapeHtml(getServiceName(serviceType))} 디자인 의뢰가 접수되었습니다.</h1>
        <table style="width:100%; border-collapse:collapse;">
          ${fields
            .map(
              ([label, value]) => `
                <tr>
                  <td style="width:160px; padding:10px 0; vertical-align:top; color:#666; font-weight:700;">${escapeHtml(label)}</td>
                  <td style="padding:10px 0; white-space:pre-wrap; color:#111;">${escapeHtml(value)}</td>
                </tr>
              `
            )
            .join("")}
        </table>
        <div style="margin-top:24px;">
          <h2 style="margin:0 0 12px; font-size:16px;">추가 옵션</h2>
          <div>${renderPills(selectedOptions)}</div>
        </div>
        <div style="margin-top:24px;">
          <h2 style="margin:0 0 12px; font-size:16px;">참고 자료</h2>
          ${renderReferenceSection(referenceItems)}
        </div>
        <div style="margin-top:24px;">
          <h2 style="margin:0 0 12px; font-size:16px;">선호 스타일</h2>
          ${renderStyleGrid(selectedStylePaths)}
        </div>
        <div style="margin-top:24px; padding:18px 20px; border-radius:14px; background:#f7fbfb; border:1px solid #d8eeee;">
          <div style="display:flex; justify-content:space-between; gap:16px; align-items:center; flex-wrap:wrap;">
            <div>
              <div style="margin-bottom:4px; color:#666; font-size:12px; font-weight:700; letter-spacing:0.04em;">총 결제 금액</div>
              <div style="font-size:24px; font-weight:800; color:#0f172a;">${escapeHtml(formatKrw(totalPrice))}</div>
            </div>
            <a href="${escapeHtml(adminUrl)}" style="display:inline-block; padding:10px 14px; border-radius:999px; background:#0f172a; color:#fff; font-size:13px; font-weight:700; text-decoration:none;">
              Admin 바로가기
            </a>
          </div>
        </div>
        ${
          originalMemo
            ? `
        <div style="margin-top:24px;">
          <h2 style="margin:0 0 12px; font-size:16px;">추가 메모</h2>
          <div style="padding:16px; border-radius:12px; background:#fafafa; white-space:pre-wrap; color:#333;">
            ${escapeHtml(originalMemo)}
          </div>
        </div>`
            : ""
        }
      </div>
    </div>
  `
}

function buildClientConfirmationEmailText(
  payload: RequestPayload,
  serviceType: "onsu" | "studio_roe",
  clientUrl: string
) {
  const selectedOptions = extractLabeledList(payload.admin_note, "추가 옵션")
  const totalPrice = calculateTotalPrice(payload.package, selectedOptions)

  return [
    `${getServiceName(serviceType)} 의뢰가 정상 접수되었습니다.`,
    "",
    `${payload.author || "고객"}님 안녕하세요.`,
    `${getServiceName(serviceType)} 의뢰가 접수되었습니다. 아래 내용을 확인해 주세요.`,
    "",
    `작품명: ${payload.title}`,
    `장르: ${payload.genre}`,
    `패키지: ${payload.package}`,
    `희망 완료일: ${payload.deadline}`,
    `시안 방향: ${payload.style_direction}`,
    `분위기 키워드: ${payload.mood_keywords}`,
    `작품 키워드: ${payload.color_keywords}`,
    `추가 옵션: ${selectedOptions.join(", ") || "없음"}`,
    `총 결제 금액: ${formatKrw(totalPrice)}`,
    "",
    `작업 진행 상태 확인: ${clientUrl}`,
  ].join("\n")
}

function buildClientConfirmationEmailHtml(
  payload: RequestPayload,
  serviceType: "onsu" | "studio_roe",
  adminRecipient: string,
  clientUrl: string
) {
  const selectedOptions = extractLabeledList(payload.admin_note, "추가 옵션")
  const totalPrice = calculateTotalPrice(payload.package, selectedOptions)
  const keywordTags = [payload.mood_keywords, payload.color_keywords].filter(Boolean)

  return `
    <div style="margin:0; padding:24px; background:#f3f3f1; font-family:Arial, sans-serif; color:#111;">
      <div style="max-width:560px; margin:0 auto;">
        <div style="background:#1a1a1a; padding:32px 36px 28px; border-radius:20px 20px 0 0;">
          <p style="font-size:13px; letter-spacing:0.12em; color:#999; margin:0 0 6px;">${escapeHtml(getServiceName(serviceType))}</p>
          <h1 style="font-size:20px; font-weight:600; color:#fff; margin:0; line-height:1.4;">의뢰가 접수되었습니다</h1>
          <p style="font-size:13px; color:#888; margin:8px 0 0;">접수 확인 후 영업일 기준 1일 이내 연락드립니다</p>
        </div>
        <div style="background:#ffffff; border:1px solid #e6e6e1; border-top:none; padding:32px 36px; border-radius:0 0 20px 20px;">
          <p style="font-size:14px; line-height:1.7; color:#555; margin:0 0 24px;">
            안녕하세요, <span style="color:#111; font-weight:600;">${escapeHtml(payload.author || "고객")}</span>님.<br />
            ${escapeHtml(getServiceName(serviceType))} 의뢰가 정상 접수되었습니다.<br />
            아래 내용을 확인해 주세요.
          </p>

          <p style="font-size:11px; letter-spacing:0.08em; color:#777; text-transform:uppercase; margin:0 0 10px; font-weight:600;">의뢰 정보</p>
          <table role="presentation" style="width:100%; border-collapse:separate; border-spacing:10px;">
            <tr>
              <td style="width:50%; background:#f7f7f4; border-radius:12px; padding:12px 14px; vertical-align:top;">
                <p style="font-size:11px; color:#777; margin:0 0 4px;">작품명</p>
                <p style="font-size:14px; font-weight:600; margin:0; color:#111;">${escapeHtml(payload.title)}</p>
              </td>
              <td style="width:50%; background:#f7f7f4; border-radius:12px; padding:12px 14px; vertical-align:top;">
                <p style="font-size:11px; color:#777; margin:0 0 4px;">장르</p>
                <p style="font-size:14px; font-weight:600; margin:0; color:#111;">${escapeHtml(payload.genre)}</p>
              </td>
            </tr>
            <tr>
              <td style="width:50%; background:#f7f7f4; border-radius:12px; padding:12px 14px; vertical-align:top;">
                <p style="font-size:11px; color:#777; margin:0 0 4px;">패키지</p>
                <p style="font-size:14px; font-weight:600; margin:0; color:#111;">${escapeHtml(payload.package)}</p>
              </td>
              <td style="width:50%; background:#f7f7f4; border-radius:12px; padding:12px 14px; vertical-align:top;">
                <p style="font-size:11px; color:#777; margin:0 0 4px;">희망 완료일</p>
                <p style="font-size:14px; font-weight:600; margin:0; color:#111;">${escapeHtml(formatDeadline(payload.deadline))}</p>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="background:#f7f7f4; border-radius:12px; padding:12px 14px; vertical-align:top;">
                <p style="font-size:11px; color:#777; margin:0 0 4px;">시안 방향</p>
                <p style="font-size:14px; font-weight:600; margin:0; color:#111;">${escapeHtml(payload.style_direction)}</p>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="background:#f7f7f4; border-radius:12px; padding:12px 14px; vertical-align:top;">
                <p style="font-size:11px; color:#777; margin:0 0 8px;">키워드</p>
                <div>${renderTags(keywordTags)}</div>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="background:#f7f7f4; border-radius:12px; padding:12px 14px; vertical-align:top;">
                <p style="font-size:11px; color:#777; margin:0 0 8px;">추가 옵션</p>
                <div>${renderTags(selectedOptions)}</div>
              </td>
            </tr>
          </table>

          <hr style="border:none; border-top:1px solid #e6e6e1; margin:24px 0;" />

          <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
            <p style="font-size:13px; color:#666; margin:0;">총 결제 금액</p>
            <p style="font-size:20px; font-weight:600; margin:0; color:#111;">${escapeHtml(formatKrw(totalPrice))}</p>
          </div>

          <a href="${escapeHtml(clientUrl)}" style="display:block; text-align:center; background:#1a1a1a; color:#fff; text-decoration:none; padding:14px; border-radius:12px; font-size:14px; font-weight:600; margin:24px 0 0;">
            작업 진행 상태 확인하기 →
          </a>

          <p style="font-size:12px; color:#666; line-height:1.6; margin:20px 0 0;">
            작업 현황은 위 링크에서 이메일 주소와 주문 시 설정하신 비밀번호로 확인하실 수 있습니다.<br />
            추가 문의 사항은 이 메일에 회신하시거나 아래 연락처로 연락주세요.
          </p>

          <hr style="border:none; border-top:1px solid #e6e6e1; margin:24px 0;" />
          <div style="font-size:12px; color:#666; text-align:center; line-height:1.7;">
            ${escapeHtml(getServiceName(serviceType))} · ${escapeHtml(adminRecipient)}<br />
            본 메일은 발신 전용입니다. 문의는 위 이메일로 해주세요.
          </div>
        </div>
      </div>
    </div>
  `
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function extractLabeledList(note: string | null, label: string) {
  if (!note) return []

  const line = note
    .split("\n")
    .find((entry) => entry.trim().startsWith(`${label}:`))

  if (!line) return []

  return line
    .split(":")
    .slice(1)
    .join(":")
    .split(",")
    .map((value) => value.trim())
    .map((value) => (label === "추가 옵션" ? formatAdditionalOption(value) : value))
    .filter(Boolean)
}

function extractOriginalMemo(note: string | null) {
  if (!note) return ""

  return note
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("추가 옵션:") && !line.startsWith("선호 스타일:"))
    .join("\n")
}

function calculateTotalPrice(packageValue: string, selectedOptions: string[]) {
  return getPackagePrice(packageValue) + selectedOptions.reduce((sum, option) => sum + getAdditionalOptionPrice(option), 0)
}

function extractReferenceItems(referenceUrl: string | null) {
  if (!referenceUrl) return []

  return referenceUrl
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const value = line.split(":").slice(1).join(":").trim()
      return { label: line.split(":")[0]?.trim() || "참고 자료", value }
    })
}

function renderPills(items: string[]) {
  if (items.length === 0) {
    return `<div style="color:#666;">없음</div>`
  }

  return items
    .map(
      (item) =>
        `<span style="display:inline-block; margin:0 8px 8px 0; padding:8px 12px; border-radius:999px; background:#eef8f8; color:#0d6b70; font-size:13px; font-weight:700;">${escapeHtml(item)}</span>`
    )
    .join("")
}

function renderTags(items: string[]) {
  if (items.length === 0) {
    return `<span style="font-size:14px; color:#666;">없음</span>`
  }

  return items
    .map(
      (item) =>
        `<span style="display:inline-block; background:#ffffff; border:1px solid #ddddda; border-radius:4px; font-size:12px; padding:3px 8px; margin:2px 6px 2px 0; color:#555;">${escapeHtml(item)}</span>`
    )
    .join("")
}

function renderReferenceSection(items: { label: string; value: string }[]) {
  if (items.length === 0) {
    return `<div style="color:#666;">없음</div>`
  }

  return items
    .map(({ label, value }) => {
      const isImage = /\.(png|jpe?g|webp|gif)$/i.test(value)
      return `
        <div style="margin-bottom:16px; padding:16px; border-radius:12px; background:#fafafa;">
          <div style="margin-bottom:8px; color:#666; font-size:13px; font-weight:700;">${escapeHtml(label)}</div>
          <a href="${escapeHtml(value)}" style="color:#0d6b70; word-break:break-all;">${escapeHtml(value)}</a>
          ${isImage ? `<img src="${escapeHtml(value)}" alt="" style="display:block; margin-top:12px; max-width:220px; border-radius:12px; border:1px solid #eee;" />` : ""}
        </div>
      `
    })
    .join("")
}

function renderStyleGrid(stylePaths: string[]) {
  if (stylePaths.length === 0) {
    return `<div style="color:#666;">없음</div>`
  }

  return `
    <table style="width:100%; border-collapse:separate; border-spacing:12px 12px;">
      <tr>
        ${stylePaths
          .map((path) => {
            const normalizedPath = path.startsWith("/") ? path : `/${path}`
            const src = path.startsWith("http") ? path : `${appUrl}${normalizedPath}`
            const name = path.split("/").pop() || path
            return `
              <td style="width:25%; vertical-align:top;">
                <a href="${escapeHtml(src)}" style="text-decoration:none;">
                  <img src="${escapeHtml(src)}" alt="${escapeHtml(name)}" style="display:block; width:100%; max-width:140px; aspect-ratio:2/3; object-fit:cover; border-radius:12px; border:1px solid #eee;" />
                </a>
                <div style="margin-top:8px; font-size:12px; color:#666;">${escapeHtml(name)}</div>
              </td>
            `
          })
          .join("")}
      </tr>
    </table>
  `
}

function getServiceName(serviceType: "onsu" | "studio_roe") {
  return serviceType === "studio_roe" ? "STUDIO ROE" : "ONSU"
}

function formatDeadline(value: string) {
  if (!value) return "-"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}
