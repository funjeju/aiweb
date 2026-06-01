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
  shootingStarIntervalMs = 10000,
  onStarClick,
}: {
  constellation: Constellation;
  showLabels?: boolean;
  shootingStarIntervalMs?: number;
  onStarClick?: (star: import("@/lib/universe/stars").ConstellationStar) => void;
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
    const glowMult = starGlow === "soft" ? 0.6 : starGlow === "intense" ? 1.6 : 1.0;

    // 별똥별 상태
    interface ShootingStar {
      x: number; y: number;
      vx: number; vy: number;
      life: number; maxLife: number;
      len: number; // 꼬리 길이
    }
    let shootingStars: ShootingStar[] = [];

    const spawnShootingStar = () => {
      // 방향 4가지: 좌→우, 우→좌, 위→아래(대각), 위→아래(대각반대)
      const dir = Math.floor(Math.random() * 4);
      // 느리고 오래 — 화면을 가로/세로로 완전히 횡단
      const speed = 3.5 + Math.random() * 2.5;
      // maxLife를 넉넉하게 (화면 대각선 완주: ~150~200프레임)
      const maxLife = 150 + Math.floor(Math.random() * 60);

      let x: number, y: number, vx: number, vy: number;

      if (dir === 0) {
        // 좌 → 우 (약간 아래)
        x = -0.08; y = 0.05 + Math.random() * 0.5;
        const a = 0.08 + Math.random() * 0.2; // 얕은 각도
        vx = Math.cos(a) * speed / w * 100;
        vy = Math.sin(a) * speed / h * 100;
      } else if (dir === 1) {
        // 우 → 좌 (약간 아래)
        x = 1.08; y = 0.05 + Math.random() * 0.5;
        const a = 0.08 + Math.random() * 0.2;
        vx = -Math.cos(a) * speed / w * 100;
        vy = Math.sin(a) * speed / h * 100;
      } else if (dir === 2) {
        // 위 → 아래 (왼쪽에서 오른쪽 대각)
        x = Math.random() * 0.6; y = -0.08;
        const a = Math.PI / 2 - 0.3 + Math.random() * 0.3;
        vx = Math.cos(a) * speed / w * 100;
        vy = Math.sin(a) * speed / h * 100;
      } else {
        // 위 → 아래 (오른쪽에서 왼쪽 대각)
        x = 0.4 + Math.random() * 0.6; y = -0.08;
        const a = Math.PI / 2 - 0.3 + Math.random() * 0.3;
        vx = -Math.cos(a) * speed / w * 100;
        vy = Math.sin(a) * speed / h * 100;
      }

      shootingStars.push({ x, y, vx, vy, life: 0, maxLife, len: 0.18 + Math.random() * 0.1 });
    };

    // 설정된 주기마다 별똥별 소환 (어드민 전역 설정, 최소 2초)
    const intervalMs = Math.max(2000, shootingStarIntervalMs);
    const shootTimer = setInterval(spawnShootingStar, intervalMs);
    // 첫 로드 후 3초에 선제 발사
    const firstShot = setTimeout(spawnShootingStar, 3000);

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

      // 별똥별
      shootingStars = shootingStars.filter((ss) => ss.life < ss.maxLife);
      for (const ss of shootingStars) {
        const progress = ss.life / ss.maxLife;
        const alpha = progress < 0.15
          ? progress / 0.15                        // fade in
          : progress > 0.7
            ? 1 - (progress - 0.7) / 0.3          // fade out
            : 1;

        const px = ss.x * w;
        const py = ss.y * h;
        const tailX = px - ss.vx * ss.len * w * 0.3;
        const tailY = py - ss.vy * ss.len * h * 0.3;

        // 꼬리 그라데이션
        const lg = ctx.createLinearGradient(tailX, tailY, px, py);
        lg.addColorStop(0, "rgba(255,255,255,0)");
        lg.addColorStop(0.6, `rgba(255,255,255,${alpha * 0.4})`);
        lg.addColorStop(1, `rgba(255,255,255,${alpha})`);
        ctx.strokeStyle = lg;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.moveTo(tailX, tailY); ctx.lineTo(px, py); ctx.stroke();

        // 머리 글로우
        const glow = ctx.createRadialGradient(px, py, 0, px, py, 6);
        glow.addColorStop(0, `rgba(255,255,255,${alpha})`);
        glow.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = glow;
        ctx.globalAlpha = alpha * 0.8;
        ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();

        // 위치 업데이트
        ss.x += ss.vx / w;
        ss.y += ss.vy / h;
        ss.life++;
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

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      clearInterval(shootTimer);
      clearTimeout(firstShot);
    };
  }, [constellation, showLabels, skyTheme, lineStyle, starGlow, shootingStarIntervalMs]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onStarClick) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    // 클릭 반경 (정규화 좌표 기준 6%)
    const THRESHOLD = 0.06;
    let closest = null as import("@/lib/universe/stars").ConstellationStar | null;
    let minDist = Infinity;
    for (const star of constellation.stars) {
      const dist = Math.sqrt((star.x - nx) ** 2 + (star.y - ny) ** 2);
      if (dist < THRESHOLD && dist < minDist) { minDist = dist; closest = star; }
    }
    if (closest) onStarClick(closest);
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full cursor-pointer"
      onClick={handleClick}
    />
  );
}
