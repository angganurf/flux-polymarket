import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

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
    "/forgot-password",
    "/reset-password",
  ];

  const staticEntries = locales.flatMap((locale) =>
    staticPages.map((page) => ({
      url: `${BASE_URL}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: page === "" ? ("daily" as const) : ("weekly" as const),
      priority: page === "" ? 1 : 0.8,
    }))
  );

  // Dynamic: query prediction events directly via Prisma (no fetch needed)
  let eventEntries: MetadataRoute.Sitemap = [];
  try {
    const events = await prisma.predictionEvent.findMany({
      where: { status: "active" },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    eventEntries = locales.flatMap((locale) =>
      events.map((event) => ({
        url: `${BASE_URL}/${locale}/predict/${event.id}`,
        lastModified: event.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.7,
      }))
    );
  } catch {
    // Sitemap generation should not fail the build
  }

  return [...staticEntries, ...eventEntries];
}
