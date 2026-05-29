# 06_design_system_and_components.md

# 1. Design System Overview (디자인 시스템 개요)

본 문서의 목적은 단순히 “예쁜 디자인”을 만드는 것이 아니다. 핵심은 **누가 만들어도 평균 이상 퀄리티의 웹사이트가 나오게 하는 웹빌더 품질 시스템(Quality OS)** 을 만드는 것이다.

기존 웹빌더는 자유도가 높을수록 결과물이 망가지기 쉽다. 폰트가 섞이고, 여백이 깨지고, 이미지 비율이 무너지며 결국 아마추어 느낌이 난다. 본 시스템은 이러한 문제를 제거하기 위해 **디자인 자유도를 의도적으로 제한하고 품질을 강제하는 구조**를 채택한다.

즉 본 시스템의 철학은 다음과 같다.

> 자유롭게 만드는 웹빌더가 아니라
> 누구나 잘 나오게 만드는 웹빌더

이다.

AI 역시 디자인을 “창작(Create)” 하지 않는다. 검증된 디자인 패턴을 **큐레이션(Curate)** 하며, 사용자는 콘텐츠만 수정하도록 만든다.

---

# 2. Core Design Principle (핵심 설계 원칙)

본 디자인 시스템은 다음 원칙을 따른다.

첫째, **웹빌더 중심 구조(Web Builder First)** 다. 디자인 시스템은 웹사이트 생성 품질을 보장하기 위한 장치이며, 마케팅 산출물은 이를 확장하는 형태로 동작한다.

둘째, **디자인 실패 방지(Guardrail)** 다. 사용자가 실수해도 웹사이트가 망가지지 않아야 한다.

셋째, **패턴 기반 큐레이션(Pattern-based Curation)** 이다. AI는 자유 생성 대신 검증된 컴포넌트와 템플릿 조합만 선택한다.

넷째, **브랜드 일관성 유지(Consistency)** 다. 웹사이트, 명함, 메뉴판, SNS 카드가 동일한 디자인 언어를 가져야 한다.

핵심은 다음 한 문장이다.

> 평균 이상 퀄리티를 시스템으로 강제한다.

---

# 3. Design Guardrail (디자인 망가짐 방지)

웹빌더는 사용자가 디자인을 망가뜨리지 못하게 해야 한다.

따라서 자유도는 제한한다.

허용:

* 텍스트 수정
* 이미지 교체
* 블록 순서 변경
* 블록 variation 변경
* Theme/Vibe 변경

비허용:

* 자유 위치 배치
* CSS 수정
* Grid 깨기
* spacing 직접 수정
* typography 무제한 변경
* 무한 커스터마이징

핵심 원칙:

> 못 망가뜨리게 만든다.

이다.

---

# 4. Component Token System (품질 토큰 시스템)

디자인 품질은 감각이 아니라 시스템으로 관리한다.

모든 UI는 Design Token 기반으로 렌더링된다.

예:

```json
{
  "spacing": {
    "xs": 4,
    "sm": 8,
    "md": 16,
    "lg": 24,
    "xl": 40
  },
  "radius": {
    "sm": 8,
    "md": 16,
    "lg": 24
  },
  "shadow": {
    "card": "soft-shadow",
    "hero": "large-shadow"
  },
  "imageRatio": {
    "hero": "16:9",
    "gallery": "1:1"
  }
}
```

관리 대상:

* spacing
* radius
* typography
* grid
* image ratio
* elevation(shadow)
* animation timing

사용자는 토큰을 수정하지 못한다.

AI 역시 토큰을 직접 생성하지 않고 사전 정의된 토큰 조합만 선택한다.

---

# 5. Pattern Library (핵심)

Pattern Library는 본 시스템의 핵심이다.

AI는 웹사이트를 디자인하지 않는다.

대신 검증된 UI 패턴 중 가장 적합한 조합을 선택한다.

예:

HeroCentered-v1
HeroCentered-v2
HeroSplit-v3

MenuGrid-v1
MenuGrid-v2

ReviewCarousel-v1
ReviewCard-v2

GalleryGrid-v1
GalleryMasonry-v2

즉:

> 디자인 생성이 아니라 디자인 선택

이다.

패턴은 업종별·분위기별로 검증된 variation을 가진다.

예:

카페 → 감성 이미지 강조형
식당 → 메뉴 중심형
미용실 → Before/After 강조형
펜션 → 공간 경험 강조형

---

# 6. Block Variation System

웹빌더에서 가장 많이 쓰이는 기능은 “갈아끼우기”다.

핵심은 데이터를 유지하면서 디자인만 바꾸는 것이다.

예:

MenuGrid-v1

↓

MenuList-v2

데이터는 유지된다.

예:

* 메뉴명
* 가격
* 설명
* 이미지

이렇게 사용자는 디자인을 망치지 않으면서 빠르게 분위기를 바꿀 수 있다.

핵심 원칙:

> Data stays, Design changes.

---

# 7. Industry Template System (업종별 템플릿)

사용자는 블록을 조립하지 않는다.

업종에 맞는 완성형 템플릿을 제공한다.

예:

### Cafe Template

Hero → Featured Menu → Gallery → Review → Map → CTA

### Restaurant Template

Hero → Signature Menu → Full Menu → Review → Reservation → Map

### Beauty Template

Hero → Style Gallery → Price List → Booking → Review

### Stay Template

Hero → Room Gallery → Facility → Reservation → Review → Map

AI는 업종과 분위기를 분석하여 가장 적절한 조합을 추천한다.

핵심:

> 블록 제작이 아니라 실전형 조합 제공

이다.

---

# 8. Theme & Vibe System

사용자는 색상을 고르고 싶어하지 않는다.

대부분은 “느낌”을 바꾸고 싶어한다.

따라서 Theme 시스템보다 **Vibe System** 을 전면에 둔다.

예:

* Warm Cafe
* Jeju Warm
* Luxury Modern
* Minimal Clean
* Vintage Cozy

사용자가:

“제주 감성으로”

라고 말하면 다음이 함께 변경된다.

* color palette
* typography tone
* spacing density
* card style
* image treatment

즉:

> 컬러 변경이 아니라 분위기 변경

이다.

---

# 9. Reference Library (레퍼런스 이미지 시스템)

AI는 수십~수백 개 레퍼런스를 활용한다.

단, 이미지 자체를 모방하지 않는다.

레퍼런스의 역할은:

> 스타일 힌트(Style Hint)

다.

모든 레퍼런스는 metadata 기반으로 저장된다.

예:

```json
{
  "industry": "cafe",
  "mood": [
    "warm",
    "minimal",
    "jeju"
  ],
  "colors": [
    "beige",
    "wood"
  ],
  "layoutType": "hero-gallery"
}
```

예시:

입력:

“제주 감성 카페”

↓

Reference Match

↓

Pattern Selection

↓

Theme 적용

↓

웹사이트 생성

즉:

> AI가 창작하는 것이 아니라
> 업계 평균 이상의 결과를 큐레이션한다.

---

# 10. Website + Marketing Kit Consistency

웹사이트는 디자인의 원본(Source of Truth)이다.

명함, 메뉴판, SNS 카드, 이벤트 포스터는 웹사이트 디자인을 자동 상속한다.

예:

웹사이트 Theme 변경

↓

메뉴판 컬러 변경

↓

SNS 카드 typography 변경

↓

명함 스타일 변경

핵심:

> 브랜드 디자인은 하나여야 한다.

이다.

---

# 11. AI Design Role

AI는 디자이너가 아니다.

AI 역할은 다음으로 제한한다.

1. 업종 분석
2. 분위기 추론
3. 템플릿 추천
4. Pattern 선택
5. Theme 추천

AI가 하지 않는 것:

* 자유 디자인 생성
* CSS 생성
* 랜덤 레이아웃 생성

핵심:

> AI는 Creator가 아니라 Curator

다.

---

# 12. Final Principle

본 문서는 웹빌더 품질 시스템의 핵심이다.

궁극적인 목표는 다음과 같다.

> 아무나 만들어도 평균 이상 예쁜 웹사이트

그리고 그 품질은 감각이 아니라 시스템으로 유지된다.

> Design Quality by System, Not Talent
