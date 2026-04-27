import { test, expect } from "@playwright/test";

test.describe("Faza 4 — Pošiljka, Customer, Cooperant detail", () => {
  test("posiljka 2026/0156 detail shows header, stats, sadrzaj, dokumenti, audit", async ({ page }) => {
    await page.goto("/posiljke/2026-0156");
    await page.waitForLoadState("networkidle");

    await expect(page.locator('[data-test="posiljka-broj"]')).toContainText("2026/0156");
    await expect(page.locator('[data-status="U tranzitu"]').first()).toBeVisible();
    await expect(page.locator('[data-test="stat-card"]')).toHaveCount(4);
    await expect(page.locator('[data-test="sadrzaj-list"]')).toBeVisible();
    await expect(page.locator('[data-test="dokumenti-list"]')).toBeVisible();
    await expect(page.locator('[data-test="audit-timeline"]')).toBeVisible();
    const events = page.locator('[data-test="audit-event"]');
    expect(await events.count()).toBeGreaterThanOrEqual(3);
  });

  test("posiljka 2025/0089 → click lot SV-2025-067 → cooperant Karakaj", async ({ page }) => {
    await page.goto("/posiljke/2025-0089");
    await page.waitForLoadState("networkidle");

    await expect(page.locator('[data-test="posiljka-broj"]')).toContainText("2025/0089");

    const lotLink = page.locator('[data-test="lot-kooperant-link"][data-lot-id="SV-2025-067"]');
    await expect(lotLink).toBeVisible();
    await lotLink.click();

    await page.waitForURL(/\/kooperanti\/karakaj-7/);
    await expect(page.getByRole("heading", { name: /Mehmedović Sefer/i })).toBeVisible();
    await expect(page.getByText("Karakaj 7").first()).toBeVisible();

    const highlightRow = page.locator('tr[data-lot-id="SV-2025-067"]');
    await expect(highlightRow).toBeVisible();
  });

  test("kupac Bio Naturkost detail shows tabs, Recharts, posiljke", async ({ page }) => {
    await page.goto("/kupci/bio-naturkost");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: "Bio Naturkost GmbH" })).toBeVisible();

    const tabTriggers = page.locator('[data-test="tab-trigger"]');
    expect(await tabTriggers.count()).toBeGreaterThanOrEqual(4);

    const chart = page.locator('[data-test="recharts-bar"]');
    await expect(chart).toBeVisible();
    await expect(chart.locator("svg")).toBeVisible();

    const posiljkaRows = page.locator('[data-test="kupac-posiljka-row"]');
    expect(await posiljkaRows.count()).toBeGreaterThanOrEqual(2);

    // Switch to Komunikacija tab
    await page.locator('[data-test="tab-trigger"][data-tab-id="komunikacija"]').click();
    const emails = page.locator('[data-test="komunikacija-email"]');
    expect(await emails.count()).toBeGreaterThanOrEqual(3);
  });

  test("kooperant Karakaj 7 shows lot list including SV-2025-067", async ({ page }) => {
    await page.goto("/kooperanti/karakaj-7");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Mehmedović Sefer/i })).toBeVisible();
    const rows = page.locator('[data-test="lot-row"]');
    expect(await rows.count()).toBeGreaterThanOrEqual(2);
    await expect(page.locator('[data-test="lot-row"][data-lot-id="SV-2025-067"]')).toBeVisible();

    await expect(page.locator('[data-test="action-eksport-biosuisse"]')).toBeVisible();
  });

  test("posiljke list page shows all 10 shipments", async ({ page }) => {
    await page.goto("/posiljke");
    await page.waitForLoadState("networkidle");

    const rows = page.locator('[data-test="posiljka-row"]');
    await expect(rows).toHaveCount(10);
  });
});
