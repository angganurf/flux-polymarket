import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const dbPath = dbUrl.replace(/^file:/, "");
const absolutePath = path.isAbsolute(dbPath)
  ? dbPath
  : path.join(process.cwd(), dbPath);

const adapter = new PrismaBetterSqlite3({ url: absolutePath });
const prisma = new PrismaClient({ adapter });

const SEED_EVENTS = [
  // Korean topics
  {
    title: "2027 대선에서 여당이 승리할까?",
    description:
      "2027년 대한민국 대통령 선거에서 현재 여당이 승리할지 예측하는 마켓입니다.",
    category: "politics",
    endDate: new Date("2027-03-10"),
  },
  {
    title: "한국은행이 2026년 안에 금리를 인하할까?",
    description:
      "한국은행이 2026년 12월 31일까지 기준금리를 현재 수준보다 인하할지 예측합니다.",
    category: "general",
    endDate: new Date("2026-12-31"),
  },
  {
    title: "BTS 진이 2026년 솔로 앨범을 발표할까?",
    description:
      "BTS 멤버 진(김석진)이 2026년 내에 공식 솔로 앨범을 발매할지 예측합니다.",
    category: "entertainment",
    endDate: new Date("2026-12-31"),
  },
  {
    title: "삼성전자 주가가 2026년 말까지 8만원을 넘을까?",
    description:
      "삼성전자 보통주(005930) 종가가 2026년 12월 31일까지 80,000원을 초과할지 예측합니다.",
    category: "technology",
    endDate: new Date("2026-12-31"),
  },
  // English topics
  {
    title: "Will Bitcoin reach $200,000 by end of 2026?",
    description:
      "Will the price of Bitcoin (BTC) reach or exceed $200,000 USD on any major exchange before December 31, 2026?",
    category: "crypto",
    endDate: new Date("2026-12-31"),
  },
  {
    title: "Will SpaceX Starship complete an orbital flight in 2026?",
    description:
      "Will SpaceX successfully complete a full orbital flight of its Starship vehicle (including both Super Heavy booster and Starship upper stage) by the end of 2026?",
    category: "technology",
    endDate: new Date("2026-12-31"),
  },
  {
    title: "Will the US Federal Reserve cut rates before June 2026?",
    description:
      "Will the US Federal Reserve reduce the federal funds target rate by at least 25 basis points before June 1, 2026?",
    category: "general",
    endDate: new Date("2026-06-01"),
  },
  {
    title: "Will an AI system pass a Turing test by 2027?",
    description:
      "Will a credible, peer-reviewed study confirm that an AI system has passed a standard Turing test (fooling >50% of human judges) before January 1, 2027?",
    category: "technology",
    endDate: new Date("2027-01-01"),
  },
];

async function main() {
  console.log("Seeding prediction events...");

  // Get or create a system user as the event creator
  let creator = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!creator) {
    console.log("No users found. Creating system user...");
    creator = await prisma.user.create({
      data: {
        name: "PredictFlow",
        email: "system@predictflow.app",
        points: 10000,
        role: "admin",
      },
    });
    console.log(`Created system user: ${creator.name} (${creator.id})`);
  } else {
    console.log(`Using existing user as creator: ${creator.name} (${creator.id})`);
  }

  let created = 0;
  let skipped = 0;

  for (const eventData of SEED_EVENTS) {
    // Check if an event with the same title already exists (idempotency)
    const existing = await prisma.predictionEvent.findFirst({
      where: { title: eventData.title },
    });

    if (existing) {
      console.log(`  Skipped (exists): ${eventData.title}`);
      skipped++;
      continue;
    }

    await prisma.predictionEvent.create({
      data: {
        ...eventData,
        status: "active",
        creatorId: creator.id,
      },
    });

    console.log(`  Created: ${eventData.title}`);
    created++;
  }

  console.log(
    `\nSeed complete: ${created} created, ${skipped} skipped (already existed).`
  );
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
