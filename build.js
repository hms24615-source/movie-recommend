// ==============================================================================
// build.js
// 목적: Vercel 배포 시 정적 웹 파일(index.html, src)을 Vercel의 배포 대상 폴더(public)로 동기화
// ==============================================================================

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

// 1. public 디렉터리가 없으면 생성
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 2. index.html 파일을 public 폴더로 복사
const srcIndex = path.join(__dirname, 'index.html');
const destIndex = path.join(publicDir, 'index.html');
fs.copyFileSync(srcIndex, destIndex);

// 3. src 폴더를 public/src 폴더로 재귀적 복사
const srcFolder = path.join(__dirname, 'src');
const destFolder = path.join(publicDir, 'src');
fs.cpSync(srcFolder, destFolder, { recursive: true });

console.log('✅ [빌드 성공] 정적 파일(index.html, src)이 public 폴더에 성공적으로 준비되었습니다.');

