/**
 * 실제 밝은 항성 데이터 (HYG / Yale Bright Star Catalog 기반 발췌).
 * 육안으로 잘 보이는 1~2등성 위주 — 별자리를 "실제 별들의 조합"으로 만들기 위한 풀.
 * mag(겉보기 등급): 작을수록 밝음.
 */
export interface RealStar {
  name: string;
  mag: number; // 겉보기 등급
}

// 전 하늘에서 가장 밝은 별들 (실제 항성명 + 등급). 별자리 구성용 풀.
export const BRIGHT_STARS: RealStar[] = [
  { name: "시리우스 (Sirius)", mag: -1.46 },
  { name: "카노푸스 (Canopus)", mag: -0.74 },
  { name: "리길 켄타우루스 (Rigil Kentaurus)", mag: -0.27 },
  { name: "아르크투루스 (Arcturus)", mag: -0.05 },
  { name: "베가 (Vega)", mag: 0.03 },
  { name: "카펠라 (Capella)", mag: 0.08 },
  { name: "리겔 (Rigel)", mag: 0.13 },
  { name: "프로키온 (Procyon)", mag: 0.34 },
  { name: "베텔게우스 (Betelgeuse)", mag: 0.42 },
  { name: "아케르나르 (Achernar)", mag: 0.46 },
  { name: "하다르 (Hadar)", mag: 0.61 },
  { name: "알타이르 (Altair)", mag: 0.77 },
  { name: "알데바란 (Aldebaran)", mag: 0.85 },
  { name: "안타레스 (Antares)", mag: 0.96 },
  { name: "스피카 (Spica)", mag: 1.04 },
  { name: "폴룩스 (Pollux)", mag: 1.14 },
  { name: "포말하우트 (Fomalhaut)", mag: 1.16 },
  { name: "데네브 (Deneb)", mag: 1.25 },
  { name: "레굴루스 (Regulus)", mag: 1.35 },
  { name: "카스토르 (Castor)", mag: 1.57 },
  { name: "감마 크루키스 (Gacrux)", mag: 1.63 },
  { name: "벨라트릭스 (Bellatrix)", mag: 1.64 },
  { name: "엘나스 (Elnath)", mag: 1.65 },
  { name: "알니람 (Alnilam)", mag: 1.69 },
  { name: "알니타크 (Alnitak)", mag: 1.77 },
  { name: "두브헤 (Dubhe)", mag: 1.79 },
  { name: "미르파크 (Mirfak)", mag: 1.79 },
  { name: "벨라 (Wezen)", mag: 1.83 },
  { name: "사르가스 (Sargas)", mag: 1.86 },
  { name: "카우스 아우스트랄리스 (Kaus Australis)", mag: 1.85 },
  { name: "아벨리오 (Avior)", mag: 1.86 },
  { name: "알카이드 (Alkaid)", mag: 1.86 },
  { name: "메사르팀 (Menkalinan)", mag: 1.9 },
  { name: "아틀라스 (Atria)", mag: 1.91 },
  { name: "알헤나 (Alhena)", mag: 1.93 },
  { name: "페크다 (Phecda)", mag: 2.44 },
  { name: "미자르 (Mizar)", mag: 2.23 },
  { name: "메라크 (Merak)", mag: 2.37 },
  { name: "알리오트 (Alioth)", mag: 1.76 },
  { name: "폴라리스 (Polaris)", mag: 1.98 },
];

/** mulberry32 — 경량 결정론적 PRNG (시드 → 항상 같은 난수열) */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 문자열 → 32bit 정수 해시 */
export function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface ConstellationStar {
  x: number; // 0~1 정규화 좌표
  y: number;
  size: number; // 1~3
  star: RealStar; // 연결된 실제 별
}

export interface Constellation {
  seed: number;
  stars: ConstellationStar[];
  // 연결 순서 (별 인덱스 쌍)
  links: Array<[number, number]>;
  primaryColor: string;
}

/**
 * 이름 + 색 + 숫자 → 고유 별자리 생성 (결정론적).
 * 실제 항성 풀에서 5~8개를 뽑아 별자리를 구성하고 선으로 잇는다.
 */
export function generateConstellation(name: string, color: string, favoriteNumber: number): Constellation {
  const seed = (hashString(`${name}|${color}|${favoriteNumber}`) ^ (favoriteNumber * 2654435761)) >>> 0;
  const rng = mulberry32(seed);

  const count = 5 + Math.floor(rng() * 4); // 5~8개
  // 실제 별 풀에서 중복 없이 선택
  const pool = [...BRIGHT_STARS];
  const chosen: RealStar[] = [];
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(rng() * pool.length);
    chosen.push(pool.splice(idx, 1)[0]);
  }

  // 중앙(0.5,0.5) 주변에 별 배치 — 자연스러운 흩뿌림
  const stars: ConstellationStar[] = chosen.map((star) => {
    const angle = rng() * Math.PI * 2;
    const radius = 0.12 + rng() * 0.26;
    return {
      x: 0.5 + Math.cos(angle) * radius,
      y: 0.5 + Math.sin(angle) * radius * 0.85,
      size: 1.2 + (2.5 - Math.min(star.mag, 2.5)) * 0.7 + rng() * 0.5,
      star,
    };
  });

  // 가까운 별끼리 잇는 경로(별자리 선) — 최근접 이웃 체인
  const links: Array<[number, number]> = [];
  const used = new Set<number>([0]);
  let current = 0;
  while (used.size < stars.length) {
    let best = -1, bestD = Infinity;
    for (let j = 0; j < stars.length; j++) {
      if (used.has(j)) continue;
      const d = (stars[j].x - stars[current].x) ** 2 + (stars[j].y - stars[current].y) ** 2;
      if (d < bestD) { bestD = d; best = j; }
    }
    if (best === -1) break;
    links.push([current, best]);
    used.add(best);
    current = best;
  }

  return { seed, stars, links, primaryColor: color };
}
