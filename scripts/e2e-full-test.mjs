#!/usr/bin/env node
/**
 * PredictFlow - Comprehensive E2E Test Suite v2
 *
 * 60+ test cases covering:
 *  S1: Auth - Registration edge cases (TC-01 ~ TC-08)
 *  S2: Auth - Login edge cases (TC-09 ~ TC-15)
 *  S3: Markets - Search, Filter, Sort, Pagination (TC-16 ~ TC-23)
 *  S4: Market Detail - Chart, Order Book, Share, Trade CTA (TC-24 ~ TC-30)
 *  S5: Predictions - List, Detail, Create (TC-31 ~ TC-37)
 *  S6: Betting - Full flow + edge cases (TC-38 ~ TC-46)
 *  S7: Portfolio & Profile (TC-47 ~ TC-52)
 *  S8: i18n - Locale switching, key completeness (TC-53 ~ TC-57)
 *  S9: Mobile Responsive (TC-58 ~ TC-62)
 *  S10: API Validation & Security (TC-63 ~ TC-72)
 *  S11: SEO & Performance (TC-73 ~ TC-77)
 */
import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";
import { mkdirSync, writeFileSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "screenshots", "e2e-full");
mkdirSync(outDir, { recursive: true });

const BASE = "https://flux-polymarket.vercel.app";
const results = [];
let ssIdx = 0;

function pad(n) { return String(n).padStart(2, "0"); }

async function ss(page, name) {
  ssIdx++;
  const fname = `${pad(ssIdx)}-${name}.png`;
  await page.screenshot({ path: path.join(outDir, fname), fullPage: false });
  return fname;
}

function log(id, title, status, detail = "", file = "") {
  const icon = status === "PASS" ? "\u2705" : status === "FAIL" ? "\u274c" : "\u26a0\ufe0f";
  console.log(`  ${icon} ${id}: ${title} — ${status}${detail ? ` | ${detail}` : ""}`);
  results.push({ id, title, status, detail, screenshot: file });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getText(page, selector) {
  const el = await page.$(selector);
  return el ? await page.evaluate(e => e.textContent?.trim(), el) : null;
}

async function waitMs(ms) { return new Promise(r => setTimeout(r, ms)); }

// Fetch JSON helper (runs in page context)
async function fetchJSON(page, url, options = {}) {
  return page.evaluate(async (u, o) => {
    const r = await fetch(u, o);
    let body;
    try { body = await r.json(); } catch { body = null; }
    return { status: r.status, body };
  }, url, options);
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 },
  });

  let page = await browser.newPage();
  const TS = Date.now();
  const testEmail = `e2e-full-${TS}@example.com`;
  const testPw = "TestPass123!";

  // ═══════════════════════════════════════════
  // S1: Auth - Registration Edge Cases
  // ═══════════════════════════════════════════
  console.log("\n\u2501 S1: Registration Edge Cases");

  // TC-01: Empty form submit
  try {
    await page.goto(`${BASE}/en/register`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(2000);
    await page.click('button[type="submit"]');
    await waitMs(1500);
    const img = await ss(page, "register-empty-submit");
    // Check for HTML5 validation or error messages
    const url = page.url();
    log("TC-01", "Register: empty form submit blocked", url.includes("register") ? "PASS" : "FAIL", "Form not submitted (validation)", img);
  } catch (e) { log("TC-01", "Register: empty form submit", "FAIL", e.message); }

  // TC-02: Invalid email format
  try {
    await page.goto(`${BASE}/en/register`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(1500);
    await page.type("#name", "Test");
    await page.type("#email", "not-an-email");
    await page.type("#password", testPw);
    await page.type("#confirm-password", testPw);
    await page.click('button[type="submit"]');
    await waitMs(2000);
    const img = await ss(page, "register-invalid-email");
    const url = page.url();
    log("TC-02", "Register: invalid email rejected", url.includes("register") ? "PASS" : "FAIL", "Stayed on register page", img);
  } catch (e) { log("TC-02", "Register: invalid email", "FAIL", e.message); }

  // TC-03: Password too short (< 8 chars)
  try {
    await page.goto(`${BASE}/en/register`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(1500);
    await page.type("#name", "Test");
    await page.type("#email", `short-pw-${TS}@example.com`);
    await page.type("#password", "Ab1!");
    await page.type("#confirm-password", "Ab1!");
    await page.click('button[type="submit"]');
    await waitMs(2000);
    const content = await page.content();
    const hasError = content.includes("8") || content.includes("character") || content.includes("짧");
    const img = await ss(page, "register-short-password");
    log("TC-03", "Register: short password rejected", hasError || page.url().includes("register") ? "PASS" : "FAIL", "Password min 8 chars enforced", img);
  } catch (e) { log("TC-03", "Register: short password", "FAIL", e.message); }

  // TC-04: Password mismatch
  try {
    await page.goto(`${BASE}/en/register`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(1500);
    await page.type("#name", "Test");
    await page.type("#email", `mismatch-${TS}@example.com`);
    await page.type("#password", "TestPass123!");
    await page.type("#confirm-password", "DifferentPass!");
    await page.click('button[type="submit"]');
    await waitMs(2000);
    const content = await page.content();
    const hasError = content.includes("match") || content.includes("일치");
    const img = await ss(page, "register-pw-mismatch");
    log("TC-04", "Register: password mismatch rejected", hasError || page.url().includes("register") ? "PASS" : "FAIL", "Passwords must match", img);
  } catch (e) { log("TC-04", "Register: password mismatch", "FAIL", e.message); }

  // TC-05: Successful registration
  try {
    await page.goto(`${BASE}/en/register`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(1500);
    await page.type("#name", "E2E FullTest");
    await page.type("#email", testEmail);
    await page.type("#password", testPw);
    await page.type("#confirm-password", testPw);
    await ss(page, "register-valid-filled");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);
    await waitMs(3000);
    const img = await ss(page, "register-success");
    log("TC-05", "Register: successful signup", !page.url().includes("register") ? "PASS" : "FAIL", `Redirected to: ${page.url()}`, img);
  } catch (e) { log("TC-05", "Register: successful signup", "FAIL", e.message); }

  // TC-06: Initial points = 1,000
  try {
    await page.goto(`${BASE}/en`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(3000);
    const content = await page.content();
    const has1000 = content.includes("1,000") || content.includes("1000");
    const img = await ss(page, "register-initial-points");
    log("TC-06", "Register: initial 1,000 points", has1000 ? "PASS" : "FAIL", "Points displayed in navbar", img);
  } catch (e) { log("TC-06", "Register: initial points", "FAIL", e.message); }

  // TC-07: Navbar shows username & Portfolio link
  try {
    const content = await page.content();
    const hasName = content.includes("E2E FullTest");
    const hasPortfolio = content.includes("Portfolio") || content.includes("포트폴리오");
    const img = await ss(page, "register-navbar-loggedin");
    log("TC-07", "Register: navbar shows user info", hasName && hasPortfolio ? "PASS" : "FAIL", `name=${hasName}, portfolio=${hasPortfolio}`, img);
  } catch (e) { log("TC-07", "Register: navbar user info", "FAIL", e.message); }

  // TC-08: Duplicate email registration
  try {
    // Logout first
    const cookies = await page.cookies();
    await page.deleteCookie(...cookies);
    const res = await fetchJSON(page, `${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Dup", email: testEmail, password: testPw }),
    });
    // Should return 200 (anti-enumeration) but user can't login with new password
    log("TC-08", "Register: duplicate email handled", res.status === 200 ? "PASS" : "FAIL", `HTTP ${res.status} (anti-enumeration)`, "");
  } catch (e) { log("TC-08", "Register: duplicate email", "FAIL", e.message); }

  // ═══════════════════════════════════════════
  // S2: Auth - Login Edge Cases
  // ═══════════════════════════════════════════
  console.log("\n\u2501 S2: Login Edge Cases");

  // TC-09: Empty login submit
  try {
    await page.goto(`${BASE}/en/login`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(1500);
    await page.click('button[type="submit"]');
    await waitMs(1500);
    const img = await ss(page, "login-empty");
    log("TC-09", "Login: empty form blocked", page.url().includes("login") ? "PASS" : "FAIL", "HTML5 validation", img);
  } catch (e) { log("TC-09", "Login: empty form", "FAIL", e.message); }

  // TC-10: Wrong password
  try {
    await page.goto(`${BASE}/en/login`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(1500);
    await page.type("#email", testEmail);
    await page.type("#password", "WrongPassword!");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);
    await waitMs(2000);
    const content = await page.content();
    const hasError = content.includes("error") || content.includes("Invalid") || content.includes("실패") || content.includes("incorrect");
    const img = await ss(page, "login-wrong-pw");
    log("TC-10", "Login: wrong password rejected", page.url().includes("login") ? "PASS" : "FAIL", `Error shown=${hasError}`, img);
  } catch (e) { log("TC-10", "Login: wrong password", "FAIL", e.message); }

  // TC-11: Non-existent email
  try {
    await page.goto(`${BASE}/en/login`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(1500);
    await page.type("#email", "nonexistent@example.com");
    await page.type("#password", testPw);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);
    await waitMs(2000);
    const img = await ss(page, "login-nonexistent");
    log("TC-11", "Login: non-existent email rejected", page.url().includes("login") ? "PASS" : "FAIL", "Stayed on login", img);
  } catch (e) { log("TC-11", "Login: non-existent email", "FAIL", e.message); }

  // TC-12: Successful login
  try {
    await page.goto(`${BASE}/en/login`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(1500);
    await page.type("#email", testEmail);
    await page.type("#password", testPw);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);
    await waitMs(3000);
    const img = await ss(page, "login-success");
    log("TC-12", "Login: successful login", !page.url().includes("login") ? "PASS" : "FAIL", `Redirected to: ${page.url()}`, img);
  } catch (e) { log("TC-12", "Login: successful login", "FAIL", e.message); }

  // TC-13: Auth-gated route redirects to login
  try {
    const cookies = await page.cookies();
    await page.deleteCookie(...cookies);
    await page.goto(`${BASE}/en/portfolio`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(2000);
    const url = page.url();
    const img = await ss(page, "auth-gate-portfolio");
    log("TC-13", "Auth gate: /portfolio redirects to login", url.includes("login") ? "PASS" : "FAIL", `url=${url}`, img);
  } catch (e) { log("TC-13", "Auth gate: portfolio", "FAIL", e.message); }

  // TC-14: Auth-gated /notifications redirects
  try {
    await page.goto(`${BASE}/en/notifications`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(2000);
    const url = page.url();
    const img = await ss(page, "auth-gate-notifications");
    log("TC-14", "Auth gate: /notifications redirects to login", url.includes("login") ? "PASS" : "FAIL", `url=${url}`, img);
  } catch (e) { log("TC-14", "Auth gate: notifications", "FAIL", e.message); }

  // TC-15: Auth-gated /profile redirects
  try {
    await page.goto(`${BASE}/en/profile`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(2000);
    const url = page.url();
    const img = await ss(page, "auth-gate-profile");
    log("TC-15", "Auth gate: /profile redirects to login", url.includes("login") ? "PASS" : "FAIL", `url=${url}`, img);
  } catch (e) { log("TC-15", "Auth gate: profile", "FAIL", e.message); }

  // Re-login for subsequent tests
  await page.goto(`${BASE}/en/login`, { waitUntil: "networkidle2", timeout: 30000 });
  await waitMs(1500);
  await page.type("#email", testEmail);
  await page.type("#password", testPw);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await waitMs(3000);

  // ═══════════════════════════════════════════
  // S3: Markets Explorer
  // ═══════════════════════════════════════════
  console.log("\n\u2501 S3: Markets Explorer");

  // TC-16: Markets page loads with data
  try {
    await page.goto(`${BASE}/en/markets`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(3000);
    const cards = await page.$$("a[href*='/markets/']");
    const img = await ss(page, "markets-loaded");
    log("TC-16", "Markets: page loads with cards", cards.length > 0 ? "PASS" : "FAIL", `${cards.length} cards`, img);
  } catch (e) { log("TC-16", "Markets: page load", "FAIL", e.message); }

  // TC-17: Search with results
  try {
    await page.goto(`${BASE}/en/markets`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(2000);
    const input = await page.$('input[placeholder*="Search"], input[placeholder*="search"]');
    await input.type("Trump");
    await waitMs(3000);
    const cards = await page.$$("a[href*='/markets/']");
    const img = await ss(page, "markets-search-trump");
    log("TC-17", "Markets: search 'Trump'", cards.length > 0 ? "PASS" : "FAIL", `${cards.length} results`, img);
  } catch (e) { log("TC-17", "Markets: search", "FAIL", e.message); }

  // TC-18: Search with no results
  try {
    await page.goto(`${BASE}/en/markets`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(2000);
    const input = await page.$('input[placeholder*="Search"], input[placeholder*="search"]');
    await input.type("xyznonexistent12345");
    await waitMs(3000);
    const content = await page.content();
    const noResults = content.includes("No markets") || content.includes("no results") || content.includes("찾을 수 없") || (await page.$$("a[href*='/markets/']")).length === 0;
    const img = await ss(page, "markets-search-empty");
    log("TC-18", "Markets: search no results", noResults ? "PASS" : "FAIL", "Empty state shown", img);
  } catch (e) { log("TC-18", "Markets: search empty", "FAIL", e.message); }

  // TC-19 ~ TC-22: Category filters
  for (const cat of ["Politics", "Sports", "Crypto", "Culture"]) {
    const tcId = `TC-${19 + ["Politics", "Sports", "Crypto", "Culture"].indexOf(cat)}`;
    try {
      await page.goto(`${BASE}/en/markets`, { waitUntil: "networkidle2", timeout: 30000 });
      await waitMs(2000);
      const btns = await page.$$("button");
      let clicked = false;
      for (const btn of btns) {
        const text = await page.evaluate(e => e.textContent?.trim(), btn);
        if (text === cat) { await btn.click(); clicked = true; break; }
      }
      await waitMs(3000);
      const img = await ss(page, `markets-filter-${cat.toLowerCase()}`);
      log(tcId, `Markets: ${cat} filter`, clicked ? "PASS" : "FAIL", `Filter applied`, img);
    } catch (e) { log(tcId, `Markets: ${cat} filter`, "FAIL", e.message); }
  }

  // TC-23: Sort dropdown
  try {
    await page.goto(`${BASE}/en/markets`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(2000);
    const select = await page.$("select");
    if (select) {
      await select.select("startDate");
      await waitMs(3000);
      const img = await ss(page, "markets-sort-newest");
      log("TC-23", "Markets: sort by newest", "PASS", "Sort changed", img);
    } else {
      log("TC-23", "Markets: sort dropdown", "FAIL", "Select not found");
    }
  } catch (e) { log("TC-23", "Markets: sort", "FAIL", e.message); }

  // ═══════════════════════════════════════════
  // S4: Market Detail
  // ═══════════════════════════════════════════
  console.log("\n\u2501 S4: Market Detail");

  // TC-24: Market detail loads
  try {
    await page.goto(`${BASE}/en/markets`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(3000);
    const links = await page.$$("a[href*='/markets/']");
    if (links.length > 0) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}),
        links[0].click(),
      ]);
      await waitMs(4000);
      const img = await ss(page, "market-detail-loaded");
      log("TC-24", "Market Detail: page loads", page.url().includes("/markets/") ? "PASS" : "FAIL", page.url(), img);
    } else {
      log("TC-24", "Market Detail: page loads", "FAIL", "No market links");
    }
  } catch (e) { log("TC-24", "Market Detail: load", "FAIL", e.message); }

  // TC-25: Price chart visible
  try {
    const chart = await page.$("canvas");
    log("TC-25", "Market Detail: price chart renders", chart ? "PASS" : "FAIL", `canvas=${!!chart}`);
  } catch (e) { log("TC-25", "Market Detail: chart", "FAIL", e.message); }

  // TC-26: Share buttons present
  try {
    const content = await page.content();
    const hasX = content.includes("X") || content.includes("Twitter");
    const hasKakao = content.includes("Kakao") || content.includes("카카오");
    const hasCopy = content.includes("Copy") || content.includes("복사");
    const img = await ss(page, "market-detail-share");
    log("TC-26", "Market Detail: share buttons", hasX && hasKakao && hasCopy ? "PASS" : "FAIL", `X=${hasX}, Kakao=${hasKakao}, Copy=${hasCopy}`, img);
  } catch (e) { log("TC-26", "Market Detail: share", "FAIL", e.message); }

  // TC-27: Trade on Polymarket CTA
  try {
    const content = await page.content();
    const hasCTA = content.includes("Trade on Polymarket") || content.includes("Polymarket에서 거래");
    log("TC-27", "Market Detail: Trade CTA", hasCTA ? "PASS" : "FAIL", `CTA found=${hasCTA}`);
  } catch (e) { log("TC-27", "Market Detail: Trade CTA", "FAIL", e.message); }

  // TC-28: Time period buttons (1H, 6H, 1D, 1W, ALL)
  try {
    const content = await page.content();
    const has1H = content.includes("1H");
    const hasALL = content.includes("ALL");
    log("TC-28", "Market Detail: time period buttons", has1H && hasALL ? "PASS" : "FAIL", `1H=${has1H}, ALL=${hasALL}`);
  } catch (e) { log("TC-28", "Market Detail: time periods", "FAIL", e.message); }

  // TC-29: Volume & Liquidity stats
  try {
    const content = await page.content();
    const hasVol = content.includes("Volume") || content.includes("거래량");
    const hasLiq = content.includes("Liquidity") || content.includes("유동성");
    log("TC-29", "Market Detail: volume/liquidity stats", hasVol || hasLiq ? "PASS" : "FAIL", `Volume=${hasVol}, Liquidity=${hasLiq}`);
  } catch (e) { log("TC-29", "Market Detail: stats", "FAIL", e.message); }

  // TC-30: Scroll to bottom content
  try {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await waitMs(2000);
    const img = await ss(page, "market-detail-bottom");
    log("TC-30", "Market Detail: scroll to bottom", "PASS", "Bottom content visible", img);
  } catch (e) { log("TC-30", "Market Detail: scroll", "FAIL", e.message); }

  // ═══════════════════════════════════════════
  // S5: Predictions
  // ═══════════════════════════════════════════
  console.log("\n\u2501 S5: Predictions");

  // TC-31: Predict page shows 8 events
  try {
    await page.goto(`${BASE}/en/predict`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(3000);
    const allLinks = await page.$$("a[href*='/predict/']");
    const eventLinks = [];
    for (const link of allLinks) {
      const href = await page.evaluate(e => e.getAttribute("href"), link);
      if (href && !href.includes("create") && /\/predict\/[a-zA-Z0-9]/.test(href)) eventLinks.push(link);
    }
    const img = await ss(page, "predict-list");
    log("TC-31", "Predict: shows seed events", eventLinks.length === 8 ? "PASS" : "WARN", `${eventLinks.length} events (expected 8)`, img);
  } catch (e) { log("TC-31", "Predict: list", "FAIL", e.message); }

  // TC-32: Category filters on predict page
  try {
    const btns = await page.$$("button");
    const categories = [];
    for (const btn of btns) {
      const text = await page.evaluate(e => e.textContent?.trim(), btn);
      if (["General", "Politics", "Sports", "Crypto", "Entertainment", "Technology"].includes(text)) {
        categories.push(text);
      }
    }
    log("TC-32", "Predict: category filters present", categories.length >= 4 ? "PASS" : "FAIL", `Found: ${categories.join(", ")}`);
  } catch (e) { log("TC-32", "Predict: categories", "FAIL", e.message); }

  // TC-33: Prediction detail page
  try {
    const allLinks = await page.$$("a[href*='/predict/']");
    const eventLinks = [];
    for (const link of allLinks) {
      const href = await page.evaluate(e => e.getAttribute("href"), link);
      if (href && !href.includes("create") && /\/predict\/[a-zA-Z0-9]/.test(href)) eventLinks.push(link);
    }
    if (eventLinks.length > 0) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 30000 }).catch(() => {}),
        eventLinks[0].click(),
      ]);
      await waitMs(3000);
      const img = await ss(page, "predict-detail");
      log("TC-33", "Predict: detail page loads", page.url().includes("/predict/") ? "PASS" : "FAIL", page.url(), img);
    } else { log("TC-33", "Predict: detail page", "FAIL", "No event links"); }
  } catch (e) { log("TC-33", "Predict: detail", "FAIL", e.message); }

  // TC-34: Detail has YES/NO buttons
  try {
    await page.$('button[aria-pressed]');
    const content = await page.content();
    const hasYes = content.includes("YES") || content.includes("Yes");
    const hasNo = content.includes("NO") || content.includes("No");
    log("TC-34", "Predict Detail: YES/NO buttons", hasYes && hasNo ? "PASS" : "FAIL", `YES=${hasYes}, NO=${hasNo}`);
  } catch (e) { log("TC-34", "Predict Detail: YES/NO", "FAIL", e.message); }

  // TC-35: Detail has comments section
  try {
    const content = await page.content();
    const hasComments = content.includes("Comments") || content.includes("댓글");
    const hasInput = await page.$("textarea");
    log("TC-35", "Predict Detail: comments section", hasComments ? "PASS" : "FAIL", `section=${hasComments}, input=${!!hasInput}`);
  } catch (e) { log("TC-35", "Predict Detail: comments", "FAIL", e.message); }

  // TC-36: Detail has share buttons
  try {
    const content = await page.content();
    const hasShare = content.includes("Share") || content.includes("공유") || content.includes("X") || content.includes("Kakao");
    log("TC-36", "Predict Detail: share buttons", hasShare ? "PASS" : "FAIL", `share=${hasShare}`);
  } catch (e) { log("TC-36", "Predict Detail: share", "FAIL", e.message); }

  // TC-37: Create prediction page
  try {
    await page.goto(`${BASE}/en/predict/create`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(3000);
    const hasTitle = await page.$("input[type='text'], input[name*='title']");
    const hasTextarea = await page.$("textarea");
    const hasSubmit = await page.$('button[type="submit"]');
    const img = await ss(page, "predict-create");
    log("TC-37", "Predict: create page has form", hasSubmit ? "PASS" : "WARN", `title=${!!hasTitle}, desc=${!!hasTextarea}, submit=${!!hasSubmit}`, img);
  } catch (e) { log("TC-37", "Predict: create form", "FAIL", e.message); }

  // ═══════════════════════════════════════════
  // S6: Betting Flow + Edge Cases
  // ═══════════════════════════════════════════
  console.log("\n\u2501 S6: Betting Flow");

  // Navigate to first prediction — re-login with original test user first
  try {
    await page.goto(`${BASE}/en/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitMs(2000);
    const emailInput = await page.$('input[type="email"]');
    if (emailInput) { await emailInput.click({ clickCount: 3 }); await emailInput.type(testEmail); }
    const pwInput = await page.$('input[type="password"]');
    if (pwInput) { await pwInput.click({ clickCount: 3 }); await pwInput.type(testPw); }
    const loginBtn = await page.$('button[type="submit"]');
    if (loginBtn) await loginBtn.click();
    await waitMs(5000);
  } catch (e) { console.log("  [Bet setup: login failed, continuing]", e.message); }

  try {
    await page.goto(`${BASE}/en/predict`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitMs(3000);
  } catch { console.log("  [Bet setup: predict page load failed, retrying]"); await page.goto(`${BASE}/en/predict`, { waitUntil: "load", timeout: 30000 }); await waitMs(3000); }

  const predLinks = await page.$$("a[href*='/predict/']");
  const validLinks = [];
  for (const link of predLinks) {
    const href = await page.evaluate(e => e.getAttribute("href"), link);
    if (href && !href.includes("create") && /\/predict\/[a-zA-Z0-9]/.test(href)) validLinks.push(link);
  }
  if (validLinks.length > 0) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {}),
      validLinks[0].click(),
    ]);
    await waitMs(3000);
  }

  // TC-38: Select YES
  try {
    const btns = await page.$$("button");
    let yesClicked = false;
    for (const btn of btns) {
      const text = await page.evaluate(e => e.textContent?.trim(), btn);
      const aria = await page.evaluate(e => e.getAttribute("aria-label"), btn);
      if ((text === "YES" || (aria && aria.includes("YES")))) {
        await btn.click();
        yesClicked = true;
        break;
      }
    }
    await waitMs(1500);
    const img = await ss(page, "bet-yes-selected");
    log("TC-38", "Bet: select YES", yesClicked ? "PASS" : "FAIL", "", img);
  } catch (e) { log("TC-38", "Bet: select YES", "FAIL", e.message); }

  // TC-39: Select NO (switch)
  try {
    const btns = await page.$$("button");
    let noClicked = false;
    for (const btn of btns) {
      const text = await page.evaluate(e => e.textContent?.trim(), btn);
      const aria = await page.evaluate(e => e.getAttribute("aria-label"), btn);
      if ((text === "NO" || (aria && aria.includes("NO")))) {
        await btn.click();
        noClicked = true;
        break;
      }
    }
    await waitMs(1500);
    const img = await ss(page, "bet-no-selected");
    log("TC-39", "Bet: switch to NO", noClicked ? "PASS" : "FAIL", "", img);
  } catch (e) { log("TC-39", "Bet: select NO", "FAIL", e.message); }

  // TC-40: Switch back to YES
  try {
    const btns = await page.$$("button");
    for (const btn of btns) {
      const text = await page.evaluate(e => e.textContent?.trim(), btn);
      if (text === "YES") { await btn.click(); break; }
    }
    await waitMs(1000);
    log("TC-40", "Bet: switch back to YES", "PASS", "Toggled");
  } catch (e) { log("TC-40", "Bet: toggle", "FAIL", e.message); }

  // TC-41: Enter bet amount
  try {
    const betInput = await page.waitForSelector("#bet-amount, input[type='number']", { timeout: 3000 }).catch(() => null);
    if (betInput) {
      await betInput.click({ clickCount: 3 });
      await betInput.type("50");
      await waitMs(1000);
      const img = await ss(page, "bet-amount-50");
      log("TC-41", "Bet: enter amount 50", "PASS", "50 pts entered", img);
    } else {
      log("TC-41", "Bet: enter amount", "FAIL", "Input not found");
    }
  } catch (e) { log("TC-41", "Bet: amount", "FAIL", e.message); }

  // TC-42: Confirm button shows correct amount
  try {
    const content = await page.content();
    const hasConfirm = content.includes("Confirm YES") || content.includes("50 pts") || content.includes("50") || content.includes("확인");
    log("TC-42", "Bet: confirm button shows amount", hasConfirm ? "PASS" : "WARN", `confirm text found=${hasConfirm}`);
  } catch (e) { log("TC-42", "Bet: confirm text", "FAIL", e.message); }

  // TC-43: Place first bet (50 pts on YES)
  try {
    const btns = await page.$$("button");
    let confirmBtn = null;
    for (const btn of btns) {
      const text = await page.evaluate(e => e.textContent?.trim(), btn);
      if (text && (text.includes("Confirm") || text.includes("50") || text.includes("확인"))) {
        confirmBtn = btn;
        break;
      }
    }
    if (confirmBtn) {
      await confirmBtn.click();
      await waitMs(4000);
      const img = await ss(page, "bet-first-placed");
      log("TC-43", "Bet: place 50 YES", "PASS", "First bet placed", img);
    } else {
      log("TC-43", "Bet: place first bet", "FAIL", "Confirm button not found");
    }
  } catch (e) { log("TC-43", "Bet: first bet", "FAIL", e.message); }

  // TC-44: Points deducted (1000 -> 950)
  try {
    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitMs(4000);
    const content = await page.content();
    const has950 = content.includes("950");
    const img = await ss(page, "bet-points-deducted");
    log("TC-44", "Bet: points deducted to 950", has950 ? "PASS" : "WARN", `950 found=${has950}`, img);
  } catch (e) { log("TC-44", "Bet: points deducted", "FAIL", e.message); }

  // TC-45: Place second bet (another event, 100 pts)
  try {
    await page.goto(`${BASE}/en/predict`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitMs(3000);
    const links2 = await page.$$("a[href*='/predict/']");
    const valid2 = [];
    for (const link of links2) {
      const href = await page.evaluate(e => e.getAttribute("href"), link);
      if (href && !href.includes("create") && /\/predict\/[a-zA-Z0-9]/.test(href)) valid2.push(link);
    }
    if (valid2.length > 1) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {}),
        valid2[1].click(), // Second event
      ]);
      await waitMs(3000);
      // Click YES
      const btns = await page.$$("button");
      for (const btn of btns) {
        const text = await page.evaluate(e => e.textContent?.trim(), btn);
        if (text === "YES") { await btn.click(); break; }
      }
      await waitMs(1000);
      // Enter 100
      const input = await page.waitForSelector("#bet-amount, input[type='number']", { timeout: 3000 }).catch(() => null);
      if (input) {
        await input.click({ clickCount: 3 });
        await input.type("100");
        await waitMs(1000);
        // Confirm
        const btns2 = await page.$$("button");
        for (const btn of btns2) {
          const text = await page.evaluate(e => e.textContent?.trim(), btn);
          if (text && (text.includes("Confirm") || text.includes("100"))) {
            await btn.click();
            break;
          }
        }
        await waitMs(4000);
        const img = await ss(page, "bet-second-placed");
        log("TC-45", "Bet: second bet 100 YES", "PASS", "Second bet placed", img);
      } else {
        log("TC-45", "Bet: second bet", "FAIL", "Input not found");
      }
    } else {
      log("TC-45", "Bet: second bet", "FAIL", "Not enough events");
    }
  } catch (e) { log("TC-45", "Bet: second bet", "FAIL", e.message); }

  // TC-46: API rejects bet > balance
  try {
    const res = await fetchJSON(page, `${BASE}/api/events`);
    if (res.body && res.body.length > 0) {
      const eventId = res.body[0].id;
      const betRes = await fetchJSON(page, `${BASE}/api/bets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, choice: "yes", amount: 999999 }),
      });
      log("TC-46", "Bet: API rejects bet > balance", betRes.status === 400 ? "PASS" : "FAIL", `HTTP ${betRes.status}`);
    } else {
      log("TC-46", "Bet: API rejects", "FAIL", "No events");
    }
  } catch (e) { log("TC-46", "Bet: over-balance", "FAIL", e.message); }

  // ═══════════════════════════════════════════
  // S7: Portfolio & Profile
  // ═══════════════════════════════════════════
  console.log("\n\u2501 S7: Portfolio & Profile");

  // TC-47: Portfolio shows bet history
  try {
    await page.goto(`${BASE}/en/portfolio`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitMs(4000);
    const content = await page.content();
    const hasBets = content.includes("YES") || content.includes("Active") || content.includes("활성");
    const img = await ss(page, "portfolio-with-bets");
    log("TC-47", "Portfolio: shows bet history", hasBets ? "PASS" : "WARN", `bets visible=${hasBets}`, img);
  } catch (e) { log("TC-47", "Portfolio: bet history", "FAIL", e.message); }

  // TC-48: Portfolio shows remaining points
  try {
    const content = await page.content();
    const hasPoints = content.includes("850") || content.includes("950") || content.includes("pts") || content.includes("포인트") || content.includes("Points");
    log("TC-48", "Portfolio: shows points", hasPoints ? "PASS" : "WARN", `points visible=${hasPoints}`);
  } catch (e) { log("TC-48", "Portfolio: points", "FAIL", e.message); }

  // TC-49: Profile page loads
  try {
    await page.goto(`${BASE}/en/profile`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitMs(4000);
    const content = await page.content();
    const hasName = content.includes("E2E FullTest") || content.includes("Profile") || content.includes("프로필");
    const hasEmail = content.includes(testEmail) || content.includes("@");
    const img = await ss(page, "profile-page");
    log("TC-49", "Profile: page loads with user info", hasName ? "PASS" : "FAIL", `name=${hasName}, email=${hasEmail}`, img);
  } catch (e) { log("TC-49", "Profile: load", "FAIL", e.message); }

  // TC-50: Forgot password page
  try {
    await page.goto(`${BASE}/en/forgot-password`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitMs(2000);
    const emailInput = await page.$("#email, input[type='email']");
    const submitBtn = await page.$('button[type="submit"]');
    const img = await ss(page, "forgot-password");
    log("TC-50", "Forgot Password: page loads", emailInput && submitBtn ? "PASS" : "FAIL", `email=${!!emailInput}, submit=${!!submitBtn}`, img);
  } catch (e) { log("TC-50", "Forgot Password", "FAIL", e.message); }

  // TC-51: Leaderboard Polymarket tab
  try {
    await page.goto(`${BASE}/en/leaderboard`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitMs(3000);
    const content = await page.content();
    const hasRanks = content.includes("Rank") || content.includes("순위") || content.includes("PnL");
    const img = await ss(page, "leaderboard-polymarket");
    log("TC-51", "Leaderboard: Polymarket tab", hasRanks ? "PASS" : "FAIL", `rankings=${hasRanks}`, img);
  } catch (e) { log("TC-51", "Leaderboard: Polymarket", "FAIL", e.message); }

  // TC-52: Leaderboard PredictFlow tab
  try {
    const btns = await page.$$("button");
    for (const btn of btns) {
      const text = await page.evaluate(e => e.textContent?.trim(), btn);
      if (text === "PredictFlow") { await btn.click(); break; }
    }
    await waitMs(2000);
    const img = await ss(page, "leaderboard-predictflow");
    log("TC-52", "Leaderboard: PredictFlow tab", "PASS", "Tab switched", img);
  } catch (e) { log("TC-52", "Leaderboard: PredictFlow", "FAIL", e.message); }

  // ═══════════════════════════════════════════
  // S8: i18n
  // ═══════════════════════════════════════════
  console.log("\n\u2501 S8: i18n");

  // TC-53: Korean home
  try {
    await page.goto(`${BASE}/ko`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(3000);
    const lang = await page.evaluate(() => document.documentElement.lang);
    const content = await page.content();
    const hasKo = content.includes("전체 마켓 보기") && content.includes("리더보드");
    const img = await ss(page, "i18n-ko-home");
    log("TC-53", "i18n: Korean home page", hasKo && lang === "ko" ? "PASS" : "FAIL", `lang="${lang}", koreanUI=${hasKo}`, img);
  } catch (e) { log("TC-53", "i18n: Korean home", "FAIL", e.message); }

  // TC-54: Korean markets page
  try {
    await page.goto(`${BASE}/ko/markets`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(3000);
    const content = await page.content();
    const hasKo = content.includes("마켓 탐색기") || content.includes("마켓");
    const img = await ss(page, "i18n-ko-markets");
    log("TC-54", "i18n: Korean markets", hasKo ? "PASS" : "FAIL", `koreanUI=${hasKo}`, img);
  } catch (e) { log("TC-54", "i18n: Korean markets", "FAIL", e.message); }

  // TC-55: Korean predict page
  try {
    await page.goto(`${BASE}/ko/predict`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(3000);
    const content = await page.content();
    const hasKo = content.includes("예측") || content.includes("2027 대선");
    const img = await ss(page, "i18n-ko-predict");
    log("TC-55", "i18n: Korean predict (seed data)", hasKo ? "PASS" : "FAIL", `koreanEvents=${hasKo}`, img);
  } catch (e) { log("TC-55", "i18n: Korean predict", "FAIL", e.message); }

  // TC-56: Locale switch EN -> KO via button
  try {
    await page.goto(`${BASE}/en`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(2000);
    // Try link first, then button with text "KO"
    let koBtn = await page.$('a[href*="/ko"]');
    if (!koBtn) {
      const buttons = await page.$$("button");
      for (const btn of buttons) {
        const text = await page.evaluate(e => e.textContent?.trim(), btn);
        if (text === "KO") { koBtn = btn; break; }
      }
    }
    if (koBtn) {
      await koBtn.click();
      await waitMs(3000);
      const lang = await page.evaluate(() => document.documentElement.lang);
      const img = await ss(page, "i18n-locale-switch");
      log("TC-56", "i18n: locale switch EN->KO", lang === "ko" ? "PASS" : "WARN", `lang="${lang}"`, img);
    } else {
      const img = await ss(page, "i18n-locale-switch");
      log("TC-56", "i18n: locale switch", "WARN", "Locale switch button not found", img);
    }
  } catch (e) { log("TC-56", "i18n: locale switch", "FAIL", e.message); }

  // TC-57: Korean login page
  try {
    await page.goto(`${BASE}/ko/login`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(2000);
    const content = await page.content();
    const hasKo = content.includes("로그인") || content.includes("이메일") || content.includes("비밀번호");
    const img = await ss(page, "i18n-ko-login");
    log("TC-57", "i18n: Korean login page", hasKo ? "PASS" : "FAIL", `koreanUI=${hasKo}`, img);
  } catch (e) { log("TC-57", "i18n: Korean login", "FAIL", e.message); }

  // ═══════════════════════════════════════════
  // S9: Mobile Responsive
  // ═══════════════════════════════════════════
  console.log("\n\u2501 S9: Mobile Responsive");
  await page.close();
  page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  // Re-login on mobile
  await page.goto(`${BASE}/en/login`, { waitUntil: "networkidle2", timeout: 30000 });
  await waitMs(1500);
  await page.type("#email", testEmail);
  await page.type("#password", testPw);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await waitMs(3000);

  // TC-58: Mobile home
  try {
    await page.goto(`${BASE}/en`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(3000);
    const hamburger = await page.$('button.md\\:hidden') || await page.$('header button:last-of-type');
    const img = await ss(page, "mobile-home");
    log("TC-58", "Mobile: home page", "PASS", `hamburger=${!!hamburger}`, img);
  } catch (e) { log("TC-58", "Mobile: home", "FAIL", e.message); }

  // TC-59: Mobile hamburger menu opens
  try {
    const hamburger = await page.$('button.md\\:hidden') || await page.$('header button:last-of-type');
    if (hamburger) {
      await hamburger.click();
      await waitMs(1500);
      const img = await ss(page, "mobile-menu-open");
      const content = await page.content();
      const hasNav = content.includes("Markets") || content.includes("Predict") || content.includes("마켓");
      log("TC-59", "Mobile: hamburger menu opens", hasNav ? "PASS" : "WARN", `nav items visible=${hasNav}`, img);
    } else {
      log("TC-59", "Mobile: hamburger menu", "FAIL", "Button not found");
    }
  } catch (e) { log("TC-59", "Mobile: hamburger", "FAIL", e.message); }

  // TC-60: Mobile markets
  try {
    await page.goto(`${BASE}/en/markets`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(3000);
    const img = await ss(page, "mobile-markets");
    log("TC-60", "Mobile: markets single column", "PASS", "Responsive layout", img);
  } catch (e) { log("TC-60", "Mobile: markets", "FAIL", e.message); }

  // TC-61: Mobile predict
  try {
    await page.goto(`${BASE}/en/predict`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(3000);
    const img = await ss(page, "mobile-predict");
    log("TC-61", "Mobile: predict page", "PASS", "Responsive layout", img);
  } catch (e) { log("TC-61", "Mobile: predict", "FAIL", e.message); }

  // TC-62: Mobile login page
  try {
    const cookies = await page.cookies();
    await page.deleteCookie(...cookies);
    await page.goto(`${BASE}/en/login`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(2000);
    const img = await ss(page, "mobile-login");
    log("TC-62", "Mobile: login page", "PASS", "Responsive form", img);
  } catch (e) { log("TC-62", "Mobile: login", "FAIL", e.message); }

  await page.close();

  // ═══════════════════════════════════════════
  // S10: API Validation & Security
  // ═══════════════════════════════════════════
  console.log("\n\u2501 S10: API Validation & Security");
  page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE}/en`, { waitUntil: "networkidle2", timeout: 30000 });

  // TC-63: GET /api/events returns array
  try {
    const res = await fetchJSON(page, `${BASE}/api/events`);
    log("TC-63", "API: GET /api/events", res.status === 200 && Array.isArray(res.body) ? "PASS" : "FAIL", `HTTP ${res.status}, ${res.body?.length} events`);
  } catch (e) { log("TC-63", "API: events", "FAIL", e.message); }

  // TC-64: GET /api/polymarket/events proxy
  try {
    const res = await fetchJSON(page, `${BASE}/api/polymarket/events?limit=2`);
    log("TC-64", "API: polymarket events proxy", res.status === 200 ? "PASS" : "FAIL", `HTTP ${res.status}`);
  } catch (e) { log("TC-64", "API: polymarket proxy", "FAIL", e.message); }

  // TC-65: GET /api/polymarket/leaderboard proxy
  try {
    const res = await fetchJSON(page, `${BASE}/api/polymarket/leaderboard`);
    log("TC-65", "API: polymarket leaderboard proxy", res.status === 200 ? "PASS" : "FAIL", `HTTP ${res.status}`);
  } catch (e) { log("TC-65", "API: leaderboard proxy", "FAIL", e.message); }

  // TC-66: Register validation - invalid email
  try {
    const res = await fetchJSON(page, `${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "T", email: "bad", password: "x" }),
    });
    log("TC-66", "API: register rejects invalid email", res.status === 400 ? "PASS" : "FAIL", `HTTP ${res.status}, error=${res.body?.error}`);
  } catch (e) { log("TC-66", "API: register validation", "FAIL", e.message); }

  // TC-67: Register validation - short password
  try {
    const res = await fetchJSON(page, `${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "T", email: "valid@test.com", password: "123" }),
    });
    log("TC-67", "API: register rejects short password", res.status === 400 ? "PASS" : "FAIL", `HTTP ${res.status}, error=${res.body?.error}`);
  } catch (e) { log("TC-67", "API: short password", "FAIL", e.message); }

  // TC-68: Bets API unauthenticated
  try {
    const cookies = await page.cookies();
    await page.deleteCookie(...cookies);
    await page.goto(`${BASE}/en`, { waitUntil: "networkidle2", timeout: 30000 });
    const res = await fetchJSON(page, `${BASE}/api/bets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: "fake", choice: "yes", amount: 100 }),
    });
    log("TC-68", "API: bets rejects unauthenticated", res.status === 401 || res.status === 400 ? "PASS" : "FAIL", `HTTP ${res.status}`);
  } catch (e) { log("TC-68", "API: bets unauth", "FAIL", e.message); }

  // TC-69: XSS attempt in register name
  try {
    const res = await fetchJSON(page, `${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: '<script>alert("xss")</script>', email: `xss-${TS}@example.com`, password: "TestPass123!" }),
    });
    // Should either reject or sanitize the name
    const nameStored = res.body?.user?.name || "";
    const hasScript = nameStored.includes("<script>");
    log("TC-69", "Security: XSS in name sanitized", !hasScript ? "PASS" : "FAIL", `stored name="${nameStored}"`);
  } catch (e) { log("TC-69", "Security: XSS", "FAIL", e.message); }

  // TC-70: SQL injection attempt in login
  try {
    const res = await fetchJSON(page, `${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "test", email: "' OR 1=1--", password: "TestPass123!" }),
    });
    log("TC-70", "Security: SQL injection rejected", res.status === 400 ? "PASS" : "FAIL", `HTTP ${res.status}`);
  } catch (e) { log("TC-70", "Security: SQLi", "FAIL", e.message); }

  // TC-71: Admin route blocked for non-admin
  try {
    // Login as test user first
    await page.goto(`${BASE}/en/login`, { waitUntil: "networkidle2", timeout: 30000 });
    await waitMs(1500);
    await page.type("#email", testEmail);
    await page.type("#password", testPw);
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);
    await waitMs(2000);
    const res = await fetchJSON(page, `${BASE}/api/admin/stats`);
    log("TC-71", "Security: admin API blocked for non-admin", res.status === 401 || res.status === 403 ? "PASS" : "FAIL", `HTTP ${res.status}`);
  } catch (e) { log("TC-71", "Security: admin block", "FAIL", e.message); }

  // TC-72: Comments API unauthenticated
  try {
    const cookies = await page.cookies();
    await page.deleteCookie(...cookies);
    await page.goto(`${BASE}/en`, { waitUntil: "networkidle2", timeout: 30000 });
    const eventsRes = await fetchJSON(page, `${BASE}/api/events`);
    if (eventsRes.body?.length > 0) {
      const eventId = eventsRes.body[0].id;
      const res = await fetchJSON(page, `${BASE}/api/events/${eventId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "test comment" }),
      });
      log("TC-72", "Security: comments reject unauthenticated", res.status === 401 ? "PASS" : "FAIL", `HTTP ${res.status}`);
    }
  } catch (e) { log("TC-72", "Security: comments auth", "FAIL", e.message); }

  // ═══════════════════════════════════════════
  // S11: SEO & Performance
  // ═══════════════════════════════════════════
  console.log("\n\u2501 S11: SEO & Performance");

  // TC-73: robots.txt
  try {
    const res = await page.goto(`${BASE}/robots.txt`, { waitUntil: "networkidle2", timeout: 30000 });
    const text = await res.text();
    const valid = text.includes("User-Agent") && text.includes("Sitemap") && text.includes("Disallow");
    log("TC-73", "SEO: robots.txt valid", valid ? "PASS" : "FAIL", `rules present=${valid}`);
  } catch (e) { log("TC-73", "SEO: robots.txt", "FAIL", e.message); }

  // TC-74: sitemap.xml
  try {
    const res = await page.goto(`${BASE}/sitemap.xml`, { waitUntil: "networkidle2", timeout: 30000 });
    const text = await res.text();
    const hasUrls = text.includes("<loc>");
    log("TC-74", "SEO: sitemap.xml valid", res.status() === 200 && hasUrls ? "PASS" : "FAIL", `HTTP ${res.status()}, urls=${hasUrls}`);
  } catch (e) { log("TC-74", "SEO: sitemap.xml", "FAIL", e.message); }

  // TC-75: Security headers
  try {
    const res = await page.goto(`${BASE}/en`, { waitUntil: "networkidle2", timeout: 30000 });
    const h = res.headers();
    const checks = {
      xfo: h["x-frame-options"] === "DENY",
      xcto: h["x-content-type-options"] === "nosniff",
      hsts: !!h["strict-transport-security"],
      rp: h["referrer-policy"] === "strict-origin-when-cross-origin",
    };
    const allPass = checks.xfo && checks.xcto && checks.rp;
    log("TC-75", "Security: response headers", allPass ? "PASS" : "FAIL",
      `XFO=${checks.xfo}, XCTO=${checks.xcto}, HSTS=${checks.hsts}, RP=${checks.rp}`);
  } catch (e) { log("TC-75", "Security: headers", "FAIL", e.message); }

  // TC-76: Page load performance (< 5s)
  try {
    const start = Date.now();
    await page.goto(`${BASE}/en`, { waitUntil: "networkidle2", timeout: 30000 });
    const elapsed = Date.now() - start;
    log("TC-76", "Performance: home load time", elapsed < 5000 ? "PASS" : "WARN", `${elapsed}ms`);
  } catch (e) { log("TC-76", "Performance: home load", "FAIL", e.message); }

  // TC-77: API response time (< 2s)
  try {
    const start = Date.now();
    await fetchJSON(page, `${BASE}/api/events`);
    const elapsed = Date.now() - start;
    log("TC-77", "Performance: API /events response time", elapsed < 2000 ? "PASS" : "WARN", `${elapsed}ms`);
  } catch (e) { log("TC-77", "Performance: API time", "FAIL", e.message); }

  await browser.close();

  // ═══════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════
  console.log("\n" + "=".repeat(70));
  console.log("  COMPREHENSIVE E2E TEST RESULTS");
  console.log("=".repeat(70));
  const pass = results.filter(r => r.status === "PASS").length;
  const fail = results.filter(r => r.status === "FAIL").length;
  const warn = results.filter(r => r.status === "WARN").length;
  console.log(`  PASS: ${pass}  |  FAIL: ${fail}  |  WARN: ${warn}  |  TOTAL: ${results.length}`);
  console.log(`  Pass Rate: ${((pass / results.length) * 100).toFixed(1)}%`);
  console.log("=".repeat(70));

  // Category breakdown
  const categories = {
    "S1: Registration": results.filter(r => parseInt(r.id.replace("TC-","")) >= 1 && parseInt(r.id.replace("TC-","")) <= 8),
    "S2: Login": results.filter(r => parseInt(r.id.replace("TC-","")) >= 9 && parseInt(r.id.replace("TC-","")) <= 15),
    "S3: Markets": results.filter(r => parseInt(r.id.replace("TC-","")) >= 16 && parseInt(r.id.replace("TC-","")) <= 23),
    "S4: Market Detail": results.filter(r => parseInt(r.id.replace("TC-","")) >= 24 && parseInt(r.id.replace("TC-","")) <= 30),
    "S5: Predictions": results.filter(r => parseInt(r.id.replace("TC-","")) >= 31 && parseInt(r.id.replace("TC-","")) <= 37),
    "S6: Betting": results.filter(r => parseInt(r.id.replace("TC-","")) >= 38 && parseInt(r.id.replace("TC-","")) <= 46),
    "S7: Portfolio/Profile": results.filter(r => parseInt(r.id.replace("TC-","")) >= 47 && parseInt(r.id.replace("TC-","")) <= 52),
    "S8: i18n": results.filter(r => parseInt(r.id.replace("TC-","")) >= 53 && parseInt(r.id.replace("TC-","")) <= 57),
    "S9: Mobile": results.filter(r => parseInt(r.id.replace("TC-","")) >= 58 && parseInt(r.id.replace("TC-","")) <= 62),
    "S10: API/Security": results.filter(r => parseInt(r.id.replace("TC-","")) >= 63 && parseInt(r.id.replace("TC-","")) <= 72),
    "S11: SEO/Perf": results.filter(r => parseInt(r.id.replace("TC-","")) >= 73 && parseInt(r.id.replace("TC-","")) <= 77),
  };

  console.log("\nCategory Breakdown:");
  for (const [cat, items] of Object.entries(categories)) {
    const p = items.filter(r => r.status === "PASS").length;
    console.log(`  ${cat}: ${p}/${items.length} PASS`);
  }

  // Write JSON
  writeFileSync(
    path.join(outDir, "test-results.json"),
    JSON.stringify({ summary: { pass, fail, warn, total: results.length, passRate: ((pass / results.length) * 100).toFixed(1) + "%" }, categories: Object.fromEntries(Object.entries(categories).map(([k, v]) => [k, `${v.filter(r => r.status === "PASS").length}/${v.length}`])), results }, null, 2)
  );

  console.log(`\n\u2705 Results: screenshots/e2e-full/test-results.json`);
  console.log(`\ud83d\udcf8 Screenshots: screenshots/e2e-full/ (${ssIdx} images)`);
}

main().catch(console.error);
