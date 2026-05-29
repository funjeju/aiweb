"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { uploadSiteImage } from "@/lib/firebase/storage";
import { Upload, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  siteId: string;
  type: "hero" | "logo" | "gallery" | "menu";
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  label?: string;
  aspectClass?: string;
}

export function ImageUploader({
  siteId,
  type,
  value,
  onChange,
  onRemove,
  label = "이미지 업로드",
  aspectClass = "aspect-video",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const url = await uploadSiteImage(siteId, type, file);
      onChange(url);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div
      className={cn("relative rounded-xl overflow-hidden border-2 border-dashed border-gray-300 cursor-pointer hover:border-indigo-400 transition-colors", aspectClass)}
      onClick={() => !value && inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {value ? (
        <>
          <Image src={value} alt={label} fill className="object-cover" />
          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
            <button
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              className="bg-white text-gray-800 px-3 py-1.5 rounded-lg text-xs font-semibold shadow"
            >
              교체
            </button>
            {onRemove && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="bg-red-500 text-white p-1.5 rounded-lg shadow"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400">
          {uploading ? (
            <Loader2 size={20} className="animate-spin text-indigo-400" />
          ) : (
            <>
              <Upload size={20} />
              <span className="text-xs">{label}</span>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
