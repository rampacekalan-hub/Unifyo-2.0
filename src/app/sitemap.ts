import type { MetadataRoute } from "next";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();

export default function sitemap(): MetadataRoute.Sitemap {
  const base = config.seo.canonicalUrl.replace(/\/$/, "");
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/cennik`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/kontakt`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/register`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/forgot-password`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/podmienky`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/sukromie`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/cookies`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/dpa`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/changelog`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
  ];
}
