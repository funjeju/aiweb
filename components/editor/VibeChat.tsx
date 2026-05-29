"use client";

import { useState } from "react";
import { Sparkles, Send, X, Loader2 } from "lucide-react";
import type { SiteSchema, ThemeId } from "@/lib/types/site";
import { useEditorStore } from "@/lib/store/editorStore";
import { VIBES } from "@/lib/types/site";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "제주 감성으로 바꿔줘",
  "좀 더 고급스럽게",
  "깔끔하고 모던하게",
  "소개 문구 더 따뜻하게",
];

export function VibeChat({ site, onClose }: { site: SiteSchema; onClose: () => void }) {
  const { updateDesignTokens, updateMerchantInfo, updateBlock } = useEditorStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "안녕하세요! 어떻게 바꿔드릴까요? 자연어로 편하게 말씀해주세요." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const applyActions = (actions: Array<{ type: string; themeId?: string; value?: string }>) => {
    for (const action of actions) {
      switch (action.type) {
        case "setTheme": {
          const vibe = VIBES.find((v) => v.id === action.themeId);
          if (vibe) updateDesignTokens({ themeId: action.themeId as ThemeId, primaryColor: vibe.primaryColor });
          break;
        }
        case "updateDescription":
          if (action.value) updateMerchantInfo({ description: action.value });
          break;
        case "updateHeroTitle":
        case "updateHeroSubtitle": {
          const heroBlock = site.layout.find((b) => b.componentType.startsWith("Hero"));
          if (heroBlock && action.value) {
            const key = action.type === "updateHeroTitle" ? "title" : "subtitle";
            updateBlock(heroBlock.blockId, { [key]: action.value });
          }
          break;
        }
      }
    }
  };

  const send = async (cmd: string) => {
    if (!cmd.trim() || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: cmd }]);
    setLoading(true);

    try {
      const res = await fetch("/api/vibe-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: cmd,
          currentSite: {
            name: site.merchantInfo.name,
            category: site.merchantInfo.category,
            description: site.merchantInfo.description,
            themeId: site.designTokens.themeId,
          },
        }),
      });
      const data = await res.json();
      if (data.actions) {
        applyActions(data.actions);
        setMessages((prev) => [...prev, { role: "assistant", text: data.message || "변경했어요!" }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", text: "죄송해요, 다시 말씀해주시겠어요?" }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "오류가 발생했어요. 다시 시도해주세요." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 right-0 sm:bottom-4 sm:right-4 w-full sm:w-96 h-[70vh] sm:h-[500px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 flex flex-col z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <p className="font-semibold text-gray-900 text-sm">AI 편집 도우미</p>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[80%] px-3.5 py-2 rounded-2xl text-sm",
              msg.role === "user" ? "bg-indigo-500 text-white rounded-br-md" : "bg-gray-100 text-gray-800 rounded-bl-md"
            )}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-3.5 py-2.5 rounded-2xl rounded-bl-md">
              <Loader2 size={16} className="animate-spin text-gray-400" />
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)}
              className="text-xs px-2.5 py-1.5 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="p-3 border-t border-gray-100 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(input); }}
          placeholder="예: 제주 감성으로 바꿔줘"
          disabled={loading}
          className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-indigo-400 focus:outline-none"
        />
        <button onClick={() => send(input)} disabled={loading || !input.trim()}
          className="p-2.5 rounded-xl bg-indigo-500 text-white disabled:bg-gray-200 disabled:text-gray-400 hover:bg-indigo-600 transition-colors">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
