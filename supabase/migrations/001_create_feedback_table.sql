-- ==============================================================================
-- 001_create_feedback_table.sql
-- 목적: 영화 추천 서비스 피드백 저장 테이블 및 인덱스, RLS 보안 정책 설정
-- 실행 위치: Supabase 대시보드 -> SQL Editor
-- ==============================================================================

-- 1. UUID 생성을 위한 pgcrypto 확장 활성화 (필요한 경우)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. 피드백 테이블 생성
-- 컬럼 정의:
--   - id: 고유 식별자 (UUID v4 자동 생성)
--   - name: 작성자 닉네임 (선택 항목, 최대 30자)
--   - message: 피드백 내용 (필수 항목, 공백 제외 1자 이상 500자 이하)
--   - created_at: 등록 일시 (기본값: 현재 시각 UTC)
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NULL CHECK (name IS NULL OR char_length(name) <= 30),
  message text NOT NULL CHECK (
    char_length(message) BETWEEN 1 AND 500
    AND length(trim(message)) > 0
  ),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. 피드백 최신순 정렬 조회를 위한 인덱스 생성
-- 최근 50개의 피드백을 빠르게 조회하기 위해 created_at 내림차순 인덱스를 추가합니다.
CREATE INDEX IF NOT EXISTS feedback_created_at_desc_idx
  ON public.feedback (created_at DESC);

-- 4. 행 단위 보안 (Row Level Security, RLS) 활성화
-- 보안 기본 원칙에 따라 RLS를 활성화합니다.
-- 서버는 비공개 SUPABASE_SERVICE_ROLE_KEY를 통해 접근하므로 안전하게 동작합니다.
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

