import { create } from "zustand";
import type { User } from "firebase/auth";
import type { UserProfile } from "@/lib/firebase/users";

interface AuthStore {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (v: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
}));
