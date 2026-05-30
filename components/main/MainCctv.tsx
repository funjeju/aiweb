"use client";

import { Video } from "lucide-react";

export function MainCctv() {
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">실시간 CCTV</h1>
        <p className="text-sm text-gray-500 mt-1">제주 주요 관광지·해안 실시간 영상 (준비 중)</p>
      </div>

      <div className="rounded-2xl border-2 border-dashed border-gray-200 py-20 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Video className="w-7 h-7 text-gray-400" />
        </div>
        <p className="font-semibold text-gray-700 mb-1">CCTV 연동 준비 중</p>
        <p className="text-sm text-gray-400 max-w-xs">
          제주 주요 관광지·해안의 공개 실시간 CCTV를 한곳에서 볼 수 있도록 준비하고 있어요.
        </p>
      </div>
    </div>
  );
}
