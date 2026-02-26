#!/usr/bin/env node
import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "screenshots", "test-flow");
mkdirSync(outDir, { recursive: true });

const BASE = "http://localhost:3100";

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: false });
  console.log(`  📸 ${name}.png`);
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();

  // ==============================
  // Step 1: Register
  // ==============================
  console.log("\n🔹 Step 1: Register");
  await page.goto(`${BASE}/en/register`, { waitUntil: "networkidle2", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1500));

  // Inputs use id selectors: #name, #email, #password, #confirm-password
  await page.type("#name", "TestUser");
  await page.type("#email", "test@example.com");
  await page.type("#password", "Test1234!");
  await page.type("#confirm-password", "Test1234!");
  await new Promise((r) => setTimeout(r, 500));
  await screenshot(page, "01-register-filled");

  // Submit
  console.log("  Submitting registration...");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await new Promise((r) => setTimeout(r, 3000));
  console.log(`  → Redirected to: ${page.url()}`);
  await screenshot(page, "02-after-register");

  // ==============================
  // Step 2: If still on register/login, do manual login
  // ==============================
  const currentUrl = page.url();
  if (currentUrl.includes("login") || currentUrl.includes("register")) {
    console.log("\n🔹 Step 2: Manual Login");
    await page.goto(`${BASE}/en/login`, { waitUntil: "networkidle2", timeout: 15000 });
    await new Promise((r) => setTimeout(r, 1500));
    await page.type("#email", "test@example.com");
    await page.type("#password", "Test1234!");
    await screenshot(page, "03-login-filled");

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);
    await new Promise((r) => setTimeout(r, 3000));
    console.log(`  → After login: ${page.url()}`);
    await screenshot(page, "04-after-login");
  } else {
    console.log("  ✓ Auto-logged in after registration");
  }

  // ==============================
  // Step 3: Home page (logged in)
  // ==============================
  console.log("\n🔹 Step 3: Home page (logged in)");
  await page.goto(`${BASE}/en`, { waitUntil: "networkidle2", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));
  await screenshot(page, "05-home-logged-in");

  // ==============================
  // Step 4: Go to Predict page
  // ==============================
  console.log("\n🔹 Step 4: Predict page");
  await page.goto(`${BASE}/en/predict`, { waitUntil: "networkidle2", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 2000));
  await screenshot(page, "06-predict-list");

  // ==============================
  // Step 5: Click first prediction event
  // ==============================
  console.log("\n🔹 Step 5: Open first prediction detail");
  // Get links that go to /predict/{id} but NOT /predict/create
  const allPredictLinks = await page.$$('a[href*="/predict/"]');
  const eventLinks = [];
  for (const link of allPredictLinks) {
    const href = await page.evaluate((el) => el.getAttribute("href"), link);
    if (href && !href.includes("create") && /\/predict\/[a-zA-Z0-9]/.test(href)) {
      eventLinks.push({ el: link, href });
    }
  }
  console.log(`  Found ${eventLinks.length} prediction event links`);

  if (eventLinks.length > 0) {
    console.log(`  Clicking: ${eventLinks[0].href}`);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {}),
      eventLinks[0].el.click(),
    ]);
    await new Promise((r) => setTimeout(r, 2000));
    console.log(`  → Detail page: ${page.url()}`);
    await screenshot(page, "07-prediction-detail");
  } else {
    console.log("  ⚠ No prediction event links found");
  }

  // ==============================
  // Step 6: Select YES and place bet
  // ==============================
  console.log("\n🔹 Step 6: Place YES bet");

  // Click YES button (aria-pressed pattern)
  const yesBtn = await page.$('button[aria-pressed][aria-label*="YES"]');
  if (yesBtn) {
    await yesBtn.click();
    await new Promise((r) => setTimeout(r, 1000));
    console.log("  ✓ Clicked YES button");
    await screenshot(page, "08-yes-selected");

    // Wait for bet amount input to appear
    const betInput = await page.waitForSelector("#bet-amount", { timeout: 3000 }).catch(() => null);
    if (betInput) {
      // Clear and type amount
      await betInput.click({ clickCount: 3 });
      await betInput.type("100");
      await new Promise((r) => setTimeout(r, 500));
      await screenshot(page, "09-bet-amount");

      // Click confirm button (contains "Confirm YES")
      const confirmBtns = await page.$$("button");
      let confirmBtn = null;
      for (const btn of confirmBtns) {
        const text = await page.evaluate((el) => el.textContent, btn);
        if (text && (text.includes("Confirm YES") || text.includes("확인 YES") || text.includes("YES - 100"))) {
          confirmBtn = btn;
          break;
        }
      }

      if (confirmBtn) {
        console.log("  Placing bet...");
        await confirmBtn.click();
        await new Promise((r) => setTimeout(r, 3000));
        await screenshot(page, "10-bet-placed");
        console.log("  ✓ Bet placed!");
      } else {
        // Try any button that looks like a confirm
        const allBtns = await page.$$("button");
        for (const btn of allBtns) {
          const text = await page.evaluate((el) => el.textContent?.trim(), btn);
          if (text && text.includes("100")) {
            console.log(`  Found button with "100": "${text}"`);
            await btn.click();
            await new Promise((r) => setTimeout(r, 3000));
            await screenshot(page, "10-bet-placed");
            console.log("  ✓ Bet placed!");
            break;
          }
        }
      }
    } else {
      console.log("  ⚠ Bet amount input not found");
      await screenshot(page, "09-no-bet-input");
    }
  } else {
    console.log("  ⚠ YES button not found, dumping buttons...");
    const allBtns = await page.$$("button");
    for (const btn of allBtns) {
      const text = await page.evaluate((el) => el.textContent?.trim(), btn);
      const ariaLabel = await page.evaluate((el) => el.getAttribute("aria-label"), btn);
      console.log(`    btn: text="${text}" aria-label="${ariaLabel}"`);
    }
    await screenshot(page, "08-debug-buttons");
  }

  // ==============================
  // Step 7: Check Portfolio
  // ==============================
  console.log("\n🔹 Step 7: Portfolio page");
  await page.goto(`${BASE}/en/portfolio`, { waitUntil: "networkidle2", timeout: 15000 });
  await new Promise((r) => setTimeout(r, 3000));
  console.log(`  → Portfolio: ${page.url()}`);
  await screenshot(page, "11-portfolio");

  await browser.close();
  console.log("\n✅ Test complete! Screenshots in screenshots/test-flow/");
}

main().catch(console.error);
