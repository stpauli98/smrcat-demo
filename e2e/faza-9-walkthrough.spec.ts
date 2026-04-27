import { test, expect, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Faza 9 — Final walkthrough sa console-cleanness", () => {
  test.setTimeout(180_000);

  function attachConsoleGuard(page: Page) {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // Ignore benign favicon 404s and dev hydration warnings
        if (
          !text.includes("favicon") &&
          !text.includes("Hydration") &&
          !text.includes("hydration") &&
          !text.includes("getServerSnapshot")
        ) {
          errors.push(`[${msg.type()}] ${text}`);
        }
      }
    });
    page.on("pageerror", (err) => errors.push(`[pageerror] ${err.message}`));
    return errors;
  }

  test("Smoke: every primary route loads without crashing", async ({ page }) => {
    const errors = attachConsoleGuard(page);
    const routes = [
      "/",
      "/inbox",
      "/posiljke",
      "/posiljke/2026-0143",
      "/posiljke/2026-0156",
      "/posiljke/2025-0089",
      "/posiljke/2026-0142",
      "/posiljke/2026-0143/dokumenti/2026-0143-komercijalna-faktura-de",
      "/posiljke/nova",
      "/kupci",
      "/kupci/bio-naturkost",
      "/kooperanti",
      "/kooperanti/karakaj-7",
    ];
    for (const r of routes) {
      const resp = await page.goto(r, { waitUntil: "networkidle" });
      expect(resp?.status(), `Route ${r}`).toBeLessThan(400);
      // Hard refresh test
      await page.reload({ waitUntil: "networkidle" });
    }
    expect(errors, "Console errors during route smoke").toEqual([]);
  });

  test("TOK 1 walkthrough — urgent fitosanitarni for 0156", async ({ page }) => {
    const errors = attachConsoleGuard(page);

    await page.goto("/inbox");
    await page.locator('[data-test="email-row"][data-email-id="8"]').click();
    await page.locator('[data-test="action-otvori-posiljku"]').click();
    await page.waitForURL(/\/posiljke\/2026-0156/);

    // Open fitosanitarni doc
    await page
      .locator('[data-test="dokument-row"][data-doc-id="2026-0156-fitosanitarni"]')
      .click();
    await page.waitForURL(/\/dokumenti\/2026-0156-fitosanitarni/);

    // Send to customer
    await page.locator('[data-test="action-posalji-kupcu"]').click();
    await expect(page.locator('[data-test="toast"]')).toBeVisible({ timeout: 5_000 });

    expect(errors).toEqual([]);
  });

  test("TOK 2 walkthrough — order from email to U tranzitu", async ({ page }) => {
    const errors = attachConsoleGuard(page);

    await page.goto("/inbox");
    await page.locator('[data-test="email-row"][data-email-id="1"]').click();
    await page.locator('[data-test="action-kreiraj-posiljku"]').click();

    await page.locator('[data-test="wizard-next"]').click();
    await page.locator('[data-test="wizard-next"]').click();
    await page.locator('[data-test="wizard-next"]').click();
    await page.locator('[data-test="wizard-generiraj"]').click();

    await expect(page.locator('[data-test="generation-counter"]')).toContainText("8 / 8", {
      timeout: 60_000,
    });

    await page.waitForURL(/\/posiljke\/2026-0143$/, { timeout: 15_000 });

    // Approve all docs via store helper
    await page.evaluate(() => {
      const store = (window as unknown as {
        __APP_STORE__: { getState(): { approveAllDocs(id: string): void } };
      }).__APP_STORE__;
      store.getState().approveAllDocs("2026-0143");
    });

    await page.locator('[data-test="action-posalji-paket"]').click();
    await expect(page.locator('[data-test="toast"]')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('[data-status="U tranzitu"]').first()).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("TOK 3 walkthrough — audit for 2025/0089", async ({ page }) => {
    const errors = attachConsoleGuard(page);

    await page.goto("/posiljke/2025-0089");
    await page.locator('[data-test="lot-kooperant-link"][data-lot-id="SV-2025-067"]').click();
    await page.waitForURL(/\/kooperanti\/karakaj-7/);
    await expect(page.locator('[data-test="mapa-bih"]')).toBeVisible();
    await expect(
      page.locator('[data-test="map-pin"][data-cooperant-id="karakaj-7"][data-highlighted="true"]'),
    ).toBeVisible();

    await page.locator('[data-test="action-eksport-biosuisse"]').click();

    expect(errors).toEqual([]);
  });
});
