"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** /private/create → /private/create/profile 리다이렉트 (구 URL 호환) */
export default function PrivateCreateRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/private/create/profile"); }, [router]);
  return null;
}
