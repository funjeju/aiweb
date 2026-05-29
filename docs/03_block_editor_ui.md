# 02_ai_generation_pipeline.md

# 1. AI Generation Pipeline (AI 생성 파이프라인)

본 시스템의 목적은 **AI가 웹사이트를 창작하는 것(Create)** 이 아니다.

핵심은:

> 가장 쉽게 웹사이트를 만들 수 있도록
> AI가 제작 과정을 가속하는 것(Accelerate)

이다.

즉, 본 파이프라인은 **웹빌더 중심 구조** 위에서 작동하는 생산성 엔진이다.

---

# 2. Core Philosophy (핵심 철학)

AI는 다음 4가지만 수행한다.

1. 정보 구조화 (Structuring)
2. 템플릿 큐레이션 (Template Curation)
3. 카피라이팅 보조 (Marketing Copy)
4. 운영 자동화 (OCR / 메뉴화 / 콘텐츠 보조)

AI는 절대 다음을 하지 않는다.

* 랜덤 디자인 생성
* UI 코드 직접 수정
* 무제한 자유 레이아웃 생성

즉,

> Create(창작)

가 아니라

> Curate(큐레이션)

방식이다.

---

# 3. Pipeline Overview (전체 흐름)

## Mode A — Zero Input

사용자 입력:

* 네이버 플레이스 URL
* 인스타그램 URL

↓

가벼운 스크래핑

↓

AI 구조화

↓

템플릿 추천

↓

카피 생성

↓

웹사이트 초안 생성

↓

즉시 렌더링

---

## Mode B — Low Input (Fallback)

스크래핑이 실패하거나 정보가 부족한 경우.

사용자 입력:

* 상호명
* 업종
* 메뉴 사진
* 대표 사진
* 소개 문구
* 전화번호

↓

AI 보완

↓

템플릿 선택

↓

사이트 생성

핵심 원칙:

> 생성 실패 = 서비스 실패

가 아니라

> 최소 입력으로 즉시 복구

이다.

---

## Mode C — Agency Workflow

대행 제작자를 위한 흐름.

플레이스 복사

↓

대표 사진 업로드

↓

메뉴판 사진 업로드

↓

AI 자동 구조화

↓

5분 내 수정

↓

즉시 퍼블리싱

핵심 목표:

> 사이트 제작 시간 최소화

---

# 4. Input Sources (입력 소스)

AI는 다양한 입력을 조합한다.

## Structured Sources

정형 데이터

* 플레이스 정보
* 전화번호
* 주소
* 영업시간
* 메뉴 데이터

## Semi-Structured Sources

반정형 데이터

* 리뷰
* 소개글
* SNS 소개 문구

## Unstructured Sources

비정형 데이터

* 메뉴 사진
* 매장 사진
* 인테리어 이미지
* 로고 이미지

---

# 5. Scraping Strategy (스크래핑 전략)

목표는 “완벽한 크롤링”이 아니다.

목표는:

> 웹사이트 제작에 필요한 최소 데이터 확보

이다.

수집 우선순위:

1. 상호명
2. 업종
3. 주소
4. 전화번호
5. 대표 이미지
6. 리뷰 키워드
7. 메뉴 정보

권장 방식:

* 공식 API 우선
* 가벼운 HTML 파싱
* 메타태그 활용

비권장:

* 무거운 Puppeteer 의존
* 브라우저 자동화 남발

핵심 KPI:

> 데이터 성공률보다
> 사이트 생성 성공률

이다.

---

# 6. AI Processing Pipeline

## Step 1 — Data Structuring

비정형 데이터를 JSON으로 변환한다.

예:

입력:

“뷰가 좋아요”
“노을 맛집”
“커피 맛있음”

↓

구조화:

```json
{
  "vibes": [
    "노을",
    "오션뷰",
    "여유로운 분위기"
  ]
}
```

---

## Step 2 — Business Type Classification

업종 자동 분류

예:

카페

↓

Cafe Template

미용실

↓

Beauty Template

펜션

↓

Stay Template

---

## Step 3 — Pattern Selection

AI는 랜덤 생성하지 않는다.

Pattern Library에서 선택만 수행한다.

예:

Input

카페 + 제주 + 오션뷰 + 감성

↓

Selection

HeroCentered-v2

FeaturedMenu-v3

Gallery-v2

Review-v1

Map-v1

즉:

> 디자인 생성

이 아니라

> 디자인 조합 추천

이다.

---

## Step 4 — Reference Library Matching

AI는 수십~수백 개 레퍼런스 이미지를 참조한다.

단,

역할은 “복제”가 아니다.

### 목적

* 분위기 추론
* 컬러 감성
* 브랜드 톤
* 스타일 힌트

예:

Reference Metadata

```json
{
  "industry": "cafe",
  "mood": [
    "warm",
    "minimal",
    "jeju"
  ],
  "color": [
    "beige",
    "wood"
  ]
}
```

카페 + 제주 감성

↓

warm-ocean theme 추천

핵심:

> Reference = Style Hint

---

## Step 5 — Marketing Copy Generation

리뷰 기반 카피 생성

예:

Raw Review:

“노을이 정말 예쁨”
“뷰가 최고”

↓

Copy:

“제주 서쪽 노을을 가장 가까이서 즐기는 공간”

규칙:

1. 과장 금지
2. 리뷰 기반
3. 짧고 직관적
4. 업종별 톤 유지

---

## Step 6 — Menu OCR Pipeline

메뉴판 사진 업로드

↓

OCR

↓

메뉴명/가격 추출

↓

menuData JSON 생성

예:

```json
{
  "menuItems": [
    {
      "name": "아메리카노",
      "price": 5000
    }
  ]
}
```

↓

자동 반영:

* 웹사이트 메뉴
* 메뉴판 포스터
* QR 메뉴판
* SNS 메뉴 카드

---

# 7. JSON Validation Layer

AI 출력은 반드시 schema validation을 통과해야 한다.

목적:

* 렌더링 오류 방지
* JSON parse 실패 제거
* UI 깨짐 방지

예:

* required field 검사
* component type 검사
* theme 검사

AI는 항상:

> Valid JSON Only

를 반환해야 한다.

---

# 8. Fallback Strategy (가장 중요)

문제:

스크래핑 실패

해결:

Placeholder Completion

예:

상호명만 확보됨

↓

AI 자동 생성:

* 기본 Hero
* Placeholder Menu
* 샘플 Gallery
* 기본 CTA

즉:

> 빈 화면 금지

원칙:

> Always Render Something

---

# 9. Prompt Engineering Strategy

AI 페르소나:

> Senior Local Business Marketer
>
> * Website Builder Assistant

역할:

* 데이터 구조화
* 템플릿 선택
* 카피 생성
* 분위기 추천

하지 말아야 할 것:

* 랜덤 디자인 생성
* HTML 생성
* CSS 생성
* 코드 수정

AI는 오직 JSON 상태값만 반환한다.

---

# 10. Example Prompt Structure

System Persona

너는 지역 비즈니스 웹빌더를 돕는
수석 로컬 마케터이자 웹사이트 큐레이터다.

Task

제공된 데이터를 분석하여
사전 정의된 JSON 스키마 기반 웹사이트 데이터를 생성하라.

Rules

1. 랜덤 디자인 생성 금지
2. Pattern Library에서만 선택
3. Reference는 분위기 힌트로만 사용
4. 오직 JSON 반환
5. 누락 시 placeholder 채우기

---

# 11. Final Pipeline Summary

본 파이프라인의 핵심은 다음이다.

> Web Builder First

그 위에서

> AI Acceleration

을 수행한다.

그리고 AI는:

> Create

가 아니라

> Curate

를 담당한다.
