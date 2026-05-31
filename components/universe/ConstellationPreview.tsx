"use client";

import { useEffect, useRef } from "react";
import { generateConstellation } from "@/lib/universe/stars";

/** 마법사용 별자리 미리보기 (입력값 바뀌면 즉시 갱신, 정적 렌더). */
export function ConstellationPreview({ name, color, favoriteNumber }: { name: string; color: string; favoriteNumber: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 배경
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
    g.addColorStop(0, "#0b1026"); g.addColorStop(1, "#05060f");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

    const c = generateConstellation(name || "나의 우주", color, favoriteNumber);

    // 연결선
    ctx.strokeStyle = color; ctx.globalAlpha = 0.4; ctx.lineWidth = 1;
    for (const [a, b] of c.links) {
      ctx.beginPath();
      ctx.moveTo(c.stars[a].x * w, c.stars[a].y * h);
      ctx.lineTo(c.stars[b].x * w, c.stars[b].y * h);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 별
    for (const s of c.stars) {
      const px = s.x * w, py = s.y * h, r = s.size * 1.4;
      const glow = ctx.createRadialGradient(px, py, 0, px, py, r * 5);
      glow.addColorStop(0, color); glow.addColorStop(0.4, `${color}66`); glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow; ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.arc(px, py, r * 5, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
    }
  }, [name, color, favoriteNumber]);

  return <canvas ref={ref} className="w-full h-full" />;
}
