import { chromium } from "@playwright/test";

const BASE_URL = "http://localhost:3001";
const OUT_DIR = "docs/screenshots/frontend-phase-2";

async function run() {
  const browser = await chromium.launch();

  // Desktop context
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  // Mobile context (iPhone 13 / modern mobile)
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
  });

  const desktopPage = await desktopContext.newPage();
  const mobilePage = await mobileContext.newPage();

  console.log("Capturing 01-hoje-desktop.png...");
  await desktopPage.goto(`${BASE_URL}/preview/hoje`, { waitUntil: "networkidle" });
  await desktopPage.screenshot({ path: `${OUT_DIR}/01-hoje-desktop.png`, fullPage: true });

  console.log("Capturing 02-hoje-mobile.png...");
  await mobilePage.goto(`${BASE_URL}/preview/hoje`, { waitUntil: "networkidle" });
  await mobilePage.screenshot({ path: `${OUT_DIR}/02-hoje-mobile.png`, fullPage: true });

  console.log("Capturing 03-hoje-zero-state-desktop.png...");
  await desktopPage.goto(`${BASE_URL}/preview/hoje?zero=1`, { waitUntil: "networkidle" });
  await desktopPage.screenshot({ path: `${OUT_DIR}/03-hoje-zero-state-desktop.png`, fullPage: true });

  console.log("Capturing 04-checkin-planning-desktop.png...");
  await desktopPage.goto(`${BASE_URL}/preview/checkin`, { waitUntil: "networkidle" });
  await desktopPage.screenshot({ path: `${OUT_DIR}/04-checkin-planning-desktop.png`, fullPage: true });

  console.log("Capturing 05-checkin-evening-desktop.png...");
  // Click on Encerramento (Noite) tab
  await desktopPage.getByRole("tab", { name: /encerramento/i }).click();
  await desktopPage.waitForTimeout(500);
  await desktopPage.screenshot({ path: `${OUT_DIR}/05-checkin-evening-desktop.png`, fullPage: true });

  console.log("Capturing 06-checkin-mobile.png...");
  await mobilePage.goto(`${BASE_URL}/preview/checkin`, { waitUntil: "networkidle" });
  await mobilePage.screenshot({ path: `${OUT_DIR}/06-checkin-mobile.png`, fullPage: true });

  console.log("Capturing 07-login-mobile-first-fold.png...");
  await mobilePage.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  // Viewport screenshot (first fold)
  await mobilePage.screenshot({ path: `${OUT_DIR}/07-login-mobile-first-fold.png`, fullPage: false });

  console.log("Capturing 08-login-desktop.png...");
  await desktopPage.goto(`${BASE_URL}/login`, { waitUntil: "networkidle" });
  await desktopPage.screenshot({ path: `${OUT_DIR}/08-login-desktop.png`, fullPage: false });

  console.log("Capturing 09-onboarding-desktop.png...");
  await desktopPage.goto(`${BASE_URL}/preview/onboarding`, { waitUntil: "networkidle" });
  await desktopPage.screenshot({ path: `${OUT_DIR}/09-onboarding-desktop.png`, fullPage: true });

  console.log("Capturing 10-onboarding-mobile.png...");
  await mobilePage.goto(`${BASE_URL}/preview/onboarding`, { waitUntil: "networkidle" });
  await mobilePage.screenshot({ path: `${OUT_DIR}/10-onboarding-mobile.png`, fullPage: true });

  await browser.close();
  console.log("All screenshots captured successfully!");
}

run().catch((err) => {
  console.error("Error capturing screenshots:", err);
  process.exit(1);
});
