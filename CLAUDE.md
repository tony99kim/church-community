# ChurchHub — Claude 작업 지침

## 메모리 관리 규칙

**모든 작업 완료 시 반드시:**
1. `C:\Users\taeyeop\.claude\projects\C--Users-taeyeop\memory\project_church_community.md` 업데이트
   - 완료된 작업, 커밋 해시, 다음 작업 방향 기록
2. SDD 진행 중이라면 `.superpowers/sdd/progress.md` 레저도 업데이트

**세션 시작 시:**
- 메모리 파일 먼저 읽어서 현재 상태 파악
- `git log --oneline -10` 으로 실제 커밋 확인 후 메모리와 대조

## 프로젝트 기본 정보

- **경로**: `C:\church-community`
- **백엔드 빌드**: `JAVA_HOME="/c/Users/taeyeop/.jdks/graalvm-jdk-21.0.7" ./gradlew compileJava` (backend 디렉토리)
- **백엔드 배포**: `fly deploy --app churchhub-backend` (backend 디렉토리)
- **프론트 배포**: `npx vercel --prod` (루트 디렉토리)
- **Flyway 다음 버전**: 현재 V5까지 존재 → 다음은 V6

## 코딩 규칙

- API prefix: `/api/v1/`
- 응답 wrapper: `ApiResponse<T>`
- 관리자 패턴: 서비스 메서드가 `Long callerId` 받아 `@Transactional` 내에서 User 로드
- 디자인 토큰: `#003478` (파랑), `#EDEFF1` (보더), `#f4f6f8` (배경)
- 서브에이전트 개발: `.superpowers/sdd/` 폴더 활용
