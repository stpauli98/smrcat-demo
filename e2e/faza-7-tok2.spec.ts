import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Faza 7 — Animacije generisanja + slanja", () => {
  test.setTimeout(120_000);

  test("TOK 2: wizard → generiraj → animation → review available", async ({ page }) => {
    page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));
    await page.goto("/inbox");
    await page.waitForLoadState("networkidle");
    await page.locator('[data-test="email-row"][data-email-id="1"]').click();
    await page.locator('[data-test="action-kreiraj-posiljku"]').click();

    // Skip through wizard
    await page.locator('[data-test="wizard-next"]').click();
    await page.locator('[data-test="wizard-next"]').click();
    await page.locator('[data-test="wizard-next"]').click();
    await page.locator('[data-test="wizard-generiraj"]').click();

    // Confirm we navigated to the right URL
    await page.waitForURL(/\/posiljke\/2026-0143/, { timeout: 15_000 });

    // Generation overlay appears
    await expect(page.locator('[data-test="generation-progress"]')).toBeVisible({ timeout: 15_000 });

    // Wait for the counter to read "8 / 8 dokumenata" (all done)
    await expect(page.locator('[data-test="generation-counter"]')).toContainText(
      "8 / 8",
      { timeout: 60_000 },
    );

    // Document list visible after overlay closes
    await expect(page.locator('[data-test="dokumenti-list"]')).toBeVisible({ timeout: 10_000 });
  });

  test("TOK 1: dokument fitosanitarni 0156 → Pošalji kupcu → toast", async ({ page }) => {
    await page.goto("/posiljke/2026-0156/dokumenti/2026-0156-fitosanitarni");
    await page.waitForLoadState("networkidle");

    // Status is already Odobreno in JSON for this doc
    const sendBtn = page.locator('[data-test="action-posalji-kupcu"]');
    await expect(sendBtn).toBeVisible();
    await sendBtn.click();

    await expect(page.locator('[data-test="toast"]')).toBeVisible({ timeout: 4000 });
    await expect(page.locator('[data-test="toast"]')).toContainText(/container može krenuti/i);
  });

  test("send paket from posiljka detail toggles status to U tranzitu and shows toast", async ({ page }) => {
    await page.goto("/posiljke/2026-0143");
    await page.waitForLoadState("networkidle");

    await page.locator('[data-test="action-posalji-paket"]').click();
    await expect(page.locator('[data-test="toast"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-status="U tranzitu"]').first()).toBeVisible();
  });
});
