# ChurchHub - 지역 청년 교회 커뮤니티 플랫폼

> 지역 청년들을 위한 온라인 커뮤니티 공간

## 문서 목차

| 문서 | 설명 |
|------|------|
| [01_PROJECT_OVERVIEW](docs/01_PROJECT_OVERVIEW.md) | 프로젝트 개요, 기능 목록, 기술 스택 |
| [02_ARCHITECTURE](docs/02_ARCHITECTURE.md) | 시스템 아키텍처, 디렉토리 구조 |
| [03_DATABASE_DESIGN](docs/03_DATABASE_DESIGN.md) | ERD, 테이블 설계, 인덱스 전략 |
| [04_API_SPEC](docs/04_API_SPEC.md) | REST API 명세 |
| [05_SECURITY](docs/05_SECURITY.md) | 보안 설계, JWT 전략, 체크리스트 |
| [06_DEVELOPMENT_GUIDE](docs/06_DEVELOPMENT_GUIDE.md) | 개발 환경 세팅, 브랜치 전략, 개발 우선순위 |

## 빠른 시작

```bash
# 1. 저장소 클론
git clone <repo-url>
cd church-community

# 2. DB 실행 (Docker 필요)
docker-compose up -d mysql redis

# 3. 백엔드 실행
cd backend && ./gradlew bootRun

# 4. 사용자 프론트 실행
cd frontend-user && npm install && npm run dev

# 5. 관리자 프론트 실행
cd frontend-admin && npm install && npm run dev
```

## 접속 주소
- 사용자 사이트: http://localhost:3000
- 관리자 사이트: http://localhost:3001
- API 서버: http://localhost:8080
- API 문서 (Swagger): http://localhost:8080/swagger-ui.html
