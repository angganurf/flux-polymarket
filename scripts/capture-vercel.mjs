#!/usr/bin/env node
import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "screenshots", "vercel-deploy");
mkdirSync(outDir, { recursive: true });

const BASE = "https://flux-polymarket.vercel.app";

const pages = [
  { name: "01-home-en", url: `${BASE}/en`, wait: 4000 },
  { name: "02-home-ko", url: `${BASE}/ko`, wait: 4000 },
  { name: "03-markets", url: `${BASE}/en/markets`, wait: 4000 },
  { name: "04-predict", url: `${BASE}/en/predict`, wait: 4000 },
  { name: "05-leaderboard", url: `${BASE}/en/leaderboard`, wait: 4000 },
  { name: "06-login", url: `${BASE}/en/login`, wait: 3000 },
  { name: "07-register", url: `${BASE}/en/register`, wait: 3000 },
  { name: "08-forgot-password", url: `${BASE}/en/forgot-password`, wait: 3000 },
];

// Mobile viewport pages
const mobilePages = [
  { name: "09-mobile-home", url: `${BASE}/en`, wait: 4000 },
  { name: "10-mobile-markets", url: `${BASE}/en/markets`, wait: 4000 },
];

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
  });

  // Desktop screenshots
  for (const pg of pages) {
    const page = await browser.newPage();
    try {
      console.log(`📸 ${pg.name} → ${pg.url}`);
      await page.goto(pg.url, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise((r) => setTimeout(r, pg.wait));
      await page.screenshot({
        path: path.join(outDir, `${pg.name}.png`),
        fullPage: false,
      });
      console.log(`  ✓ ${pg.name}.png`);
    } catch (err) {
      console.error(`  ✗ ${pg.name}: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  // Mobile screenshots
  for (const pg of mobilePages) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });
    try {
      console.log(`📱 ${pg.name} → ${pg.url}`);
      await page.goto(pg.url, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise((r) => setTimeout(r, pg.wait));
      await page.screenshot({
        path: path.join(outDir, `${pg.name}.png`),
        fullPage: false,
      });
      console.log(`  ✓ ${pg.name}.png`);
    } catch (err) {
      console.error(`  ✗ ${pg.name}: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log(`\n✅ Done! Screenshots saved to screenshots/vercel-deploy/`);
}

main().catch(console.error);
