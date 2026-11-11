// ==============================================================================
// api/feedback.js
// 목적: 피드백 조회(GET) 및 등록(POST)을 처리하는 Vercel 서버리스 함수 엔드포인트
// ==============================================================================

const { validateFeedbackInput } = require('../lib/validation');
const { supabase } = require('../lib/supabase');

module.exports = async function handler(req, res) {
  // 1. 피드백 목록 조회 (GET /api/feedback)
  if (req.method === 'GET') {
    try {
      // 최신순(created_at 내림차순)으로 최대 50건의 피드백을 조회합니다.
      const { data, error } = await supabase
        .from('feedback')
        .select('id, name, message, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('[피드백 조회 DB 오류]', error.message);
        return res.status(500).json({
          error: {
            code: 'DB_FETCH_ERROR',
            message: '피드백 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
          }
        });
      }

      return res.status(200).json(data || []);
    } catch (err) {
      console.error('[피드백 조회 서버 오류]', err.message);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: '서버 내부 오류가 발생했습니다.'
        }
      });
    }
  }

  // 2. 피드백 신규 등록 (POST /api/feedback)
  if (req.method === 'POST') {
    // 입력값 검증 (이름 길이, 본문 공백 여부 등)
    const validation = validateFeedbackInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.error
      });
    }

    try {
      // Supabase 데이터베이스에 새 행을 추가합니다.
      const { data, error } = await supabase
        .from('feedback')
        .insert([
          {
            name: validation.sanitizedName,
            message: validation.sanitizedMessage
          }
        ])
        .select('id, name, message, created_at')
        .single();

      if (error) {
        console.error('[피드백 저장 DB 오류]', error.message);
        return res.status(500).json({
          error: {
            code: 'DB_INSERT_ERROR',
            message: '피드백을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'
          }
        });
      }

      return res.status(201).json(data);
    } catch (err) {
      console.error('[피드백 저장 서버 오류]', err.message);
      return res.status(500).json({
        error: {
          code: 'SERVER_ERROR',
          message: '서버 내부 오류가 발생했습니다.'
        }
      });
    }
  }

  // 3. 지원하지 않는 HTTP 메서드 차단
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: 'GET 및 POST 요청만 지원합니다.'
    }
  });
};

