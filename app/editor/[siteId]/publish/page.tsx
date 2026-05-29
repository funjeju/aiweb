"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSiteById, updateSite } from "@/lib/firebase/sites";
import type { SiteSchema } from "@/lib/types/site";
import { Globe, Link2, Copy, CheckCircle2, ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { cn, getAppUrl } from "@/lib/utils";

export default function PublishPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const router = useRouter();
  const [site, setSite] = useState<SiteSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [subdomain, setSubdomain] = useState("");
  const [available] = useState<boolean | null>(true);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [copied, setCopied] = useState(false);

  const appUrl = getAppUrl();

  useEffect(() => {
    getSiteById(siteId).then((s) => {
      if (s) {
        setSite(s);
        setSubdomain(s.subdomain || siteId);
        if (s.published) setPublished(true);
      }
      setLoading(false);
    });
  }, [siteId]);

  const handlePublish = async () => {
    if (!site) return;
    setPublishing(true);
    try {
      await updateSite(siteId, { published: true, subdomain });
      setPublished(true);
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!site) return;
    await updateSite(siteId, { published: false });
    setPublished(false);
  };

  const siteUrl = `${appUrl}/site/${siteId}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(siteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <Link href={`/editor/${siteId}`} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <h1 className="font-bold text-gray-900">홈페이지 공개 설정</h1>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8 space-y-6">
        {/* 공개 상태 */}
        <div className={cn(
          "rounded-3xl p-6 border",
          published ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
        )}>
          <div className="flex items-center gap-3 mb-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", published ? "bg-green-500" : "bg-gray-200")}>
              <Globe size={20} color="white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{published ? "공개 중" : "비공개"}</p>
              <p className="text-xs text-gray-500">{published ? "누구나 홈페이지를 볼 수 있어요" : "아직 공개되지 않았어요"}</p>
            </div>
          </div>

          {published ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-3 border border-green-200">
                <Link2 size={14} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 flex-1 truncate">{siteUrl}</span>
                <button onClick={copyUrl} className="flex-shrink-0">
                  {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-400" />}
                </button>
              </div>
              <div className="flex gap-2">
                <a href={siteUrl} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  <ExternalLink size={16} />미리보기
                </a>
                <button onClick={handleUnpublish}
                  className="flex-1 py-3 rounded-2xl bg-white border border-red-200 text-sm font-semibold text-red-500 hover:bg-red-50">
                  비공개로 전환
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handlePublish}
              disabled={publishing || available === false}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
            >
              {publishing ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />}
              {publishing ? "공개 중..." : "지금 공개하기"}
            </button>
          )}
        </div>

        {/* URL 설정 */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200">
          <p className="font-bold text-gray-900 mb-1">홈페이지 주소</p>
          <p className="text-xs text-gray-400 mb-4">고객에게 공유할 링크예요</p>
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 mb-3">
            <span className="text-sm text-gray-400 flex-shrink-0">{appUrl}/site/</span>
            <span className="text-sm font-semibold text-gray-800">{siteId}</span>
          </div>
          <p className="text-xs text-gray-400 text-center">* 커스텀 도메인은 추후 지원 예정</p>
        </div>

        {/* 공유 방법 */}
        {published && (
          <div className="bg-white rounded-3xl p-6 border border-gray-200">
            <p className="font-bold text-gray-900 mb-4">공유하기</p>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`https://pf.kakao.com/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#FEE500] text-[#3B1E08] font-semibold text-sm"
              >
                카카오톡 공유
              </a>
              <button
                onClick={copyUrl}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-sm"
              >
                {copied ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                링크 복사
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
