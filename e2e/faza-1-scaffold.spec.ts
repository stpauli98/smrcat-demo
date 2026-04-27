import { test, expect } from "@playwright/test";

test.describe("Faza 1 — Scaffold + dizajn sistem", () => {
  test("home page renders SMRČAK brand and nav", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: /Smrčak početna/i })).toBeVisible();
    await expect(page.getByText("SMRČAK", { exact: true })).toBeVisible();

    const nav = page.getByRole("navigation", { name: "Glavna navigacija" });
    await expect(nav).toBeVisible();

    const expectedLinks = ["Dashboard", "Inbox", "Pošiljke", "Kupci", "Kooperanti"];
    for (const label of expectedLinks) {
      await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
    }

    await expect(page.getByRole("heading", { name: "Dashboard", exact: true })).toBeVisible();
    await expect(page.getByText(/Powered by NextPixel/)).toBeVisible();
  });

  test("Source Serif 4 is active on heading and Inter on body", async ({ page }) => {
    await page.goto("/");

    const heading = page.getByRole("heading", { name: "Dashboard", exact: true });
    const headingFont = await heading.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(headingFont.toLowerCase()).toContain("source serif");

    const body = page.locator("body");
    const bodyFont = await body.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(bodyFont.toLowerCase()).toContain("inter");
  });

  test("background uses cream palette token", async ({ page }) => {
    await page.goto("/");
    const bg = await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor);
    // cream = hsl(43 35% 93%) ≈ rgb(244, 239, 226) — allow tolerance
    const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    expect(match).not.toBeNull();
    if (match) {
      const [r, g, b] = [Number(match[1]), Number(match[2]), Number(match[3])];
      expect(r).toBeGreaterThan(230);
      expect(g).toBeGreaterThan(225);
      expect(b).toBeGreaterThan(210);
    }
  });

  test("brand circle is forest green", async ({ page }) => {
    await page.goto("/");
    const circle = page.locator("header span[aria-hidden]").first();
    await expect(circle).toBeVisible();
    const bg = await circle.evaluate((el) => getComputedStyle(el).backgroundColor);
    // forest = hsl(121 39% 27%) ≈ rgb(42, 96, 44)
    const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    expect(match).not.toBeNull();
    if (match) {
      const [r, g, b] = [Number(match[1]), Number(match[2]), Number(match[3])];
      expect(g).toBeGreaterThan(r);
      expect(g).toBeGreaterThan(b);
    }
  });
});
