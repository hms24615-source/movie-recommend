# 01. 프로젝트 생성 및 폴더 구조

## 목적
처음부터 실행 가능한 최소 프로젝트를 만들고, 프런트엔드와 서버 기능을 분리한다.

## 권장 폴더 구조
```text
movie-recommendation/
├─ AGENTS.md
├─ PRD.md
├─ package.json
├─ .gitignore
├─ .env.example
├─ index.html
├─ public/
│  └─ assets/
├─ src/
│  ├─ css/
│  │  └─ styles.css
│  └─ js/
│     └─ app.js
├─ api/
│  ├─ recommend.js
│  └─ feedback.js
├─ lib/
│  ├─ openai.js
│  ├─ supabase.js
│  └─ validation.js
├─ docs/
│  ├─ 01-project-setup.md
│  ├─ 02-ui-guidelines.md
│  ├─ 03-frontend-guidelines.md
│  ├─ 04-backend-ai-guidelines.md
│  ├─ 05-supabase-guidelines.md
│  └─ 06-deployment-testing.md
└─ supabase/
   └─ schema.sql
```

## 생성 순서
1. Node.js LTS와 npm 설치 여부를 확인한다.
2. `npm init -y`로 프로젝트를 초기화한다.
3. HTML/CSS/JS 파일과 Vercel 서버 함수 폴더를 생성한다.
4. 서버 의존성으로 OpenAI SDK와 Supabase JS SDK를 설치한다. 버전은 설치 시점의 안정 버전을 사용하고 lock 파일을 커밋한다.
5. 정적 파일과 `/api/*` 경로가 함께 배포되도록 Vercel 기본 구성을 사용한다.
6. `.gitignore`에 `node_modules/`, `.env*`(단, `.env.example` 제외), `.vercel/`을 등록한다.

## 환경 변수
`.env.example`에 이름과 설명만 작성한다.
```dotenv
OPENAI_API_KEY=replace-with-your-server-side-key
OPENAI_MODEL=replace-with-supported-model
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=server-only-secret
```
실제 값은 로컬 `.env.local` 및 Vercel 프로젝트 환경 변수에 등록한다. `SUPABASE_SERVICE_ROLE_KEY`는 브라우저에 절대 전달하지 않는다.

## 구현 제약
- 프런트엔드는 바닐라 JS로 작성한다.
- 서버 함수는 Vercel Node.js 런타임에서 동작하도록 작성한다.
- 로컬 개발은 `vercel dev`를 기준으로 안내한다. 정적 페이지만 확인할 때는 별도 정적 서버를 쓸 수 있지만 `/api` 호출 검증은 `vercel dev`로 한다.
- 별도 빌드 도구·SPA 프레임워크는 추가하지 않는다.

## 완료 및 검증
- [ ] `npm install`이 오류 없이 끝난다.
- [ ] `npm run` 또는 README에 명시한 명령으로 로컬 서버를 실행할 수 있다.
- [ ] 메인 HTML이 표시된다.
- [ ] `/api` 경로가 Vercel 로컬 런타임에서 실행된다.
- [ ] `.env.example`만으로 필요한 환경 변수 이름을 파악할 수 있다.
