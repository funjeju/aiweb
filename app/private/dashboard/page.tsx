"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** 통합 대시보드(/dashboard)의 개인 탭으로 리다이렉트 */
export default function PrivateDashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard?tab=personal");
  }, [router]);
  return null;
}
