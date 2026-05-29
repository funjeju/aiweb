import type { ThemeId } from "@/lib/types/site";

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40, "2xl": 64 } as const;

export const RADIUS = { sm: "8px", md: "16px", lg: "24px", full: "9999px" } as const;

export const IMAGE_RATIO = {
  hero: "aspect-[16/9]",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
  card: "aspect-[4/3]",
} as const;

export interface ThemeTokens {
  primary: string;
  primaryFg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  gradient: string;
}

export const THEME_TOKENS: Record<ThemeId, ThemeTokens> = {
  "warm-ocean": {
    primary: "#6366F1",
    primaryFg: "#ffffff",
    surface: "#ffffff",
    surfaceAlt: "#F5F3FF",
    text: "#1C1C1E",
    textMuted: "#6B7280",
    border: "#E5E7EB",
    gradient: "from-indigo-500 to-purple-600",
  },
  "jeju-warm": {
    primary: "#F97316",
    primaryFg: "#ffffff",
    surface: "#FFFBF5",
    surfaceAlt: "#FEF3C7",
    text: "#1C1C1E",
    textMuted: "#6B7280",
    border: "#FDE68A",
    gradient: "from-orange-400 to-amber-500",
  },
  "luxury-modern": {
    primary: "#1C1C1E",
    primaryFg: "#ffffff",
    surface: "#ffffff",
    surfaceAlt: "#F9FAFB",
    text: "#1C1C1E",
    textMuted: "#6B7280",
    border: "#E5E7EB",
    gradient: "from-gray-900 to-gray-700",
  },
  "minimal-clean": {
    primary: "#3B82F6",
    primaryFg: "#ffffff",
    surface: "#ffffff",
    surfaceAlt: "#EFF6FF",
    text: "#1C1C1E",
    textMuted: "#6B7280",
    border: "#BFDBFE",
    gradient: "from-blue-500 to-cyan-500",
  },
  "vintage-cozy": {
    primary: "#92400E",
    primaryFg: "#ffffff",
    surface: "#FEFCE8",
    surfaceAlt: "#FEF3C7",
    text: "#1C1C1E",
    textMuted: "#78716C",
    border: "#D97706",
    gradient: "from-amber-700 to-yellow-600",
  },
  "fresh-green": {
    primary: "#16A34A",
    primaryFg: "#ffffff",
    surface: "#F0FDF4",
    surfaceAlt: "#DCFCE7",
    text: "#1C1C1E",
    textMuted: "#6B7280",
    border: "#86EFAC",
    gradient: "from-green-500 to-emerald-600",
  },
};

export function getThemeTokens(themeId: ThemeId): ThemeTokens {
  return THEME_TOKENS[themeId] ?? THEME_TOKENS["warm-ocean"];
}
