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
  const feedbackMovieInput = document.getElementById('feedback-movie-input');
  const starPicker = document.getElementById('star-picker');
  const starScoreText = document.getElementById('star-score-text');
  const ratingHelperText = document.getElementById('rating-helper-text');
  const feedbackRatingInput = document.getElementById('feedback-rating-input');
  const feedbackMessageInput = document.getElementById('feedback-message-input');
  const feedbackCharCount = document.getElementById('feedback-char-count');
  const feedbackSubmitBtn = document.getElementById('feedback-submit-btn');
  const feedbackStatus = document.getElementById('feedback-status');
  const feedbackList = document.getElementById('feedback-list');
  const feedbackLoading = document.getElementById('feedback-loading');
  const feedbackEmpty = document.getElementById('feedback-empty');
  const feedbackError = document.getElementById('feedback-error');

  // ----------------------------------------------------------------------------
  // 2. 인터랙티브 별 5개 그래픽 선택기 (Star Rating Widget)
  // ----------------------------------------------------------------------------
  let selectedRating = null; // 선택 확정된 0.5~5.0 값
  let selectedScore = null;  // 선택 확정된 1~10점 값

  const starBoxes = starPicker.querySelectorAll('.star-box');
  const starHalves = starPicker.querySelectorAll('.star-half');

  // 별 채우기 시각 업데이트 함수 (0.5 ~ 5.0)
  function renderStarVisuals(ratingValue) {
    const targetRating = ratingValue || 0;

    starBoxes.forEach((box) => {
      const starIndex = parseInt(box.dataset.star, 10);
      const fg = box.querySelector('.star-fg');

      if (targetRating >= starIndex) {
        // 온전한 한 개 별
        fg.style.width = '100%';
      } else if (targetRating === starIndex - 0.5) {
        // 반 개 별
        fg.style.width = '50%';
      } else {
        // 비어있는 별
        fg.style.width = '0%';
      }
    });
  }

  // 별점 텍스트 표기 업데이트 함수
  function updateScoreText(ratingVal, scoreVal) {
    if (!ratingVal) {
      if (feedbackMovieInput.value.trim().length > 0) {
        starScoreText.textContent = '별을 클릭하여 점수를 매겨주세요';
      } else {
        starScoreText.textContent = '영화를 먼저 입력해 주세요';
      }
      return;
    }
    // 예: "⭐ 3.5점 (7점)" / "⭐ 4.0점 (8점)"
    starScoreText.textContent = `⭐ ${Number(ratingVal).toFixed(1)}점 (${scoreVal}점)`;
  }

  // 별 반쪽들마다 마우스 호버 및 클릭 이벤트 등록
  starHalves.forEach((half) => {
    // 1. 마우스 올렸을 때 (호버 미리보기)
    half.addEventListener('mouseenter', () => {
      if (starPicker.classList.contains('is-disabled')) return;
      const hoverRating = parseFloat(half.dataset.val);
      const hoverScore = parseInt(half.dataset.score, 10);
      renderStarVisuals(hoverRating);
      updateScoreText(hoverRating, hoverScore);
    });

    // 2. 클릭했을 때 (별점 확정)
    half.addEventListener('click', () => {
      if (starPicker.classList.contains('is-disabled')) return;
      selectedRating = parseFloat(half.dataset.val);
      selectedScore = parseInt(half.dataset.score, 10);
      feedbackRatingInput.value = selectedRating;
      renderStarVisuals(selectedRating);
      updateScoreText(selectedRating, selectedScore);
    });
  });

  // 마우스가 별 영역 전체를 벗어났을 때 확정된 점수로 복원
  starPicker.addEventListener('mouseleave', () => {
    if (starPicker.classList.contains('is-disabled')) return;
    renderStarVisuals(selectedRating);
    updateScoreText(selectedRating, selectedScore);
  });

  // 영화 제목 입력 시 별점 위젯 동적 활성화/비활성화
  feedbackMovieInput.addEventListener('input', () => {
    const movieText = feedbackMovieInput.value.trim();
    if (movieText.length > 0) {
      // 활성화
      starPicker.classList.remove('is-disabled');
      ratingHelperText.textContent = '(별을 클릭하여 점수를 선택하세요)';
      if (!selectedRating) {
        starScoreText.textContent = '별을 클릭하여 점수를 매겨주세요';
      }
    } else {
      // 영화를 지우면 비활성화 및 초기화
      starPicker.classList.add('is-disabled');
      ratingHelperText.textContent = '(영화를 입력하면 활성화)';
      selectedRating = null;
      selectedScore = null;
      feedbackRatingInput.value = '';
      renderStarVisuals(0);
      starScoreText.textContent = '영화를 먼저 입력해 주세요';
    }
  });

  // ----------------------------------------------------------------------------
  // 3. 글자 수 카운터 실시간 업데이트
  // ----------------------------------------------------------------------------
  promptInput.addEventListener('input', () => {
    promptCharCount.textContent = `${promptInput.value.length} / 500`;
  });

  feedbackMessageInput.addEventListener('input', () => {
    feedbackCharCount.textContent = `${feedbackMessageInput.value.length} / 500`;
  });

  // ----------------------------------------------------------------------------
  // 4. 상태 메시지 출력 헬퍼 함수
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
  // 5. 날짜 포맷팅 도우미 (한국 시각 기준 읽기 쉬운 형식)
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
  // 6. 영화 추천 요청 처리 (POST /api/recommend)
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
  // 7. 추천 결과 DOM 안전 렌더링 (XSS 방지를 위해 textContent 전용 사용)
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
  // 8. 피드백 목록 불러오기 (GET /api/feedback)
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

  // 피드백 단일 요소 생성 함수 (작성자 + 영화 + 별점 + 본문 안전한 DOM 생성)
  function createFeedbackElement(item) {
    const li = document.createElement('li');
    li.className = 'feedback-item';

    const header = document.createElement('div');
    header.className = 'feedback-item-header';

    const authorBox = document.createElement('div');
    authorBox.className = 'feedback-author-box';

    // 1. 작성자 닉네임 (미입력 시 '익명')
    const author = document.createElement('span');
    author.className = 'feedback-author';
    author.textContent = item.name && item.name.trim().length > 0 ? item.name.trim() : '익명';
    authorBox.appendChild(author);

    // 2. 영화 제목 뱃지 (입력한 경우에만 표시)
    if (item.movie_title && item.movie_title.trim().length > 0) {
      const movieBadge = document.createElement('span');
      movieBadge.className = 'feedback-movie-badge';
      movieBadge.textContent = `🎬 ${item.movie_title.trim()}`;
      authorBox.appendChild(movieBadge);
    }

    // 3. 별점 뱃지 (선택한 경우에만 표시)
    // 0.5~5.0점 및 1~10점 표기 (예: ⭐ 3.5점 (7점))
    if (item.rating !== null && item.rating !== undefined && item.rating !== '') {
      const rNum = Number(item.rating);
      const score10 = Math.round(rNum * 2);
      const ratingBadge = document.createElement('span');
      ratingBadge.className = 'feedback-rating-badge';
      ratingBadge.textContent = `⭐ ${rNum.toFixed(1)}점 (${score10}점)`;
      authorBox.appendChild(ratingBadge);
    }

    // 4. 작성 일시
    const date = document.createElement('span');
    date.className = 'feedback-date';
    date.textContent = formatDate(item.created_at);

    header.appendChild(authorBox);
    header.appendChild(date);

    // 5. 피드백 본문
    const message = document.createElement('p');
    message.className = 'feedback-message';
    message.textContent = item.message || '';

    li.appendChild(header);
    li.appendChild(message);

    return li;
  }

  // ----------------------------------------------------------------------------
  // 9. 피드백 등록 요청 처리 (POST /api/feedback)
  // ----------------------------------------------------------------------------
  feedbackForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const rawName = feedbackNameInput.value;
    const rawMovie = feedbackMovieInput.value;
    const rawRating = feedbackRatingInput.value;
    const rawMessage = feedbackMessageInput.value;

    const messageText = rawMessage.trim();
    const nameText = rawName.trim();
    const movieText = rawMovie.trim();

    // 유효성 검사
    if (messageText.length < 1) {
      setStatus(feedbackStatus, '내용을 1자 이상 입력해 주세요.', 'error');
      feedbackMessageInput.focus();
      return;
    }

    if (messageText.length > 500) {
      setStatus(feedbackStatus, '내용은 최대 500자까지 입력 가능합니다.', 'error');
      feedbackMessageInput.focus();
      return;
    }

    if (nameText.length > 30) {
      setStatus(feedbackStatus, '작성자 이름은 최대 30자까지 입력 가능합니다.', 'error');
      feedbackNameInput.focus();
      return;
    }

    if (movieText.length > 100) {
      setStatus(feedbackStatus, '영화 제목은 최대 100자까지 입력 가능합니다.', 'error');
      feedbackMovieInput.focus();
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
          movie_title: movieText.length > 0 ? movieText : null,
          rating: movieText.length > 0 && rawRating ? Number(rawRating) : null,
          message: messageText
        })
      });

      const savedData = await response.json();

      if (!response.ok) {
        const errorMsg = savedData?.error?.message || '피드백을 저장하지 못했습니다. 다시 시도해 주세요.';
        setStatus(feedbackStatus, errorMsg, 'error');
        return;
      }

      // 등록 성공 시 폼 초기화
      feedbackForm.reset();
      selectedRating = null;
      selectedScore = null;
      feedbackRatingInput.value = '';
      starPicker.classList.add('is-disabled');
      renderStarVisuals(0);
      starScoreText.textContent = '영화를 먼저 입력해 주세요';
      ratingHelperText.textContent = '(영화를 입력하면 활성화)';
      feedbackCharCount.textContent = '0 / 500';
      setStatus(feedbackStatus, '소중한 피드백이 등록되었습니다. 감사합니다!', 'success');

      // 목록 최상단에 새 피드백 추가
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
