import { create } from "zustand";

export interface GlobalTrack {
  url: string;
  name: string;
  volume?: number;
}

type ResumeMode = "auto" | "none";
// auto  = 자동재생 중이었음 → 방문 후 복귀 시 재개
// none  = 수동 재생이었음 OR 재생 안 했음 → 복귀 후 재개 안 함

interface BgmState {
  /* 내 BGM */
  myTracks: GlobalTrack[];
  myTrackIdx: number;
  myPersonalId: string | null;

  /* 재생 상태 */
  isPlaying: boolean;
  mode: "mine" | "visiting";  // 현재 재생 중인 주체

  /* 방문 전 상태 저장 */
  resumeMode: ResumeMode;
  resumeTrackIdx: number;

  /* Actions */
  setMyBgm: (tracks: GlobalTrack[], personalId: string) => void;
  setMyTrackIdx: (idx: number) => void;
  play: () => void;
  pause: () => void;
  /** 타 스페이스 입장: 내 음악이 auto-playing이면 일시정지 후 resumeMode=auto */
  pauseForVisit: (autoWasPlaying: boolean) => void;
  /** 타 스페이스 퇴장: resumeMode=auto면 재개 */
  resumeAfterVisit: () => void;
  /** 사용자가 타 스페이스에서 수동 재생 → 내 음악 재개 안 함 */
  manualVisitPlay: () => void;
}

export const useBgmStore = create<BgmState>((set, get) => ({
  myTracks: [],
  myTrackIdx: 0,
  myPersonalId: null,
  isPlaying: false,
  mode: "mine",
  resumeMode: "none",
  resumeTrackIdx: 0,

  setMyBgm: (tracks, personalId) => set({ myTracks: tracks, myPersonalId: personalId, myTrackIdx: 0 }),

  setMyTrackIdx: (idx) => set({ myTrackIdx: idx }),

  play: () => set({ isPlaying: true, mode: "mine" }),

  pause: () => set({ isPlaying: false }),

  pauseForVisit: (autoWasPlaying) => set((s) => ({
    isPlaying: false,
    mode: "visiting",
    resumeMode: autoWasPlaying ? "auto" : "none",
    resumeTrackIdx: s.myTrackIdx,
  })),

  resumeAfterVisit: () => {
    const { resumeMode, resumeTrackIdx } = get();
    if (resumeMode === "auto") {
      set({ isPlaying: true, mode: "mine", myTrackIdx: resumeTrackIdx, resumeMode: "none" });
    } else {
      set({ mode: "mine", resumeMode: "none" });
    }
  },

  manualVisitPlay: () => set({ resumeMode: "none" }),
}));
