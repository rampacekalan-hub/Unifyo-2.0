import type { MetadataRoute } from "next";
import { getSiteConfig } from "@/config/site-settings";

const config = getSiteConfig();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/admin/",
          "/dashboard",
          "/dashboard/",
          "/crm",
          "/crm/",
          "/calendar",
          "/calendar/",
          "/email",
          "/email/",
          "/calls",
          "/calls/",
          "/analytics",
          "/analytics/",
          "/settings",
          "/settings/",
          "/reset-password",
          "/verify-email",
        ],
      },
    ],
    sitemap: `${config.seo.canonicalUrl}/sitemap.xml`,
    host: config.seo.canonicalUrl,
  };
}
