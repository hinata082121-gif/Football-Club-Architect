import type { MetadataRoute } from "next";

const routes = [
  "",
  "/about",
  "/how-to-play",
  "/features",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/disclaimer",
  "/glossary",
  "/ads",
  "/updates",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://football-club-architect.vercel.app";

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
