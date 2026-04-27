import { test, expect } from "@playwright/test";

test.describe("Faza 6 — Document review + PDF preview", () => {
  test("opens document review with PDF iframe and edit form", async ({ page }) => {
    await page.goto("/posiljke/2026-0143/dokumenti/2026-0143-komercijalna-faktura-de");
    await page.waitForLoadState("networkidle");

    await expect(page.locator('[data-test="dokument-naslov"]')).toContainText(
      "Komercijalna faktura DE",
    );

    const iframe = page.locator('[data-test="pdf-iframe"]');
    await expect(iframe).toBeVisible();
    const src = await iframe.getAttribute("src");
    expect(src).toContain("/sample-docs/komercijalna_faktura_de.pdf");

    const editForm = page.locator('[data-test="edit-form"]');
    await expect(editForm).toBeVisible();
    const fields = page.locator('[data-test="edit-field"]');
    expect(await fields.count()).toBeGreaterThanOrEqual(3);
  });

  test("changing a field switches it from AI (yellow) to edited (green)", async ({ page }) => {
    await page.goto("/posiljke/2026-0143/dokumenti/2026-0143-komercijalna-faktura-de");
    await page.waitForLoadState("networkidle");

    const cijenaField = page.locator('[data-test="edit-field"][data-field-key="iznos"]');
    await expect(cijenaField).toHaveAttribute("data-field-state", "ai");

    await cijenaField.fill("18.600,00 €");
    await expect(cijenaField).toHaveAttribute("data-field-state", "edited");
  });

  test("regeneriši button shows spinner then completes", async ({ page }) => {
    await page.goto("/posiljke/2026-0143/dokumenti/2026-0143-komercijalna-faktura-de");
    await page.waitForLoadState("networkidle");

    const btn = page.locator('[data-test="action-regenerate"]');
    await btn.click();
    await expect(btn).toContainText("Regenerisanje");
    // Wait for completion (~2.2s)
    await expect(btn).toContainText("Regeneriši dokument", { timeout: 5000 });
  });

  test("odobri button changes document status to Odobreno", async ({ page }) => {
    await page.goto("/posiljke/2026-0143/dokumenti/2026-0143-cmr");
    await page.waitForLoadState("networkidle");

    await page.locator('[data-test="action-approve"]').click();
    await expect(page.locator('[data-test="dokument-status"] [data-status="Odobreno"]')).toBeVisible();

    // Navigate back via the in-app link (preserves Zustand state)
    await page.getByRole("link", { name: /Nazad na pošiljku/i }).click();
    await page.waitForURL(/\/posiljke\/2026-0143$/);
    const cmrRow = page.locator('[data-test="dokument-row"][data-doc-id="2026-0143-cmr"]');
    await expect(cmrRow).toHaveAttribute("data-doc-status", "Odobreno");
  });

  test("upload placeholder shown for spoljni dokument (Upload status)", async ({ page }) => {
    await page.goto("/posiljke/2026-0143/dokumenti/2026-0143-fitosanitarni");
    await page.waitForLoadState("networkidle");

    await expect(page.locator('[data-test="upload-placeholder"]')).toBeVisible();
    await page.locator('[data-test="action-upload-spoljni"]').click();
    await expect(page.locator('[data-test="dokument-status"] [data-status="Odobreno"]')).toBeVisible();
  });
});
