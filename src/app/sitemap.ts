import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteMeta";

const routes = [
  "",
  "/play",
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
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
