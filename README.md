# onroe

STUDIO ROE 전용 독립 Next.js 프로젝트입니다.

포함 범위:
- 루트 `/` 의뢰 페이지
- `/portfolio` 포트폴리오
- `/client` 고객 확인 페이지
- `/admin` 관리자 페이지
- `/api/*` 요청/포트폴리오/관리자 API

## Local

```bash
npm install
npm run dev
```

## Environment Variables

`.env.example`를 기준으로 값을 채우세요.

핵심 변수:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY_STUDIO_ROE`
- `ORDER_MAIL_FROM_STUDIO_ROE`
- `ORDER_NOTIFICATION_TO_STUDIO_ROE`
- `CLIENT_CONFIRMATION_MAIL_FROM_STUDIO_ROE`
- `CLIENT_CONFIRMATION_URL_STUDIO_ROE`
- `ORDER_APP_URL`
- `CLIENT_ACCESS_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_ACCESS_SECRET`

## Deploy

1. GitHub 레포 `piethesweetpie-cell/onroe`를 Vercel에 연결
2. Vercel Environment Variables에 `.env.example` 기준 값 입력
3. 첫 배포 후 `ORDER_APP_URL`, `CLIENT_CONFIRMATION_URL_STUDIO_ROE`를 실제 도메인으로 맞춤

## Notes

- 현재 원본 프로젝트의 `/studio-roe`를 루트 `/`로 옮긴 형태입니다.
- 포트폴리오 이미지는 `public/images/portfolio`를 그대로 포함합니다.
- Supabase 스키마는 `supabase/schema.sql`, `supabase/migrations/`를 참고하세요.