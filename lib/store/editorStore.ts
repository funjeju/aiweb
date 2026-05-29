import { create } from "zustand";
import type { SiteSchema, SiteBlock } from "@/lib/types/site";

interface EditorStore {
  site: SiteSchema | null;
  isDirty: boolean;
  isSaving: boolean;
  selectedBlockId: string | null;

  setSite: (site: SiteSchema) => void;
  patchSite: (patch: Partial<SiteSchema>) => void;
  updateBlock: (blockId: string, data: Record<string, unknown>) => void;
  reorderBlocks: (blocks: SiteBlock[]) => void;
  toggleBlockVisibility: (blockId: string) => void;
  updateMerchantInfo: (info: Partial<SiteSchema["merchantInfo"]>) => void;
  updateDesignTokens: (tokens: Partial<SiteSchema["designTokens"]>) => void;
  selectBlock: (blockId: string | null) => void;
  setIsSaving: (v: boolean) => void;
  markClean: () => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  site: null,
  isDirty: false,
  isSaving: false,
  selectedBlockId: null,

  setSite: (site) => set({ site, isDirty: false }),

  patchSite: (patch) =>
    set((state) => {
      if (!state.site) return state;
      return { isDirty: true, site: { ...state.site, ...patch } };
    }),

  updateBlock: (blockId, data) =>
    set((state) => {
      if (!state.site) return state;
      return {
        isDirty: true,
        site: {
          ...state.site,
          layout: state.site.layout.map((b) =>
            b.blockId === blockId ? { ...b, data: { ...b.data, ...data } } : b
          ),
        },
      };
    }),

  reorderBlocks: (blocks) =>
    set((state) => {
      if (!state.site) return state;
      return { isDirty: true, site: { ...state.site, layout: blocks } };
    }),

  toggleBlockVisibility: (blockId) =>
    set((state) => {
      if (!state.site) return state;
      return {
        isDirty: true,
        site: {
          ...state.site,
          layout: state.site.layout.map((b) =>
            b.blockId === blockId ? { ...b, visible: b.visible === false ? true : false } : b
          ),
        },
      };
    }),

  updateMerchantInfo: (info) =>
    set((state) => {
      if (!state.site) return state;
      return {
        isDirty: true,
        site: {
          ...state.site,
          merchantInfo: { ...state.site.merchantInfo, ...info },
        },
      };
    }),

  updateDesignTokens: (tokens) =>
    set((state) => {
      if (!state.site) return state;
      return {
        isDirty: true,
        site: {
          ...state.site,
          designTokens: { ...state.site.designTokens, ...tokens },
        },
      };
    }),

  selectBlock: (blockId) => set({ selectedBlockId: blockId }),
  setIsSaving: (v) => set({ isSaving: v }),
  markClean: () => set({ isDirty: false }),
}));
