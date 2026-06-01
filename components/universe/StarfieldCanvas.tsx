"use client";

import { useEffect, useRef } from "react";
import { mulberry32 } from "@/lib/universe/stars";
import type { Constellation } from "@/lib/universe/stars";

/**
 * 배경 밤하늘(무수한 별, 은은한 트윙클 + 미세 드리프트) + 중앙 유저 별자리(실제 별)
 * + 연결선 + 별 이름 라벨을 Canvas로 렌더하고 부드럽게 애니메이션.
 */
export function StarfieldCanvas({ constellation, showLabels = true }: { constellation: Constellation; showLabels?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // 배경 별 — 여러 레이어(원근감), 부드러운 트윙클 + 미세 드리프트
    const bgRng = mulberry32(constellation.seed ^ 0x9e3779b9);
    const BG_COUNT = 320;
    const bgStars = Array.from({ length: BG_COUNT }, () => {
      const depth = bgRng(); // 0(가까움)~1(멈)
      return {
        x: bgRng(), y: bgRng(),
        r: 0.3 + (1 - depth) * 1.4,
        base: 0.15 + bgRng() * 0.5,     // 기본 밝기
        amp: 0.15 + bgRng() * 0.45,     // 트윙클 진폭
        phase: bgRng() * Math.PI * 2,
        speed: 0.3 + bgRng() * 0.9,     // 느리고 스무스하게
        drift: (0.3 + depth) * 0.000004, // 미세 흐름 속도
        hue: bgRng() < 0.15 ? "#bcd0ff" : bgRng() < 0.3 ? "#fff3d6" : "#e8ecff",
      };
    });

    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const color = constellation.primaryColor || "#a78bfa";
    const cs = constellation.stars;

    const draw = (t: number) => {
      // 깊은 우주 배경
      const grad = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h / 2, Math.max(w, h) * 0.75);
      grad.addColorStop(0, "#0d1330");
      grad.addColorStop(0.5, "#080b1d");
      grad.addColorStop(1, "#04050d");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 배경 별 (부드러운 트윙클 + 가로 드리프트)
      for (const s of bgStars) {
        const tw = s.base + s.amp * (0.5 + 0.5 * Math.sin(t * 0.001 * s.speed + s.phase));
        let x = (s.x + t * s.drift) % 1;
        if (x < 0) x += 1;
        const px = x * w, py = s.y * h, r = s.r;
        // 큰 별은 살짝 글로우
        if (r > 1) {
          const g = ctx.createRadialGradient(px, py, 0, px, py, r * 4);
          g.addColorStop(0, s.hue); g.addColorStop(1, "transparent");
          ctx.globalAlpha = tw * 0.4; ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(px, py, r * 4, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = tw;
        ctx.fillStyle = s.hue;
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 별자리 연결선 (은은한 빛 흐름 — 그라데이션 펄스)
      ctx.lineWidth = 1.2;
      for (const [a, b] of constellation.links) {
        const x1 = cs[a].x * w, y1 = cs[a].y * h, x2 = cs[b].x * w, y2 = cs[b].y * h;
        const lg = ctx.createLinearGradient(x1, y1, x2, y2);
        lg.addColorStop(0, `${color}00`);
        lg.addColorStop(0.5, `${color}aa`);
        lg.addColorStop(1, `${color}00`);
        ctx.strokeStyle = lg;
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 0.0012 + x1 * 0.01);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // 별자리 별 (글로우 + 부드러운 반짝임)
      for (const s of cs) {
        const px = s.x * w, py = s.y * h;
        const tw = 0.7 + 0.3 * Math.sin(t * 0.0018 + px * 0.02);
        const r = s.size * 1.5;
        const g = ctx.createRadialGradient(px, py, 0, px, py, r * 6);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.25, color);
        g.addColorStop(0.6, `${color}55`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.globalAlpha = 0.55 * tw;
        ctx.beginPath(); ctx.arc(px, py, r * 6, 0, Math.PI * 2); ctx.fill();
        // 코어
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(px, py, r * 0.9, 0, Math.PI * 2); ctx.fill();

        // 실제 별 이름 라벨
        if (showLabels) {
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = "#ffffff";
          ctx.font = "10px ui-sans-serif, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(s.star.name, px, py - r * 2 - 4);
        }
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [constellation, showLabels]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}
