"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import { getAllPersonals, updatePersonal, saveCountry } from "@/lib/firebase/personals";
import { getUniverseConfig, setUniverseConfig } from "@/lib/firebase/config";
import { STAR_ARCHIVE, type StarArchiveData } from "@/lib/data/star-archive";
import type { PersonalSchema } from "@/lib/types/personal";
import {
  Loader2, Users, Globe, Star, Settings, Layers,
  ChevronRight, Search, Check, RefreshCw, ArrowUpRight,
  BarChart2, UserCheck, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── 상수 ─────────────────────────────────────── */

type Tab = "dashboard" | "users" | "stars" | "config" | "assets";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "대시보드",   icon: <BarChart2 size={15} /> },
  { id: "users",     label: "유저 관리",  icon: <Users size={15} /> },
  { id: "stars",     label: "별 도감",    icon: <Star size={15} /> },
  { id: "config",    label: "전역 설정",  icon: <Settings size={15} /> },
  { id: "assets",    label: "에셋",       icon: <Layers size={15} /> },
];

const COUNTRIES = [
  { code: "KR", name: "대한민국" }, { code: "US", name: "미국" },
  { code: "JP", name: "일본" }, { code: "CN", name: "중국" },
  { code: "GB", name: "영국" }, { code: "DE", name: "독일" },
  { code: "FR", name: "프랑스" }, { code: "CA", name: "캐나다" },
  { code: "AU", name: "호주" }, { code: "BR", name: "브라질" },
  { code: "IN", name: "인도" }, { code: "SG", name: "싱가포르" },
  { code: "TH", name: "태국" }, { code: "VN", name: "베트남" },
  { code: "TW", name: "대만" }, { code: "HK", name: "홍콩" },
  { code: "MX", name: "멕시코" }, { code: "ES", name: "스페인" },
  { code: "IT", name: "이탈리아" }, { code: "NL", name: "네덜란드" },
  { code: "SE", name: "스웨덴" }, { code: "NO", name: "노르웨이" },
  { code: "NZ", name: "뉴질랜드" }, { code: "PT", name: "포르투갈" },
];

function flag(code: string) {
  if (!code || code.length !== 2) return "🌐";
  return code.toUpperCase().replace(/./g, (c) =>
    String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))
  );
}

function countryName(code: string) {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

/* ─── 대시보드 탭 ───────────────────────────────── */

function DashboardTab({ personals }: { personals: PersonalSchema[] }) {
  const universeUsers = personals.filter((p) => !!p.universe?.color);
  const publishedUsers = personals.filter((p) => p.published === true);

  // 국가별 집계
  const countryMap: Record<string, number> = {};
  for (const p of universeUsers) {
    const code = p.country ?? "unknown";
    countryMap[code] = (countryMap[code] ?? 0) + 1;
  }
  const topCountries = Object.entries(countryMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  // 최근 7일 가입자
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentUsers = personals.filter((p) => {
    const ts = (p as any).createdAt?.seconds
      ? (p as any).createdAt.seconds * 1000
      : new Date(p.updatedAt ?? 0).getTime();
    return ts > sevenDaysAgo;
  });

  const stats = [
    { label: "전체 유저",      value: personals.length,      icon: <Users size={18} className="text-blue-500" />,   bg: "bg-blue-50" },
    { label: "우주 보유",      value: universeUsers.length,  icon: <Star size={18} className="text-violet-500" />,  bg: "bg-violet-50" },
    { label: "공개 우주",      value: publishedUsers.length, icon: <Globe size={18} className="text-green-500" />,  bg: "bg-green-50" },
    { label: "최근 7일 신규",  value: recentUsers.length,    icon: <UserCheck size={18} className="text-amber-500" />, bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2", s.bg)}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 국가 분포 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Globe size={15} />국가별 우주 분포</h3>
        {topCountries.length === 0 ? (
          <p className="text-sm text-gray-400">아직 국가 데이터가 없습니다.</p>
        ) : (
          <div className="space-y-2.5">
            {topCountries.map(([code, count]) => {
              const pct = Math.round((count / universeUsers.length) * 100);
              return (
                <div key={code} className="flex items-center gap-3">
                  <span className="text-lg w-7 text-center">{flag(code)}</span>
                  <span className="text-xs text-gray-500 w-20 truncate">{code === "unknown" ? "미설정" : countryName(code)}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-400 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-12 text-right">{count}명 ({pct}%)</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 최근 가입자 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><UserCheck size={15} />최근 가입자 (우주 보유)</h3>
        <div className="space-y-2">
          {universeUsers.slice(-10).reverse().map((p) => (
            <div key={p.id} className="flex items-center gap-3 py-1">
              <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-600 shrink-0">
                {p.profile.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{p.profile.name}</p>
                <p className="text-xs text-gray-400 truncate">{p.profile.tagline || p.id}</p>
              </div>
              {p.country && <span className="text-base">{flag(p.country)}</span>}
              <Link href={`/p/${p.id}`} target="_blank"
                className="p-1.5 text-gray-300 hover:text-violet-500 transition-colors shrink-0">
                <ArrowUpRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── 유저 관리 탭 ──────────────────────────────── */

function UsersTab({ personals, onRefresh }: { personals: PersonalSchema[]; onRefresh: () => void }) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return personals.filter((p) =>
      p.profile.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      (p.ownerId ?? "").toLowerCase().includes(q)
    );
  }, [personals, search]);

  const openEdit = (p: PersonalSchema) => {
    setEditingId(p.id);
    setEditRole(p.profile?.role ?? "");
    setEditCountry(p.country ?? "");
  };

  const saveEdit = async (p: PersonalSchema) => {
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updatePersonal(p.id, { "profile.role": editRole } as any);
      if (editCountry !== (p.country ?? "")) {
        await saveCountry(p.id, editCountry);
      }
      setEditingId(null);
      onRefresh();
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-white focus-within:border-violet-400">
          <Search size={14} className="text-gray-300 shrink-0" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 / ID / ownerId 검색"
            className="flex-1 min-w-0 text-sm text-gray-800 placeholder-gray-300 focus:outline-none bg-transparent" />
        </div>
        <button onClick={onRefresh} className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-400 hover:text-violet-500 transition-colors">
          <RefreshCw size={15} />
        </button>
      </div>

      <p className="text-xs text-gray-400">{filtered.length}명</p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-semibold">유저</th>
                <th className="text-left px-4 py-3 font-semibold">국적</th>
                <th className="text-left px-4 py-3 font-semibold">역할</th>
                <th className="text-left px-4 py-3 font-semibold">우주</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.slice(0, 100).map((p) => {
                const isEditing = editingId === p.id;
                return (
                  <tr key={p.id} className={cn("hover:bg-gray-50 transition-colors", isEditing && "bg-violet-50")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-600 shrink-0">
                          {p.profile.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 truncate">{p.profile.name}</p>
                          <p className="text-[10px] text-gray-400 truncate max-w-[120px]">{p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select value={editCountry} onChange={(e) => setEditCountry(e.target.value)}
                          className="px-2 py-1 rounded-lg border border-gray-200 text-xs focus:border-violet-400 focus:outline-none bg-white">
                          <option value="">-</option>
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>{flag(c.code)} {c.name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-base" title={p.country ? countryName(p.country) : "미설정"}>
                          {p.country ? flag(p.country) : <span className="text-gray-300 text-xs">-</span>}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select value={editRole} onChange={(e) => setEditRole(e.target.value)}
                          className="px-2 py-1 rounded-lg border border-gray-200 text-xs focus:border-violet-400 focus:outline-none bg-white">
                          <option value="">일반</option>
                          <option value="admin">admin</option>
                          <option value="agency">agency</option>
                        </select>
                      ) : (
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold",
                          p.profile?.role === "admin" ? "bg-red-50 text-red-600"
                          : p.profile?.role ? "bg-blue-50 text-blue-600"
                          : "text-gray-300")}>
                          {p.profile?.role || "일반"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.universe?.color ? (
                        <div className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: p.universe.color }} />
                          <span className="text-xs text-gray-500">{p.published ? "공개" : "비공개"}</span>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">없음</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        {isEditing ? (
                          <>
                            <button onClick={() => saveEdit(p)} disabled={saving}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500 text-white text-xs font-semibold hover:bg-violet-600 disabled:opacity-50">
                              {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}저장
                            </button>
                            <button onClick={() => setEditingId(null)}
                              className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs hover:bg-gray-200">취소</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => openEdit(p)}
                              className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs hover:bg-gray-200 font-medium">편집</button>
                            <Link href={`/p/${p.id}`} target="_blank"
                              className="p-1.5 text-gray-300 hover:text-violet-500 transition-colors">
                              <ArrowUpRight size={13} />
                            </Link>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 100 && (
          <p className="text-center text-xs text-gray-400 py-3 border-t border-gray-50">
            100건 표시 중 (전체 {filtered.length}건) — 검색으로 좁혀보세요.
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── 별 도감 탭 ────────────────────────────────── */

function StarsTab({ personals }: { personals: PersonalSchema[] }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<StarArchiveData | null>(null);

  // 별별 도감 등록 수 집계
  const archiveCount: Record<string, number> = {};
  for (const p of personals) {
    for (const slug of p.starArchive ?? []) {
      archiveCount[slug] = (archiveCount[slug] ?? 0) + 1;
    }
  }

  const stars = Object.values(STAR_ARCHIVE);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return stars.filter((s) =>
      s.nameKo.toLowerCase().includes(q) ||
      s.nameEn.toLowerCase().includes(q) ||
      s.slug.toLowerCase().includes(q)
    );
  }, [search, stars]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-white focus-within:border-violet-400">
        <Search size={14} className="text-gray-300 shrink-0" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="별 이름 검색 (한/영)"
          className="flex-1 min-w-0 text-sm text-gray-800 placeholder-gray-300 focus:outline-none bg-transparent" />
      </div>

      <p className="text-xs text-gray-400">{filtered.length}개 / 전체 {stars.length}개</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filtered.map((s) => (
          <button key={s.slug} onClick={() => setSelected(selected?.slug === s.slug ? null : s)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all",
              selected?.slug === s.slug
                ? "border-violet-400 bg-violet-50"
                : "border-gray-100 bg-white hover:border-gray-200 shadow-sm"
            )}>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 text-sm">{s.nameKo}</p>
              <p className="text-xs text-gray-400">{s.nameEn} · {s.constellation.ko}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-violet-600">{archiveCount[s.slug] ?? 0}</p>
              <p className="text-[10px] text-gray-400">등록</p>
            </div>
          </button>
        ))}
      </div>

      {/* 선택된 별 상세 */}
      {selected && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{selected.nameKo} <span className="text-gray-400 font-normal text-base">({selected.nameEn})</span></h3>
              <p className="text-sm text-gray-500">{selected.constellation.ko} · 거리 {selected.distanceLy}광년 · 등급 {selected.magnitude}</p>
            </div>
            <Link href={`/star/${selected.slug}`} target="_blank"
              className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-700 font-semibold px-2.5 py-1.5 rounded-xl border border-violet-200 hover:bg-violet-50 transition-colors">
              페이지 보기 <ArrowUpRight size={12} />
            </Link>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{selected.shortDesc.ko}</p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <BookOpen size={12} />
            <span>신화: {selected.mythology.map((m) => m.culture.ko).join(", ")}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── 전역 설정 탭 ──────────────────────────────── */

function ConfigTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cfg, setCfg] = useState({ shootingStarIntervalSec: 10 });

  useEffect(() => {
    import("@/lib/firebase/config").then(({ getUniverseConfig }) =>
      getUniverseConfig().then((c) => { setCfg({ shootingStarIntervalSec: c.shootingStarIntervalSec }); setLoading(false); })
    );
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await setUniverseConfig(cfg);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-violet-400" /></div>;

  return (
    <div className="space-y-4 max-w-lg">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-800">우주 전역 설정</h3>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1.5">별똥별 발사 주기 (초)</label>
          <div className="flex items-center gap-3">
            <input
              type="number" min={3} max={120}
              value={cfg.shootingStarIntervalSec}
              onChange={(e) => setCfg((p) => ({ ...p, shootingStarIntervalSec: parseInt(e.target.value) || 10 }))}
              className="w-24 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:border-violet-400 focus:outline-none" />
            <span className="text-xs text-gray-400">초 (3–120)</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">모든 별자리 우주의 별똥별 주기에 적용됩니다.</p>
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-600 disabled:opacity-50 transition-colors">
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
        {saved ? "저장됨 ✓" : "저장하기"}
      </button>
    </div>
  );
}

/* ─── 에셋 탭 ───────────────────────────────────── */

function AssetsTab() {
  return (
    <div className="max-w-lg space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Layers size={15} />우주 에셋 관리</h3>
        <p className="text-sm text-gray-500 mb-4">
          기본 에셋 및 커스텀 에셋을 추가·삭제하고 무료/유료 여부를 설정합니다.
        </p>
        <Link href="/admin/universe-assets"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-600 transition-colors">
          에셋 관리 페이지로 <ChevronRight size={15} />
        </Link>
      </div>
    </div>
  );
}

/* ─── 메인 어드민 페이지 ─────────────────────────── */

export default function AdminPage() {
  const { profile, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [personals, setPersonals] = useState<PersonalSchema[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPersonals = async () => {
    setLoading(true);
    try {
      const list = await getAllPersonals(300);
      setPersonals(list);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!profile || profile.role !== "admin") { router.replace("/"); return; }
    loadPersonals();
  }, [profile, authLoading, router]);

  if (authLoading || (loading && personals.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 h-14 flex items-center gap-4">
        <span className="text-lg">🌌</span>
        <h1 className="font-bold text-gray-900">어드민</h1>
        <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold">admin</span>
        <div className="ml-auto flex items-center gap-1">
          {loading && <Loader2 size={14} className="animate-spin text-gray-300" />}
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="sticky top-14 z-30 bg-white border-b border-gray-100 px-4 overflow-x-auto">
        <div className="flex gap-0.5 max-w-4xl mx-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-colors whitespace-nowrap border-b-2 -mb-px",
                tab === t.id
                  ? "border-violet-500 text-violet-600"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              )}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {tab === "dashboard" && <DashboardTab personals={personals} />}
        {tab === "users"     && <UsersTab personals={personals} onRefresh={loadPersonals} />}
        {tab === "stars"     && <StarsTab personals={personals} />}
        {tab === "config"    && <ConfigTab />}
        {tab === "assets"    && <AssetsTab />}
      </main>
    </div>
  );
}
