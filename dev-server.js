// ==============================================================================
// dev-server.js
// 목적: Vercel CLI 로그인 없이도 로컬에서 프런트엔드와 /api 함수를 즉시 실행해볼 수 있는 로컬 개발 서버
// ==============================================================================

require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// MIME 타입 매핑 정의
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// API 핸들러 로드
const recommendHandler = require('./api/recommend');
const feedbackHandler = require('./api/feedback');

// Node.js 기본 req, res 객체를 Vercel Serverless Function 스타일로 래핑하는 헬퍼 함수
function enhanceResponse(res) {
  res.status = function (statusCode) {
    res.statusCode = statusCode;
    return res;
  };
  res.json = function (data) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
    return res;
  };
  return res;
}

// 요청 본문(JSON Body) 파싱 헬퍼 함수
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) { // 1MB 제한
        req.connection.destroy();
        reject(new Error('Payload Too Large'));
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', err => reject(err));
  });
}

// HTTP 서버 생성
const server = http.createServer(async (req, res) => {
  enhanceResponse(res);
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // 1. API 라우팅 처리 (/api/recommend)
  if (pathname === '/api/recommend') {
    try {
      req.body = await parseRequestBody(req);
      await recommendHandler(req, res);
    } catch (err) {
      console.error('[API recommend 에러]', err);
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' } });
    }
    return;
  }

  // 2. API 라우팅 처리 (/api/feedback)
  if (pathname === '/api/feedback') {
    try {
      req.body = await parseRequestBody(req);
      await feedbackHandler(req, res);
    } catch (err) {
      console.error('[API feedback 에러]', err);
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: '서버 오류가 발생했습니다.' } });
    }
    return;
  }

  // 3. 정적 파일 서비스 (index.html, src/css, src/js, public 등)
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // 보안 검사: 상위 디렉터리 접근 차단
  if (!filePath.startsWith(__dirname)) {
    res.status(403).end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.status(404).end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🎬 시네마 큐레이터 개발 서버가 성공적으로 실행되었습니다!`);
  console.log(`👉 브라우저 주소: http://localhost:${PORT}`);
  console.log(`종료하려면 터미널에서 Ctrl + C 를 누르세요.`);
  console.log('====================================================');
});

