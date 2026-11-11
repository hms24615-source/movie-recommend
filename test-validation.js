// ==============================================================================
// test-validation.js
// 목적: AGENTS.md 및 PRD.md에 명시된 유효성 검증 규칙(T02, T03, T08 등) 자동 테스트 스크립트
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
  // T01 정상 입력 (3자 이상)
  const r1 = validateRecommendInput({ prompt: '비 오는 날 볼 따뜻한 영화' });
  assert(r1.isValid === true && r1.sanitizedPrompt === '비 오는 날 볼 따뜻한 영화', 'T01: 정상 추천 입력 (통과 기대)');

  // T02 빈 입력
  const r2 = validateRecommendInput({ prompt: '   ' });
  assert(r2.isValid === false && r2.error.code === 'TOO_SHORT', 'T02: 공백만 입력 시 거부');

  // T03 2자 입력 (최소 길이 미달)
  const r3 = validateRecommendInput({ prompt: '영화' });
  assert(r3.isValid === false && r3.error.code === 'TOO_SHORT', 'T03: 2자 입력 시 거부');

  // 500자 초과 입력
  const r4 = validateRecommendInput({ prompt: 'a'.repeat(501) });
  assert(r4.isValid === false && r4.error.code === 'TOO_LONG', '추천 입력 501자 입력 시 거부');

  // 잘못된 타입
  const r5 = validateRecommendInput({ prompt: 12345 });
  assert(r5.isValid === false && r5.error.code === 'INVALID_INPUT', '문자열이 아닌 입력 거부');

  // --- 피드백 입력 검증 테스트 ---
  // T07 이름 없이 피드백 등록 (익명 허용)
  const f1 = validateFeedbackInput({ message: '서비스가 정말 좋습니다!' });
  assert(f1.isValid === true && f1.sanitizedName === null, 'T07: 이름 없이 등록 시 익명(null) 처리');

  // 정상 등록 (이름 + 본문)
  const f2 = validateFeedbackInput({ name: '영화광', message: '추천 감사합니다.' });
  assert(f2.isValid === true && f2.sanitizedName === '영화광', '피드백 정상 등록');

  // T08 501자 피드백 (본문 길이 초과)
  const f3 = validateFeedbackInput({ message: 'a'.repeat(501) });
  assert(f3.isValid === false && f3.error.code === 'MESSAGE_TOO_LONG', 'T08: 피드백 본문 501자 거부');

  // 공백 피드백
  const f4 = validateFeedbackInput({ message: '   ' });
  assert(f4.isValid === false && f4.error.code === 'MESSAGE_EMPTY', '피드백 공백 거부');

  // 이름 30자 초과
  const f5 = validateFeedbackInput({ name: '가'.repeat(31), message: '테스트' });
  assert(f5.isValid === false && f5.error.code === 'NAME_TOO_LONG', '이름 30자 초과 거부');

  console.log(`\n🎉 테스트 완료: 총 ${total}개 중 ${passed}개 통과!`);
}

runTests();

