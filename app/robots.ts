import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://predictflow.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/en/admin/", "/ko/admin/", "/en/profile/", "/ko/profile/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
