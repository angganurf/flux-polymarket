import puppeteer from 'puppeteer';

const BASE = 'http://localhost:3100';
const DIR = '/Users/blockmeta/Desktop/workspace/flux-polymarket/screenshots';

async function go(page, path, wait = 3000) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, wait));
}

async function shot(page, name) {
  await page.screenshot({ path: `${DIR}/${name}.png`, fullPage: false });
  console.log(`  ✓ ${name}.png`);
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.emulateMediaFeatures([
    { name: 'prefers-color-scheme', value: 'dark' },
  ]);

  // 1) Register + Login
  console.log('=== Auth ===');
  try {
    const regRes = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Kelly', email: 'kelly4@test.com', password: 'test1234' }),
    });
    const regData = await regRes.json();
    console.log(`  Register: ${regRes.status}`, regData.email || regData.error || '');
  } catch (e) { console.log('  Register:', e.message); }

  try {
    await go(page, '/en/login', 2000);
    await page.type('input[type="email"]', 'kelly4@test.com');
    await page.type('input[type="password"]', 'test1234');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 3000));
    console.log(`  Login: ${page.url()}`);
  } catch (e) { console.log('  Login:', e.message); }

  // 2) Core Pages
  console.log('\n=== Core Pages ===');
  const pages = [
    ['01-home', '/en', 4000],
    ['02-markets', '/en/markets', 5000],
    ['03-leaderboard', '/en/leaderboard', 3000],
    ['04-predict', '/en/predict', 3000],
    ['05-predict-create', '/en/predict/create', 2000],
  ];
  for (const [name, path, wait] of pages) {
    try { await go(page, path, wait); await shot(page, name); }
    catch (e) { console.log(`  ✗ ${name}: ${e.message}`); }
  }

  // 3) Market Detail (share buttons, embed generator, AI panel)
  console.log('\n=== Market Detail ===');
  try {
    await go(page, '/en/markets', 5000);
    const card = await page.$('a[href*="/markets/"]');
    if (card) {
      await card.click();
      await new Promise(r => setTimeout(r, 5000));
      await shot(page, '06-market-detail');
      console.log(`    URL: ${page.url()}`);

      // Scroll to bottom sections
      await page.evaluate(() => window.scrollTo(0, 900));
      await new Promise(r => setTimeout(r, 2000));
      await shot(page, '07-market-bottom');
    }
  } catch (e) { console.log(`  ✗ ${e.message}`); }

  // 4) Portfolio
  console.log('\n=== Portfolio ===');
  try { await go(page, '/en/portfolio', 3000); await shot(page, '08-portfolio'); }
  catch (e) { console.log(`  ✗ ${e.message}`); }

  // 5) Prediction Detail + Comments
  console.log('\n=== Prediction Detail + Comments ===');
  try {
    await go(page, '/en/predict', 3000);
    const evt = await page.$('a[href*="/predict/c"]');
    if (evt) {
      await evt.click();
      await new Promise(r => setTimeout(r, 3000));
      await shot(page, '09-predict-detail');

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise(r => setTimeout(r, 2000));
      await shot(page, '10-comments');
    } else {
      console.log('  No prediction event link found');
    }
  } catch (e) { console.log(`  ✗ ${e.message}`); }

  // 6) Embed Widget
  console.log('\n=== Embed Widget ===');
  try {
    await go(page, '/embed/market/will-trump-win-the-2024-presidential-election', 5000);
    await shot(page, '11-embed');
  } catch (e) { console.log(`  ✗ ${e.message}`); }

  // 7) OG Image API
  console.log('\n=== OG Image ===');
  try {
    const ogUrl = `${BASE}/api/og?title=${encodeURIComponent('Will Bitcoin reach $200K?')}&yes=67&no=33`;
    const res = await fetch(ogUrl);
    console.log(`  OG: ${res.status} (${res.headers.get('content-type')})`);
  } catch (e) { console.log(`  OG: ${e.message}`); }

  // 8) API Tests
  console.log('\n=== API Endpoints ===');
  const apis = [
    ['Events API', '/api/polymarket/events?limit=1'],
    ['Markets API', '/api/polymarket/markets?limit=1'],
    ['Search API', '/api/polymarket/search?q=bitcoin'],
    ['Local Events', '/api/events'],
    ['User Bets', '/api/user/bets'],
  ];
  for (const [name, url] of apis) {
    try {
      // Forward cookies for auth-protected endpoints
      const cookies = await page.cookies();
      const cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');
      const res = await fetch(`${BASE}${url}`, { headers: { Cookie: cookieStr } });
      const text = await res.text();
      const preview = text.slice(0, 80);
      console.log(`  ${name}: ${res.status} ${preview}...`);
    } catch (e) { console.log(`  ${name}: ${e.message}`); }
  }

  // 9) Korean
  console.log('\n=== Korean ===');
  try { await go(page, '/ko', 4000); await shot(page, '12-home-ko'); }
  catch (e) { console.log(`  ✗ ${e.message}`); }
  try { await go(page, '/ko/portfolio', 3000); await shot(page, '13-portfolio-ko'); }
  catch (e) { console.log(`  ✗ ${e.message}`); }

  // 10) Mobile
  console.log('\n=== Mobile ===');
  await page.setViewport({ width: 390, height: 844 });
  try { await go(page, '/en', 4000); await shot(page, '14-mobile-home'); }
  catch (e) { console.log(`  ✗ ${e.message}`); }
  try { await go(page, '/en/portfolio', 3000); await shot(page, '15-mobile-portfolio'); }
  catch (e) { console.log(`  ✗ ${e.message}`); }

  await browser.close();
  console.log('\n=== All done! ===');
}

main().catch(console.error);
