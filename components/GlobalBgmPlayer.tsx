"use client";

import { useEffect, useRef } from "react";
import { useBgmStore } from "@/lib/store/bgmStore";

/**
 * 레이아웃에 삽입되는 숨겨진 오디오 엔진.
 * store의 isPlaying / myTrackIdx / myTracks를 감지해 실제 <audio>를 제어한다.
 * UI는 없으며 각 페이지의 플레이어 버튼이 store를 통해 이 엔진을 구동한다.
 */
export function GlobalBgmPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { myTracks, myTrackIdx, isPlaying, mode, play, pause } = useBgmStore();

  const currentTrack = mode === "mine" ? (myTracks[myTrackIdx] ?? null) : null;

  // 트랙이 바뀌면 오디오 교체
  useEffect(() => {
    if (!currentTrack?.url) {
      audioRef.current?.pause();
      return;
    }
    if (audioRef.current && audioRef.current.src !== currentTrack.url) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (!audioRef.current) {
      const audio = new Audio(currentTrack.url);
      audio.loop = true;
      audio.volume = currentTrack.volume ?? 1;
      audioRef.current = audio;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.url]);

  // 볼륨 즉시 반영
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = currentTrack?.volume ?? 1;
  }, [currentTrack?.volume]);

  // isPlaying 변경 → 실제 재생/정지
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying && mode === "mine") {
      audio.play().catch(() => pause());
    } else {
      audio.pause();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, mode]);

  // 페이지 언마운트 시 정리
  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  return null;
}
