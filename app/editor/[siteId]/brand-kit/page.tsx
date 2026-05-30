"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSiteById } from "@/lib/firebase/sites";
import type { SiteSchema } from "@/lib/types/site";
import { getThemeTokens } from "@/lib/design/tokens";
import { formatPrice, getAppUrl } from "@/lib/utils";
import { ArrowLeft, Download, Loader2, Phone, MapPin, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { QRCode } from "@/components/QRCode";

type KitTab = "card" | "menu" | "sns";

const TAB_LABELS: Record<KitTab, string> = { card: "디지털 명함", menu: "메뉴 포스터", sns: "SNS 카드" };

export default function BrandKitPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const [site, setSite] = useState<SiteSchema | null>(null);
  const [tab, setTab] = useState<KitTab>("card");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSiteById(siteId).then((s) => { if (s) setSite(s); setLoading(false); });
  }, [siteId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-400" /></div>;
  if (!site) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href={`/editor/${siteId}`} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="font-bold text-gray-900">마케팅 키트</h1>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 flex">
        {(Object.keys(TAB_LABELS) as KitTab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 py-3 text-sm font-semibold transition-colors", tab === t ? "text-indigo-600 border-b-2 border-indigo-500" : "text-gray-500")}>
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      <main className="max-w-lg mx-auto px-6 py-8">
        {tab === "card" && <BusinessCard site={site} siteId={siteId} />}
        {tab === "menu" && <MenuPoster site={site} />}
        {tab === "sns" && <SnsCard site={site} />}
      </main>
    </div>
  );
}

/* ────── 디지털 명함 ────── */
function BusinessCard({ site, siteId }: { site: SiteSchema; siteId: string }) {
  const theme = getThemeTokens(site.designTokens.themeId);
  const cardRef = useRef<HTMLDivElement>(null);
  const appUrl = getAppUrl();
  const siteUrl = `${appUrl}/${siteId}`;

  const downloadCard = async () => {
    const { default: html2canvas } = await import("html2canvas");
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${site.merchantInfo.name}_명함.png`;
    a.click();
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">홈페이지 링크가 포함된 디지털 명함을 생성합니다</p>

      {/* Card Preview */}
      <div ref={cardRef} className="rounded-3xl overflow-hidden shadow-xl mb-6" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primary}cc)` }}>
        <div className="p-6 flex gap-4">
          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">{site.merchantInfo.category}</p>
              <p className="text-white text-2xl font-bold mt-1">{site.merchantInfo.name}</p>
            </div>
            {site.merchantInfo.description && (
              <p className="text-white/80 text-sm mb-5 line-clamp-2">{site.merchantInfo.description}</p>
            )}
            <div className="space-y-2">
              {site.merchantInfo.phone && (
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <Phone size={14} />
                  <span>{site.merchantInfo.phone}</span>
                </div>
              )}
              {site.merchantInfo.address && (
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <MapPin size={14} />
                  <span className="line-clamp-1">{site.merchantInfo.address}</span>
                </div>
              )}
            </div>
          </div>
          {/* QR 코드 */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            <div className="bg-white p-1.5 rounded-xl">
              <QRCode value={siteUrl} size={72} />
            </div>
            <span className="text-white/60 text-[10px]">스캔하기</span>
          </div>
        </div>
        <div className="bg-white/10 px-6 py-3 flex items-center gap-2">
          <Globe size={12} className="text-white/60" />
          <span className="text-white/60 text-xs truncate">{siteUrl}</span>
        </div>
      </div>

      <button onClick={downloadCard} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-colors">
        <Download size={18} />PNG 저장
      </button>
    </div>
  );
}

/* ────── 메뉴 포스터 ────── */
function MenuPoster({ site }: { site: SiteSchema }) {
  const theme = getThemeTokens(site.designTokens.themeId);
  const posterRef = useRef<HTMLDivElement>(null);
  const items = site.menuData.items.slice(0, 8);

  const downloadPoster = async () => {
    const { default: html2canvas } = await import("html2canvas");
    if (!posterRef.current) return;
    const canvas = await html2canvas(posterRef.current, { scale: 3, useCORS: true });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${site.merchantInfo.name}_메뉴.png`;
    a.click();
  };

  if (items.length === 0) return (
    <div className="text-center py-16">
      <p className="text-gray-500 text-sm">메뉴를 먼저 등록해주세요</p>
      <Link href={`/editor/${site.siteId}`} className="text-indigo-500 text-sm font-semibold mt-2 inline-block">에디터에서 메뉴 추가 →</Link>
    </div>
  );

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">메뉴 정보를 바탕으로 포스터를 생성합니다</p>

      <div ref={posterRef} className="rounded-3xl overflow-hidden shadow-xl mb-6" style={{ backgroundColor: theme.surface }}>
        <div className="p-6" style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.primary}cc)` }}>
          <p className="text-white text-xl font-bold">{site.merchantInfo.name}</p>
          <p className="text-white/80 text-sm">{site.merchantInfo.category} 메뉴</p>
        </div>
        <div className="p-5 space-y-0">
          {items.map((item, i) => (
            <div key={item.id} className="flex justify-between items-center py-3" style={{ borderBottom: i < items.length - 1 ? `1px solid ${theme.border}` : undefined }}>
              <p className="font-semibold text-sm" style={{ color: theme.text }}>{item.name}</p>
              <p className="font-bold text-sm" style={{ color: theme.primary }}>{formatPrice(item.price)}</p>
            </div>
          ))}
        </div>
      </div>

      <button onClick={downloadPoster} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-colors">
        <Download size={18} />메뉴 포스터 저장
      </button>
    </div>
  );
}

/* ────── SNS 카드 ────── */
function SnsCard({ site }: { site: SiteSchema }) {
  const theme = getThemeTokens(site.designTokens.themeId);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardType, setCardType] = useState<"intro" | "menu" | "event">("intro");

  const downloadCard = async () => {
    const { default: html2canvas } = await import("html2canvas");
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${site.merchantInfo.name}_SNS카드.png`;
    a.click();
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">인스타그램, 카카오에 바로 올릴 수 있는 정사각형 카드</p>

      <div className="flex gap-2 mb-4">
        {([["intro", "소개"], ["menu", "메뉴"], ["event", "이벤트"]] as const).map(([type, label]) => (
          <button key={type} onClick={() => setCardType(type)}
            className={cn("flex-1 py-2 rounded-xl text-sm font-semibold transition-colors", cardType === type ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-600")}>
            {label}
          </button>
        ))}
      </div>

      {/* 1:1 SNS Card */}
      <div ref={cardRef} className="rounded-3xl overflow-hidden shadow-xl mb-6 aspect-square relative" style={{ background: `linear-gradient(135deg, ${theme.primary}22, ${theme.surfaceAlt})`, backgroundColor: theme.surface }}>
        <div className="absolute inset-0 flex flex-col justify-center p-8">
          {cardType === "intro" && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: theme.primary }}>{site.merchantInfo.category}</p>
              <p className="text-3xl font-bold mb-3" style={{ color: theme.text }}>{site.merchantInfo.name}</p>
              <p className="text-sm leading-relaxed" style={{ color: theme.textMuted }}>{site.merchantInfo.description}</p>
              {site.merchantInfo.phone && (
                <div className="flex items-center gap-2 mt-4" style={{ color: theme.primary }}>
                  <Phone size={14} />
                  <span className="text-sm font-semibold">{site.merchantInfo.phone}</span>
                </div>
              )}
            </>
          )}
          {cardType === "menu" && (
            <>
              <p className="text-lg font-bold mb-4" style={{ color: theme.text }}>오늘의 메뉴</p>
              {site.menuData.items.slice(0, 4).map((item) => (
                <div key={item.id} className="flex justify-between py-2 border-b" style={{ borderColor: theme.border }}>
                  <span className="text-sm font-medium" style={{ color: theme.text }}>{item.name}</span>
                  <span className="text-sm font-bold" style={{ color: theme.primary }}>{formatPrice(item.price)}</span>
                </div>
              ))}
            </>
          )}
          {cardType === "event" && (
            <>
              <div className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4" style={{ backgroundColor: theme.primary, color: theme.primaryFg }}>
                이벤트
              </div>
              <p className="text-2xl font-bold mb-2" style={{ color: theme.text }}>{site.merchantInfo.name}</p>
              <p className="text-base" style={{ color: theme.textMuted }}>지금 방문하시면 특별한 혜택이 기다리고 있어요</p>
            </>
          )}
        </div>
      </div>

      <button onClick={downloadCard} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-colors">
        <Download size={18} />SNS 카드 저장
      </button>
    </div>
  );
}
