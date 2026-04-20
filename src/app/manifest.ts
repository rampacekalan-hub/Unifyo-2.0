import type { MetadataRoute } from "next";

// Next.js 16 app-router manifest file convention.
// See node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/manifest.md
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Unifyo",
    short_name: "Unifyo",
    description: "AI business asistent pre slovenských podnikateľov.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#05070f",
    theme_color: "#6366f1",
    orientation: "portrait-primary",
    // TODO: add icon PNGs to /public (icon-192.png, icon-512.png, icon-192-maskable.png)
    icons: [],
  };
}
