/**
 * 실제 밝은 항성 데이터 (HYG / Yale Bright Star Catalog 기반).
 * ra: 적경(deg, 0~360), dec: 적위(deg, -90~90), mag: 겉보기 등급(작을수록 밝음).
 * 별자리를 "실제 별들의 실제 상대 위치"로 그리기 위해 실제 천구 좌표를 포함한다.
 */
export interface RealStar {
  name: string;
  ra: number;
  dec: number;
  mag: number;
}

export const BRIGHT_STARS: RealStar[] = [
  { name: "시리우스", ra: 101.3, dec: -16.7, mag: -1.46 },
  { name: "카노푸스", ra: 95.9, dec: -52.7, mag: -0.74 },
  { name: "리길 켄타우루스", ra: 219.9, dec: -60.8, mag: -0.27 },
  { name: "아르크투루스", ra: 213.9, dec: 19.2, mag: -0.05 },
  { name: "베가", ra: 279.2, dec: 38.8, mag: 0.03 },
  { name: "카펠라", ra: 79.2, dec: 46.0, mag: 0.08 },
  { name: "리겔", ra: 78.6, dec: -8.2, mag: 0.13 },
  { name: "프로키온", ra: 114.8, dec: 5.2, mag: 0.34 },
  { name: "베텔게우스", ra: 88.8, dec: 7.4, mag: 0.42 },
  { name: "아케르나르", ra: 24.4, dec: -57.2, mag: 0.46 },
  { name: "하다르", ra: 210.9, dec: -60.4, mag: 0.61 },
  { name: "알타이르", ra: 297.7, dec: 8.9, mag: 0.77 },
  { name: "알데바란", ra: 68.9, dec: 16.5, mag: 0.85 },
  { name: "안타레스", ra: 247.4, dec: -26.4, mag: 0.96 },
  { name: "스피카", ra: 201.3, dec: -11.2, mag: 1.04 },
  { name: "폴룩스", ra: 116.3, dec: 28.0, mag: 1.14 },
  { name: "포말하우트", ra: 344.4, dec: -29.6, mag: 1.16 },
  { name: "데네브", ra: 310.4, dec: 45.3, mag: 1.25 },
  { name: "레굴루스", ra: 152.1, dec: 12.0, mag: 1.35 },
  { name: "카스토르", ra: 113.6, dec: 31.9, mag: 1.57 },
  { name: "감마 크루키스", ra: 187.8, dec: -57.1, mag: 1.63 },
  { name: "벨라트릭스", ra: 81.3, dec: 6.3, mag: 1.64 },
  { name: "엘나스", ra: 81.6, dec: 28.6, mag: 1.65 },
  { name: "알니람", ra: 84.0, dec: -1.2, mag: 1.69 },
  { name: "알니타크", ra: 85.2, dec: -1.9, mag: 1.77 },
  { name: "알리오트", ra: 193.5, dec: 56.0, mag: 1.76 },
  { name: "두브헤", ra: 165.9, dec: 61.8, mag: 1.79 },
  { name: "미르파크", ra: 51.1, dec: 49.9, mag: 1.79 },
  { name: "웨젠", ra: 107.1, dec: -26.4, mag: 1.83 },
  { name: "사르가스", ra: 264.3, dec: -43.0, mag: 1.86 },
  { name: "카우스 아우스트랄리스", ra: 276.0, dec: -34.4, mag: 1.85 },
  { name: "아비오르", ra: 125.6, dec: -59.5, mag: 1.86 },
  { name: "알카이드", ra: 206.9, dec: 49.3, mag: 1.86 },
  { name: "멘칼리난", ra: 89.9, dec: 44.9, mag: 1.90 },
  { name: "아트리아", ra: 252.2, dec: -69.0, mag: 1.91 },
  { name: "알헤나", ra: 99.4, dec: 16.4, mag: 1.93 },
  { name: "폴라리스", ra: 37.9, dec: 89.3, mag: 1.98 },
  { name: "미자르", ra: 200.9, dec: 54.9, mag: 2.23 },
  { name: "메라크", ra: 165.5, dec: 56.4, mag: 2.37 },
  { name: "페크다", ra: 178.5, dec: 53.7, mag: 2.44 },
  { name: "알파르드", ra: 141.9, dec: -8.7, mag: 1.98 },
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
  x: number; // 0~1 정규화 화면 좌표
  y: number;
  size: number;
  star: RealStar; // 실제 별
}

export interface Constellation {
  seed: number;
  stars: ConstellationStar[];
  links: Array<[number, number]>;
  primaryColor: string;
}

/** 시드로 뽑은 실제 별들을 실제 적경/적위 상대배치로 화면에 투영 (종횡비 유지) */
function projectStars(chosen: RealStar[]): ConstellationStar[] {
  // RA unwrap(0/360 경계 보정) + 적위 cos 보정으로 실제 하늘 형태 근사
  const refRa = chosen[0].ra;
  const pts = chosen.map((s) => {
    let ra = s.ra;
    while (ra - refRa > 180) ra -= 360;
    while (ra - refRa < -180) ra += 360;
    return { x: ra * Math.cos((s.dec * Math.PI) / 180), y: -s.dec, star: s };
  });

  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY, 1e-3);
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const scale = 0.5 / span; // 화면 폭 50% 안에 종횡비 유지하며 배치

  return pts.map((p) => ({
    x: 0.5 + (p.x - cx) * scale,
    y: 0.5 + (p.y - cy) * scale,
    size: 1.4 + (2.6 - Math.min(p.star.mag, 2.6)) * 0.8,
    star: p.star,
  }));
}

/** 최근접 이웃 체인으로 별자리 선 연결 (실제 위치 기준) */
function buildLinks(stars: ConstellationStar[]): Array<[number, number]> {
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
  return links;
}

/**
 * 이름 + 색 + 숫자 → 고유 별자리 생성 (결정론적).
 * 실제 밝은 별 5~8개를 시드로 뽑아, 그 별들의 "실제 적경/적위 상대 위치"로 배치.
 * → 실제 하늘에서 같은 별들을 찾아 이으면 동일한 모양이 되는 "실제 별자리".
 */
export function generateConstellation(name: string, color: string, favoriteNumber: number): Constellation {
  const seed = (hashString(`${name}|${color}|${favoriteNumber}`) ^ (favoriteNumber * 2654435761)) >>> 0;
  const rng = mulberry32(seed);

  const count = 5 + Math.floor(rng() * 4); // 5~8개
  const pool = [...BRIGHT_STARS];
  const chosen: RealStar[] = [];
  for (let i = 0; i < count && pool.length; i++) {
    chosen.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }

  const stars = projectStars(chosen);
  const links = buildLinks(stars);
  return { seed, stars, links, primaryColor: color };
}
