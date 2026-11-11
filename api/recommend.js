// ==============================================================================
// api/recommend.js
// 목적: 영화 추천 요청을 처리하는 Vercel 서버리스 함수 엔드포인트 (POST /api/recommend)
// ==============================================================================

const { validateRecommendInput } = require('../lib/validation');
const { getMovieRecommendation } = require('../lib/openai');

module.exports = async function handler(req, res) {
  // 1. HTTP 메서드 확인 (POST만 허용)
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'POST 요청만 지원합니다.'
      }
    });
  }

  // 2. 입력값 유효성 검증
  const validation = validateRecommendInput(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      error: validation.error
    });
  }

  // 3. OpenAI API 호출을 통한 영화 추천 생성
  try {
    const result = await getMovieRecommendation(validation.sanitizedPrompt);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[추천 오류]', error.message);

    // AI 서비스 장애 또는 API 키 오류 등 구분 처리
    if (error.status === 401 || (error.message && error.message.includes('API key'))) {
      return res.status(500).json({
        error: {
          code: 'AUTH_CONFIG_ERROR',
          message: 'AI 서비스 인증 설정에 문제가 발생했습니다. 관리자에게 문의해 주세요.'
        }
      });
    }

    return res.status(502).json({
      error: {
        code: 'AI_PROVIDER_ERROR',
        message: '영화 추천을 가져오는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
      }
    });
  }
};

