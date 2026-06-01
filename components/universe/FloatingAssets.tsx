"use client";

import { useMemo } from "react";
import Image from "next/image";
import { DEFAULT_ASSETS, PROFILE_PHOTO_ASSET } from "@/lib/types/asset";
import type { UniverseAsset } from "@/lib/types/asset";

/** mulberry32 PRNG — 결정적 랜덤 (시드 기반으로 위치 고정) */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s ^= s << 13; s ^= s >> 17; s ^= s << 5;
    return ((s >>> 0) / 0xffffffff);
  };
}

interface PlacedAsset {
  asset: UniverseAsset;
  top: string;
  left: string;
  size: number;
  duration: number;
  delay: number;
  amplitude: number;
}

export function FloatingAssets({
  selectedIds,
  seed,
  allAssets = DEFAULT_ASSETS,
  customPositions = {},
  profilePhotoUrl,
}: {
  selectedIds: string[];
  seed: number;
  allAssets?: UniverseAsset[];
  customPositions?: Record<string, { top: string; left: string }>;
  profilePhotoUrl?: string;
}) {
  const placed = useMemo<PlacedAsset[]>(() => {
    const rng = seededRandom(seed ^ 0xdeadbeef);
    return selectedIds.flatMap((id) => {
      let asset: UniverseAsset | undefined;
      if (id === "profile-photo") {
        if (!profilePhotoUrl) return [];
        asset = PROFILE_PHOTO_ASSET;
      } else {
        asset = allAssets.find((a) => a.id === id);
        if (!asset) return [];
      }
      const custom = customPositions[id];
      return [{
        asset,
        top: custom?.top ?? `${10 + rng() * 75}%`,
        left: custom?.left ?? `${5 + rng() * 85}%`,
        size: 28 + Math.floor(rng() * 20),
        duration: 4 + rng() * 6,
        delay: rng() * 4,
        amplitude: 10 + rng() * 20,
      }];
    });
  }, [selectedIds, seed, allAssets, customPositions]);

  if (placed.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes ua-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(var(--ua-amp, -15px)) rotate(3deg); }
        }
        @keyframes ua-drift {
          0%, 100% { transform: translateX(0px); }
          50%       { transform: translateX(var(--ua-amp, 20px)); }
        }
        @keyframes ua-orbit {
          0%   { transform: rotate(0deg)   translateX(var(--ua-amp, 40px)) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(var(--ua-amp, 40px)) rotate(-360deg); }
        }
        @keyframes ua-pulse {
          0%, 100% { transform: scale(1);    opacity: 0.85; }
          50%       { transform: scale(1.25); opacity: 1; }
        }
      `}</style>

      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {placed.map((p, i) => {
          const isPhoto = p.asset.id === "profile-photo";
          const photoSize = p.size + 20;
          return (
            <div
              key={`${p.asset.id}-${i}`}
              className="absolute select-none"
              style={{
                top: p.top,
                left: p.left,
                fontSize: isPhoto ? undefined : p.size,
                "--ua-amp": `${p.amplitude}px`,
                animation: `ua-${p.asset.animationType} ${p.duration.toFixed(1)}s ease-in-out ${p.delay.toFixed(1)}s infinite`,
                filter: isPhoto
                  ? "drop-shadow(0 0 12px rgba(255,255,255,0.35))"
                  : "drop-shadow(0 0 8px rgba(255,255,255,0.2))",
                opacity: 0.9,
              } as React.CSSProperties}
            >
              {isPhoto && profilePhotoUrl ? (
                <Image
                  src={profilePhotoUrl}
                  alt="프로필"
                  width={photoSize}
                  height={photoSize}
                  className="rounded-full object-cover border-2 border-white/40"
                  style={{ width: photoSize, height: photoSize }}
                />
              ) : (
                p.asset.emoji
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
