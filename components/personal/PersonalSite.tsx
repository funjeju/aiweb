"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { PersonalSchema, PersonalSection } from "@/lib/types/personal";
import { SECTION_LABEL } from "@/lib/types/personal";
import { getThemeTokens } from "@/lib/design/tokens";
import { useAuthStore } from "@/lib/store/authStore";
import { cn } from "@/lib/utils";
import { Github, Linkedin, Instagram, Twitter, Globe, Mail, Phone, ArrowUpRight, Menu, X, Pencil } from "lucide-react";

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function PersonalSite({ data }: { data: PersonalSchema }) {
  const theme = getThemeTokens(data.themeId);
  const { user } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const sections = data.sections;
  const isOwner = user?.uid === data.ownerId;

  const socials = data.profile.socials || {};
  const socialIcons: Array<{ key: keyof typeof socials; icon: React.ReactNode }> = [
    { key: "github", icon: <Github size={18} /> },
    { key: "linkedin", icon: <Linkedin size={18} /> },
    { key: "instagram", icon: <Instagram size={18} /> },
    { key: "twitter", icon: <Twitter size={18} /> },
    { key: "website", icon: <Globe size={18} /> },
  ];

  return (
    <div style={{ backgroundColor: theme.surface, color: theme.text }}>
      {/* 네비게이션 */}
      <header className="sticky top-0 z-40 backdrop-blur" style={{ backgroundColor: `${theme.surface}e6`, borderBottom: `1px solid ${theme.border}` }}>
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <button onClick={() => scrollToId("hero")} className="text-xl font-bold" style={{ color: theme.primary }}>
            {data.profile.name || "My Page"}
          </button>
          <nav className="hidden md:flex items-center gap-7">
            {sections.map((s) => (
              <button key={s} onClick={() => scrollToId(s)} className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: theme.textMuted }}>
                {SECTION_LABEL[s]}
              </button>
            ))}
          </nav>
          <button className="md:hidden" onClick={() => setMenuOpen((v) => !v)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t px-5 py-3 flex flex-col gap-1" style={{ borderColor: theme.border }}>
            {sections.map((s) => (
              <button key={s} onClick={() => { scrollToId(s); setMenuOpen(false); }} className="text-left py-2 text-sm font-medium" style={{ color: theme.textMuted }}>
                {SECTION_LABEL[s]}
              </button>
            ))}
          </div>
        )}
      </header>

      {sections.includes("hero") && <HeroSection data={data} theme={theme} socials={socials} socialIcons={socialIcons} />}
      {sections.includes("about") && <AboutSection data={data} theme={theme} />}
      {sections.includes("skills") && <SkillsSection data={data} theme={theme} />}
      {sections.includes("projects") && <ProjectsSection data={data} theme={theme} />}
      {sections.includes("contact") && <ContactSection data={data} theme={theme} />}

      <footer className="text-center py-8 text-xs" style={{ color: theme.textMuted, borderTop: `1px solid ${theme.border}` }}>
        © {new Date().getFullYear()} {data.profile.name}. All rights reserved.
      </footer>

      {/* 소유자 편집 버튼 */}
      {isOwner && (
        <Link href={`/private/edit/${data.id}`}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-full text-white font-semibold shadow-lg"
          style={{ backgroundColor: theme.primary }}>
          <Pencil size={16} />편집
        </Link>
      )}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function HeroSection({ data, theme, socials, socialIcons }: any) {
  return (
    <section id="hero" className="max-w-5xl mx-auto px-5 py-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] mb-3" style={{ color: theme.primary }}>Hello, I&apos;m</p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-3">{data.profile.name || "Your Name"}</h1>
        {data.profile.tagline && <p className="text-base md:text-lg mb-5" style={{ color: theme.primary }}>{data.profile.tagline}</p>}
        {data.profile.bio && <p className="text-sm md:text-base leading-relaxed mb-8" style={{ color: theme.textMuted }}>{data.profile.bio}</p>}
        <div className="flex flex-wrap gap-3 mb-6">
          <button onClick={() => scrollToId("projects")} className="flex items-center gap-1.5 px-5 py-3 rounded-full text-white font-semibold text-sm" style={{ backgroundColor: theme.primary }}>
            프로젝트 보기 <ArrowUpRight size={16} />
          </button>
          <button onClick={() => scrollToId("contact")} className="flex items-center gap-1.5 px-5 py-3 rounded-full font-semibold text-sm border" style={{ borderColor: theme.border, color: theme.text }}>
            연락하기 <Mail size={15} />
          </button>
        </div>
        <div className="flex gap-3">
          {socialIcons.map(({ key, icon }: any) => socials[key] && (
            <a key={key} href={socials[key]} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: theme.accent, color: theme.primary }}>{icon}</a>
          ))}
        </div>
      </div>
      {(data.profile.heroImage || data.profile.photo) && (
        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden">
          <Image src={data.profile.heroImage || data.profile.photo} alt={data.profile.name} fill className="object-cover" />
        </div>
      )}
    </section>
  );
}

function AboutSection({ data, theme }: any) {
  if (!data.about) return null;
  return (
    <section id="about" className="py-20 px-5" style={{ backgroundColor: theme.accent }}>
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: theme.primary }}>● About Me</p>
        <p className="text-lg md:text-xl leading-relaxed whitespace-pre-line">{data.about}</p>
      </div>
    </section>
  );
}

function SkillsSection({ data, theme }: any) {
  if (!data.skills?.length) return null;
  return (
    <section id="skills" className="py-20 px-5">
      <div className="max-w-4xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] mb-6" style={{ color: theme.primary }}>● My Skills</p>
        <div className="flex flex-wrap gap-3">
          {data.skills.map((skill: string, i: number) => (
            <span key={i} className="px-4 py-2.5 rounded-xl font-semibold text-sm border" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>{skill}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectsSection({ data, theme }: any) {
  if (!data.projects?.length) return null;
  return (
    <section id="projects" className="py-20 px-5" style={{ backgroundColor: theme.accent }}>
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-[0.2em] mb-6" style={{ color: theme.primary }}>● Projects</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.projects.map((p: any) => (
            <a key={p.id} href={p.link || "#"} target={p.link ? "_blank" : undefined} rel="noopener noreferrer"
              className="group rounded-2xl overflow-hidden" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
              <div className="relative aspect-[16/10] overflow-hidden" style={{ backgroundColor: theme.accent }}>
                {p.image
                  ? <Image src={p.image} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-30">🗂️</div>}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold">{p.title}</p>
                  {p.link && <ArrowUpRight size={15} style={{ color: theme.textMuted }} />}
                </div>
                {p.description && <p className="text-sm mt-1 line-clamp-2" style={{ color: theme.textMuted }}>{p.description}</p>}
                {p.tags && <p className="text-xs mt-2" style={{ color: theme.primary }}>{p.tags}</p>}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection({ data, theme }: any) {
  return (
    <section id="contact" className="py-24 px-5">
      <div className="max-w-xl mx-auto text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: theme.primary }}>● Contact</p>
        <h2 className="text-3xl font-bold mb-3">함께 이야기해요</h2>
        {data.contact?.message && <p className="mb-8" style={{ color: theme.textMuted }}>{data.contact.message}</p>}
        <div className="flex flex-col items-center gap-3">
          {data.contact?.email && (
            <a href={`mailto:${data.contact.email}`} className="flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold" style={{ backgroundColor: theme.primary }}>
              <Mail size={16} />{data.contact.email}
            </a>
          )}
          {data.contact?.phone && (
            <a href={`tel:${data.contact.phone}`} className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold border" style={{ borderColor: theme.border }}>
              <Phone size={16} />{data.contact.phone}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
