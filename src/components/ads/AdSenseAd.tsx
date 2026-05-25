"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdSenseAdProps {
  slot?: string;
  format?: "auto" | "rectangle" | "horizontal" | "vertical";
  className?: string;
  label?: string;
}

function shouldRenderAd(slot?: string) {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_ENABLE_ADS === "true" &&
    Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID) &&
    Boolean(slot)
  );
}

export function AdSenseAd({
  slot,
  format = "auto",
  className = "",
  label = "広告",
}: AdSenseAdProps) {
  const pushedRef = useRef(false);
  const renderAd = shouldRenderAd(slot);

  useEffect(() => {
    if (!renderAd || pushedRef.current) {
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle ?? [];
      window.adsbygoogle.push({});
      pushedRef.current = true;
    } catch {
      // Ad loading failures should never affect the game experience.
    }
  }, [renderAd]);

  if (!renderAd) {
    return null;
  }

  return (
    <aside className={`my-8 ${className}`} aria-label={label}>
      <p className="mb-2 text-center text-xs text-slate-500">{label}</p>
      <ins
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
