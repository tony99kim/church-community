# 배포 가이드

## 배포 구조

```
사용자/관리자  →  Vercel (Next.js)  →  Fly.io (Spring Boot)  →  Supabase (PostgreSQL)
                                                              →  Upstash (Redis)
```

| 서비스 | 플랫폼 | URL |
|--------|--------|-----|
| 프론트엔드 | Vercel | https://church-community-zeta.vercel.app |
| 백엔드 | Fly.io | https://churchhub-backend.fly.dev |
| DB | Supabase | (PostgreSQL) |
| Redis | Upstash | (토큰 블랙리스트) |

---

## CI/CD (GitHub Actions)

`main` 브랜치의 `backend/**` 경로 변경 시 자동으로 Fly.io에 배포됩니다.

`.github/workflows/deploy-backend.yml` 참고.

수동 배포 트리거: GitHub → Actions → "Deploy Backend to Fly.io" → Run workflow

### 필요한 GitHub Secret
| Secret | 값 |
|--------|-----|
| `FLY_API_TOKEN` | `fly tokens create deploy -x 999999h` 결과값 |

---

## Step 1. Supabase (PostgreSQL) 세팅

1. https://supabase.com 회원가입
2. New Project 생성
3. Settings → Database → Connection string → JDBC 복사
   ```
   jdbc:postgresql://db.xxxx.supabase.co:5432/postgres
   ```
4. `DATABASE_URL` 구성:
   ```
   jdbc:postgresql://db.xxxx.supabase.co:5432/postgres?user=postgres&password=YOUR_PASSWORD
   ```

---

## Step 2. Upstash (Redis) 세팅

1. https://upstash.com 회원가입
2. Create Database → 가까운 Region 선택
3. Details 탭에서:
   - `Endpoint` → `REDIS_HOST`
   - `Port` → `REDIS_PORT`
   - `Password` → `REDIS_PASSWORD`

---

## Step 3. Fly.io (백엔드) 배포

```bash
# flyctl 설치 후
cd backend
fly auth login
fly deploy --remote-only
```

### 환경변수 설정
```bash
fly secrets set \
  SPRING_PROFILES_ACTIVE=prod \
  DATABASE_URL=jdbc:postgresql://... \
  REDIS_HOST=... \
  REDIS_PORT=6379 \
  REDIS_PASSWORD=... \
  JWT_SECRET=... \
  CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
```

---

## Step 4. Vercel (프론트엔드) 배포

1. https://vercel.com → New Project → GitHub 연결 → `church-community` 선택
2. Root Directory: `frontend`
3. Framework: Next.js (자동 감지)
4. Environment Variables:
   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://churchhub-backend.fly.dev/api/v1` |
5. Deploy

> 관리자 사이트는 별도 배포 없이 같은 Next.js 앱의 `/admin` 경로로 제공됩니다.

---

## Step 5. CORS 업데이트

Vercel 배포 후 Fly.io secrets 업데이트:
```bash
fly secrets set CORS_ALLOWED_ORIGINS=https://your-app.vercel.app
```

---

## 무료 티어 제한

| 서비스 | 제한 |
|--------|------|
| Fly.io | 무료 티어: 공유 CPU, 256MB RAM |
| Supabase | 500MB DB, 비활성 1주 후 일시정지 가능 |
| Upstash | 10,000 req/day |
| Vercel | 100GB bandwidth/month |
