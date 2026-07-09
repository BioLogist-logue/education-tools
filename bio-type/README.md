# 생물학적 MBTI

React + TypeScript + Vite로 만든 테스트 웹앱입니다. 결과 통계는 Supabase의 `mbti_stats` 테이블과 `increment_mbti_count` RPC로 저장/조회합니다.

## 로컬 실행

```bash
npm install
npm run dev
```

배포 전 빌드 확인:

```bash
npm run build
```

## 환경변수

`.env.example`을 참고해 로컬에는 `.env`를 만들고, Vercel에는 아래 이름 그대로 등록합니다.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Supabase 설정

1. Supabase 프로젝트를 엽니다.
2. SQL Editor에서 `supabase/schema.sql` 전체를 실행합니다.
3. 생성되는 항목은 `public.mbti_stats` 테이블과 `public.increment_mbti_count(p_type_id text)` 함수입니다.
4. RLS 정책은 통계 조회만 허용하며, 카운트 증가는 RPC를 통해서만 실행됩니다.

## 이미지 추가

대표 이미지는 아래 경로에 PNG 파일로 넣습니다.

```text
public/images/{결과타입}.png
```

예시:

```text
public/images/광감교우.png
public/images/호운부열.png
```

이미지가 없거나 로딩에 실패하면 결과 화면에는 `이미지 준비중` placeholder가 표시됩니다.

## 아이콘 추가

소울메이트/멸종 천적 카드의 작은 아이콘은 아래 경로에 PNG 파일로 넣습니다.

```text
public/icons/{결과타입}.png
```

예시:

```text
public/icons/광감교우.png
public/icons/호운부열.png
```

아이콘은 `resultsDB`에서 `name`이 일치하는 결과 타입 key를 찾아 자동으로 연결됩니다. 아이콘이 없으면 작은 원형 placeholder가 표시됩니다.

## 결과 타입 파일명

이미지와 아이콘 파일명은 아래 16개 결과 타입을 그대로 사용합니다.

```text
광감교우.png
광운교우.png
광감부우.png
광운부우.png
광감교열.png
광운교열.png
광감부열.png
광운부열.png
호감교우.png
호운교우.png
호감부우.png
호운부우.png
호감교열.png
호운교열.png
호감부열.png
호운부열.png
```

## 공유 링크

결과 화면에서 공유하면 아래 형식의 URL이 복사됩니다.

```text
https://your-domain.vercel.app/?result=광감교우
```

사용자가 이 링크로 접속하면 테스트 과정을 건너뛰고 해당 결과 화면이 바로 열립니다.

## Vercel 배포 체크리스트

- `npm run build`가 성공하는지 확인합니다.
- Supabase에서 `supabase/schema.sql`을 실행합니다.
- Vercel Project Settings에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`를 등록합니다.
- 대표 이미지는 `public/images/`에, 아이콘은 `public/icons/`에 넣습니다.
- 배포 후 `?result=결과타입` 공유 링크가 결과 화면으로 바로 이동하는지 확인합니다.
