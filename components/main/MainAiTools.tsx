"use client";

import Link from "next/link";
import { CreditCard, Image as ImageIcon, FileText, QrCode, Megaphone, Sparkles, Lock } from "lucide-react";

interface Tool {
  label: string;
  desc: string;
  icon: React.ReactNode;
  href?: string;
  premium?: boolean;
}

const TOOLS: Tool[] = [
  { label: "디지털 명함", desc: "QR 포함 명함을 무료로 체험", icon: <CreditCard size={22} />, href: "/tools/business-card" },
  { label: "메뉴 포스터", desc: "사진 한 장으로 메뉴판 제작", icon: <ImageIcon size={22} />, href: "/create" },
  { label: "SNS 카드", desc: "인스타·스레드용 카드 생성", icon: <Megaphone size={22} />, href: "/create" },
  { label: "QR 메뉴판", desc: "테이블 QR 메뉴판", icon: <QrCode size={22} />, href: "/create" },
  { label: "AI 매거진 글", desc: "업체 포함 정보성 글 자동 발행", icon: <FileText size={22} />, premium: true },
  { label: "카드뉴스 자동발행", desc: "사진 모아 SNS 자동 게시", icon: <Sparkles size={22} />, premium: true },
];

export function MainAiTools() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">AI 마케팅 도구</h1>
        <p className="text-sm text-gray-500 mt-1">소상공인을 위한 AI 툴 모음</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {TOOLS.map((tool) => {
          const inner = (
            <div className="relative h-full rounded-2xl border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors">
              {tool.premium && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  <Lock size={9} />PRO
                </span>
              )}
              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-3">
                {tool.icon}
              </div>
              <p className="font-bold text-gray-900 text-sm">{tool.label}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{tool.desc}</p>
            </div>
          );
          return tool.href && !tool.premium ? (
            <Link key={tool.label} href={tool.href}>{inner}</Link>
          ) : (
            <button key={tool.label} className="text-left" disabled={tool.premium} title={tool.premium ? "준비 중 (유료)" : ""}>
              {inner}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 text-center mt-6">
        PRO 도구(AI 매거진·카드뉴스 자동발행)는 곧 출시됩니다
      </p>
    </div>
  );
}
