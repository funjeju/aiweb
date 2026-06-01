# TODO — AI 웹빌더 (0_aiweb)

> 최종 갱신: 2026-05-31
> 배포: https://aiweb-xi-one.vercel.app (Vercel, main 브랜치 자동배포)
> 상세 기획: `docs/`, 별자리 컨셉은 `docs/07_constellation_personal_universe.md`

---

## ✅ 완료 (배포됨)

### 비즈니스 웹빌더 (소상공인)
- [x] AI 사이트 생성 (Gemini `gemini-flash-latest`) + 블록 조합 엔진
- [x] **카카오 로컬 + 구글 grounding 2단 정보수집** — 카카오로 주소/전화/좌표 확정, 구글로 메뉴/소개 보강 (출처 검증 → 날조 차단)
- [x] 장소 후보 선택 플로우 (동명 가게 혼동 방지)
- [x] WYSIWYG 에디터 — 블록 추가/삭제/순서변경(DnD)/variation 교체, 인라인 텍스트 편집, PC/모바일 토글
- [x] 블록: Hero/Menu/Featured/Gallery/Review/Map(카카오지도)/Contact/CTA/BusinessHours/PriceList/**BlogReviews(네이버)**/**AttractionInfo(관광지)**
- [x] 메뉴 OCR, 메뉴 항목별 이미지, 갤러리 업로드 (Firebase Storage)
- [x] 마케팅 키트 — 디지털 명함(QR)/메뉴 포스터/SNS 카드
- [x] Live Feed (사진 업로드 → AI 분석)
- [x] 발행 (`/{siteId}`, `/site/` 제거 완료) + 공개/비공개
- [x] **관광지/오름 템플릿** (siteType: attraction) + 지도 카테고리 핀

### SEO
- [x] LocalBusiness/Restaurant JSON-LD 구조화 데이터
- [x] metadata(canonical/OG/twitter/keywords) + metadataBase
- [x] sitemap.ts + robots.ts (published 동적)
- [x] ISR(revalidate 3600) + getSite React cache

### 인증/권한
- [x] Firebase Auth (Google/이메일), 관리자 이메일 자동 admin 승격
- [x] 권한 기반 대시보드 (admin/승인 사용자만)

### 메인화면
- [x] Live Feed / Map / AI Tools / CCTV 4탭 + 로그인/대시보드 진입
- [x] AI Tools 명함 체험판 (비로그인 2회 무료)

### 다국어
- [x] 공개 사이트 AI 번역 (KOR/ENG/中文 토글)

### 개인 홈페이지 — 별자리 우주 (NEW 메인 컨셉)
- [x] 시드 별자리 생성 (이름+색+숫자 → mulberry32 PRNG)
- [x] **실제 항성 좌표(RA/Dec) 기반 배치** + 실제 별 이름 라벨
- [x] Canvas 렌더 — 배경 별 다층 트윙클 + 드리프트, 연결선 빛흐름, 스무스 반짝임
- [x] 마법사 단순화 (`/private/create` — 이름/색/숫자 + 실시간 미리보기)
- [x] 발행 `/p/[id]` (universe 모드면 별자리 홈) + 메뉴 노드(내소개/다이어리/갤러리) 클릭 진입
- [x] 개인 페이지 편집(`/private/edit/[id]`) + 대시보드(`/private/dashboard`)

---

## 🔜 지금 할 일 (즉시 가능, 우선순위 순)

### 1. 메인 → 별자리(/private) 진입점 추가 ⭐ 작지만 중요
- 현재 `/private`은 **URL 직접 입력해야만** 접근 가능. 메인에서 못 들어감.
- 메인(`app/page.tsx`) 상단바 또는 네비에 "내 우주 만들기"(별자리) 진입 버튼 추가.
- → 전체 메뉴 재정리와 연계: 비즈니스(소상공인) vs 개인(별자리) 두 축 노출 구조 확정 필요.

### 2. 별자리 2단계 — 소셜 + 꾸미기
- [x] **랜덤 이웃 구경** — published universe 랜덤 조회, ConstellationPreview 카드 그리드, 클릭 시 우주 방문.
- [ ] **지역 하늘 정밀도** — 현재 별 상대위치만. 위경도(geolocation)+시각으로 그 지역에서 실제 보이는 하늘 영역 반영 (astronomy-engine 검토, 무거우면 위도 근사부터).
- [x] **기본 꾸미기** — 별 반짝임(soft/default/intense), 연결선 스타일(flow/dotted/aurora), 배경 하늘 테마(deep-space/purple-galaxy/jeju/vintage). 편집 페이지 UI 추가.
- [x] **어드민 모듈 추가 시스템** — 메뉴 카탈로그(profile/diary/gallery/link/music/note) + 편집 페이지에서 노드 추가/제거 (최대 6개). UniverseIconType 확장.

### 3. AI 다이어리 (별자리 메뉴 핵심 기능)
- [ ] 현재 "다이어리" 메뉴는 빈 안내 패널. AI와 대화하며 하루를 정리·기록하는 실제 기능 연결 (Gemini 대화 → 요약 저장).
- [ ] 갤러리 메뉴도 실제 이미지 업로드/표시 연결.

---

## 🕓 추후 (외부 의존성 / 인프라 필요)

### 별자리 3단계 — 감성 심화
- [ ] AI 다이어리 감정 → 시각 변화 (행복=밝은 별↑, 우울=푸른 안개, 목표달성=새 별)
- [ ] 사운드/분위기 (배경음·별 클릭 효과음)
- [ ] 떠다니는 오브젝트 (행성/유성/달/폴라로이드 등 다꾸 스티커)
- [ ] 희귀 아이템/수집 (계절 이벤트·방문기록 기반)

### 수익화 (유료 포인트)
- [ ] **AI 매거진 자동발행** — cron으로 Live Feed 사진 종합 → 주제/지역별 정보성 글에 업체 포함해 자동 발행. ⚠️ **cron 인프라(Vercel Cron 등) 필요**.
- [ ] **카드뉴스 + SNS 자동게시** — Live Feed 사진 → 카드뉴스 → 인스타/스레드 자동 등록. ⚠️ **인스타 Graph API(비즈니스계정+심사), 스레드 API 필요** (계정 공유만으론 불가).
- [ ] 마케팅 키트 유/무료 티어 (크레딧 시스템)

### 기타
- [ ] UI 다국어 (관리/에디터 화면 ENG/CHN — 현재는 공개사이트 콘텐츠만 번역)
- [ ] CCTV 메뉴 구체화 (요구사항 확인 필요 — 관광지 실시간 CCTV 임베드?)
- [ ] 전체 메뉴 재정리 (비즈니스 + 개인 별자리 통합 네비게이션)
- [ ] 커스텀 도메인 연결 (Vercel Domains, 도메인 구매 후)

---

## ⚙️ 운영 메모 (배포 시 필요)

**Vercel 환경변수** (코드는 준비됨, Vercel Settings에 등록 필요):
- `GEMINI_API_KEY` 또는 `GOOGLE_GENERATIVE_AI_API_KEY`
- `NEXT_PUBLIC_KAKAO_MAP_KEY`, `NEXT_PUBLIC_KAKAO_REST_API_KEY`
- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` (블로그 후기)
- `NEXT_PUBLIC_FIREBASE_*` (6개), `FIREBASE_ADMIN_*` (3개)

**외부 콘솔 설정**:
- Firebase Console → Auth → Authorized domains에 `aiweb-xi-one.vercel.app` 추가 (Google 로그인)
- 카카오 개발자센터 → Web 플랫폼 도메인 등록 (지도)
- 네이버 개발자센터 → 검색 API Web 서비스 URL 등록

**Firestore 컬렉션**: `sites`(비즈니스), `personals`(개인/별자리), `users`(권한), `live-feeds`
