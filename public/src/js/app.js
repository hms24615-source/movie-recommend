// ==============================================================================
// app.js — 프런트엔드 상호작용 및 API 통신 제어 스크립트
// ==============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // ----------------------------------------------------------------------------
  // 1. DOM 요소 참조
  // ----------------------------------------------------------------------------
  // 추천 관련 요소
  const recommendForm = document.getElementById('recommend-form');
  const promptInput = document.getElementById('prompt-input');
  const promptCharCount = document.getElementById('prompt-char-count');
  const recommendSubmitBtn = document.getElementById('recommend-submit-btn');
  const recommendStatus = document.getElementById('recommend-status');

  // 결과 표시 영역 요소
  const resultSection = document.getElementById('result-section');
  const mainMovieTitle = document.getElementById('main-movie-title');
  const mainMovieRelease = document.getElementById('main-movie-release');
  const mainMovieRuntime = document.getElementById('main-movie-runtime');
  const mainMovieDesc = document.getElementById('main-movie-desc');
  const similarMoviesWrapper = document.getElementById('similar-movies-wrapper');
  const similarMoviesList = document.getElementById('similar-movies-list');

  // 피드백 관련 요소
  const feedbackForm = document.getElementById('feedback-form');
  const feedbackNameInput = document.getElementById('feedback-name-input');
  const feedbackMessageInput = document.getElementById('feedback-message-input');
  const feedbackCharCount = document.getElementById('feedback-char-count');
  const feedbackSubmitBtn = document.getElementById('feedback-submit-btn');
  const feedbackStatus = document.getElementById('feedback-status');
  const feedbackList = document.getElementById('feedback-list');
  const feedbackLoading = document.getElementById('feedback-loading');
  const feedbackEmpty = document.getElementById('feedback-empty');
  const feedbackError = document.getElementById('feedback-error');

  // ----------------------------------------------------------------------------
  // 2. 글자 수 카운터 실시간 업데이트
  // ----------------------------------------------------------------------------
  promptInput.addEventListener('input', () => {
    promptCharCount.textContent = `${promptInput.value.length} / 500`;
  });

  feedbackMessageInput.addEventListener('input', () => {
    feedbackCharCount.textContent = `${feedbackMessageInput.value.length} / 500`;
  });

  // ----------------------------------------------------------------------------
  // 3. 상태 메시지 출력 헬퍼 함수
  // ----------------------------------------------------------------------------
  function setStatus(targetElement, message, type = 'normal') {
    targetElement.textContent = message;
    targetElement.className = 'status-message';
    if (type === 'error') {
      targetElement.classList.add('error');
    } else if (type === 'success') {
      targetElement.classList.add('success');
    }
  }

  // ----------------------------------------------------------------------------
  // 4. 날짜 포맷팅 도우미 (한국 시각 기준 읽기 쉬운 형식)
  // ----------------------------------------------------------------------------
  function formatDate(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  }

  // ----------------------------------------------------------------------------
  // 5. 영화 추천 요청 처리 (POST /api/recommend)
  // ----------------------------------------------------------------------------
  recommendForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const rawPrompt = promptInput.value;
    const promptText = rawPrompt.trim();

    // 클라이언트 사전 검증
    if (promptText.length < 3) {
      setStatus(recommendStatus, '원하는 영화 분위기나 조건을 3자 이상 입력해 주세요.', 'error');
      promptInput.focus();
      return;
    }

    if (promptText.length > 500) {
      setStatus(recommendStatus, '입력 내용이 너무 깁니다. 500자 이내로 입력해 주세요.', 'error');
      promptInput.focus();
      return;
    }

    // 로딩 상태 시작
    setStatus(recommendStatus, 'AI 큐레이터가 최적의 영화를 찾고 있습니다. 잠시만 기다려 주세요...');
    recommendSubmitBtn.disabled = true;
    recommendSubmitBtn.classList.add('is-loading');

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: promptText })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || '영화 추천을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.';
        setStatus(recommendStatus, errorMsg, 'error');
        return;
      }

      // 추천 결과 렌더링
      renderRecommendation(data);
      setStatus(recommendStatus, '영화 추천이 완료되었습니다!', 'success');

      // 결과 화면으로 부드럽게 스크롤 이동
      resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      console.error('추천 요청 통신 에러:', err);
      setStatus(recommendStatus, '네트워크 통신 중 오류가 발생했습니다. 인터넷 연결을 확인해 주세요.', 'error');
    } finally {
      // 로딩 상태 해제
      recommendSubmitBtn.disabled = false;
      recommendSubmitBtn.classList.remove('is-loading');
    }
  });

  // ----------------------------------------------------------------------------
  // 6. 추천 결과 DOM 안전 렌더링 (XSS 방지를 위해 textContent 전용 사용)
  // ----------------------------------------------------------------------------
  function renderRecommendation(data) {
    const { recommendation, similarMovies } = data;
    if (!recommendation) {
      setStatus(recommendStatus, '추천 영화 정보를 파싱하지 못했습니다.', 'error');
      return;
    }

    // 대표 추천 영화 바인딩
    mainMovieTitle.textContent = recommendation.title || '제목 정보 없음';

    // 개봉일 표시 (불확실하면 PRD 규칙에 따라 "정보 확인 필요")
    mainMovieRelease.textContent = recommendation.releaseDate ? recommendation.releaseDate : '정보 확인 필요';

    // 러닝타임 표시
    mainMovieRuntime.textContent =
      typeof recommendation.runtimeMinutes === 'number'
        ? `${recommendation.runtimeMinutes}분`
        : '정보 확인 필요';

    mainMovieDesc.textContent = recommendation.description || '';

    // 비슷한 영화 목록 바인딩 (안전하게 기존 자식 노드 비우기)
    while (similarMoviesList.firstChild) {
      similarMoviesList.removeChild(similarMoviesList.firstChild);
    }

    if (Array.isArray(similarMovies) && similarMovies.length > 0) {
      similarMoviesWrapper.hidden = false;

      similarMovies.slice(0, 3).forEach((movie) => {
        const card = document.createElement('article');
        card.className = 'similar-card';

        const title = document.createElement('h4');
        title.className = 'similar-title';
        title.textContent = movie.title || '제목 정보 없음';

        const meta = document.createElement('div');
        meta.className = 'similar-meta';
        const rel = movie.releaseDate ? movie.releaseDate : '정보 확인 필요';
        const run = typeof movie.runtimeMinutes === 'number' ? `${movie.runtimeMinutes}분` : '정보 확인 필요';
        meta.textContent = `${rel} · ${run}`;

        const desc = document.createElement('p');
        desc.className = 'similar-desc';
        desc.textContent = movie.description || '';

        card.appendChild(title);
        card.appendChild(meta);
        card.appendChild(desc);

        similarMoviesList.appendChild(card);
      });
    } else {
      similarMoviesWrapper.hidden = true;
    }

    // 결과 섹션 표시
    resultSection.hidden = false;
  }

  // ----------------------------------------------------------------------------
  // 7. 피드백 목록 불러오기 (GET /api/feedback)
  // ----------------------------------------------------------------------------
  async function loadFeedbacks() {
    feedbackLoading.hidden = false;
    feedbackEmpty.hidden = true;
    feedbackError.hidden = true;

    try {
      const response = await fetch('/api/feedback');
      const items = await response.json();

      feedbackLoading.hidden = true;

      if (!response.ok) {
        feedbackError.textContent = items?.error?.message || '피드백을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.';
        feedbackError.hidden = false;
        return;
      }

      while (feedbackList.firstChild) {
        feedbackList.removeChild(feedbackList.firstChild);
      }

      if (!Array.isArray(items) || items.length === 0) {
        feedbackEmpty.hidden = false;
        return;
      }

      items.forEach((item) => {
        const li = createFeedbackElement(item);
        feedbackList.appendChild(li);
      });
    } catch (err) {
      console.error('피드백 조회 에러:', err);
      feedbackLoading.hidden = true;
      feedbackError.textContent = '피드백 목록을 가져오는 데 실패했습니다.';
      feedbackError.hidden = false;
    }
  }

  // 피드백 단일 요소 생성 함수 (안전한 textContent 사용)
  function createFeedbackElement(item) {
    const li = document.createElement('li');
    li.className = 'feedback-item';

    const header = document.createElement('div');
    header.className = 'feedback-item-header';

    const author = document.createElement('span');
    author.className = 'feedback-author';
    // 빈 이름은 PRD 규칙에 따라 "익명"으로 표기
    author.textContent = item.name && item.name.trim().length > 0 ? item.name.trim() : '익명';

    const date = document.createElement('span');
    date.className = 'feedback-date';
    date.textContent = formatDate(item.created_at);

    header.appendChild(author);
    header.appendChild(date);

    const message = document.createElement('p');
    message.className = 'feedback-message';
    message.textContent = item.message || '';

    li.appendChild(header);
    li.appendChild(message);

    return li;
  }

  // ----------------------------------------------------------------------------
  // 8. 피드백 등록 요청 처리 (POST /api/feedback)
  // ----------------------------------------------------------------------------
  feedbackForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const rawName = feedbackNameInput.value;
    const rawMessage = feedbackMessageInput.value;

    const messageText = rawMessage.trim();
    const nameText = rawName.trim();

    if (messageText.length < 1) {
      setStatus(feedbackStatus, '피드백 내용을 1자 이상 입력해 주세요.', 'error');
      feedbackMessageInput.focus();
      return;
    }

    if (messageText.length > 500) {
      setStatus(feedbackStatus, '피드백 내용은 최대 500자까지 입력 가능합니다.', 'error');
      feedbackMessageInput.focus();
      return;
    }

    if (nameText.length > 30) {
      setStatus(feedbackStatus, '이름은 최대 30자까지 입력 가능합니다.', 'error');
      feedbackNameInput.focus();
      return;
    }

    // 로딩 상태 시작
    setStatus(feedbackStatus, '피드백을 저장하고 있습니다...');
    feedbackSubmitBtn.disabled = true;
    feedbackSubmitBtn.classList.add('is-loading');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: nameText.length > 0 ? nameText : null,
          message: messageText
        })
      });

      const savedData = await response.json();

      if (!response.ok) {
        const errorMsg = savedData?.error?.message || '피드백을 저장하지 못했습니다. 다시 시도해 주세요.';
        setStatus(feedbackStatus, errorMsg, 'error');
        return;
      }

      // 등록 성공 시 폼 초기화 및 목록 최상단에 새 피드백 추가
      feedbackForm.reset();
      feedbackCharCount.textContent = '0 / 500';
      setStatus(feedbackStatus, '소중한 피드백이 등록되었습니다. 감사합니다!', 'success');

      feedbackEmpty.hidden = true;
      const newElement = createFeedbackElement(savedData);
      feedbackList.insertBefore(newElement, feedbackList.firstChild);
    } catch (err) {
      console.error('피드백 저장 통신 에러:', err);
      setStatus(feedbackStatus, '피드백 등록 중 통신 오류가 발생했습니다.', 'error');
    } finally {
      feedbackSubmitBtn.disabled = false;
      feedbackSubmitBtn.classList.remove('is-loading');
    }
  });

  // 초기 피드백 목록 로드 실행
  loadFeedbacks();
});

