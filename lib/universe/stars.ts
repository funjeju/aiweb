/**
 * 실제 밝은 항성 데이터 (HYG / Yale Bright Star Catalog 기반).
 * ra: 적경(deg, 0~360), dec: 적위(deg, -90~90), mag: 겉보기 등급(작을수록 밝음).
 * 별자리를 "실제 별들의 실제 상대 위치"로 그리기 위해 실제 천구 좌표를 포함한다.
 */
export interface RealStar {
  name: string;      // 표시용 이름 (캔버스 — IP 언어)
  nameEn: string;   // 영문 공식명
  nameKo: string;   // 한글명
  slug: string;     // URL slug (/star/[slug])
  ra: number;
  dec: number;
  mag: number;
}

export const BRIGHT_STARS: RealStar[] = [
  { nameEn: "Sirius",              nameKo: "시리우스",          slug: "sirius",              name: "Sirius",              ra: 101.3, dec: -16.7, mag: -1.46 },
  { nameEn: "Canopus",             nameKo: "카노푸스",          slug: "canopus",             name: "Canopus",             ra: 95.9,  dec: -52.7, mag: -0.74 },
  { nameEn: "Rigil Kentaurus",     nameKo: "리길 켄타우루스",    slug: "rigil-kentaurus",     name: "Rigil Kentaurus",     ra: 219.9, dec: -60.8, mag: -0.27 },
  { nameEn: "Arcturus",            nameKo: "아르크투루스",       slug: "arcturus",            name: "Arcturus",            ra: 213.9, dec: 19.2,  mag: -0.05 },
  { nameEn: "Vega",                nameKo: "베가",              slug: "vega",                name: "Vega",                ra: 279.2, dec: 38.8,  mag: 0.03  },
  { nameEn: "Capella",             nameKo: "카펠라",            slug: "capella",             name: "Capella",             ra: 79.2,  dec: 46.0,  mag: 0.08  },
  { nameEn: "Rigel",               nameKo: "리겔",              slug: "rigel",               name: "Rigel",               ra: 78.6,  dec: -8.2,  mag: 0.13  },
  { nameEn: "Procyon",             nameKo: "프로키온",          slug: "procyon",             name: "Procyon",             ra: 114.8, dec: 5.2,   mag: 0.34  },
  { nameEn: "Betelgeuse",          nameKo: "베텔게우스",        slug: "betelgeuse",          name: "Betelgeuse",          ra: 88.8,  dec: 7.4,   mag: 0.42  },
  { nameEn: "Achernar",            nameKo: "아케르나르",        slug: "achernar",            name: "Achernar",            ra: 24.4,  dec: -57.2, mag: 0.46  },
  { nameEn: "Hadar",               nameKo: "하다르",            slug: "hadar",               name: "Hadar",               ra: 210.9, dec: -60.4, mag: 0.61  },
  { nameEn: "Altair",              nameKo: "알타이르",          slug: "altair",              name: "Altair",              ra: 297.7, dec: 8.9,   mag: 0.77  },
  { nameEn: "Aldebaran",           nameKo: "알데바란",          slug: "aldebaran",           name: "Aldebaran",           ra: 68.9,  dec: 16.5,  mag: 0.85  },
  { nameEn: "Antares",             nameKo: "안타레스",          slug: "antares",             name: "Antares",             ra: 247.4, dec: -26.4, mag: 0.96  },
  { nameEn: "Spica",               nameKo: "스피카",            slug: "spica",               name: "Spica",               ra: 201.3, dec: -11.2, mag: 1.04  },
  { nameEn: "Pollux",              nameKo: "폴룩스",            slug: "pollux",              name: "Pollux",              ra: 116.3, dec: 28.0,  mag: 1.14  },
  { nameEn: "Fomalhaut",           nameKo: "포말하우트",        slug: "fomalhaut",           name: "Fomalhaut",           ra: 344.4, dec: -29.6, mag: 1.16  },
  { nameEn: "Deneb",               nameKo: "데네브",            slug: "deneb",               name: "Deneb",               ra: 310.4, dec: 45.3,  mag: 1.25  },
  { nameEn: "Regulus",             nameKo: "레굴루스",          slug: "regulus",             name: "Regulus",             ra: 152.1, dec: 12.0,  mag: 1.35  },
  { nameEn: "Castor",              nameKo: "카스토르",          slug: "castor",              name: "Castor",              ra: 113.6, dec: 31.9,  mag: 1.57  },
  { nameEn: "Gamma Crucis",        nameKo: "감마 크루키스",      slug: "gamma-crucis",        name: "Gamma Crucis",        ra: 187.8, dec: -57.1, mag: 1.63  },
  { nameEn: "Bellatrix",           nameKo: "벨라트릭스",        slug: "bellatrix",           name: "Bellatrix",           ra: 81.3,  dec: 6.3,   mag: 1.64  },
  { nameEn: "Elnath",              nameKo: "엘나스",            slug: "elnath",              name: "Elnath",              ra: 81.6,  dec: 28.6,  mag: 1.65  },
  { nameEn: "Alnilam",             nameKo: "알니람",            slug: "alnilam",             name: "Alnilam",             ra: 84.0,  dec: -1.2,  mag: 1.69  },
  { nameEn: "Alnitak",             nameKo: "알니타크",          slug: "alnitak",             name: "Alnitak",             ra: 85.2,  dec: -1.9,  mag: 1.77  },
  { nameEn: "Alioth",              nameKo: "알리오트",          slug: "alioth",              name: "Alioth",              ra: 193.5, dec: 56.0,  mag: 1.76  },
  { nameEn: "Dubhe",               nameKo: "두브헤",            slug: "dubhe",               name: "Dubhe",               ra: 165.9, dec: 61.8,  mag: 1.79  },
  { nameEn: "Mirfak",              nameKo: "미르파크",          slug: "mirfak",              name: "Mirfak",              ra: 51.1,  dec: 49.9,  mag: 1.79  },
  { nameEn: "Wezen",               nameKo: "웨젠",              slug: "wezen",               name: "Wezen",               ra: 107.1, dec: -26.4, mag: 1.83  },
  { nameEn: "Sargas",              nameKo: "사르가스",          slug: "sargas",              name: "Sargas",              ra: 264.3, dec: -43.0, mag: 1.86  },
  { nameEn: "Kaus Australis",      nameKo: "카우스 아우스트랄리스", slug: "kaus-australis",   name: "Kaus Australis",      ra: 276.0, dec: -34.4, mag: 1.85  },
  { nameEn: "Avior",               nameKo: "아비오르",          slug: "avior",               name: "Avior",               ra: 125.6, dec: -59.5, mag: 1.86  },
  { nameEn: "Alkaid",              nameKo: "알카이드",          slug: "alkaid",              name: "Alkaid",              ra: 206.9, dec: 49.3,  mag: 1.86  },
  { nameEn: "Menkalinan",          nameKo: "멘칼리난",          slug: "menkalinan",          name: "Menkalinan",          ra: 89.9,  dec: 44.9,  mag: 1.90  },
  { nameEn: "Atria",               nameKo: "아트리아",          slug: "atria",               name: "Atria",               ra: 252.2, dec: -69.0, mag: 1.91  },
  { nameEn: "Alhena",              nameKo: "알헤나",            slug: "alhena",              name: "Alhena",              ra: 99.4,  dec: 16.4,  mag: 1.93  },
  { nameEn: "Polaris",             nameKo: "폴라리스",          slug: "polaris",             name: "Polaris",             ra: 37.9,  dec: 89.3,  mag: 1.98  },
  { nameEn: "Mizar",               nameKo: "미자르",            slug: "mizar",               name: "Mizar",               ra: 200.9, dec: 54.9,  mag: 2.23  },
  { nameEn: "Merak",               nameKo: "메라크",            slug: "merak",               name: "Merak",               ra: 165.5, dec: 56.4,  mag: 2.37  },
  { nameEn: "Phecda",              nameKo: "페크다",            slug: "phecda",              name: "Phecda",              ra: 178.5, dec: 53.7,  mag: 2.44  },
  { nameEn: "Alphard",             nameKo: "알파르드",          slug: "alphard",             name: "Alphard",             ra: 141.9, dec: -8.7,  mag: 1.98  },
  // 추가 별 (42 → 100)
  { nameEn: "Nunki",               nameKo: "눈키",              slug: "nunki",               name: "Nunki",               ra: 283.8, dec: -26.3, mag: 2.05  },
  { nameEn: "Denebola",            nameKo: "데네볼라",          slug: "denebola",            name: "Denebola",            ra: 177.3, dec: 14.6,  mag: 2.14  },
  { nameEn: "Murzim",              nameKo: "무르짐",            slug: "murzim",              name: "Murzim",              ra: 95.7,  dec: -17.9, mag: 1.98  },
  { nameEn: "Alpheratz",           nameKo: "알페라츠",          slug: "alpheratz",           name: "Alpheratz",           ra: 2.1,   dec: 29.1,  mag: 2.07  },
  { nameEn: "Rasalhague",          nameKo: "라살하게",          slug: "rasalhague",          name: "Rasalhague",          ra: 263.7, dec: 12.6,  mag: 2.08  },
  { nameEn: "Almach",              nameKo: "알마크",            slug: "almach",              name: "Almach",              ra: 30.9,  dec: 42.3,  mag: 2.10  },
  { nameEn: "Schedar",             nameKo: "셰다르",            slug: "schedar",             name: "Schedar",             ra: 10.1,  dec: 56.5,  mag: 2.24  },
  { nameEn: "Caph",                nameKo: "카프",              slug: "caph",                name: "Caph",                ra: 2.3,   dec: 59.1,  mag: 2.28  },
  { nameEn: "Adhara",              nameKo: "아다라",            slug: "adhara",              name: "Adhara",              ra: 104.7, dec: -28.9, mag: 1.50  },
  { nameEn: "Shaula",              nameKo: "샤울라",            slug: "shaula",              name: "Shaula",              ra: 263.4, dec: -37.1, mag: 1.63  },
  { nameEn: "Gacrux",              nameKo: "가크룩스",          slug: "gacrux",              name: "Gacrux",              ra: 187.8, dec: -57.1, mag: 1.63  },
  { nameEn: "Mimosa",              nameKo: "미모사",            slug: "mimosa",              name: "Mimosa",              ra: 191.9, dec: -59.7, mag: 1.25  },
  { nameEn: "Acrux",               nameKo: "아크룩스",          slug: "acrux",               name: "Acrux",               ra: 186.6, dec: -63.1, mag: 0.77  },
  { nameEn: "Hamal",               nameKo: "하말",              slug: "hamal",               name: "Hamal",               ra: 31.8,  dec: 23.5,  mag: 2.01  },
  { nameEn: "Diphda",              nameKo: "디프다",            slug: "diphda",              name: "Diphda",              ra: 10.9,  dec: -18.0, mag: 2.04  },
  { nameEn: "Menkent",             nameKo: "멘켄트",            slug: "menkent",             name: "Menkent",             ra: 211.7, dec: -36.4, mag: 2.06  },
  { nameEn: "Ankaa",               nameKo: "앙카",              slug: "ankaa",               name: "Ankaa",               ra: 6.6,   dec: -42.3, mag: 2.40  },
  { nameEn: "Izar",                nameKo: "이자르",            slug: "izar",                name: "Izar",                ra: 221.2, dec: 27.1,  mag: 2.37  },
  { nameEn: "Enif",                nameKo: "에니프",            slug: "enif",                name: "Enif",                ra: 326.0, dec: 9.9,   mag: 2.40  },
  { nameEn: "Scheat",              nameKo: "셰아트",            slug: "scheat",              name: "Scheat",              ra: 345.9, dec: 28.1,  mag: 2.42  },
  { nameEn: "Markab",              nameKo: "마르카브",          slug: "markab",              name: "Markab",              ra: 346.2, dec: 15.2,  mag: 2.49  },
  { nameEn: "Alderamin",           nameKo: "알데라민",          slug: "alderamin",           name: "Alderamin",           ra: 319.6, dec: 62.6,  mag: 2.45  },
  { nameEn: "Saiph",               nameKo: "사이프",            slug: "saiph",               name: "Saiph",               ra: 86.9,  dec: -9.7,  mag: 2.07  },
  { nameEn: "Mintaka",             nameKo: "민타카",            slug: "mintaka",             name: "Mintaka",             ra: 83.0,  dec: -0.3,  mag: 2.23  },
  { nameEn: "Phact",               nameKo: "팩트",              slug: "phact",               name: "Phact",               ra: 84.9,  dec: -34.1, mag: 2.65  },
  { nameEn: "Naos",                nameKo: "나오스",            slug: "naos",                name: "Naos",                ra: 120.9, dec: -40.0, mag: 2.25  },
  { nameEn: "Regor",               nameKo: "레고르",            slug: "regor",               name: "Regor",               ra: 122.4, dec: -47.3, mag: 1.75  },
  { nameEn: "Suhail",              nameKo: "수하일",            slug: "suhail",              name: "Suhail",              ra: 136.0, dec: -43.4, mag: 2.21  },
  { nameEn: "Miaplacidus",         nameKo: "미아플라키두스",     slug: "miaplacidus",         name: "Miaplacidus",         ra: 138.3, dec: -69.7, mag: 1.68  },
  { nameEn: "Tureis",              nameKo: "투레이스",          slug: "tureis",              name: "Tureis",              ra: 123.7, dec: -24.3, mag: 2.25  },
  { nameEn: "Aspidiske",           nameKo: "아스피디스케",       slug: "aspidiske",           name: "Aspidiske",           ra: 139.3, dec: -59.3, mag: 2.25  },
  { nameEn: "Algieba",             nameKo: "알기에바",          slug: "algieba",             name: "Algieba",             ra: 154.2, dec: 19.8,  mag: 2.28  },
  { nameEn: "Zosma",               nameKo: "조스마",            slug: "zosma",               name: "Zosma",               ra: 168.5, dec: 20.5,  mag: 2.56  },
  { nameEn: "Kochab",              nameKo: "코카브",            slug: "kochab",              name: "Kochab",              ra: 222.7, dec: 74.2,  mag: 2.08  },
  { nameEn: "Pherkad",             nameKo: "페르카드",          slug: "pherkad",             name: "Pherkad",             ra: 230.2, dec: 71.8,  mag: 3.05  },
  { nameEn: "Cor Caroli",          nameKo: "코르 카롤리",        slug: "cor-caroli",          name: "Cor Caroli",          ra: 194.0, dec: 38.3,  mag: 2.89  },
  { nameEn: "Seginus",             nameKo: "세기누스",          slug: "seginus",             name: "Seginus",             ra: 218.0, dec: 38.3,  mag: 3.03  },
  { nameEn: "Muphrid",             nameKo: "무프리드",          slug: "muphrid",             name: "Muphrid",             ra: 208.7, dec: 18.4,  mag: 2.68  },
  { nameEn: "Megrez",              nameKo: "메그레즈",          slug: "megrez",              name: "Megrez",              ra: 183.9, dec: 57.0,  mag: 3.32  },
  { nameEn: "Gienah",              nameKo: "기에나",            slug: "gienah",              name: "Gienah",              ra: 183.8, dec: -17.5, mag: 2.59  },
  { nameEn: "Algorab",             nameKo: "알고라브",          slug: "algorab",             name: "Algorab",             ra: 187.5, dec: -16.5, mag: 2.94  },
  { nameEn: "Porrima",             nameKo: "포리마",            slug: "porrima",             name: "Porrima",             ra: 190.4, dec: -1.4,  mag: 2.74  },
  { nameEn: "Minkar",              nameKo: "민카르",            slug: "minkar",              name: "Minkar",              ra: 184.0, dec: -22.6, mag: 3.02  },
  { nameEn: "Alchiba",             nameKo: "알키바",            slug: "alchiba",             name: "Alchiba",             ra: 182.1, dec: -24.7, mag: 4.02  },
  { nameEn: "Zubenelgenubi",       nameKo: "주베넬게누비",       slug: "zubenelgenubi",       name: "Zubenelgenubi",       ra: 222.7, dec: -16.0, mag: 2.75  },
  { nameEn: "Zubeneschamali",      nameKo: "주베네샤말리",       slug: "zubeneschamali",      name: "Zubeneschamali",      ra: 229.3, dec: -9.4,  mag: 2.61  },
  { nameEn: "Dschubba",            nameKo: "주바",              slug: "dschubba",            name: "Dschubba",            ra: 240.1, dec: -22.6, mag: 2.32  },
  { nameEn: "Graffias",            nameKo: "그라피아스",        slug: "graffias",            name: "Graffias",            ra: 241.4, dec: -19.8, mag: 2.62  },
  { nameEn: "Lesath",              nameKo: "레사스",            slug: "lesath",              name: "Lesath",              ra: 264.0, dec: -37.3, mag: 2.69  },
  { nameEn: "Kaus Media",          nameKo: "카우스 메디아",      slug: "kaus-media",          name: "Kaus Media",          ra: 275.2, dec: -29.8, mag: 2.70  },
  { nameEn: "Kaus Borealis",       nameKo: "카우스 보레알리스",   slug: "kaus-borealis",       name: "Kaus Borealis",       ra: 274.0, dec: -25.4, mag: 2.81  },
  { nameEn: "Ascella",             nameKo: "아셀라",            slug: "ascella",             name: "Ascella",             ra: 290.7, dec: -29.9, mag: 2.60  },
  { nameEn: "Rukbat",              nameKo: "루크바트",          slug: "rukbat",              name: "Rukbat",              ra: 283.8, dec: -40.6, mag: 3.97  },
  { nameEn: "Albaldah",            nameKo: "알발다",            slug: "albaldah",            name: "Albaldah",            ra: 290.7, dec: -21.0, mag: 2.89  },
  { nameEn: "Tarazed",             nameKo: "타라제드",          slug: "tarazed",             name: "Tarazed",             ra: 296.6, dec: 10.6,  mag: 2.72  },
  { nameEn: "Alshain",             nameKo: "알샤인",            slug: "alshain",             name: "Alshain",             ra: 298.8, dec: 6.4,   mag: 3.71  },
  { nameEn: "Rotanev",             nameKo: "로타네브",          slug: "rotanev",             name: "Rotanev",             ra: 309.9, dec: 14.6,  mag: 3.63  },
  { nameEn: "Sualocin",            nameKo: "수알로신",          slug: "sualocin",            name: "Sualocin",            ra: 309.4, dec: 15.9,  mag: 3.77  },
  { nameEn: "Sadr",                nameKo: "사드르",            slug: "sadr",                name: "Sadr",                ra: 305.6, dec: 40.3,  mag: 2.23  },
  { nameEn: "Gienah Cygni",        nameKo: "기에나 시그니",      slug: "gienah-cygni",        name: "Gienah Cygni",        ra: 305.6, dec: 33.9,  mag: 2.46  },
  { nameEn: "Albireo",             nameKo: "알비레오",          slug: "albireo",             name: "Albireo",             ra: 292.7, dec: 27.9,  mag: 3.05  },
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

/**
 * 시드 기반 랜덤 트리로 별자리 선 연결.
 * - 첫 연결은 가장 가까운 별로
 * - 이후 연결은 직전 링크 방향 기준 각도 제한으로 수평/일자 방지
 * - 분기 생성으로 국자/Y자/별 모양 등 다양한 형태 생성
 */
function buildLinks(stars: ConstellationStar[], rng: () => number): Array<[number, number]> {
  const links: Array<[number, number]> = [];
  const connected = [0];
  const remaining = stars.map((_, i) => i).slice(1);
  // 각 연결된 별에서 마지막으로 나간 방향 기록
  const lastAngle: Record<number, number> = {};

  while (remaining.length > 0) {
    const ri = Math.floor(rng() * remaining.length);
    const next = remaining.splice(ri, 1)[0];

    // 가까운 상위 5개 후보 중 각도 다양성 우선 선택
    const candidates = connected
      .map((ci) => {
        const dx = stars[next].x - stars[ci].x;
        const dy = stars[next].y - stars[ci].y;
        const d = dx * dx + dy * dy;
        const angle = Math.atan2(dy, dx);
        // 직전 방향과의 각도 차이 (없으면 최대 다양성 부여)
        const prevAngle = lastAngle[ci];
        const angleDiff = prevAngle !== undefined
          ? Math.abs(Math.atan2(Math.sin(angle - prevAngle), Math.cos(angle - prevAngle)))
          : Math.PI;
        return { ci, d, angle, angleDiff };
      })
      .sort((a, b) => a.d - b.d)
      .slice(0, 5);

    // 각도 차이가 45도(π/4) 이상인 후보 우선 — 없으면 전체에서 랜덤
    const angular = candidates.filter((c) => c.angleDiff >= Math.PI / 4);
    const pool = angular.length > 0 ? angular : candidates;
    const chosen = pool[Math.floor(rng() * pool.length)];

    lastAngle[chosen.ci] = chosen.angle;
    links.push([chosen.ci, next]);
    connected.push(next);
  }
  return links;
}

/**
 * 시드 값으로 별자리를 직접 생성 (DB에 저장된 고정 시드용).
 * 한 번 만들어진 별자리는 시드가 같으면 항상 동일한 모양.
 */
export function generateConstellationFromSeed(seed: number, color: string, starPool?: RealStar[]): Constellation {
  const rng = mulberry32(seed);
  const pool = [...(starPool ?? BRIGHT_STARS)];
  // 풀 크기에 따라 별 개수 범위 조정 (최소 4, 최대 9)
  const maxCount = Math.min(9, Math.max(4, Math.floor(pool.length * 0.25)));
  const minCount = Math.min(4, maxCount);
  const count = minCount + Math.floor(rng() * (maxCount - minCount + 1));
  const chosen: RealStar[] = [];
  for (let i = 0; i < count && pool.length; i++) {
    chosen.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  const stars = projectStars(chosen);
  const links = buildLinks(stars, rng);
  return { seed, stars, links, primaryColor: color };
}

/**
 * 이름 + 색 + 숫자 → 고유 별자리 생성 (처음 만들 때 한 번만 호출).
 * 반환된 seed를 DB에 저장해두면, 이후엔 generateConstellationFromSeed를 쓴다.
 */
export function generateConstellation(name: string, color: string, favoriteNumber: number, starPool?: RealStar[]): Constellation {
  const seed = (hashString(`${name}|${color}|${favoriteNumber}`) ^ (favoriteNumber * 2654435761)) >>> 0;
  return generateConstellationFromSeed(seed, color, starPool);
}
