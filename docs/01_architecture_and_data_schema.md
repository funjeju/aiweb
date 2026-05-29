# 01_architecture_and_data_schema.md

# 1. System Architecture (시스템 아키텍처)

본 시스템은 **“가장 쉽게 웹사이트를 만들 수 있는 웹빌더”**를 중심으로 설계된다.

핵심 원칙은 다음과 같다.

1. 웹빌더가 제품의 중심(Core)이다.
2. AI는 입력 부담을 줄이는 보조 엔진이다.
3. UI와 데이터는 완전히 분리한다.
4. 웹사이트·마케팅 산출물·운영 데이터를 하나의 데이터 구조로 관리한다.
5. 소상공인 직접 사용과 대행 제작(Agency Workflow)을 모두 지원한다.

---

# 2. Infrastructure Architecture (인프라 구조)

## 2.1 Frontend (Vercel + Next.js)

### Framework

Next.js (App Router)

목적:

* SEO 최적화
* 초고속 렌더링
* 모바일 중심 UX
* 웹빌더 구조 최적화

Rendering Strategy:

* SSR (SEO)
* ISR (속도)
* Client-side Editing (실시간 편집)

### Styling

Tailwind CSS

역할:

* 디자인 시스템 강제
* 블록 스타일 통일
* 빠른 바이브코딩 지원

### Routing

Vercel Edge Middleware 기반 동적 라우팅

예시:

`windmill-cafe.funjeju.com`

사용자는 서브도메인을 의식하지 않는다.

관리자에서는 단순히:

“웹사이트 공유”

버튼만 노출된다.

---

## 2.2 Backend / Database (Firebase)

### Firestore

역할:

* 사이트 JSON 저장
* 템플릿 상태 관리
* 콘텐츠 자산(contentAssets) 저장
* 메뉴 OCR 결과 저장
* Live Feed 저장

핵심 설계 원칙:

> Firestore의 JSON 상태값이 단 하나의 진실(Single Source of Truth)이다.

### Firebase Storage

역할:

* 대표 이미지
* 메뉴 사진
* 로고
* 라이브 피드 이미지
* 업로드 원본 저장

### Firebase Auth

역할:

* 사장님 로그인
* 대행 제작자 계정
* 권한 관리

예시 Role:

* owner
* agency
* admin

---

## 2.3 AI Layer (Gemini API)

AI는 “웹사이트 생성기”가 아니다.

AI의 역할은 다음 5가지로 제한한다.

### 1. Data Structuring

비정형 데이터를 JSON으로 구조화

예:

* 플레이스 정보
* 리뷰
* 소개글
* 메뉴

↓

정형 데이터 변환

### 2. Template Recommendation

업종 기반 템플릿 추천

예:

카페 → Cafe Template

미용실 → Beauty Template

펜션 → Stay Template

### 3. Marketing Copy

리뷰 기반 카피 생성

예:

“노을이 예쁜 카페”

↓

“제주 서쪽 노을을 가장 가까이서 즐기는 공간”

### 4. OCR Content Structuring

메뉴판 사진 분석

예:

아메리카노 5000원

↓

menuItems JSON 변환

### 5. Vibe Editing

챗봇 명령 기반 분위기 수정

예:

“좀 더 따뜻한 제주 감성으로 바꿔줘”

---

# 3. Core Design Principle

## Single Source of Truth

모든 UI는 JSON 상태값으로부터 렌더링된다.

AI는 절대 UI 코드를 직접 수정하지 않는다.

AI는 오직 JSON 상태값만 변경한다.

즉:

AI → JSON 수정

Frontend → JSON 렌더링

---

# 4. Core Data Structure

Firestore의 `sites` 컬렉션에는 하나의 웹사이트가 하나의 document로 저장된다.

## Site Schema

```json
{
  "siteId": "windmill-cafe",
  "createdAt": "2026-05-29T10:00:00Z",
  "updatedAt": "2026-05-29T10:00:00Z",

  "ownerId": "uid_xxx",
  "role": "owner",

  "siteType": "cafe",

  "generationMode": {
    "type": "low-input",
    "source": [
      "naver-place",
      "manual-input",
      "menu-image"
    ]
  },

  "merchantInfo": {
    "name": "풍차로 가는 길",
    "category": "카페",
    "phone": "0507-XXXX-XXXX",
    "address": "제주특별자치도 제주시",
    "description": "제주 서쪽 오션뷰 카페",
    "coordinates": {
      "lat": 33.345,
      "lng": 126.173
    }
  },

  "externalLinks": {
    "naverPlace": "",
    "instagram": "",
    "kakaoTalk": "",
    "booking": ""
  },

  "designTokens": {
    "themeId": "warm-ocean",
    "primaryColor": "#6366F1",
    "fontFamily": "Pretendard",
    "radius": "lg"
  },

  "contentAssets": {
    "heroImage": "",
    "logoImage": "",
    "galleryImages": [],
    "menuImages": [],
    "reviewImages": []
  },

  "menuData": {
    "source": "ocr",
    "items": [
      {
        "name": "아메리카노",
        "price": 5000,
        "description": ""
      }
    ]
  },

  "layout": [
    {
      "blockId": "hero-01",
      "componentType": "HeroCentered-v2",
      "data": {}
    },
    {
      "blockId": "featured-menu",
      "componentType": "MenuGrid-v1",
      "data": {}
    }
  ]
}
```

---

# 5. Template System (웹빌더 핵심)

웹사이트는 자유 제작 방식이 아니다.

AI는 검증된 템플릿을 큐레이션한다.

예시:

## Cafe Template

구성:

* Hero
* Featured Menu
* Gallery
* Review
* Map
* CTA

## Restaurant Template

구성:

* Hero
* Signature Menu
* Menu List
* Review
* Reservation CTA
* Map

## Beauty Template

구성:

* Hero
* Style Gallery
* Price List
* Booking CTA
* Review

## Stay Template

구성:

* Hero
* Room Gallery
* Reservation
* Facility Guide
* Map

핵심 원칙:

> 블록은 자유 창작이 아니라 검증된 조합

---

# 6. Pattern Library Structure

AI가 랜덤 생성하지 않도록 Pattern Library를 둔다.

예시:

```json
{
  "componentLibrary": {
    "HeroCentered": [
      "v1",
      "v2",
      "v3"
    ],
    "MenuGrid": [
      "v1",
      "v2"
    ],
    "FeaturedCard": [
      "v1",
      "v2",
      "v3"
    ]
  }
}
```

예:

카페 + 감성 + 제주

↓

HeroCentered-v2

FeaturedCard-v3

Gallery-v2

추천

---

# 7. Menu OCR System

메뉴 사진 업로드 시 자동 구조화.

Flow:

메뉴판 이미지 업로드

↓

OCR

↓

메뉴명 / 가격 추출

↓

menuData 저장

↓

자동 반영

* 웹사이트 메뉴 섹션
* 메뉴 포스터
* QR 메뉴판
* SNS 카드

핵심 철학:

> 한 번 입력 → 여러 산출물

---

# 8. Website Feature Requirement

웹빌더는 최소 아래 기능을 기본 제공해야 한다.

* 전화 연결
* 길찾기
* 지도
* SNS 링크
* 카카오톡 문의
* 메뉴/가격표
* 리뷰
* 갤러리
* 예약/문의 CTA
* 영업시간
* 이벤트 배너
* 모바일 최적화

---

# 9. Data Flow

## Mode A — Zero Input

네이버 플레이스 URL

↓

스크래핑

↓

AI 구조화

↓

템플릿 선택

↓

사이트 생성

---

## Mode B — Low Input

수동 입력

* 상호명
* 메뉴 사진
* 대표 이미지
* 전화번호

↓

AI 보완

↓

사이트 생성

---

## Agency Workflow

플레이스 복붙

↓

사진 업로드

↓

5분 내 수정

↓

즉시 배포

---

# 10. Final Architecture Summary

본 시스템은 다음 구조를 따른다.

> Web Builder First

그 위에

> AI Acceleration

그 뒤에서

> DaaS Backend Layer

가 동작하는 형태다.
