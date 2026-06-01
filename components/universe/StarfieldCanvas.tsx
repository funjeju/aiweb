"use client";

import { useEffect, useRef } from "react";
import { mulberry32 } from "@/lib/universe/stars";
import type { Constellation } from "@/lib/universe/stars";
import type { SkyTheme, LineStyle, StarGlow } from "@/lib/types/personal";

interface StyleProps {
  skyTheme?: SkyTheme;
  lineStyle?: LineStyle;
  starGlow?: StarGlow;
}

const SKY_GRADIENTS: Record<SkyTheme, [string, string, string]> = {
  "deep-space":    ["#0d1330", "#080b1d", "#04050d"],
  "purple-galaxy": ["#120820", "#0b0516", "#060208"],
  "jeju":          ["#071820", "#040e14", "#02090e"],
  "vintage":       ["#1a1208", "#100c04", "#080501"],
};

export function StarfieldCanvas({
  constellation, showLabels = true,
  skyTheme = "deep-space", lineStyle = "flow", starGlow = "default",
}: {
  constellation: Constellation;
  showLabels?: boolean;
} & StyleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const bgRng = mulberry32(constellation.seed ^ 0x9e3779b9);
    const BG_COUNT = 320;
    const bgStars = Array.from({ length: BG_COUNT }, () => {
      const depth = bgRng();
      return {
        x: bgRng(), y: bgRng(),
        r: 0.3 + (1 - depth) * 1.4,
        base: 0.15 + bgRng() * 0.5,
        amp: 0.15 + bgRng() * 0.45,
        phase: bgRng() * Math.PI * 2,
        speed: 0.3 + bgRng() * 0.9,
        drift: (0.3 + depth) * 0.000004,
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
    const [c0, c1, c2] = SKY_GRADIENTS[skyTheme];

    // starGlow 강도 계수
    const glowMult = starGlow === "soft" ? 0.6 : starGlow === "intense" ? 1.6 : 1.0;

    const draw = (t: number) => {
      const grad = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h / 2, Math.max(w, h) * 0.75);
      grad.addColorStop(0, c0);
      grad.addColorStop(0.5, c1);
      grad.addColorStop(1, c2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // vintage 테마 — 앤틱 성도 느낌 오버레이
      if (skyTheme === "vintage") {
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = "#d4a44c";
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      }
      // purple-galaxy — 중심 성운 글로우
      if (skyTheme === "purple-galaxy") {
        const nebula = ctx.createRadialGradient(w * 0.6, h * 0.35, 0, w * 0.6, h * 0.35, Math.min(w, h) * 0.4);
        nebula.addColorStop(0, "#6b21a820");
        nebula.addColorStop(1, "transparent");
        ctx.fillStyle = nebula;
        ctx.fillRect(0, 0, w, h);
      }
      // jeju — 옅은 청록 안개
      if (skyTheme === "jeju") {
        const mist = ctx.createRadialGradient(w * 0.3, h * 0.7, 0, w * 0.3, h * 0.7, Math.min(w, h) * 0.5);
        mist.addColorStop(0, "#0891b218");
        mist.addColorStop(1, "transparent");
        ctx.fillStyle = mist;
        ctx.fillRect(0, 0, w, h);
      }

      // 배경 별
      for (const s of bgStars) {
        const tw = s.base + s.amp * (0.5 + 0.5 * Math.sin(t * 0.001 * s.speed + s.phase));
        let x = (s.x + t * s.drift) % 1;
        if (x < 0) x += 1;
        const px = x * w, py = s.y * h, r = s.r;
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

      // 별자리 연결선
      for (const [a, b] of constellation.links) {
        const x1 = cs[a].x * w, y1 = cs[a].y * h, x2 = cs[b].x * w, y2 = cs[b].y * h;
        const pulse = 0.5 + 0.3 * Math.sin(t * 0.0012 + x1 * 0.01);

        if (lineStyle === "dotted") {
          ctx.setLineDash([4, 8]);
          ctx.strokeStyle = `${color}99`;
          ctx.lineWidth = 1.0;
          ctx.globalAlpha = pulse;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
          ctx.setLineDash([]);
        } else if (lineStyle === "aurora") {
          // 넓은 빛 번짐 + 가는 중심선
          ctx.lineWidth = 8;
          const lg = ctx.createLinearGradient(x1, y1, x2, y2);
          lg.addColorStop(0, `${color}00`);
          lg.addColorStop(0.5, `${color}44`);
          lg.addColorStop(1, `${color}00`);
          ctx.strokeStyle = lg;
          ctx.globalAlpha = pulse * 0.7;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

          ctx.lineWidth = 1.2;
          const lgc = ctx.createLinearGradient(x1, y1, x2, y2);
          lgc.addColorStop(0, `${color}00`);
          lgc.addColorStop(0.5, `${color}cc`);
          lgc.addColorStop(1, `${color}00`);
          ctx.strokeStyle = lgc;
          ctx.globalAlpha = pulse;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        } else {
          // flow (기본)
          ctx.lineWidth = 1.2;
          const lg = ctx.createLinearGradient(x1, y1, x2, y2);
          lg.addColorStop(0, `${color}00`);
          lg.addColorStop(0.5, `${color}aa`);
          lg.addColorStop(1, `${color}00`);
          ctx.strokeStyle = lg;
          ctx.globalAlpha = pulse;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      // 별자리 별
      for (const s of cs) {
        const px = s.x * w, py = s.y * h;
        const tw = 0.7 + 0.3 * Math.sin(t * 0.0018 + px * 0.02);
        const r = s.size * 1.5;
        const glowR = r * 6;
        const g = ctx.createRadialGradient(px, py, 0, px, py, glowR);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.25, color);
        g.addColorStop(0.6, `${color}55`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.globalAlpha = 0.55 * tw * glowMult;
        ctx.beginPath(); ctx.arc(px, py, glowR, 0, Math.PI * 2); ctx.fill();

        ctx.globalAlpha = 1;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(px, py, r * 0.9, 0, Math.PI * 2); ctx.fill();

        if (showLabels) {
          // save/restore로 shadow 상태 격리, Math.round로 픽셀 정렬
          ctx.save();
          ctx.shadowColor = "rgba(0,0,0,0.95)";
          ctx.shadowBlur = 6;
          ctx.globalAlpha = 0.88;
          ctx.fillStyle = "#ffffff";
          ctx.font = "500 11px ui-sans-serif, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(s.star.name, Math.round(px), Math.round(py - r * 2 - 5));
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [constellation, showLabels, skyTheme, lineStyle, starGlow]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}
