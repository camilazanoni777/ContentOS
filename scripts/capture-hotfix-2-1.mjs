import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const outDir = path.resolve(process.cwd(), "docs/screenshots/frontend-hotfix-2-1");
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  const browser = await chromium.launch({ headless: true });

  // 1. Localhost recovered
  console.log("1. Capturing 01-localhost-recovered.png...");
  {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    await page.goto("http://localhost:3001", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(outDir, "01-localhost-recovered.png"),
      fullPage: false,
    });
    await page.close();
  }

  // 2. Login recovered
  console.log("2. Capturing 02-login-recovered.png...");
  {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    });
    await page.goto("http://localhost:3001/login", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(outDir, "02-login-recovered.png"),
      fullPage: false,
    });
    await page.close();
  }

  // 3. Hoje recovered
  console.log("3. Capturing 03-hoje-recovered.png...");
  {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
      deviceScaleFactor: 2,
    });
    await page.goto("http://localhost:3001/preview/hoje", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(outDir, "03-hoje-recovered.png"),
      fullPage: false,
    });
    await page.close();
  }

  // 4. Checkin recovered
  console.log("4. Capturing 04-checkin-recovered.png...");
  {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 950 },
      deviceScaleFactor: 2,
    });
    await page.goto("http://localhost:3001/preview/checkin", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(outDir, "04-checkin-recovered.png"),
      fullPage: false,
    });
    await page.close();
  }

  // 5. Offline styled (tested both offline and directly)
  console.log("5. Capturing 05-offline-styled.png...");
  {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 800 },
      deviceScaleFactor: 2,
    });
    await page.goto("http://localhost:3001/offline", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: path.join(outDir, "05-offline-styled.png"),
      fullPage: false,
    });
    await page.close();
  }

  // 6. Reconnected (simulating clicking "Tentar novamente" and showing connection restored)
  console.log("6. Capturing 06-reconnected.png...");
  {
    const context = await browser.newContext({
      viewport: { width: 1200, height: 800 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    await page.goto("http://localhost:3001/offline", { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    // Click retry
    const retryBtn = page.getByRole("button", { name: /tentar novamente/i });
    await retryBtn.click();
    // Wait for the reconnected message to appear (before redirect)
    await page.waitForSelector("text=Conexão restabelecida!", { timeout: 3000 }).catch(() => undefined);
    await page.waitForTimeout(300);

    await page.screenshot({
      path: path.join(outDir, "06-reconnected.png"),
      fullPage: false,
    });
    await context.close();
  }

  await browser.close();
  console.log("All screenshots captured successfully in docs/screenshots/frontend-hotfix-2-1/");
}

run().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
