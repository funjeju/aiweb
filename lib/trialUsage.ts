"use client";

/** 비로그인 체험 횟수 제한 (localStorage 기반, 클라이언트 전용). */
const FREE_LIMIT = 2;

export function getTrialCount(toolId: string): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(`trial:${toolId}`) || "0");
}

export function incrementTrial(toolId: string): number {
  if (typeof window === "undefined") return 0;
  const next = getTrialCount(toolId) + 1;
  localStorage.setItem(`trial:${toolId}`, String(next));
  return next;
}

export function trialRemaining(toolId: string): number {
  return Math.max(0, FREE_LIMIT - getTrialCount(toolId));
}

export const TRIAL_LIMIT = FREE_LIMIT;
