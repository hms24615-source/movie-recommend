// ==============================================================================
// lib/supabase.js
// 목적: Supabase 데이터베이스와의 통신을 관리하는 서버 전용 클라이언트 모듈
// ==============================================================================

// 로컬 개발 환경에서 .env 파일의 환경 변수를 읽어오기 위해 dotenv를 로드합니다.
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 필수 환경 변수가 누락되었는지 확인합니다.
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(
    '[경고] SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다. .env 파일을 확인해 주세요.'
  );
}

/**
 * 서버 전용 Supabase 클라이언트 인스턴스 생성
 * 주의: SUPABASE_SERVICE_ROLE_KEY는 모든 보안 정책(RLS)을 관리자 권한으로 통과하므로
 * 절대로 브라우저(프런트엔드)로 노출해서는 안 되며, 오직 서버 함수 내부에서만 사용해야 합니다.
 */
const supabase = createClient(supabaseUrl || '', supabaseServiceRoleKey || '', {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

module.exports = {
  supabase
};

