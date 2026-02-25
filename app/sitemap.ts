import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://predictflow.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ["en", "ko"];

  // Static pages
  const staticPages = [
    "",
    "/markets",
    "/predict",
    "/leaderboard",
    "/portfolio",
    "/login",
    "/register",
  ];

  const staticEntries = locales.flatMap((locale) =>
    staticPages.map((page) => ({
      url: `${BASE_URL}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: page === "" ? ("daily" as const) : ("weekly" as const),
      priority: page === "" ? 1 : 0.8,
    }))
  );

  // Dynamic: try to fetch prediction events for sitemap
  let eventEntries: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${BASE_URL}/api/events?limit=100&status=active`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      const events = Array.isArray(data) ? data : (data.events ?? []);
      eventEntries = locales.flatMap((locale) =>
        events.map((event: { id: string; updatedAt?: string }) => ({
          url: `${BASE_URL}/${locale}/predict/${event.id}`,
          lastModified: event.updatedAt ? new Date(event.updatedAt) : new Date(),
          changeFrequency: "daily" as const,
          priority: 0.7,
        }))
      );
    }
  } catch {
    // Sitemap generation should not fail
  }

  return [...staticEntries, ...eventEntries];
}
