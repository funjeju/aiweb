"use client";

import { useState } from "react";
import { StarfieldCanvas } from "./StarfieldCanvas";
import { generateConstellation } from "@/lib/universe/stars";
import { User, BookOpen, Image as ImageIcon, Sparkles, X } from "lucide-react";

export interface UniverseMenu {
  id: string;
  label: string;
  icon: "profile" | "diary" | "gallery";
}

export interface UniverseData {
  name: string;
  color: string;
  favoriteNumber: number;
  menus: UniverseMenu[];
  about?: string;
}

const ICON: Record<string, React.ReactNode> = {
  profile: <User size={20} />,
  diary: <BookOpen size={20} />,
  gallery: <ImageIcon size={20} />,
};

// 메뉴를 별자리 중심 전후좌우에 배치 (최대 4~6개)
const MENU_POS = [
  { top: "18%", left: "50%" },   // 위
  { top: "50%", left: "16%" },   // 좌
  { top: "50%", left: "84%" },   // 우
  { top: "82%", left: "50%" },   // 아래
  { top: "26%", left: "22%" },   // 좌상
  { top: "26%", left: "78%" },   // 우상
];

export function UniverseHome({ data }: { data: UniverseData }) {
  const constellation = generateConstellation(data.name, data.color, data.favoriteNumber);
  const [openMenu, setOpenMenu] = useState<UniverseMenu | null>(null);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#05060f]">
      <StarfieldCanvas constellation={constellation} />

      {/* 중앙 별자리 이름 */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10">
        <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: data.color }}>Constellation of</p>
        <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
          {data.name}<span className="text-white/60">님의 별자리</span>
        </h1>
      </div>

      {/* 메뉴 노드 (전후좌우) */}
      {data.menus.slice(0, MENU_POS.length).map((menu, i) => (
        <button
          key={menu.id}
          onClick={() => setOpenMenu(menu)}
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 group"
          style={{ top: MENU_POS[i].top, left: MENU_POS[i].left }}
        >
          <span className="flex flex-col items-center gap-2">
            <span className="w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm border transition-transform group-hover:scale-110"
              style={{ backgroundColor: `${data.color}22`, borderColor: `${data.color}88`, color: "#fff", boxShadow: `0 0 20px ${data.color}55` }}>
              {ICON[menu.icon]}
            </span>
            <span className="text-xs font-medium text-white/80">{menu.label}</span>
          </span>
        </button>
      ))}

      {/* 하단 액션 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold text-white backdrop-blur-sm border"
          style={{ backgroundColor: `${data.color}22`, borderColor: `${data.color}66` }}
          onClick={() => alert("랜덤 이웃 구경은 2단계에서 곧 추가됩니다 ✨")}>
          <Sparkles size={15} />랜덤 이웃 구경
        </button>
      </div>

      {/* 메뉴 패널 */}
      {openMenu && (
        <div className="absolute inset-0 z-30 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setOpenMenu(null)}>
          <div className="w-full sm:max-w-md bg-[#0b1026] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 m-0 sm:m-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white">
                <span style={{ color: data.color }}>{ICON[openMenu.icon]}</span>
                <h2 className="font-bold text-lg">{openMenu.label}</h2>
              </div>
              <button onClick={() => setOpenMenu(null)} className="text-white/50 hover:text-white"><X size={20} /></button>
            </div>
            <div className="text-white/70 text-sm leading-relaxed min-h-[120px]">
              {openMenu.icon === "profile" && (data.about || "아직 소개가 작성되지 않았어요. 편집에서 채워보세요.")}
              {openMenu.icon === "diary" && "AI와 대화하며 하루를 기록하는 다이어리예요. (2단계에서 연동 예정)"}
              {openMenu.icon === "gallery" && "나만의 사진 성운. 갤러리는 곧 추가됩니다."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
