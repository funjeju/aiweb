"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSiteById } from "@/lib/firebase/sites";
import { SiteEditor } from "@/components/editor/SiteEditor";
import { Loader2 } from "lucide-react";

export default function EditorPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!siteId) return;
    getSiteById(siteId).then((site) => {
      if (!site) {
        setNotFound(true);
      }
      setLoading(false);
    });
  }, [siteId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">사이트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return <SiteEditor siteId={siteId} />;
}
