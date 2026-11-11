-- ==============================================================================
-- 002_add_movie_and_rating_to_feedback.sql
-- 목적: 피드백 테이블에 영화 제목(movie_title) 및 별점(rating, 0.5 ~ 5.0) 컬럼 추가
-- 실행 위치: Supabase 대시보드 -> SQL Editor
-- ==============================================================================

-- 1. 영화 제목 컬럼 추가 (선택 항목, 최대 100자)
ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS movie_title text NULL CHECK (
  movie_title IS NULL OR char_length(movie_title) <= 100
);

-- 2. 별점 컬럼 추가 (0.5점 단위, 최소 0.5점에서 최대 5.0점까지 허용)
-- 예: 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0
ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS rating numeric(2, 1) NULL CHECK (
  rating IS NULL OR (
    rating >= 0.5 
    AND rating <= 5.0 
    AND (rating * 2) = floor(rating * 2)
  )
);

