// ==============================================================================
// lib/validation.js
// 목적: 클라이언트로부터 수신된 요청 데이터(추천 문장, 피드백)의 유효성을 검증하는 도우미 모듈
// ==============================================================================

/**
 * 추천 요청 입력값(prompt) 유효성 검사 함수
 * @param {any} body - 클라이언트가 전송한 요청 본문
 * @returns {{ isValid: boolean, error?: { code: string, message: string }, sanitizedPrompt?: string }}
 */
function validateRecommendInput(body) {
  // 1. 요청 본문이 존재하는지 확인
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      error: {
        code: 'INVALID_REQUEST',
        message: '요청 본문 형식이 올바르지 않습니다.'
      }
    };
  }

  const { prompt } = body;

  // 2. prompt 필드가 문자열인지 확인
  if (typeof prompt !== 'string') {
    return {
      isValid: false,
      error: {
        code: 'INVALID_INPUT',
        message: '영화 추천 조건은 문자열 형태로 입력해야 합니다.'
      }
    };
  }

  // 3. 앞뒤 공백 제거(trim)
  const trimmed = prompt.trim();

  // 4. 글자 수 검증: PRD 기준 최소 3자 이상, 최대 500자 이하
  if (trimmed.length < 3) {
    return {
      isValid: false,
      error: {
        code: 'TOO_SHORT',
        message: '원하는 영화 분위기나 조건을 3자 이상 입력해 주세요.'
      }
    };
  }

  if (trimmed.length > 500) {
    return {
      isValid: false,
      error: {
        code: 'TOO_LONG',
        message: '입력 내용이 너무 깁니다. 500자 이내로 입력해 주세요.'
      }
    };
  }

  return {
    isValid: true,
    sanitizedPrompt: trimmed
  };
}

/**
 * 피드백 등록 입력값(name, message) 유효성 검사 함수
 * @param {any} body - 클라이언트가 전송한 요청 본문
 * @returns {{ isValid: boolean, error?: { code: string, message: string }, sanitizedName?: string | null, sanitizedMessage?: string }}
 */
function validateFeedbackInput(body) {
  // 1. 요청 본문이 존재하는지 확인
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      error: {
        code: 'INVALID_REQUEST',
        message: '요청 본문 형식이 올바르지 않습니다.'
      }
    };
  }

  let { name, message } = body;

  // 2. 이름(name) 검증 (선택 사항: 0자~30자)
  let sanitizedName = null;
  if (name !== undefined && name !== null) {
    if (typeof name !== 'string') {
      return {
        isValid: false,
        error: {
          code: 'INVALID_NAME',
          message: '이름은 문자열이어야 합니다.'
        }
      };
    }
    const trimmedName = name.trim();
    if (trimmedName.length > 30) {
      return {
        isValid: false,
        error: {
          code: 'NAME_TOO_LONG',
          message: '이름은 최대 30자까지 입력할 수 있습니다.'
        }
      };
    }
    sanitizedName = trimmedName.length > 0 ? trimmedName : null;
  }

  // 3. 피드백 본문(message) 검증 (필수 사항: 공백 제외 1자~500자)
  if (typeof message !== 'string') {
    return {
      isValid: false,
      error: {
        code: 'INVALID_MESSAGE',
        message: '피드백 내용은 필수이며 문자열이어야 합니다.'
      }
    };
  }

  const trimmedMessage = message.trim();
  if (trimmedMessage.length < 1) {
    return {
      isValid: false,
      error: {
        code: 'MESSAGE_EMPTY',
        message: '공백을 제외한 1자 이상의 피드백 내용을 입력해 주세요.'
      }
    };
  }

  if (trimmedMessage.length > 500) {
    return {
      isValid: false,
      error: {
        code: 'MESSAGE_TOO_LONG',
        message: '피드백 내용은 최대 500자까지 입력할 수 있습니다.'
      }
    };
  }

  return {
    isValid: true,
    sanitizedName,
    sanitizedMessage: trimmedMessage
  };
}

module.exports = {
  validateRecommendInput,
  validateFeedbackInput
};

