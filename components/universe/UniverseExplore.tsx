"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  generateConstellation, generateConstellationFromSeed,
  hashString, mulberry32,
} from "@/lib/universe/stars";
import type { Constellation } from "@/lib/universe/stars";
import { useAuthStore } from "@/lib/store/authStore";
import { getPersonalsByOwner } from "@/lib/firebase/personals";
import { getUniverseConfig } from "@/lib/firebase/config";
import { Sparkles, LogIn, Plus, Minus, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { useBgmStore } from "@/lib/store/bgmStore";

/* ─── 타입 ─────────────────────────────────────── */

export interface UniverseItem {
  id: string;
  name: string;
  color: string;
  favoriteNumber: number;
  constellationSeed?: number;
  tagline?: string;
  role?: string;
  country?: string;
}

interface UniverseNode {
  item: UniverseItem;
  constellation: Constellation;
  cx: number;
  cy: number;
}

/* ─── 상수 ─────────────────────────────────────── */

const CELL = 200;
const LABEL_OFFSET = CELL * 0.52 + 18;
const TILE_SIZE = 600; // 배경별 타일 크기
const TILE_STARS_PER = 18; // 타일당 별 수
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.0;

/* ─── 배경별: 타일 좌표마다 고유 시드로 생성 ── */

function getTileStars(tileX: number, tileY: number) {
  const seed = mulberry32((tileX * 73856093) ^ (tileY * 19349663) ^ 0xc0ffee42);
  return Array.from({ length: TILE_STARS_PER }, () => ({
    tx: seed(),
    ty: seed(),
    r: 0.4 + seed() * 1.1,
    base: 0.2 + seed() * 0.35,
    amp: 0.1 + seed() * 0.2,
    phase: seed() * Math.PI * 2,
    speed: 0.4 + seed() * 0.8,
  }));
}

// 타일 캐시 (렌더 중 매번 생성 방지)
const tileCache = new Map<string, ReturnType<typeof getTileStars>>();
function getCachedTile(tx: number, ty: number) {
  const key = `${tx},${ty}`;
  if (!tileCache.has(key)) tileCache.set(key, getTileStars(tx, ty));
  return tileCache.get(key)!;
}

/* ─── 가상 공간 크기 (별자리 수에 비례 확장) ──────── */

function getVirtualSize(n: number) {
  const side = Math.max(4, Math.ceil(Math.sqrt(n * 1.4)));
  return {
    W: Math.max(4800, side * 600),
    H: Math.max(3200, side * 400),
  };
}

/* ─── 국기 이모지 ─────────────────────────────── */
function countryFlag(code: string): string {
  if (!code || code.length !== 2 || code === "??") return "🌐";
  return code.toUpperCase().replace(/./g, (c) =>
    String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))
  );
}

/* ─── 국가별 존 + 블랙홀 위치 계산 ──────────────── */

const ZONE_BUFFER = 900;    // 존 사이 버퍼 (블랙홀 공간)
const ZONE_MIN   = 2400;    // 존 최소 크기
const CELL_SPACING = 800;   // 존 내 그리드 셀 크기 (겹침 방지)

export interface BlackHole {
  id: string;
  x: number;
  y: number;
  zoneA: string; // 국가코드
  zoneB: string;
}

interface ZoneRect { x: number; y: number; w: number; h: number; }

function computeZoneLayout(universes: UniverseItem[]): {
  positions: Map<string, { cx: number; cy: number }>;
  blackHoles: BlackHole[];
  virtualW: number;
  virtualH: number;
} {
  // 국가별 그룹화 (country 없으면 "??")
  const groups = new Map<string, UniverseItem[]>();
  for (const u of universes) {
    const c = u.country ?? "??";
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c)!.push(u);
  }

  // 유저 수 내림차순 정렬
  const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

  // 각 존의 그리드 셀 수 계산 (정사각형에 가깝게)
  const zoneSizes = sorted.map(([code, members]) => {
    // ID 기준 정렬 → 항상 동일한 순서 보장
    const ms = [...members].sort((a, b) => a.id.localeCompare(b.id));
    const gridCols = Math.max(1, Math.ceil(Math.sqrt(ms.length * 1.4)));
    const gridRows = Math.ceil(ms.length / gridCols);
    // 셀 크기(CELL_SPACING)로 존 크기 결정, ZONE_MIN 보장
    const w = Math.max(ZONE_MIN, gridCols * CELL_SPACING);
    const h = Math.max(ZONE_MIN, gridRows * CELL_SPACING);
    return { code, members: ms, gridCols, gridRows, w, h };
  });

  // 존 배치: 2열 그리드
  const COLS = 2;
  const zones = new Map<string, ZoneRect>();
  const zoneGrids = new Map<string, { cols: number; rows: number; members: UniverseItem[] }>();
  let curX = 0, curY = 0, rowH = 0;
  zoneSizes.forEach(({ code, members, gridCols, gridRows, w, h }, i) => {
    const col = i % COLS;
    if (col === 0 && i > 0) { curY += rowH + ZONE_BUFFER; curX = 0; rowH = 0; }
    zones.set(code, { x: curX, y: curY, w, h });
    zoneGrids.set(code, { cols: gridCols, rows: gridRows, members });
    curX += w + ZONE_BUFFER;
    rowH = Math.max(rowH, h);
  });

  // 전체 가상 공간 크기
  let maxX = 0, maxY = 0;
  zones.forEach((z) => { maxX = Math.max(maxX, z.x + z.w); maxY = Math.max(maxY, z.y + z.h); });
  const virtualW = maxX + ZONE_BUFFER;
  const virtualH = maxY + ZONE_BUFFER;

  // 별자리 위치: 그리드 셀 기반 배치 (겹침 방지)
  // 각 유저는 정렬된 인덱스에 따라 고정 셀을 배정받고, 셀 내에서 ID 해시로 미세 지터
  const positions = new Map<string, { cx: number; cy: number }>();
  for (const [code, zone] of zones) {
    const grid = zoneGrids.get(code);
    if (!grid) continue;
    const cellW = zone.w / grid.cols;
    const cellH = zone.h / grid.rows;
    grid.members.forEach((u, idx) => {
      const gc = idx % grid.cols;
      const gr = Math.floor(idx / grid.cols);
      const rng = mulberry32(hashString(u.id));
      // 셀 내 20%~80% 구간에 배치 (가장자리 여백 확보)
      positions.set(u.id, {
        cx: zone.x + gc * cellW + cellW * (0.2 + rng() * 0.6),
        cy: zone.y + gr * cellH + cellH * (0.2 + rng() * 0.6),
      });
    });
  }

  // 블랙홀: 인접 존 쌍의 경계 중간
  const blackHoles: BlackHole[] = [];
  const zoneList = [...zones.entries()];
  for (let i = 0; i < zoneList.length; i++) {
    for (let j = i + 1; j < zoneList.length; j++) {
      const [codeA, zA] = zoneList[i];
      const [codeB, zB] = zoneList[j];
      const hAdj = Math.abs((zA.x + zA.w) - zB.x) < ZONE_BUFFER * 1.5 || Math.abs((zB.x + zB.w) - zA.x) < ZONE_BUFFER * 1.5;
      const vAdj = Math.abs((zA.y + zA.h) - zB.y) < ZONE_BUFFER * 1.5 || Math.abs((zB.y + zB.h) - zA.y) < ZONE_BUFFER * 1.5;
      if (!hAdj && !vAdj) continue;
      blackHoles.push({
        id: `bh-${codeA}-${codeB}`,
        x: (zA.x + zA.w / 2 + zB.x + zB.w / 2) / 2,
        y: (zA.y + zA.h / 2 + zB.y + zB.h / 2) / 2,
        zoneA: codeA,
        zoneB: codeB,
      });
    }
  }

  return { positions, blackHoles, virtualW, virtualH };
}

/* ─── 워프 효과음 (Web Audio API) ───────────────── */

function playWarpSound(genKey = "builtin") {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AC() as AudioContext;
    const t = ctx.currentTime;

    if (genKey === "sci-fi") {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "square"; o.frequency.setValueAtTime(100, t);
      o.frequency.exponentialRampToValueAtTime(3000, t + 1.5);
      o.frequency.exponentialRampToValueAtTime(500, t + 2.5);
      g.gain.setValueAtTime(0.05, t); g.gain.linearRampToValueAtTime(0.12, t + 0.8);
      g.gain.linearRampToValueAtTime(0, t + 2.5);
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(t + 2.5);
      const p = ctx.createOscillator(); const pg = ctx.createGain();
      p.type = "sine"; p.frequency.setValueAtTime(1200, t + 1.8);
      pg.gain.setValueAtTime(0, t + 1.8); pg.gain.linearRampToValueAtTime(0.2, t + 2.0);
      pg.gain.linearRampToValueAtTime(0, t + 2.5);
      p.connect(pg); pg.connect(ctx.destination); p.start(t + 1.8); p.stop(t + 2.5);

    } else if (genKey === "booster") {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2.5, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.5);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const g = ctx.createGain(); const f = ctx.createBiquadFilter();
      f.type = "lowpass"; f.frequency.setValueAtTime(400, t); f.frequency.linearRampToValueAtTime(100, t + 2.5);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.6, t + 0.3); g.gain.linearRampToValueAtTime(0, t + 2.5);
      src.connect(f); f.connect(g); g.connect(ctx.destination); src.start(); src.stop(t + 2.5);

    } else if (genKey === "whoosh") {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 1.2, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(); src.buffer = buf;
      const f = ctx.createBiquadFilter(); const g = ctx.createGain();
      f.type = "bandpass"; f.frequency.setValueAtTime(2000, t); f.frequency.exponentialRampToValueAtTime(200, t + 1.2); f.Q.value = 0.8;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5, t + 0.1); g.gain.linearRampToValueAtTime(0, t + 1.2);
      src.connect(f); f.connect(g); g.connect(ctx.destination); src.start(); src.stop(t + 1.2);

    } else if (genKey === "laser") {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.setValueAtTime(4000, t); o.frequency.exponentialRampToValueAtTime(80, t + 2.0);
      g.gain.setValueAtTime(0.1, t); g.gain.linearRampToValueAtTime(0.15, t + 0.5); g.gain.linearRampToValueAtTime(0, t + 2.0);
      o.connect(g); g.connect(ctx.destination); o.start(); o.stop(t + 2.0);
      const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
      o2.type = "sine"; o2.frequency.setValueAtTime(8000, t); o2.frequency.exponentialRampToValueAtTime(200, t + 2.0);
      g2.gain.setValueAtTime(0.05, t); g2.gain.linearRampToValueAtTime(0, t + 2.0);
      o2.connect(g2); g2.connect(ctx.destination); o2.start(); o2.stop(t + 2.0);

    } else {
      // builtin (기본)
      const drone = ctx.createOscillator(); const dg = ctx.createGain();
      drone.type = "sawtooth"; drone.frequency.setValueAtTime(60, t); drone.frequency.exponentialRampToValueAtTime(30, t + 2.7);
      dg.gain.setValueAtTime(0, t); dg.gain.linearRampToValueAtTime(0.15, t + 0.3); dg.gain.linearRampToValueAtTime(0, t + 2.7);
      drone.connect(dg); dg.connect(ctx.destination); drone.start(); drone.stop(t + 2.7);
      const sw = ctx.createOscillator(); const sg = ctx.createGain();
      sw.type = "sine"; sw.frequency.setValueAtTime(200, t); sw.frequency.exponentialRampToValueAtTime(2000, t + 0.6);
      sg.gain.setValueAtTime(0.08, t); sg.gain.linearRampToValueAtTime(0, t + 2.7);
      sw.connect(sg); sg.connect(ctx.destination); sw.start(); sw.stop(t + 2.7);
      const ping = ctx.createOscillator(); const pg = ctx.createGain();
      ping.type = "sine"; ping.frequency.setValueAtTime(880, t + 2.1); ping.frequency.exponentialRampToValueAtTime(440, t + 2.7);
      pg.gain.setValueAtTime(0, t + 2.1); pg.gain.linearRampToValueAtTime(0.2, t + 2.2); pg.gain.linearRampToValueAtTime(0, t + 2.7);
      ping.connect(pg); pg.connect(ctx.destination); ping.start(t + 2.1); ping.stop(t + 2.7);
    }
  } catch { /* 무시 */ }
}

/* ─── 방향 이름 ─────────────────────────────────── */

function directionName(angle: number): string {
  const deg = ((angle * 180 / Math.PI) + 360) % 360;
  if (deg < 22.5 || deg >= 337.5) return "동쪽";
  if (deg < 67.5) return "남동쪽";
  if (deg < 112.5) return "남쪽";
  if (deg < 157.5) return "남서쪽";
  if (deg < 202.5) return "서쪽";
  if (deg < 247.5) return "북서쪽";
  if (deg < 292.5) return "북쪽";
  return "북동쪽";
}

/* ─── 메인 컴포넌트 ─────────────────────────────── */

export function UniverseExplore({ universes }: { universes: UniverseItem[] }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* 내 별자리 여부 */
  const [myConstellationId, setMyConstellationId] = useState<string | null>(null);
  const bgmInitRef = useRef(false);
  const { setMyBgm, setMyTrackIdx, myTracks, myTrackIdx, isPlaying, mode, play, pause } = useBgmStore();

  useEffect(() => {
    if (!user) { setMyConstellationId(null); bgmInitRef.current = false; return; }
    getPersonalsByOwner(user.uid).then((pages) => {
      const mine = pages.find((p) => p.universe);
      setMyConstellationId(mine?.id ?? null);

      // BGM 초기화 (첫 로드 시 한 번만)
      if (!bgmInitRef.current && mine?.universe?.bgmList?.length) {
        bgmInitRef.current = true;
        const list = mine.universe.bgmList;
        const shuffle = mine.universe.bgmShuffle ?? false;
        const tracks = list.map((t: { url: string; name: string; volume?: number }) => ({
          url: t.url, name: t.name, volume: t.volume,
        }));
        let initIdx = 0;
        if (shuffle) { initIdx = Math.floor(Math.random() * tracks.length); }
        else { const d = list.findIndex((t: { isDefault?: boolean }) => t.isDefault); initIdx = d >= 0 ? d : 0; }
        setMyBgm(tracks, mine.id);
        setMyTrackIdx(initIdx);
      }
    }).catch(() => {});
  }, [user]);

  const zoneLayout = useMemo(() => computeZoneLayout(universes), [universes]);
  const VIRTUAL_W = zoneLayout.virtualW;
  const VIRTUAL_H = zoneLayout.virtualH;

  /* 카메라 */
  const camRef = useRef({ x: VIRTUAL_W / 2, y: VIRTUAL_H / 2 });
  const [camSnap, setCamSnap] = useState({ x: VIRTUAL_W / 2, y: VIRTUAL_H / 2 });

  /* 줌 */
  const zoomRef = useRef(1);
  const [zoomSnap, setZoomSnap] = useState(1);

  /* 드래그 */
  const dragging = useRef(false);
  const moved = useRef(false);
  const dragOrigin = useRef({ mx: 0, my: 0, cx: 0, cy: 0 });

  /* 핀치 줌 */
  const lastPinchDist = useRef<number | null>(null);

  /* 별똥별 */
  interface ShootingStar {
    x: number; y: number;
    vx: number; vy: number;
    life: number; maxLife: number;
    absorbing?: boolean; // 블랙홀 흡수 중
  }
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const shootingStarTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const spawn = () => {
      const W = window.innerWidth, H = window.innerHeight;
      const dir = Math.floor(Math.random() * 4);
      const speed = 0.006 + Math.random() * 0.004;
      const maxLife = 150 + Math.floor(Math.random() * 60);
      let x: number, y: number, vx: number, vy: number;
      if (dir === 0) { x = -0.08; y = 0.05 + Math.random() * 0.5; const a = 0.08 + Math.random() * 0.2; vx = Math.cos(a) * speed; vy = Math.sin(a) * speed; }
      else if (dir === 1) { x = 1.08; y = 0.05 + Math.random() * 0.5; const a = 0.08 + Math.random() * 0.2; vx = -Math.cos(a) * speed; vy = Math.sin(a) * speed; }
      else if (dir === 2) { x = Math.random() * 0.6; y = -0.08; const a = Math.PI / 2 - 0.3 + Math.random() * 0.3; vx = Math.cos(a) * speed; vy = Math.sin(a) * speed; }
      else { x = 0.4 + Math.random() * 0.6; y = -0.08; const a = Math.PI / 2 - 0.3 + Math.random() * 0.3; vx = -Math.cos(a) * speed; vy = Math.sin(a) * speed; }
      shootingStarsRef.current.push({ x, y, vx, vy, life: 0, maxLife });
      void W; void H;
    };
    // 첫 발사 3초 후
    const first = setTimeout(spawn, 3000);
    // 이후 10초마다
    shootingStarTimerRef.current = setInterval(spawn, 10000);
    return () => { clearTimeout(first); if (shootingStarTimerRef.current) clearInterval(shootingStarTimerRef.current); };
  }, []);

  /* 워프 */
  const warpRef = useRef<{
    active: boolean;
    phase: "stretching" | "traveling" | "arriving";
    progress: number;
    fromX: number; fromY: number;
    toX: number; toY: number;
    startTime: number;
    targetNodeId?: string;
  } | null>(null);
  const [warping, setWarping] = useState(false);

  /* 호버 */
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredRef = useRef<string | null>(null);

  /* 힌트 */
  const [showHint, setShowHint] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(t);
  }, []);

  /* 뷰포트 */
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);
  useEffect(() => {
    const update = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /* 노드 */
  const nodes = useMemo<UniverseNode[]>(() => {
    return universes.map((item) => {
      const constellation = item.constellationSeed != null
        ? generateConstellationFromSeed(item.constellationSeed, item.color)
        : generateConstellation(item.name, item.color, item.favoriteNumber);
      const pos = zoneLayout.positions.get(item.id) ?? { cx: 0, cy: 0 };
      return { item, constellation, cx: pos.cx, cy: pos.cy };
    });
  }, [universes, zoneLayout]);

  const blackHoles = zoneLayout.blackHoles;

  /* 초기 카메라: 신규 방문자는 랜덤 스팟 */
  useEffect(() => {
    if (nodes.length === 0) return;
    const rng = mulberry32(Date.now() & 0xffffffff);
    const randX = VIRTUAL_W * (0.1 + rng() * 0.8);
    const randY = VIRTUAL_H * (0.1 + rng() * 0.8);
    camRef.current = { x: randX, y: randY };
    setCamSnap({ x: randX, y: randY });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length > 0]);

  /* 줌 헬퍼 */
  const applyZoom = useCallback((delta: number, pivotX: number, pivotY: number) => {
    const oldZoom = zoomRef.current;
    const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldZoom * delta));
    // 피벗 기준으로 카메라 보정
    const scale = newZoom / oldZoom;
    const W = canvasRef.current?.clientWidth ?? window.innerWidth;
    const H = canvasRef.current?.clientHeight ?? window.innerHeight;
    const vx = camRef.current.x + (pivotX - W / 2) / oldZoom;
    const vy = camRef.current.y + (pivotY - H / 2) / oldZoom;
    camRef.current = {
      x: vx - (pivotX - W / 2) / newZoom,
      y: vy - (pivotY - H / 2) / newZoom,
    };
    zoomRef.current = newZoom;
    setZoomSnap(newZoom);
    setCamSnap({ ...camRef.current });
  }, []);

  /* 워프 효과음 URL (config에서 로드) */
  const warpSoundUrlRef = useRef<string | null>(null);
  useEffect(() => {
    getUniverseConfig().then((c) => { warpSoundUrlRef.current = c.warpSoundUrl ?? null; }).catch(() => {});
  }, []);

  /* 워프 실행 */
  const startWarp = useCallback((toX: number, toY: number, targetNodeId?: string) => {
    if (warpRef.current?.active) return;
    warpRef.current = {
      active: true,
      phase: "stretching",
      progress: 0,
      fromX: camRef.current.x,
      fromY: camRef.current.y,
      toX, toY,
      startTime: performance.now(),
      targetNodeId,
    };
    setWarping(true);
    const soundUrl = warpSoundUrlRef.current;
    if (soundUrl && !soundUrl.startsWith("builtin:")) {
      // 커스텀 업로드 파일
      const audio = new Audio(soundUrl);
      audio.volume = 0.7;
      audio.play().catch(() => playWarpSound("builtin"));
    } else {
      // builtin:genKey 또는 null → genKey 추출
      const genKey = soundUrl?.startsWith("builtin:") ? soundUrl.replace("builtin:", "") : "builtin";
      playWarpSound(genKey);
    }
  }, []);

  /* ── 앰비언트 펄스 이벤트 ─────────────────────── */
  interface PulseEvent {
    nodeId: string;       // 대상 별자리 id
    starIdx: number | -1; // -1 = 별자리 전체, ≥0 = 특정 별 하나
    startTime: number;
    duration: number;     // ms
    peak: number;         // 최대 추가 밝기 (0~1)
  }
  const pulseEventsRef = useRef<PulseEvent[]>([]);
  const lastPulseScheduleRef = useRef(0);

  const schedulePulse = useCallback((now: number, nodeList: typeof nodes) => {
    if (nodeList.length === 0) return;
    // 5~14초 간격으로 새 이벤트
    const interval = 5000 + Math.random() * 9000;
    if (now - lastPulseScheduleRef.current < interval) return;
    lastPulseScheduleRef.current = now;

    const node = nodeList[Math.floor(Math.random() * nodeList.length)];
    const kind = Math.random();
    const starIdx = kind < 0.4
      ? -1  // 40%: 별자리 전체 글로우
      : Math.floor(Math.random() * node.constellation.stars.length); // 60%: 별 하나

    pulseEventsRef.current.push({
      nodeId: node.item.id,
      starIdx,
      startTime: now,
      duration: starIdx === -1 ? 2200 + Math.random() * 1200 : 900 + Math.random() * 600,
      peak: starIdx === -1 ? 0.35 + Math.random() * 0.3 : 0.7 + Math.random() * 0.3,
    });

    // 만료된 이벤트 정리
    pulseEventsRef.current = pulseEventsRef.current.filter(
      (e) => now - e.startTime < e.duration + 200
    );
  }, [nodes]);

  /* RAF 렌더 */
  const animRef = useRef(0);
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) { animRef.current = requestAnimationFrame(render); return; }
    const ctx = canvas.getContext("2d");
    if (!ctx) { animRef.current = requestAnimationFrame(render); return; }

    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const { x: camX, y: camY } = camRef.current;
    const zoom = zoomRef.current;
    const hid = hoveredRef.current;
    const t = performance.now();

    // virtual → screen (줌 적용)
    const sx = (vx: number) => (vx - camX) * zoom + W / 2;
    const sy = (vy: number) => (vy - camY) * zoom + H / 2;
    const margin = (CELL + 60) * zoom;

    /* 배경 */
    const bg = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H / 2, Math.max(W, H) * 0.85);
    bg.addColorStop(0, "#0d1330");
    bg.addColorStop(0.55, "#080b1d");
    bg.addColorStop(1, "#04050d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* 배경별 타일링 */
    const tileW = TILE_SIZE * zoom;
    const tileH = TILE_SIZE * zoom;
    const offX = ((-camX * zoom) % tileW + tileW) % tileW;
    const offY = ((-camY * zoom) % tileH + tileH) % tileH;
    const tilesX = Math.ceil(W / tileW) + 2;
    const tilesY = Math.ceil(H / tileH) + 2;

    // 블랙홀 스크린 좌표 사전 계산 (중력 렌즈 + 혜성 흡수에 공용)
    const bhScreen = blackHoles
      .map((bh) => ({ bh, bx: sx(bh.x), by: sy(bh.y), R: Math.max(28, 40 * zoom) }))
      .filter(({ bx, by }) => bx > -500 && bx < W + 500 && by > -500 && by < H + 500);

    /* 워프 진행 */
    const warp = warpRef.current;
    let warpStretch = 0; // 0 = 점, 1 = 최대 늘어남
    if (warp?.active) {
      const elapsed = (t - warp.startTime) / 1000;
      if (warp.phase === "stretching") {
        warpStretch = Math.min(1, elapsed / 0.6);
        if (elapsed > 0.6) {
          warp.phase = "traveling";
          warp.startTime = t;
        }
      } else if (warp.phase === "traveling") {
        warpStretch = 1;
        const progress = Math.min(1, elapsed / 1.4);
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        camRef.current = {
          x: warp.fromX + (warp.toX - warp.fromX) * ease,
          y: warp.fromY + (warp.toY - warp.fromY) * ease,
        };
        setCamSnap({ ...camRef.current });
        if (elapsed > 1.4) {
          warp.phase = "arriving";
          warp.startTime = t;
          camRef.current = { x: warp.toX, y: warp.toY };
          setCamSnap({ x: warp.toX, y: warp.toY });
        }
      } else if (warp.phase === "arriving") {
        warpStretch = Math.max(0, 1 - elapsed / 0.7);
        if (elapsed > 0.7) {
          warpRef.current = null;
          setWarping(false);
        }
      }
    }

    for (let tx = -1; tx < tilesX; tx++) {
      for (let ty = -1; ty < tilesY; ty++) {
        const tileAbsX = Math.floor((camX * zoom - offX) / tileW) + tx + 1;
        const tileAbsY = Math.floor((camY * zoom - offY) / tileH) + ty + 1;
        for (const s of getCachedTile(tileAbsX, tileAbsY)) {
          const px = offX + tx * tileW + s.tx * tileW;
          const py = offY + ty * tileH + s.ty * tileH;
          if (px < -4 || px > W + 4 || py < -4 || py > H + 4) continue;
          const alpha = s.base + s.amp * Math.sin(t * 0.001 * s.speed + s.phase);
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.fillStyle = "#e8ecff";

          // 중력 렌즈: 블랙홀 근방 배경별을 미세하게 당김
          let lpx = px, lpy = py;
          for (const { bx, by, R } of bhScreen) {
            const dx = bx - px, dy = by - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const lensR = R * 7;
            if (dist > R && dist < lensR) {
              const t2 = 1 - dist / lensR;
              const pull = 0.18 * t2 * t2;
              lpx += (dx / dist) * dist * pull;
              lpy += (dy / dist) * dist * pull;
            }
          }

          if (warpStretch > 0) {
            // 별을 화면 중심 기준으로 방사형으로 늘어나게
            const dx = lpx - W / 2;
            const dy = lpy - H / 2;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const stretch = 1 + warpStretch * 25 * (len / (Math.max(W, H) * 0.5));
            ctx.save();
            ctx.translate(lpx, lpy);
            ctx.rotate(Math.atan2(dy, dx));
            ctx.scale(stretch, 1);
            ctx.beginPath();
            ctx.arc(0, 0, s.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          } else {
            ctx.beginPath();
            ctx.arc(lpx, lpy, s.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }
    ctx.globalAlpha = 1;

    /* 별똥별 + 블랙홀 흡수 */
    shootingStarsRef.current = shootingStarsRef.current.filter((ss) => ss.life < ss.maxLife);
    for (const ss of shootingStarsRef.current) {
      const px = ss.x * W, py = ss.y * H;

      // 블랙홀 중력 적용
      for (const { bx, by, R } of bhScreen) {
        const dx = (bx - px) / W;
        const dy = (by - py) / H;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const gravR = (R * 6) / Math.min(W, H);
        if (dist < gravR && dist > 0.001) {
          const strength = 0.00022 * ((1 - dist / gravR) ** 2);
          ss.vx += (dx / dist) * strength;
          ss.vy += (dy / dist) * strength;
          ss.absorbing = true;
          // 매우 가까우면 즉시 흡수
          if (dist < (R * 1.4) / Math.min(W, H)) {
            ss.life = ss.maxLife;
          }
        }
      }

      const progress = ss.life / ss.maxLife;
      // 흡수 중일 때 더 빠르게 페이드아웃
      const alpha = ss.absorbing
        ? Math.max(0, 1 - progress * 2.5)
        : (progress < 0.15 ? progress / 0.15 : progress > 0.7 ? 1 - (progress - 0.7) / 0.3 : 1);

      if (alpha > 0.01) {
        const tailX = px - ss.vx * W * 18, tailY = py - ss.vy * H * 18;
        const lg = ctx.createLinearGradient(tailX, tailY, px, py);
        lg.addColorStop(0, "rgba(255,255,255,0)");
        lg.addColorStop(0.6, `rgba(255,255,255,${alpha * 0.4})`);
        lg.addColorStop(1, `rgba(255,255,255,${alpha})`);
        ctx.strokeStyle = lg; ctx.lineWidth = 1.5; ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(px, py); ctx.stroke();
        const glow = ctx.createRadialGradient(px, py, 0, px, py, 6);
        glow.addColorStop(0, `rgba(255,255,255,${alpha})`);
        glow.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = glow; ctx.globalAlpha = alpha * 0.8;
        ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
      }

      ss.x += ss.vx; ss.y += ss.vy; ss.life++;
    }
    ctx.globalAlpha = 1;

    /* 앰비언트 펄스 스케줄 */
    schedulePulse(t, nodes);

    /* 별자리 렌더 */
    const cellZoomed = CELL * zoom;
    // 도착 글로우: arriving 페이즈에서 목적지 별자리 강조
    const arrivingGlow = warp?.phase === "arriving"
      ? Math.max(0, 1 - (performance.now() - warp.startTime) / 700)
      : 0;

    for (const node of nodes) {
      const px = sx(node.cx), py = sy(node.cy);
      if (px < -margin || px > W + margin || py < -margin || py > H + margin) continue;

      const isHovered = node.item.id === hid;
      const isArriving = arrivingGlow > 0 && node.item.id === warp?.targetNodeId;
      const pulse = 0.88 + 0.12 * Math.sin(t * 0.0014 + node.cx * 0.0007);
      const baseAlpha = isHovered ? 1 : 0.72;

      // 앰비언트 펄스 강도 계산
      const activePulses = pulseEventsRef.current.filter((e) => e.nodeId === node.item.id);
      let ambientBoost = 0;        // 별자리 전체용
      const starBoosts: number[] = node.constellation.stars.map(() => 0);
      for (const ev of activePulses) {
        const progress = (t - ev.startTime) / ev.duration;
        if (progress < 0 || progress > 1) continue;
        // ease in-out: 올라갔다 내려오는 종 모양
        const bell = Math.sin(progress * Math.PI);
        const boost = ev.peak * bell;
        if (ev.starIdx === -1) {
          ambientBoost = Math.max(ambientBoost, boost);
        } else {
          starBoosts[ev.starIdx] = Math.max(starBoosts[ev.starIdx], boost);
        }
      }

      // 도착 글로우 — 큰 원형 빛 번짐
      if (isArriving) {
        const glowR = cellZoomed * (1.5 + arrivingGlow * 2);
        const arriGlow = ctx.createRadialGradient(px, py, 0, px, py, glowR);
        arriGlow.addColorStop(0, `${node.item.color}${Math.round(arrivingGlow * 80).toString(16).padStart(2, "0")}`);
        arriGlow.addColorStop(0.4, `${node.item.color}${Math.round(arrivingGlow * 40).toString(16).padStart(2, "0")}`);
        arriGlow.addColorStop(1, "transparent");
        ctx.fillStyle = arriGlow;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(px, py, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isHovered) {
        const ring = ctx.createRadialGradient(px, py, cellZoomed * 0.1, px, py, cellZoomed * 0.85);
        ring.addColorStop(0, `${node.item.color}30`);
        ring.addColorStop(0.6, `${node.item.color}18`);
        ring.addColorStop(1, "transparent");
        ctx.fillStyle = ring;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(px, py, cellZoomed * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      const c = node.constellation;

      // 연결선 — 전체 펄스 반영
      const lineAlpha = Math.min(1, baseAlpha * (0.38 + ambientBoost * 0.55) * pulse);
      ctx.globalAlpha = lineAlpha;
      ctx.strokeStyle = node.item.color;
      ctx.lineWidth = isHovered ? 1.3 : ambientBoost > 0.1 ? 1 + ambientBoost * 0.8 : 1;
      for (const [a, b] of c.links) {
        const ax = px + (c.stars[a].x - 0.5) * cellZoomed;
        const ay = py + (c.stars[a].y - 0.5) * cellZoomed;
        const bx = px + (c.stars[b].x - 0.5) * cellZoomed;
        const by = py + (c.stars[b].y - 0.5) * cellZoomed;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      }

      for (let si = 0; si < c.stars.length; si++) {
        const s = c.stars[si];
        const spx = px + (s.x - 0.5) * cellZoomed;
        const spy = py + (s.y - 0.5) * cellZoomed;
        const starBoost = Math.max(ambientBoost * 0.6, starBoosts[si]);
        const r = s.size * 1.4 * Math.max(0.5, zoom) * (1 + starBoost * 0.7);

        // 글로우
        const g = ctx.createRadialGradient(spx, spy, 0, spx, spy, r * 5);
        g.addColorStop(0, node.item.color);
        g.addColorStop(0.4, `${node.item.color}66`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.globalAlpha = Math.min(1, baseAlpha * (0.38 + starBoost * 0.7) * pulse);
        ctx.beginPath(); ctx.arc(spx, spy, r * 5, 0, Math.PI * 2); ctx.fill();

        // 핀포인트 글레어 (개별 별 강조 시)
        if (starBoost > 0.2) {
          const glare = ctx.createRadialGradient(spx, spy, 0, spx, spy, r * 2.5);
          glare.addColorStop(0, `rgba(255,255,255,${starBoost * 0.85})`);
          glare.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = glare;
          ctx.globalAlpha = 1;
          ctx.beginPath(); ctx.arc(spx, spy, r * 2.5, 0, Math.PI * 2); ctx.fill();
        }

        // 별 코어
        ctx.globalAlpha = Math.min(1, baseAlpha * pulse + starBoost * 0.4);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(spx, spy, r * 0.85, 0, Math.PI * 2); ctx.fill();
      }

      ctx.globalAlpha = isHovered ? 0.95 : 0.55;
      ctx.fillStyle = isHovered ? node.item.color : "#c8cfe8";
      ctx.font = isHovered
        ? `bold ${Math.round(13 * Math.max(0.7, zoom))}px ui-sans-serif, system-ui, sans-serif`
        : `${Math.round(12 * Math.max(0.7, zoom))}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.95)";
      ctx.shadowBlur = 8;
      ctx.fillText(node.item.name, px, py + LABEL_OFFSET * zoom);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    /* ── 블랙홀 렌더 (은은한 밤하늘 감성) ── */
    for (const { bh, bx, by, R } of bhScreen) {
      // 호흡 주기: ~10초 (2π / 0.000628 ≈ 10000ms), bh.x로 위상 오프셋
      const breathe = 0.82 + 0.18 * Math.sin(t * 0.000628 + bh.x * 0.00025);

      // 1. 넓고 매우 흐린 외곽 광휘 (존재감만)
      const outerHalo = ctx.createRadialGradient(bx, by, R * 0.5, bx, by, R * 8);
      outerHalo.addColorStop(0,   `rgba(100,50,200,${0.09 * breathe})`);
      outerHalo.addColorStop(0.35,`rgba(70,20,160,${0.05 * breathe})`);
      outerHalo.addColorStop(0.7, `rgba(40,10,100,${0.025 * breathe})`);
      outerHalo.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = outerHalo; ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(bx, by, R * 8, 0, Math.PI * 2); ctx.fill();

      // 2. 중간 보라빛 코로나 (에지 글로우)
      const corona = ctx.createRadialGradient(bx, by, R * 0.85, bx, by, R * 2.8);
      corona.addColorStop(0,   `rgba(130,60,240,${0.32 * breathe})`);
      corona.addColorStop(0.45,`rgba(90,30,180,${0.14 * breathe})`);
      corona.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = corona; ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(bx, by, R * 2.8, 0, Math.PI * 2); ctx.fill();

      // 3. 내부 전이 영역 (검정→보라→검정)
      const inner = ctx.createRadialGradient(bx, by, R * 0.6, bx, by, R * 1.1);
      inner.addColorStop(0,   "rgba(0,0,0,0)");
      inner.addColorStop(0.55,`rgba(60,15,120,${0.4 * breathe})`);
      inner.addColorStop(1,   "rgba(0,0,0,0)");
      ctx.fillStyle = inner; ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(bx, by, R * 1.1, 0, Math.PI * 2); ctx.fill();

      // 4. 사건의 지평선 — 완전한 검정
      ctx.fillStyle = "#000000"; ctx.globalAlpha = 1;
      ctx.beginPath(); ctx.arc(bx, by, R * 0.92, 0, Math.PI * 2); ctx.fill();

      // 5. 국가 방향 레이블 (줌 충분 시, 매우 은은하게)
      if (zoom > 0.45) {
        const flagA = countryFlag(bh.zoneA);
        const flagB = countryFlag(bh.zoneB);
        ctx.font = `${Math.round(12 * zoom)}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.globalAlpha = 0.38 * breathe;
        ctx.fillStyle = "#b8a8e8";
        ctx.shadowColor = "rgba(0,0,0,1)";
        ctx.shadowBlur = 8;
        ctx.fillText(`${flagA} ${bh.zoneA}`, bx, by - R * 2.4);
        ctx.fillText(`${flagB} ${bh.zoneB}`, bx, by + R * 2.4 + 13 * zoom);
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
    }

    animRef.current = requestAnimationFrame(render);
  }, [nodes, blackHoles]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [render]);

  /* 이벤트 핸들러 */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const hitTest = (clientX: number, clientY: number): string | null => {
      const rect = canvas.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      const W = canvas.clientWidth, H = canvas.clientHeight;
      const { x, y } = camRef.current;
      const zoom = zoomRef.current;
      let best: string | null = null;
      let bestDist = CELL * 0.62 * zoom;
      for (const node of nodes) {
        const spx = (node.cx - x) * zoom + W / 2;
        const spy = (node.cy - y) * zoom + H / 2;
        const d = Math.sqrt((mx - spx) ** 2 + (my - spy) ** 2);
        if (d < bestDist) { bestDist = d; best = node.item.id; }
      }
      return best;
    };

    const hitTestBlackHole = (clientX: number, clientY: number): BlackHole | null => {
      const rect = canvas.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      const W = canvas.clientWidth, H = canvas.clientHeight;
      const { x, y } = camRef.current;
      const zoom = zoomRef.current;
      const R = Math.max(28, 40 * zoom) * 1.5;
      for (const bh of blackHoles) {
        const bx = (bh.x - x) * zoom + W / 2;
        const by = (bh.y - y) * zoom + H / 2;
        if (Math.sqrt((mx - bx) ** 2 + (my - by) ** 2) < R) return bh;
      }
      return null;
    };

    /* 마우스 드래그 */
    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      dragging.current = true;
      moved.current = false;
      dragOrigin.current = { mx: e.clientX, my: e.clientY, cx: camRef.current.x, cy: camRef.current.y };
      canvas.style.cursor = "grabbing";
    };

    const onMove = (e: MouseEvent) => {
      if (dragging.current) {
        const dx = e.clientX - dragOrigin.current.mx;
        const dy = e.clientY - dragOrigin.current.my;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved.current = true;
        camRef.current = {
          x: dragOrigin.current.cx - dx / zoomRef.current,
          y: dragOrigin.current.cy - dy / zoomRef.current,
        };
        setCamSnap({ ...camRef.current });
      } else {
        const id = hitTest(e.clientX, e.clientY);
        hoveredRef.current = id;
        setHoveredId(id);
        const bh = !id ? hitTestBlackHole(e.clientX, e.clientY) : null;
        canvas.style.cursor = (id || bh) ? "pointer" : "grab";
      }
    };

    const onUp = (e: MouseEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      const id = hitTest(e.clientX, e.clientY);
      canvas.style.cursor = id ? "pointer" : "grab";
      if (!moved.current && id) { router.push(`/p/${id}`); return; }
      if (!moved.current) {
        const bh = hitTestBlackHole(e.clientX, e.clientY);
        if (bh) {
          // 인접 존 중 하나를 랜덤 선택해서 그 존의 랜덤 별자리로 워프
          const targetZone = Math.random() < 0.5 ? bh.zoneA : bh.zoneB;
          const candidates = universes.filter((u) => (u.country ?? "??") === targetZone);
          const target = candidates.length > 0
            ? candidates[Math.floor(Math.random() * candidates.length)]
            : universes[Math.floor(Math.random() * universes.length)];
          if (target) {
            const pos = zoneLayout.positions.get(target.id);
            if (pos) startWarp(pos.cx, pos.cy, target.id);
          }
        }
      }
    };

    /* 마우스 휠 줌 */
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const pivotX = e.clientX - rect.left;
      const pivotY = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      applyZoom(factor, pivotX, pivotY);
    };

    /* 터치 드래그 + 핀치 줌 */
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        dragging.current = true;
        moved.current = false;
        dragOrigin.current = { mx: t.clientX, my: t.clientY, cx: camRef.current.x, cy: camRef.current.y };
      } else if (e.touches.length === 2) {
        dragging.current = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist.current = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && dragging.current) {
        const t = e.touches[0];
        const dx = t.clientX - dragOrigin.current.mx;
        const dy = t.clientY - dragOrigin.current.my;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved.current = true;
        camRef.current = {
          x: dragOrigin.current.cx - dx / zoomRef.current,
          y: dragOrigin.current.cy - dy / zoomRef.current,
        };
        setCamSnap({ ...camRef.current });
      } else if (e.touches.length === 2 && lastPinchDist.current !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const factor = dist / lastPinchDist.current;
        const pivotX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const pivotY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const rect = canvas.getBoundingClientRect();
        applyZoom(factor, pivotX - rect.left, pivotY - rect.top);
        lastPinchDist.current = dist;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) lastPinchDist.current = null;
      dragging.current = false;
      if (!moved.current && e.changedTouches.length > 0) {
        const t = e.changedTouches[0];
        const id = hitTest(t.clientX, t.clientY);
        if (id) router.push(`/p/${id}`);
      }
    };

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.style.cursor = "grab";

    return () => {
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [nodes, router, applyZoom]);

  /* 호버 노드 */
  const hoveredNode = useMemo(
    () => nodes.find((n) => n.item.id === hoveredId) ?? null,
    [nodes, hoveredId]
  );

  /* 화면 밖 별자리 → 가까운 4개 방향 힌트 */
  const nearestHints = useMemo(() => {
    if (nodes.length === 0 || vw === 0) return [];
    const zoom = zoomSnap;
    const margin = CELL + 60;
    const LY_PER_UNIT = 120;
    const HIDE_LY = 3;

    const candidates = [...nodes]
      .map((n) => {
        const px = (n.cx - camSnap.x) * zoom + vw / 2;
        const py = (n.cy - camSnap.y) * zoom + vh / 2;
        const onScreen = px > -margin && px < vw + margin && py > -margin && py < vh + margin;
        const dist = Math.hypot(n.cx - camSnap.x, n.cy - camSnap.y);
        const lightyears = dist / LY_PER_UNIT;
        return { node: n, dist, lightyears, angle: Math.atan2(n.cy - camSnap.y, n.cx - camSnap.x), onScreen };
      })
      // 화면에 보이는 별자리 제외 + 3광년 초과만
      .filter((s) => !s.onScreen && s.lightyears > HIDE_LY)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 4);

    if (candidates.length === 0) return [];

    const maxDist = candidates[candidates.length - 1]?.dist ?? 1;
    return candidates.map((s) => ({
      angle: s.angle,
      lightyears: Math.round(s.lightyears),
      name: s.node.item.name,
      opacity: 0.3 + 0.7 * (1 - s.dist / maxDist),
      scale: 0.6 + 0.4 * (1 - s.dist / maxDist),
      toX: s.node.cx,
      toY: s.node.cy,
      nodeId: s.node.item.id,
    }));
  }, [nodes, camSnap, vw, vh, zoomSnap]);

  /* 호버 툴팁 위치 */
  const tooltipPos = useMemo(() => {
    if (!hoveredNode || typeof window === "undefined") return null;
    const W = window.innerWidth, H = window.innerHeight;
    const zoom = zoomSnap;
    const rawX = (hoveredNode.cx - camSnap.x) * zoom + W / 2;
    const rawY = (hoveredNode.cy - camSnap.y) * zoom + H / 2;
    return {
      x: Math.max(120, Math.min(W - 120, rawX)),
      y: rawY + LABEL_OFFSET * zoom + 10,
    };
  }, [hoveredNode, camSnap, zoomSnap]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#04050d]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* 상단 바 */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-5 py-4 pointer-events-none">
        <Link href="/" className="flex items-center gap-2 pointer-events-auto select-none">
          <div className="w-8 h-8 rounded-xl bg-violet-500/25 border border-violet-400/35 flex items-center justify-center backdrop-blur-sm">
            <Sparkles size={16} className="text-violet-300" />
          </div>
          <span className="font-bold text-white/90 text-sm tracking-tight">별자리 우주</span>
        </Link>

        <div className="flex items-center gap-2 pointer-events-auto">
          {!user && (
            <Link href="/login?from=/private"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/15 bg-black/30 text-white/60 text-xs font-medium hover:bg-white/10 hover:text-white transition-colors">
              <LogIn size={13} />로그인
            </Link>
          )}
        </div>
      </div>

      {/* 별자리 수 */}
      <div className="absolute top-16 inset-x-0 flex justify-center z-10 pointer-events-none">
        <span className="text-white/20 text-[11px] tracking-[0.25em] uppercase select-none">
          {universes.length}개의 별자리 우주
        </span>
      </div>

      {/* 줌 버튼 */}
      <div className="absolute right-5 z-20 flex flex-col gap-2 pointer-events-auto" style={{ bottom: "max(8rem, env(safe-area-inset-bottom, 0px) + 7rem)" }}>
        <button
          onClick={() => applyZoom(1.25, (canvasRef.current?.clientWidth ?? window.innerWidth) / 2, (canvasRef.current?.clientHeight ?? window.innerHeight) / 2)}
          className="w-9 h-9 rounded-xl bg-black/40 border border-white/15 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
          <Plus size={16} />
        </button>
        <button
          onClick={() => applyZoom(0.8, (canvasRef.current?.clientWidth ?? window.innerWidth) / 2, (canvasRef.current?.clientHeight ?? window.innerHeight) / 2)}
          className="w-9 h-9 rounded-xl bg-black/40 border border-white/15 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
          <Minus size={16} />
        </button>
        <div className="text-center text-white/20 text-[10px] select-none">{Math.round(zoomSnap * 100)}%</div>
      </div>

      {/* 호버 툴팁 */}
      {hoveredNode && tooltipPos && (
        <div
          className="absolute z-30 pointer-events-none -translate-x-1/2"
          style={{ left: tooltipPos.x, top: Math.min(tooltipPos.y, window.innerHeight - 120) }}
        >
          <div
            className="px-4 py-3 rounded-2xl backdrop-blur-xl border text-center shadow-xl"
            style={{
              backgroundColor: `${hoveredNode.item.color}12`,
              borderColor: `${hoveredNode.item.color}40`,
            }}
          >
            <p className="font-bold text-sm" style={{ color: hoveredNode.item.color }}>
              {hoveredNode.item.name}
            </p>
            {hoveredNode.item.role && (
              <p className="text-white/50 text-[11px] mt-0.5">{hoveredNode.item.role}</p>
            )}
            {hoveredNode.item.tagline && (
              <p className="text-white/55 text-[11px] mt-1 max-w-[180px] leading-relaxed">
                {hoveredNode.item.tagline}
              </p>
            )}
            <p className="text-white/25 text-[10px] mt-2">클릭해서 입장 →</p>
          </div>
        </div>
      )}

      {/* 드래그 힌트 (첫 4초) */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 transition-opacity duration-1000"
        style={{ opacity: showHint && universes.length > 0 && nearestHints.length === 0 ? 1 : 0 }}
      >
        <p className="text-white/20 text-sm tracking-widest uppercase select-none text-center">
          드래그해서 우주를 탐험하세요
        </p>
      </div>

      {/* 빈 우주 */}
      {universes.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <div className="w-16 h-16 rounded-full border border-white/10 bg-white/5 flex items-center justify-center mb-2">
              <Sparkles size={24} className="text-white/20" />
            </div>
            <p className="text-white/40 text-lg font-light tracking-wide">아직 아무도 없는 우주예요</p>
            <p className="text-white/20 text-sm leading-relaxed max-w-xs">
              지금 당신이 첫 번째 별자리를 새기면<br />이 우주 전체가 당신의 것이 됩니다
            </p>
          </div>
        </div>
      )}

      {/* 방향 힌트 (가까운 4개) — 화면 크기 비례 반경 배치 */}
      {nearestHints.map((hint, i) => {
        // 화면 크기의 30% 반경 — 뭉침 방지, 가장자리 근처 분산
        const radius = vw > 0 ? Math.min(vw, vh) * 0.32 : 130;

        return (
        <div
          key={i}
          className="absolute z-10 pointer-events-none"
          style={{
            left: `calc(50% + ${Math.cos(hint.angle) * radius}px)`,
            top: `calc(50% + ${Math.sin(hint.angle) * radius}px)`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            className="flex flex-col items-center gap-3"
            style={{
              opacity: warping ? 0 : hint.opacity,
              transform: `scale(${hint.scale})`,
              transition: "opacity 0.3s",
            }}
          >
            <div
              className="flex items-center justify-center animate-pulse"
              style={{ transform: `rotate(${hint.angle}rad)` }}
            >
              <svg width={Math.round(32 + hint.scale * 16)} height={Math.round(32 + hint.scale * 16)} viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-center space-y-1">
              <p className="text-white/70 text-sm font-semibold whitespace-nowrap">
                {directionName(hint.angle)} {hint.lightyears}광년
              </p>
              <p className="text-white/40 text-xs whitespace-nowrap">{hint.name}</p>
            </div>
            <button
              className="pointer-events-auto flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white border border-white/20 bg-white/10 hover:bg-white/20 active:scale-95 transition-all whitespace-nowrap backdrop-blur-sm"
              onClick={() => startWarp(hint.toX, hint.toY, hint.nodeId)}
            >
              🚀 워프
            </button>
          </div>
        </div>
        );
      })}

      {/* 하단 CTA + 미니 BGM 플레이어 */}
      <div className="absolute bottom-0 inset-x-0 flex flex-col items-center gap-2.5 z-20 pointer-events-none" style={{ paddingBottom: "max(5rem, env(safe-area-inset-bottom, 20px) + 4rem)" }}>

        {/* 미니 BGM 플레이어 — CTA 위에 자연스럽게 쌓임 */}
        {user && myTracks.length > 0 && (
          <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10">
            {myTracks.length > 1 && (
              <button
                onClick={() => setMyTrackIdx((myTrackIdx - 1 + myTracks.length) % myTracks.length)}
                className="text-white/40 hover:text-white/80 transition-colors">
                <SkipBack size={11} />
              </button>
            )}
            <button
              onClick={() => (isPlaying && mode === "mine") ? pause() : play()}
              className="text-white/70 hover:text-white transition-colors">
              {(isPlaying && mode === "mine") ? <Pause size={14} /> : <Play size={14} />}
            </button>
            {myTracks.length > 1 && (
              <button
                onClick={() => setMyTrackIdx((myTrackIdx + 1) % myTracks.length)}
                className="text-white/40 hover:text-white/80 transition-colors">
                <SkipForward size={11} />
              </button>
            )}
            <span className="text-white/40 text-[10px] max-w-[90px] truncate ml-1">
              {myTracks[myTrackIdx]?.name ?? "—"}
            </span>
          </div>
        )}

        {/* 케이스 1: 별자리 있음 → 내 별자리로 가기 + 추가 버튼(유료) */}
        {myConstellationId && (
          <div className="pointer-events-auto flex items-center gap-2">
            <Link
              href={`/p/${myConstellationId}`}
              className="flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-white text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-900/40 select-none"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
            >
              <Sparkles size={16} />
              나의 별자리로 가기
            </Link>
            <button
              disabled
              title="곧 출시 예정 (유료)"
              className="flex items-center gap-1.5 px-4 py-3.5 rounded-full text-sm font-semibold text-white/40 border border-white/15 bg-white/5 cursor-not-allowed select-none"
            >
              <Plus size={15} />
              별자리 추가
            </button>
          </div>
        )}

        {/* 케이스 2: 로그인 + 별자리 없음 → 만들기 (바로 생성 페이지) */}
        {user && !myConstellationId && (
          <Link
            href="/private"
            className="pointer-events-auto flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-white text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-900/40 select-none"
            style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
          >
            <Sparkles size={16} />
            나만의 별자리 만들기
          </Link>
        )}

        {/* 케이스 3: 비로그인 → 만들기 (회원가입 유도) */}
        {!user && (
          <>
            <Link
              href="/signup?from=/private"
              className="pointer-events-auto flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-white text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-900/40 select-none"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
            >
              <Sparkles size={16} />
              나만의 별자리 만들기
            </Link>
            <p className="text-white/25 text-xs select-none">이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-violet-400/70 hover:text-violet-400 pointer-events-auto underline underline-offset-2 transition-colors">
                로그인
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
