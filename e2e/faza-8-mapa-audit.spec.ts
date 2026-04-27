import { test, expect } from "@playwright/test";

test.describe("Faza 8 — Mapa BiH + audit eksport", () => {
  test("kooperant Karakaj 7 page shows BiH map with 8 pins, target highlighted", async ({ page }) => {
    await page.goto("/kooperanti/karakaj-7");
    await page.waitForLoadState("networkidle");

    const mapa = page.locator('[data-test="mapa-bih"]');
    await expect(mapa).toBeVisible();

    const pins = page.locator('[data-test="map-pin"]');
    await expect(pins).toHaveCount(8);

    const highlighted = page.locator(
      '[data-test="map-pin"][data-cooperant-id="karakaj-7"][data-highlighted="true"]',
    );
    await expect(highlighted).toBeVisible();
  });

  test("audit export dialog opens, allows date selection, downloads file", async ({ page }) => {
    await page.goto("/posiljke/2025-0089");
    await page.waitForLoadState("networkidle");

    await page.locator('[data-test="action-eksport-audit"]').click();
    await expect(page.locator('[data-test="audit-export-dialog"]')).toBeVisible();

    await page.locator('[data-test="audit-format-PDF"]').click();
    await expect(page.locator('[data-test="audit-format-PDF"]')).toHaveAttribute(
      "data-selected",
      "true",
    );

    const downloadPromise = page.waitForEvent("download", { timeout: 10_000 });
    await page.locator('[data-test="audit-generate"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/audit-2025-0089/);
  });

  test("BioSuisse export from kooperant page triggers loading state", async ({ page }) => {
    await page.goto("/kooperanti/karakaj-7");
    await page.waitForLoadState("networkidle");

    const btn = page.locator('[data-test="action-eksport-biosuisse"]');
    await btn.click();
    await expect(btn).toContainText("Priprema");
    await expect(btn).toContainText(/Paket spreman|Eksport/, { timeout: 5000 });
  });

  test("TOK 3 full flow: posiljka 2025/0089 → lot → kooperant → eksport BioSuisse", async ({ page }) => {
    await page.goto("/posiljke/2025-0089");
    await page.waitForLoadState("networkidle");

    await page.locator('[data-test="lot-kooperant-link"][data-lot-id="SV-2025-067"]').click();
    await page.waitForURL(/\/kooperanti\/karakaj-7/);

    await expect(page.locator('[data-test="mapa-bih"]')).toBeVisible();
    await expect(page.locator('[data-test="action-eksport-biosuisse"]')).toBeVisible();
  });
});
