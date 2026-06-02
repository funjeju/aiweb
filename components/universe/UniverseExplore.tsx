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
import { Sparkles, LogIn, LayoutDashboard, Plus, Minus } from "lucide-react";

/* ─── 타입 ─────────────────────────────────────── */

export interface UniverseItem {
  id: string;
  name: string;
  color: string;
  favoriteNumber: number;
  constellationSeed?: number;
  tagline?: string;
  role?: string;
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

/* ─── 배경별 타일 (0~1 정규화, 타일링으로 무한 확장) ── */

const TILE_BG = (() => {
  const rng = mulberry32(0xc0ffee42);
  return Array.from({ length: TILE_STARS_PER }, () => ({
    tx: rng(),
    ty: rng(),
    r: 0.4 + rng() * 1.1,
    base: 0.2 + rng() * 0.35,
    amp: 0.1 + rng() * 0.2,
    phase: rng() * Math.PI * 2,
    speed: 0.4 + rng() * 0.8,
  }));
})();

/* ─── 가상 공간 크기 (별자리 수에 비례 확장) ──────── */

function getVirtualSize(n: number) {
  const side = Math.max(4, Math.ceil(Math.sqrt(n * 1.4)));
  return {
    W: Math.max(4800, side * 600),
    H: Math.max(3200, side * 400),
  };
}

/* ─── 유니버스 위치 계산 ─────────────────────────── */

function computePositions(universes: UniverseItem[]): Map<string, { cx: number; cy: number }> {
  const n = universes.length;
  const { W, H } = getVirtualSize(n);
  const cols = Math.ceil(Math.sqrt(n * 1.4));
  const rows = Math.ceil(n / cols);
  const cellW = W / cols;
  const cellH = H / rows;

  const sorted = [...universes].sort((a, b) => (hashString(a.id) >>> 0) - (hashString(b.id) >>> 0));
  const result = new Map<string, { cx: number; cy: number }>();
  sorted.forEach((u, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const rng = mulberry32(hashString(u.id));
    result.set(u.id, {
      cx: cellW * col + cellW * (0.18 + rng() * 0.64),
      cy: cellH * row + cellH * (0.18 + rng() * 0.64),
    });
  });
  return result;
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

  const { W: VIRTUAL_W, H: VIRTUAL_H } = useMemo(() => getVirtualSize(universes.length), [universes.length]);

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
    const posMap = computePositions(universes);
    return universes.map((item) => {
      const constellation = item.constellationSeed != null
        ? generateConstellationFromSeed(item.constellationSeed, item.color)
        : generateConstellation(item.name, item.color, item.favoriteNumber);
      const pos = posMap.get(item.id)!;
      return { item, constellation, cx: pos.cx, cy: pos.cy };
    });
  }, [universes]);

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

    for (let tx = -1; tx < tilesX; tx++) {
      for (let ty = -1; ty < tilesY; ty++) {
        for (const s of TILE_BG) {
          const px = offX + tx * tileW + s.tx * tileW;
          const py = offY + ty * tileH + s.ty * tileH;
          if (px < -4 || px > W + 4 || py < -4 || py > H + 4) continue;
          const alpha = s.base + s.amp * Math.sin(t * 0.001 * s.speed + s.phase);
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.fillStyle = "#e8ecff";
          ctx.beginPath();
          ctx.arc(px, py, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;

    /* 별자리 렌더 */
    const cellZoomed = CELL * zoom;
    for (const node of nodes) {
      const px = sx(node.cx), py = sy(node.cy);
      if (px < -margin || px > W + margin || py < -margin || py > H + margin) continue;

      const isHovered = node.item.id === hid;
      const pulse = 0.88 + 0.12 * Math.sin(t * 0.0014 + node.cx * 0.0007);
      const baseAlpha = isHovered ? 1 : 0.72;

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

      ctx.globalAlpha = baseAlpha * 0.38 * pulse;
      ctx.strokeStyle = node.item.color;
      ctx.lineWidth = isHovered ? 1.3 : 1;
      for (const [a, b] of c.links) {
        const ax = px + (c.stars[a].x - 0.5) * cellZoomed;
        const ay = py + (c.stars[a].y - 0.5) * cellZoomed;
        const bx = px + (c.stars[b].x - 0.5) * cellZoomed;
        const by = py + (c.stars[b].y - 0.5) * cellZoomed;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      }

      for (const s of c.stars) {
        const spx = px + (s.x - 0.5) * cellZoomed;
        const spy = py + (s.y - 0.5) * cellZoomed;
        const r = s.size * 1.4 * Math.max(0.5, zoom);

        const g = ctx.createRadialGradient(spx, spy, 0, spx, spy, r * 5);
        g.addColorStop(0, node.item.color);
        g.addColorStop(0.4, `${node.item.color}66`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.globalAlpha = baseAlpha * 0.38 * pulse;
        ctx.beginPath(); ctx.arc(spx, spy, r * 5, 0, Math.PI * 2); ctx.fill();

        ctx.globalAlpha = baseAlpha * pulse;
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

    animRef.current = requestAnimationFrame(render);
  }, [nodes]);

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
        canvas.style.cursor = id ? "pointer" : "grab";
      }
    };

    const onUp = (e: MouseEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      const id = hitTest(e.clientX, e.clientY);
      canvas.style.cursor = id ? "pointer" : "grab";
      if (!moved.current && id) router.push(`/p/${id}`);
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
    const hasVisible = nodes.some((n) => {
      const px = (n.cx - camSnap.x) * zoom + vw / 2;
      const py = (n.cy - camSnap.y) * zoom + vh / 2;
      return px > -margin && px < vw + margin && py > -margin && py < vh + margin;
    });
    if (hasVisible) return [];

    const sorted = [...nodes]
      .map((n) => ({
        node: n,
        dist: Math.hypot(n.cx - camSnap.x, n.cy - camSnap.y),
        angle: Math.atan2(n.cy - camSnap.y, n.cx - camSnap.x),
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 4);

    const maxDist = sorted[sorted.length - 1]?.dist ?? 1;
    return sorted.map((s) => ({
      angle: s.angle,
      lightyears: Math.min(10, Math.max(1, Math.round(s.dist / 120))),
      name: s.node.item.name,
      opacity: 0.3 + 0.7 * (1 - s.dist / maxDist),
      scale: 0.6 + 0.4 * (1 - s.dist / maxDist),
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
          {user ? (
            <Link href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/15 bg-black/30 text-white/70 text-xs font-medium hover:bg-white/10 hover:text-white transition-colors">
              <LayoutDashboard size={13} />내 대시보드
            </Link>
          ) : (
            <Link href="/login"
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
      <div className="absolute right-5 bottom-32 z-20 flex flex-col gap-2 pointer-events-auto">
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

      {/* 방향 힌트 (가까운 4개) */}
      {nearestHints.map((hint, i) => (
        <div
          key={i}
          className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
        >
          <div
            className="flex flex-col items-center gap-2"
            style={{
              opacity: hint.opacity,
              transform: `scale(${hint.scale})`,
              // 각 힌트를 중앙에서 방향별로 오프셋
              position: "absolute",
              left: `calc(50% + ${Math.cos(hint.angle) * 80}px)`,
              top: `calc(50% + ${Math.sin(hint.angle) * 80}px)`,
              translate: "-50% -50%",
            }}
          >
            <div
              className="flex items-center justify-center animate-pulse"
              style={{ transform: `rotate(${hint.angle}rad)` }}
            >
              <svg width={Math.round(20 + hint.scale * 12)} height={Math.round(20 + hint.scale * 12)} viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-center space-y-0.5">
              <p className="text-white/60 text-[11px] font-medium whitespace-nowrap">
                {directionName(hint.angle)} {hint.lightyears}광년
              </p>
              <p className="text-white/30 text-[10px] whitespace-nowrap">{hint.name}</p>
            </div>
          </div>
        </div>
      ))}

      {/* 하단 CTA */}
      <div className="absolute bottom-8 inset-x-0 flex flex-col items-center gap-3 z-20 pointer-events-none">
        <Link
          href={user ? "/private/create/universe" : "/signup"}
          className="pointer-events-auto flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-white text-sm transition-all hover:scale-105 active:scale-95 shadow-lg shadow-violet-900/40 select-none"
          style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
        >
          <Sparkles size={16} />
          나만의 별자리 만들기
        </Link>
        {!user && (
          <p className="text-white/25 text-xs select-none">이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-violet-400/70 hover:text-violet-400 pointer-events-auto underline underline-offset-2 transition-colors">
              로그인
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
