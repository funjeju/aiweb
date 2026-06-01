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
import { Sparkles, LogIn, LayoutDashboard } from "lucide-react";

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
  cx: number; // virtual-space center
  cy: number;
}

/* ─── 상수 ─────────────────────────────────────── */

const VIRTUAL_W = 4800;
const VIRTUAL_H = 3200;
const CELL = 200;     // 별자리 표시 영역 지름
const LABEL_OFFSET = CELL * 0.52 + 18;

/* ─── 배경별 (고정 시드, 800개) ─────────────────── */

const BG_STARS = (() => {
  const rng = mulberry32(0xc0ffee42);
  return Array.from({ length: 800 }, () => ({
    vx: rng() * VIRTUAL_W,
    vy: rng() * VIRTUAL_H,
    r: 0.4 + rng() * 1.1,
    base: 0.2 + rng() * 0.35,
    amp: 0.1 + rng() * 0.2,
    phase: rng() * Math.PI * 2,
    speed: 0.4 + rng() * 0.8,
  }));
})();

/* ─── 유니버스 위치 계산 (그리드 + 지터) ─────────── */

function computePositions(universes: UniverseItem[]): Map<string, { cx: number; cy: number }> {
  const n = universes.length;
  const cols = Math.ceil(Math.sqrt(n * 1.4));
  const rows = Math.ceil(n / cols);
  const cellW = VIRTUAL_W / cols;
  const cellH = VIRTUAL_H / rows;

  // hash 순서로 정렬 → 배열 순서와 무관하게 위치 고정
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

/* ─── 메인 컴포넌트 ─────────────────────────────── */

export function UniverseExplore({ universes }: { universes: UniverseItem[] }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* 카메라 (virtual-space 중심점) */
  const camRef = useRef({ x: VIRTUAL_W / 2, y: VIRTUAL_H / 2 });
  const [camSnap, setCamSnap] = useState({ x: VIRTUAL_W / 2, y: VIRTUAL_H / 2 });

  /* 드래그 */
  const dragging = useRef(false);
  const moved = useRef(false);
  const dragOrigin = useRef({ mx: 0, my: 0, cx: 0, cy: 0 });

  /* 호버 */
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const hoveredRef = useRef<string | null>(null);

  /* 첫 방문 힌트 */
  const [showHint, setShowHint] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(t);
  }, []);

  /* 노드 계산 */
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

  /* 초기 카메라: 전체 별자리 무게중심 */
  useEffect(() => {
    if (nodes.length === 0) return;
    const cx = nodes.reduce((s, n) => s + n.cx, 0) / nodes.length;
    const cy = nodes.reduce((s, n) => s + n.cy, 0) / nodes.length;
    camRef.current = { x: cx, y: cy };
    setCamSnap({ x: cx, y: cy });
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
    const hid = hoveredRef.current;
    const t = performance.now();

    const sx = (vx: number) => vx - camX + W / 2;
    const sy = (vy: number) => vy - camY + H / 2;
    const margin = CELL + 60;

    /* 배경 그라디언트 */
    const bg = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H / 2, Math.max(W, H) * 0.85);
    bg.addColorStop(0, "#0d1330");
    bg.addColorStop(0.55, "#080b1d");
    bg.addColorStop(1, "#04050d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* 배경별 */
    for (const s of BG_STARS) {
      const px = sx(s.vx), py = sy(s.vy);
      if (px < -4 || px > W + 4 || py < -4 || py > H + 4) continue;
      const alpha = s.base + s.amp * Math.sin(t * 0.001 * s.speed + s.phase);
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = "#e8ecff";
      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* 별자리 렌더 */
    for (const node of nodes) {
      const px = sx(node.cx), py = sy(node.cy);
      if (px < -margin || px > W + margin || py < -margin || py > H + margin) continue;

      const isHovered = node.item.id === hid;
      const pulse = 0.88 + 0.12 * Math.sin(t * 0.0014 + node.cx * 0.0007);
      const baseAlpha = isHovered ? 1 : 0.72;

      /* 호버 글로우 링 */
      if (isHovered) {
        const ring = ctx.createRadialGradient(px, py, CELL * 0.1, px, py, CELL * 0.85);
        ring.addColorStop(0, `${node.item.color}30`);
        ring.addColorStop(0.6, `${node.item.color}18`);
        ring.addColorStop(1, "transparent");
        ctx.fillStyle = ring;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(px, py, CELL * 0.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      const c = node.constellation;

      /* 연결선 */
      ctx.globalAlpha = baseAlpha * 0.38 * pulse;
      ctx.strokeStyle = node.item.color;
      ctx.lineWidth = isHovered ? 1.3 : 1;
      for (const [a, b] of c.links) {
        const ax = px + (c.stars[a].x - 0.5) * CELL;
        const ay = py + (c.stars[a].y - 0.5) * CELL;
        const bx = px + (c.stars[b].x - 0.5) * CELL;
        const by = py + (c.stars[b].y - 0.5) * CELL;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }

      /* 별 */
      for (const s of c.stars) {
        const spx = px + (s.x - 0.5) * CELL;
        const spy = py + (s.y - 0.5) * CELL;
        const r = s.size * 1.4;

        /* 별빛 글로우 */
        const g = ctx.createRadialGradient(spx, spy, 0, spx, spy, r * 5);
        g.addColorStop(0, node.item.color);
        g.addColorStop(0.4, `${node.item.color}66`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.globalAlpha = baseAlpha * 0.38 * pulse;
        ctx.beginPath();
        ctx.arc(spx, spy, r * 5, 0, Math.PI * 2);
        ctx.fill();

        /* 별 코어 */
        ctx.globalAlpha = baseAlpha * pulse;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(spx, spy, r * 0.85, 0, Math.PI * 2);
        ctx.fill();
      }

      /* 이름 레이블 */
      ctx.globalAlpha = isHovered ? 0.95 : 0.55;
      ctx.fillStyle = isHovered ? node.item.color : "#c8cfe8";
      ctx.font = isHovered ? "bold 13px ui-sans-serif, system-ui, sans-serif" : "12px ui-sans-serif, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.95)";
      ctx.shadowBlur = 8;
      ctx.fillText(node.item.name, px, py + LABEL_OFFSET);
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
      let best: string | null = null;
      let bestDist = CELL * 0.62;
      for (const node of nodes) {
        const spx = node.cx - x + W / 2;
        const spy = node.cy - y + H / 2;
        const d = Math.sqrt((mx - spx) ** 2 + (my - spy) ** 2);
        if (d < bestDist) { bestDist = d; best = node.item.id; }
      }
      return best;
    };

    const clampCam = (x: number, y: number) => ({
      x: Math.max(0, Math.min(VIRTUAL_W, x)),
      y: Math.max(0, Math.min(VIRTUAL_H, y)),
    });

    /* 마우스 */
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
        const clamped = clampCam(dragOrigin.current.cx - dx, dragOrigin.current.cy - dy);
        camRef.current = clamped;
        setCamSnap(clamped);
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

    /* 터치 */
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      dragging.current = true;
      moved.current = false;
      dragOrigin.current = { mx: t.clientX, my: t.clientY, cx: camRef.current.x, cy: camRef.current.y };
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      const dx = t.clientX - dragOrigin.current.mx;
      const dy = t.clientY - dragOrigin.current.my;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved.current = true;
      const clamped = clampCam(dragOrigin.current.cx - dx, dragOrigin.current.cy - dy);
      camRef.current = clamped;
      setCamSnap(clamped);
    };

    const onTouchEnd = (e: TouchEvent) => {
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
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);
    canvas.style.cursor = "grab";

    return () => {
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [nodes, router]);

  /* 호버된 노드 */
  const hoveredNode = useMemo(
    () => nodes.find((n) => n.item.id === hoveredId) ?? null,
    [nodes, hoveredId]
  );

  /* 호버 툴팁 화면 위치 */
  const tooltipPos = useMemo(() => {
    if (!hoveredNode || typeof window === "undefined") return null;
    const W = window.innerWidth, H = window.innerHeight;
    const rawX = hoveredNode.cx - camSnap.x + W / 2;
    const rawY = hoveredNode.cy - camSnap.y + H / 2;
    return {
      x: Math.max(120, Math.min(W - 120, rawX)),
      y: rawY + LABEL_OFFSET + 10,
    };
  }, [hoveredNode, camSnap]);

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

      {/* 탐험 힌트 */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 transition-opacity duration-1000"
        style={{ opacity: showHint ? 1 : 0 }}
      >
        <p className="text-white/20 text-sm tracking-widest uppercase select-none text-center">
          드래그해서 우주를 탐험하세요
        </p>
      </div>

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
