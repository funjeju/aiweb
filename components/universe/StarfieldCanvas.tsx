"use client";

import { useEffect, useRef } from "react";
import { mulberry32 } from "@/lib/universe/stars";
import type { Constellation } from "@/lib/universe/stars";

/**
 * 배경 밤하늘(무수한 별) + 중앙 유저 별자리 + 연결선을 Canvas로 렌더하고 반짝임 애니메이션.
 * 메뉴 노드는 별도 DOM으로 위에 얹는다(클릭 위해).
 */
export function StarfieldCanvas({ constellation }: { constellation: Constellation }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // 배경 별 (시드 기반, 화면 가득) — 성능 위해 개수 제한
    const bgRng = mulberry32(constellation.seed ^ 0x9e3779b9);
    const BG_COUNT = 220;
    const bgStars = Array.from({ length: BG_COUNT }, () => ({
      x: bgRng(), y: bgRng(),
      r: 0.4 + bgRng() * 1.3,
      tw: bgRng() * Math.PI * 2, // 반짝임 위상
      sp: 0.5 + bgRng() * 1.5,
    }));

    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const color = constellation.primaryColor || "#a78bfa";

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);

      // 배경 그라데이션 (깊은 우주)
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
      grad.addColorStop(0, "#0b1026");
      grad.addColorStop(1, "#05060f");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 배경 별
      for (const s of bgStars) {
        const tw = 0.5 + 0.5 * Math.sin(t * 0.001 * s.sp + s.tw);
        ctx.globalAlpha = 0.3 + tw * 0.6;
        ctx.fillStyle = "#cdd6ff";
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 별자리 연결선 (희미하게 빛 흐름)
      const cs = constellation.stars;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.35;
      for (const [a, b] of constellation.links) {
        ctx.beginPath();
        ctx.moveTo(cs[a].x * w, cs[a].y * h);
        ctx.lineTo(cs[b].x * w, cs[b].y * h);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // 별자리 별 (글로우 + 반짝임)
      for (const s of cs) {
        const px = s.x * w, py = s.y * h;
        const tw = 0.6 + 0.4 * Math.sin(t * 0.002 + px);
        const r = s.size * 1.6;
        const g = ctx.createRadialGradient(px, py, 0, px, py, r * 5);
        g.addColorStop(0, color);
        g.addColorStop(0.4, `${color}66`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.globalAlpha = 0.5 * tw;
        ctx.beginPath(); ctx.arc(px, py, r * 5, 0, Math.PI * 2); ctx.fill();
        // 코어
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [constellation]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}
