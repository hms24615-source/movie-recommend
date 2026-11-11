# 05. Supabase 데이터베이스 구현 지침

## 목적
로그인 없이 작성되는 피드백을 Supabase Postgres에 영구 저장하고, 방문자 모두에게 최신순으로 공개한다.

## 테이블
테이블명: `public.feedback`

| 컬럼 | 타입 | 제약 |
|---|---|---|
| id | uuid | 기본값 `gen_random_uuid()`, PK |
| name | text | nullable, 최대 30자 |
| message | text | NOT NULL, 1~500자(공백 제외) |
| created_at | timestamptz | NOT NULL, 기본값 `now()` |

## SQL 초안
```sql
create extension if not exists pgcrypto;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  name text null check (name is null or char_length(name) <= 30),
  message text not null check (
    char_length(message) between 1 and 500
    and length(trim(message)) > 0
  ),
  created_at timestamptz not null default now()
);

create index if not exists feedback_created_at_desc_idx
  on public.feedback (created_at desc);

alter table public.feedback enable row level security;
```

## 접근 방식 및 권한
권장 방식은 브라우저가 Supabase에 직접 접근하지 않고 Vercel 서버 API를 통해서만 접근하는 것이다.
- 서버는 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`를 사용한다.
- Service Role Key는 서버 환경 변수에만 둔다. 절대로 프런트엔드에 전달하지 않는다.
- 서버 API는 조회 시 필요한 컬럼만 선택하고 최대 50개로 제한한다.
- 저장 시 서버에서 입력을 다시 검증한다.
- RLS를 활성화한다. Service Role은 RLS를 우회하므로 API 자체의 검증·요청 제한이 중요하다.
- 브라우저용 anon key를 노출하는 구조로 바꾸려면 별도 검토 후 SELECT/INSERT 정책을 최소 권한으로 작성한다. 현재 구현에서 임의로 바꾸지 않는다.

## 공개 피드 주의
피드백은 로그인 없이 누구나 작성하고 모든 방문자에게 공개된다. 작성 폼 근처에 공개 사실을 안내한다. 이메일·전화번호 등 민감한 개인정보를 입력하지 말라는 안내를 추가한다. 이번 범위에는 삭제·숨김·관리자 검토 도구가 없다.

## 조회·정렬
- `created_at` 내림차순.
- 최대 50행.
- 새 피드백은 서버 저장 완료 후 반환된 데이터를 화면 맨 위에 추가한다.
- 클라이언트 시각을 정렬 기준으로 사용하지 않는다.

## 완료/검증 기준
- [ ] Supabase SQL Editor에서 스키마 SQL 실행이 성공한다.
- [ ] 피드백 저장 후 Supabase 테이블에 행이 생성된다.
- [ ] 새로고침 후 목록에 남아 있다.
- [ ] 조회 결과가 최신순이고 50개를 초과하지 않는다.
- [ ] 이름 없이 저장할 수 있다.
- [ ] 500자 초과 본문, 공백 본문, 30자 초과 이름이 거부된다.
- [ ] 브라우저 번들·네트워크 응답에 Service Role Key가 없다.
