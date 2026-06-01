"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSitesByOwner, deleteSite } from "@/lib/firebase/sites";
import { getPersonalsByOwner, deletePersonal } from "@/lib/firebase/personals";
import { useAuthStore } from "@/lib/store/authStore";
import { canManageSites } from "@/lib/firebase/users";
import { logout } from "@/lib/firebase/auth";
import type { SiteSchema } from "@/lib/types/site";
import type { PersonalSchema } from "@/lib/types/personal";
import { getAppUrl } from "@/lib/utils";
// slug 재등록은 서버사이드 API route로 처리 (CORS 우회)
import {
  Plus, Globe, Pencil, ExternalLink, Sparkles, LogOut, User,
  MoreVertical, Trash2, Layers, Star, Building2, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "business" | "personal";

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { user, profile, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const canBusiness = canManageSites(profile);
  const defaultTab: Tab = canBusiness ? "business" : "personal";
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) || defaultTab);

  const [sites, setSites] = useState<SiteSchema[]>([]);
  const [pages, setPages] = useState<PersonalSchema[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/login"); return; }
    if (profile === null) return; // AuthProvider 대기

    setLoadingData(true);
    const loads: Promise<void>[] = [
      getPersonalsByOwner(user.uid).then((p) => setPages(p)),
    ];
    if (canBusiness) {
      loads.push(getSitesByOwner(user.uid).then((s) => setSites(s)));
    }
    Promise.all(loads).finally(() => setLoadingData(false));
  }, [user, profile, authLoading, canBusiness, router]);

  // 탭 기본값: canBusiness 확정되면 재설정
  useEffect(() => {
    if (!searchParams.get("tab")) setTab(canBusiness ? "business" : "personal");
  }, [canBusiness, searchParams]);

  const handleLogout = async () => { await logout(); router.push("/"); };

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h1 className="text-lg font-bold text-gray-900">AI 웹빌더</h1>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-6 py-8 space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />)}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h1 className="text-lg font-bold text-gray-900">AI 웹빌더</h1>
        </div>
        <div className="flex items-center gap-3">
          {tab === "business" && canBusiness && (
            <Link href="/create" className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-colors">
              <Plus size={16} />새 홈페이지
            </Link>
          )}
          {tab === "personal" && (
            <Link href="/private/create" className="flex items-center gap-2 px-4 py-2 bg-violet-500 text-white rounded-xl text-sm font-semibold hover:bg-violet-600 transition-colors">
              <Plus size={16} />새 별자리
            </Link>
          )}
          <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg" title="로그아웃">
            <LogOut size={18} className="text-gray-500" />
          </button>
        </div>
      </header>

      {/* 유저 정보 */}
      <div className="max-w-2xl mx-auto px-6 pt-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
            {user?.photoURL
              ? <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full" />
              : <User size={16} className="text-indigo-500" />
            }
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{user?.displayName || user?.email}</p>
            <p className="text-xs text-gray-400">
              {canBusiness ? `비즈니스 ${sites.length}개 · ` : ""}개인 페이지 {pages.length}개
            </p>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
          {canBusiness && (
            <button
              onClick={() => setTab("business")}
              className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
                tab === "business" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              <Building2 size={14} />비즈니스
              {sites.length > 0 && (
                <span className={cn("text-xs rounded-full px-1.5", tab === "business" ? "bg-indigo-100 text-indigo-600" : "bg-gray-200 text-gray-500")}>
                  {sites.length}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => setTab("personal")}
            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
              tab === "personal" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
          >
            <Star size={14} />개인 페이지
            {pages.length > 0 && (
              <span className={cn("text-xs rounded-full px-1.5", tab === "personal" ? "bg-violet-100 text-violet-600" : "bg-gray-200 text-gray-500")}>
                {pages.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-6 pb-8">
        {/* ── 비즈니스 탭 ── */}
        {tab === "business" && canBusiness && (
          <>
            {sites.length === 0 ? (
              <EmptyState
                icon={<Building2 size={28} className="text-indigo-400" />}
                bg="bg-indigo-50"
                title="아직 홈페이지가 없어요"
                desc="AI로 3분 안에 첫 홈페이지를 만들어보세요"
                action={<Link href="/create" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-2xl font-semibold hover:bg-indigo-600"><Plus size={18} />홈페이지 만들기</Link>}
              />
            ) : (
              <div className="space-y-4">
                {sites.map((site) => (
                  <SiteCard key={site.siteId} site={site} onDelete={() => setSites((p) => p.filter((s) => s.siteId !== site.siteId))} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── 개인 탭 ── */}
        {tab === "personal" && (
          <>
            {pages.length === 0 ? (
              <EmptyState
                icon={<Star size={28} className="text-violet-400" />}
                bg="bg-violet-50"
                title="아직 만든 페이지가 없어요"
                desc="별자리로 나만의 우주 홈페이지를 만들어보세요"
                action={<Link href="/private/create" className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500 text-white rounded-2xl font-semibold hover:bg-violet-600"><Plus size={18} />별자리 만들기</Link>}
              />
            ) : (
              <div className="space-y-3">
                {pages.map((p) => (
                  <PersonalCard key={p.id} page={p} onDelete={() => setPages((prev) => prev.filter((x) => x.id !== p.id))} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* ── 빈 상태 ── */
function EmptyState({ icon, bg, title, desc, action }: {
  icon: React.ReactNode; bg: string; title: string; desc: string; action: React.ReactNode;
}) {
  return (
    <div className="text-center py-20">
      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4", bg)}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm mb-6">{desc}</p>
      {action}
    </div>
  );
}

/* ── 비즈니스 사이트 카드 ── */
function SiteCard({ site, onDelete }: { site: SiteSchema; onDelete: () => void }) {
  const appUrl = getAppUrl();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`"${site.merchantInfo.name}" 홈페이지를 삭제할까요? 되돌릴 수 없습니다.`)) return;
    setDeleting(true);
    try { await deleteSite(site.siteId); onDelete(); }
    catch { setDeleting(false); alert("삭제에 실패했습니다."); }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-gray-900 truncate">{site.merchantInfo.name}</p>
          {site.published
            ? <span className="shrink-0 flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><Globe size={10} />공개중</span>
            : <span className="shrink-0 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">비공개</span>
          }
        </div>
        <p className="text-xs text-gray-400 truncate">{site.merchantInfo.category}</p>
      </div>
      <div className="flex items-center gap-1 ml-4">
        <a href={`${appUrl}/${site.siteId}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 rounded-lg" title="미리보기">
          <ExternalLink size={16} className="text-gray-500" />
        </a>
        <Link href={`/editor/${site.siteId}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-xl font-semibold hover:bg-gray-700">
          <Pencil size={14} />편집
        </Link>
        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)} className="p-2 hover:bg-gray-100 rounded-lg" disabled={deleting}>
            <MoreVertical size={16} className="text-gray-500" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                <Link href={`/editor/${site.siteId}/brand-kit`} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  <Layers size={14} />마케팅 키트
                </Link>
                <button onClick={handleDelete} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                  <Trash2 size={14} />삭제
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 개인 페이지 카드 ── */
function PersonalCard({ page, onDelete }: { page: PersonalSchema; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fixing, setFixing] = useState(false);

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!confirm(`"${page.profile.name}" 페이지를 삭제할까요?`)) return;
    setDeleting(true);
    try { await deletePersonal(page.id); onDelete(); }
    catch { setDeleting(false); alert("삭제에 실패했습니다."); }
  };

  // 슬러그 재등록 — 서버사이드 API route 호출 (CORS 우회)
  const handleFixSlug = async () => {
    setMenuOpen(false);
    // publicSlug가 없으면 personalId를 slug로 사용해서 새로 발급
    const slugToFix = page.publicSlug || page.id;
    setFixing(true);
    try {
      const res = await fetch("/api/slug/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slugToFix, personalId: page.id }),
      });
      const data = await res.json();
      if (data.success) {
        const msg = data.registrySucceeded
          ? `✅ 주소 발급 완료!\n${data.publicUrl}`
          : `⚠️ 단축 URL 서비스 연결 불가\n직접 주소로 저장되었습니다:\n${data.publicUrl}\n\n(study.funjeju.com 프로젝트 재배포 후 재시도하면 단축 URL로 교체됩니다)`;
        alert(msg + "\n\n페이지를 새로고침하면 반영됩니다.");
      } else {
        alert(`❌ 오류: ${data.error}`);
      }
    } catch (e) {
      alert(`❌ 오류: ${String(e)}`);
    } finally { setFixing(false); }
  };

  const isUniverse = !!page.universe;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: isUniverse ? `${page.universe!.color}22` : "#f3f4f6" }}>
          {isUniverse
            ? <Star size={18} style={{ color: page.universe!.color }} />
            : <User size={18} className="text-gray-400" />
          }
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900 truncate">{page.profile.name || "이름 없음"}</p>
            {page.published
              ? <span className="shrink-0 flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><Globe size={10} />공개</span>
              : <span className="shrink-0 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">비공개</span>
            }
          </div>
          <p className="text-xs text-gray-400 truncate">
            {page.publicUrl || (isUniverse ? "별자리 우주" : "개인 페이지")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 ml-3 shrink-0">
        <a href={`/p/${page.id}`} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-100 rounded-lg" title="보기">
          <ExternalLink size={16} className="text-gray-500" />
        </a>
        <Link href={`/private/edit/${page.id}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-xl font-semibold hover:bg-gray-700">
          <Pencil size={14} />편집
        </Link>
        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)} disabled={deleting || fixing}
            className="p-2 hover:bg-gray-100 rounded-lg">
            {fixing
              ? <RefreshCw size={15} className="text-violet-500 animate-spin" />
              : <MoreVertical size={15} className="text-gray-500" />}
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                <button onClick={handleFixSlug}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-violet-600 hover:bg-violet-50">
                  <RefreshCw size={14} />{page.publicUrl ? "주소 재등록" : "주소 발급"}
                </button>
                <button onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                  <Trash2 size={14} />삭제
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
