// ==============================================================================
// test-validation.js
// 목적: AGENTS.md 및 확장된 피드백 규칙(영화 제목, 0.5~5.0점 별점) 단위 테스트
// ==============================================================================

const { validateRecommendInput, validateFeedbackInput } = require('./lib/validation');

function runTests() {
  console.log('🧪 입력 유효성 검증 단위 테스트를 시작합니다...\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`✅ [통과] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [실패] ${testName}`);
    }
  }

  // --- 추천 입력 검증 테스트 ---
  const r1 = validateRecommendInput({ prompt: '비 오는 날 볼 따뜻한 영화' });
  assert(r1.isValid === true && r1.sanitizedPrompt === '비 오는 날 볼 따뜻한 영화', 'T01: 정상 추천 입력 (통과 기대)');

  const r2 = validateRecommendInput({ prompt: '   ' });
  assert(r2.isValid === false && r2.error.code === 'TOO_SHORT', 'T02: 공백만 입력 시 거부');

  const r3 = validateRecommendInput({ prompt: '영화' });
  assert(r3.isValid === false && r3.error.code === 'TOO_SHORT', 'T03: 2자 입력 시 거부');

  // --- 피드백 입력 검증 테스트 ---
  // 1. 기본 피드백 (이름 없음, 내용만)
  const f1 = validateFeedbackInput({ message: '서비스가 정말 좋습니다!' });
  assert(f1.isValid === true && f1.sanitizedName === null && f1.sanitizedMovieTitle === null && f1.sanitizedRating === null, '피드백 기본 등록 (익명, 영화 없음)');

  // 2. 확장 피드백: 작성자 + 영화 + 별점(4.5)
  const f2 = validateFeedbackInput({
    name: '영화광',
    movie_title: '라라랜드',
    rating: 4.5,
    message: '음악과 영상미가 최고였습니다.'
  });
  assert(f2.isValid === true && f2.sanitizedMovieTitle === '라라랜드' && f2.sanitizedRating === 4.5, '확장 피드백 정상 등록 (영화 + 4.5점 별점)');

  // 3. 확장 피드백: 별 반 개(0.5) 및 만점(5.0) 허용
  const f3 = validateFeedbackInput({ movie_title: '테스트', rating: 0.5, message: '별 반 개' });
  assert(f3.isValid === true && f3.sanitizedRating === 0.5, '별점 최소값 0.5점 허용');

  const f4 = validateFeedbackInput({ movie_title: '테스트', rating: 5.0, message: '만점' });
  assert(f4.isValid === true && f4.sanitizedRating === 5.0, '별점 최대값 5.0점 허용');

  // 4. 영화 없이 별점만 넘겼을 때 -> 별점 null로 자동 리셋
  const f5 = validateFeedbackInput({ movie_title: '', rating: 4.0, message: '영화 없이 별점만' });
  assert(f5.isValid === true && f5.sanitizedMovieTitle === null && f5.sanitizedRating === null, '영화 미입력 시 별점 자동 null 처리');

  // 5. 잘못된 별점 (0.7점 등 0.5 단위가 아닌 경우 거부)
  const f6 = validateFeedbackInput({ movie_title: '영화', rating: 3.7, message: '잘못된 별점' });
  assert(f6.isValid === false && f6.error.code === 'INVALID_RATING', '0.5 단위가 아닌 별점(3.7) 거부');

  // 6. 별점 범위 초과 (5.5점 거부)
  const f7 = validateFeedbackInput({ movie_title: '영화', rating: 5.5, message: '초과' });
  assert(f7.isValid === false && f7.error.code === 'INVALID_RATING', '5.0점 초과 별점 거부');

  console.log(`\n🎉 테스트 완료: 총 ${total}개 중 ${passed}개 통과!`);
}

runTests();
