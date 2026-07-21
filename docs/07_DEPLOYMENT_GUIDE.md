# 배포 가이드 (완전 무료)

## 배포 구조
```
사용자  →  Vercel (Next.js)      →  Render (Spring Boot)  →  Supabase (PostgreSQL)
관리자  →  Vercel (React/Vite)  →  Render (Spring Boot)  →  Upstash (Redis)
```

---

## Step 1. GitHub 저장소 만들기

```bash
cd C:\church-community
git init
git add .
git commit -m "initial commit"
```
GitHub에서 새 저장소 생성 후:
```bash
git remote add origin https://github.com/YOUR_ID/church-community.git
git push -u origin master
```

---

## Step 2. Supabase (PostgreSQL) 세팅

1. https://supabase.com 회원가입
2. "New Project" 생성
3. 좌측 메뉴 **Settings → Database** 클릭
4. **Connection string → JDBC** 복사
   ```
   jdbc:postgresql://db.xxxx.supabase.co:5432/postgres
   ```
5. `.env.example` 참고해서 `DATABASE_URL` 구성:
   ```
   jdbc:postgresql://db.xxxx.supabase.co:5432/postgres?user=postgres&password=YOUR_DB_PASSWORD
   ```

---

## Step 3. Upstash (Redis) 세팅

1. https://upstash.com 회원가입
2. "Create Database" → Region: 가장 가까운 지역 선택
3. 생성 후 **Details** 탭에서:
   - `Endpoint` → `REDIS_HOST`
   - `Port` → `REDIS_PORT`
   - `Password` → `REDIS_PASSWORD`

---

## Step 4. Render (Spring Boot 백엔드) 배포

1. https://render.com 회원가입
2. **"New Web Service"** 클릭
3. GitHub 연결 → `church-community` 저장소 선택
4. 설정:
   - **Root Directory**: `backend`
   - **Runtime**: Docker
   - **Instance Type**: Free
5. **Environment Variables** 탭에서 입력:
   | Key | Value |
   |-----|-------|
   | `SPRING_PROFILES_ACTIVE` | `prod` |
   | `DATABASE_URL` | Supabase JDBC URL |
   | `REDIS_HOST` | Upstash Endpoint |
   | `REDIS_PORT` | 6379 |
   | `REDIS_PASSWORD` | Upstash Password |
   | `JWT_SECRET` | 랜덤 문자열 (32자 이상) |
   | `CORS_ALLOWED_ORIGINS` | (일단 비워두고 Vercel 배포 후 입력) |
6. **"Create Web Service"** 클릭
7. 배포 완료 후 URL 복사: `https://church-hub-backend.onrender.com`

---

## Step 5. Vercel (프론트엔드) 배포

### 사용자 사이트 (Next.js)
1. https://vercel.com 회원가입
2. **"New Project"** → GitHub 연결 → `church-community` 선택
3. **Root Directory**: `frontend-user`
4. **Framework**: Next.js (자동 감지)
5. Environment Variables:
   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://church-hub-backend.onrender.com/api/v1` |
6. Deploy

### 관리자 사이트 (React)
1. **"New Project"** → 같은 저장소
2. **Root Directory**: `frontend-admin`
3. **Framework**: Vite
4. Environment Variables:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://church-hub-backend.onrender.com/api/v1` |
5. Deploy

---

## Step 6. CORS 업데이트

Vercel 배포 완료 후 Render 백엔드의 환경변수 업데이트:
```
CORS_ALLOWED_ORIGINS=https://your-user-app.vercel.app,https://your-admin-app.vercel.app
```
→ Render가 자동으로 재배포됨

---

## 무료 티어 제한 사항

| 서비스 | 제한 | 해결책 |
|--------|------|--------|
| Render | 15분 비활성 시 슬립, 첫 요청 30초 콜드스타트 | UptimeRobot으로 14분마다 ping |
| Supabase | 500MB, 비활성 1주 후 일시정지 가능 | 프로젝트 활성 상태 유지 |
| Upstash | 10,000 req/day | 초기엔 충분 |
| Vercel | 100GB bandwidth/month | 거의 무한 |

### Render 슬립 방지 (UptimeRobot 설정)
1. https://uptimerobot.com 무료 가입
2. "Add New Monitor" → HTTP(s)
3. URL: `https://church-hub-backend.onrender.com/actuator/health`
4. Interval: 14분
→ 완전 무료로 슬립 방지

---

## API 문서 (Swagger)
배포 후: `https://church-hub-backend.onrender.com/swagger-ui.html`
