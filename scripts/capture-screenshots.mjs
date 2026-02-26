#!/usr/bin/env node
import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "screenshots", "local-preview");

const BASE = "http://localhost:3100";

const pages = [
  { name: "01-home-en", url: `${BASE}/en`, wait: 3000 },
  { name: "02-home-ko", url: `${BASE}/ko`, wait: 3000 },
  { name: "03-markets", url: `${BASE}/en/markets`, wait: 3000 },
  { name: "04-predict", url: `${BASE}/en/predict`, wait: 3000 },
  { name: "05-leaderboard", url: `${BASE}/en/leaderboard`, wait: 3000 },
  { name: "06-login", url: `${BASE}/en/login`, wait: 2000 },
  { name: "07-register", url: `${BASE}/en/register`, wait: 2000 },
];

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
  });

  for (const pg of pages) {
    const page = await browser.newPage();
    try {
      console.log(`Capturing ${pg.name} → ${pg.url}`);
      await page.goto(pg.url, { waitUntil: "networkidle2", timeout: 15000 });
      await new Promise((r) => setTimeout(r, pg.wait));
      await page.screenshot({
        path: path.join(outDir, `${pg.name}.png`),
        fullPage: true,
      });
      console.log(`  ✓ ${pg.name}.png`);
    } catch (err) {
      console.error(`  ✗ ${pg.name}: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log("\nDone! Screenshots saved to screenshots/local-preview/");
}

main().catch(console.error);
