"use client";

import { useEffect } from "react";
import { onAuth } from "@/lib/firebase/auth";
import { getOrCreateUserProfile } from "@/lib/firebase/users";
import { useAuthStore } from "@/lib/store/authStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile } = useAuthStore();

  useEffect(() => {
    const unsub = onAuth(async (user) => {
      setUser(user);
      if (user) {
        try {
          const profile = await getOrCreateUserProfile(user.uid, user.email || "", user.displayName || "");
          setProfile(profile);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    });
    return unsub;
  }, [setUser, setProfile]);

  return <>{children}</>;
}
