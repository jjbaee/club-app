# 동아리 홈 🌱

React + Supabase로 만든 동아리 전용 웹앱입니다.
로그인/회원가입(구글 로그인 포함), 게시판, 캘린더, 자료실, 회원목록, 채팅방 기능이 들어있어요.

## 1. 처음 실행하기

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속하면 바로 확인할 수 있어요.

## 2. Supabase DB 설정 (최초 1회, 필수)

1. supabase.com 대시보드 → 본인 프로젝트 → 왼쪽 메뉴 **SQL Editor**
2. 이 프로젝트의 `schema.sql` 파일 내용을 전부 복사해서 붙여넣고 **Run** 클릭
   - 회원 프로필, 게시판, 캘린더, 자료실, 채팅 테이블이 전부 생성돼요
   - 파일 업로드용 Storage 버킷(`files`)도 자동으로 만들어져요
   - 채팅 실시간 기능(Realtime)도 활성화돼요

## 3. 구글 로그인 설정 (선택, 하지만 추천)

1. Google Cloud Console → 새 프로젝트 생성 → **API 및 서비스 → OAuth 동의 화면** 설정
2. **사용자 인증 정보 → OAuth 클라이언트 ID 만들기** (유형: 웹 애플리케이션)
   - 승인된 리디렉션 URI에 Supabase 대시보드에 나오는 콜백 URL을 그대로 붙여넣기
     (Supabase 대시보드 → Authentication → Providers → Google 항목에 있음)
3. 발급받은 클라이언트 ID / 보안 비밀번호를 Supabase 대시보드 → Authentication → Providers → **Google**에 입력 후 활성화

이 단계를 건너뛰어도 이메일/비밀번호 로그인은 바로 작동해요. 구글 로그인은 나중에 추가해도 됩니다.

## 4. 첫 관리자 지정하기

가입 직후 모든 회원은 `member` 등급으로 시작해요. 본인을 관리자로 만들려면:

1. Supabase 대시보드 → **Table Editor → profiles** 테이블
2. 본인 이름을 찾아 `role` 값을 `member`에서 `admin`으로 직접 수정

이후부터는 회원목록 페이지에서 관리자가 다른 회원의 등급을 바로 바꿀 수 있어요.

## 5. 실제 배포하기 (무료)

- Vercel 또는 Netlify에 무료 가입 → GitHub에 이 프로젝트 올리고 연결하면 몇 분 안에 실제 URL로 배포돼요
- 배포 후에는 Google Cloud Console과 Supabase의 리디렉션 URL을 배포된 주소로도 추가해줘야 구글 로그인이 정상 작동해요

## 폴더 구조

```
src/
  lib/supabaseClient.js   # Supabase 연결
  context/AuthContext.jsx # 로그인 상태 전역 관리
  components/Layout.jsx   # 네비게이션 (사이드바/하단탭)
  pages/
    Login.jsx
    Board.jsx      # 게시판
    Calendar.jsx   # 캘린더
    Files.jsx      # 자료실
    Members.jsx    # 회원목록
    Chat.jsx       # 채팅방
schema.sql          # Supabase에 실행할 DB 스키마
```

## 참고

- `.env` 파일에는 Supabase anon key만 들어있어요. 이 키는 공개되어도 안전하도록 설계된 키지만(RLS로 보호됨), 그래도 `.env`를 깃허브에 올릴 땐 `.gitignore`에 포함되어 있는지 확인하세요.
- 무료 플랜 기준 DB 500MB, Storage 1GB, Realtime 동시연결 200개까지 지원돼요. 일반적인 동아리 규모라면 충분합니다.
