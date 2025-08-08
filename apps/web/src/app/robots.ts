import { baseUrl } from "@/lib/constants";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/login",
          "/login",
          "/",
          "/discord",
        ],
        disallow: [
          "/admin/*",
          "/api/*",
          "/_next/*",
          "/favicon.ico",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
} 