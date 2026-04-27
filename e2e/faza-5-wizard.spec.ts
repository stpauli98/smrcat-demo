import { test, expect } from "@playwright/test";

test.describe("Faza 5 — Wizard nove pošiljke", () => {
  test("from inbox NARUDZBA Bio Naturkost → wizard pre-filled with FIFO lots", async ({ page }) => {
    await page.goto("/inbox");
    await page.waitForLoadState("networkidle");

    await page.locator('[data-test="email-row"][data-email-id="1"]').click();
    await page.locator('[data-test="action-kreiraj-posiljku"]').click();

    await page.waitForURL(/\/posiljke\/nova/);
    await expect(page.locator('[data-test="wizard-step-1"]')).toBeVisible();

    // Step 1: Bio Naturkost selected
    const selected = page.locator('[data-test="wizard-kupac-option"][data-kupac-id="bio-naturkost"]');
    await expect(selected).toHaveAttribute("data-selected", "true");
    await expect(page.locator('[data-test="wizard-kupac-card"]')).toContainText("Bio Naturkost");

    // Next → Step 2
    await page.locator('[data-test="wizard-next"]').click();
    await expect(page.locator('[data-test="wizard-step-2"]')).toBeVisible();

    // Vrganji 500kg, FIFO lots SV-2026-014 + SV-2026-018 suggested
    const proizvodRow = page.locator('[data-test="wizard-proizvod-row"]');
    await expect(proizvodRow).toContainText(/Vrganji/i);
    await expect(page.locator('[data-test="wizard-kolicina"]')).toHaveValue("500");
    await expect(page.locator('[data-test="wizard-lot-chip"][data-lot-id="SV-2026-014"]')).toBeVisible();
    await expect(page.locator('[data-test="wizard-lot-chip"][data-lot-id="SV-2026-018"]')).toBeVisible();

    // Ukupno €18.500
    await expect(page.locator('[data-test="wizard-ukupno-eur"]')).toContainText("18.500");

    // Next → Step 3
    await page.locator('[data-test="wizard-next"]').click();
    await expect(page.locator('[data-test="wizard-step-3"]')).toBeVisible();

    const cargoExpressBtn = page.locator(
      '[data-test="wizard-prevoznik-option"][data-prevoznik="Cargo Express"]',
    );
    await expect(cargoExpressBtn).toHaveAttribute("data-selected", "true");

    // Next → Step 4 Pregled
    await page.locator('[data-test="wizard-next"]').click();
    await expect(page.locator('[data-test="wizard-pregled"]')).toBeVisible();
    await expect(page.locator('[data-test="pregled-kupac"]')).toContainText("Bio Naturkost");
    await expect(page.locator('[data-test="pregled-iznos"]')).toContainText("18.500");

    // Generiši button visible
    await expect(page.locator('[data-test="wizard-generiraj"]')).toBeVisible();
  });

  test("Pregled lists 8 documents that will be generated", async ({ page }) => {
    await page.goto("/posiljke/nova?fromEmail=1");
    await page.waitForLoadState("networkidle");

    // Skip through to step 4
    await page.locator('[data-test="wizard-next"]').click();
    await page.locator('[data-test="wizard-next"]').click();
    await page.locator('[data-test="wizard-next"]').click();

    const docRows = page.locator('[data-test="pregled-doc-row"]');
    await expect(docRows).toHaveCount(8);
  });
});
