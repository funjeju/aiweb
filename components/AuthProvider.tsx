"use client";

import { useEffect } from "react";
import { onAuth } from "@/lib/firebase/auth";
import { useAuthStore } from "@/lib/store/authStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useAuthStore();

  useEffect(() => {
    const unsub = onAuth((user) => setUser(user));
    return unsub;
  }, [setUser]);

  return <>{children}</>;
}
