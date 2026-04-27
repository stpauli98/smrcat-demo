import { test, expect } from "@playwright/test";

test.describe("Faza 3 — Dashboard + Inbox", () => {
  test("dashboard shows 4 stat cards and activity feed", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const statCards = page.locator('[data-test="stat-card"]');
    await expect(statCards).toHaveCount(4);

    const feed = page.locator('[data-test="activity-feed"]');
    await expect(feed).toBeVisible();

    const activityRows = page.locator('[data-test="activity-row"]');
    const count = await activityRows.count();
    expect(count).toBeGreaterThanOrEqual(8);
    expect(count).toBeLessThanOrEqual(10);
  });

  test("inbox lists 30 emails with classification chips and language flags", async ({ page }) => {
    await page.goto("/inbox");
    await page.waitForLoadState("networkidle");

    const rows = page.locator('[data-test="email-row"]');
    await expect(rows).toHaveCount(30);

    const firstRow = rows.first();
    await expect(firstRow.locator("[data-kategorija]")).toBeVisible();
    await expect(firstRow.locator("[data-jezik]")).toBeVisible();
    await expect(firstRow.locator("[data-prioritet]")).toBeVisible();
  });

  test('filter "NARUDZBA" reduces to 8 emails', async ({ page }) => {
    await page.goto("/inbox");
    await page.waitForLoadState("networkidle");

    await page.locator('[data-test="filter-NARUDZBA"]').click();
    await expect(page.locator('[data-test="email-row"]')).toHaveCount(8);
  });

  test("clicking email opens preview with AI summary and action buttons", async ({ page }) => {
    await page.goto("/inbox");
    await page.waitForLoadState("networkidle");

    // Click email ID 1 (Bio Naturkost narudzba)
    await page.locator('[data-test="email-row"][data-email-id="1"]').click();

    const preview = page.locator('[data-test="email-preview"]');
    await expect(preview).toBeVisible();
    await expect(preview).toContainText("AI sažetak");
    await expect(preview).toContainText("Bio Naturkost");
    await expect(page.locator('[data-test="action-kreiraj-posiljku"]')).toBeVisible();
  });

  test("clicking reklamacija email shows 'Otvori pošiljku' for 0142", async ({ page }) => {
    await page.goto("/inbox");
    await page.waitForLoadState("networkidle");

    await page.locator('[data-test="email-row"][data-email-id="6"]').click();

    const preview = page.locator('[data-test="email-preview"]');
    await expect(preview).toBeVisible();
    await expect(page.locator('[data-test="action-otvori-posiljku"]')).toBeVisible();
    await expect(page.locator('[data-test="action-otvori-posiljku"]')).toContainText("2026/0142");
  });

  test('global search "0156" shows autocomplete for München Bio shipment', async ({ page }) => {
    await page.goto("/inbox");
    await page.waitForLoadState("networkidle");

    await page.locator('[data-test="global-search"]').fill("0156");

    const suggestions = page.locator('[data-test="search-result"]');
    await expect(suggestions.first()).toBeVisible();
    await expect(suggestions.first()).toContainText("2026/0156");
    await expect(suggestions.first()).toContainText("München Bio");
  });

  test("dashboard quick action links navigate", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("link", { name: /Otvori Inbox/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Sve pošiljke/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Kupci/i }).first()).toBeVisible();
  });
});
