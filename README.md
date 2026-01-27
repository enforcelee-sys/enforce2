# 강화하기 게임 (Enforce Game)

Next.js 14 (App Router) + Supabase 기반 강화 게임 웹앱

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com) 에서 새 프로젝트 생성
2. 프로젝트 대시보드 > Settings > API 에서 URL과 anon key 복사
3. `.env.example`을 `.env.local`로 복사 후 값 입력:

```bash
cp .env.example .env.local
```

### 3. 데이터베이스 마이그레이션

Supabase 대시보드 > SQL Editor에서 `supabase/migrations/00001_init.sql` 내용 실행

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 접속

## 타입 생성 (선택)

Supabase CLI로 자동 타입 생성:

```bash
npx supabase gen types typescript --project-id your-project-id > src/types/supabase.ts
```

## 프로젝트 구조

- `/src/app` - Next.js App Router 페이지
- `/src/components` - 재사용 컴포넌트
- `/src/lib/supabase` - Supabase 클라이언트 설정
- `/src/types` - TypeScript 타입 정의
- `/supabase/migrations` - DB 스키마 SQL

## TODO

- [ ] 강화 로직 구현 (`/upgrade`)
- [ ] 출석 보상 로직 (`/daily`)
- [ ] 상점 결제 로직 (`/shop`)
- [ ] 배틀/랭킹 시스템 (`/battle`)
- [ ] 칭호 시스템 (`/titles`)
