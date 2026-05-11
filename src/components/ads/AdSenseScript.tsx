import Script from "next/script";

function shouldLoadAdsenseScript() {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_ENABLE_ADS === "true" &&
    Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID)
  );
}

export function AdSenseScript() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  if (!shouldLoadAdsenseScript() || !clientId) {
    return null;
  }

  return (
    <Script
      id="adsense-script"
      strategy="afterInteractive"
      async
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
    />
  );
}
