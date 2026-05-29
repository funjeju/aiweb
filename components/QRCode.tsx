"use client";

import { useEffect, useState } from "react";
import QRCodeLib from "qrcode";

interface QRCodeProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
  className?: string;
}

export function QRCode({ value, size = 80, fgColor = "#000000", bgColor = "#ffffff", className }: QRCodeProps) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    QRCodeLib.toDataURL(value, {
      width: size * 3,
      margin: 1,
      color: { dark: fgColor, light: bgColor },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(""));
  }, [value, size, fgColor, bgColor]);

  if (!dataUrl) {
    return <div style={{ width: size, height: size }} className={className} />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={dataUrl} alt="QR 코드" width={size} height={size} className={className} />;
}
