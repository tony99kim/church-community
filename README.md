# ChurchHub - 지역 청년 교회 커뮤니티 플랫폼

> 지역 청년들을 위한 온라인 커뮤니티 공간

## 라이브 URL

| 서비스 | URL |
|--------|-----|
| 사용자 사이트 | https://church-community-zeta.vercel.app |
| 백엔드 API | https://churchhub-backend.fly.dev/api/v1 |

## 문서 목차

| 문서 | 설명 |
|------|------|
| [01_PROJECT_OVERVIEW](docs/01_PROJECT_OVERVIEW.md) | 프로젝트 개요, 기능 목록, 기술 스택 |
| [02_ARCHITECTURE](docs/02_ARCHITECTURE.md) | 시스템 아키텍처, 디렉토리 구조 |
| [03_DATABASE_DESIGN](docs/03_DATABASE_DESIGN.md) | ERD, 테이블 설계, 인덱스 전략 |
| [04_API_SPEC](docs/04_API_SPEC.md) | REST API 명세 |
| [05_SECURITY](docs/05_SECURITY.md) | 보안 설계, JWT 전략, 체크리스트 |
| [06_DEVELOPMENT_GUIDE](docs/06_DEVELOPMENT_GUIDE.md) | 개발 환경 세팅, 브랜치 전략, 개발 우선순위 |
| [07_DEPLOYMENT_GUIDE](docs/07_DEPLOYMENT_GUIDE.md) | 배포 가이드 (Fly.io / Vercel) |

## 빠른 시작

```bash
# 1. 저장소 클론
git clone https://github.com/tony99kim/church-community.git
cd church-community

# 2. 백엔드 실행 (환경변수 필요 - .env.example 참고)
cd backend
./gradlew bootRun

# 3. 프론트엔드 실행
cd frontend
npm install
npm run dev
# http://localhost:3000
```

> **로컬 DB 불필요**: DB는 Supabase, Redis는 Upstash 클라우드를 그대로 사용합니다.  
> `backend/.env.example`을 참고해 환경변수를 설정해주세요.

## 접속 주소 (로컬)
- 사용자 사이트: http://localhost:3000
- 관리자 사이트: http://localhost:3000/admin
- API 서버: http://localhost:8080
