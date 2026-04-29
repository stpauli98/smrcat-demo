import { test, expect, type Route } from "@playwright/test";

function buildSseResponse(events: object[]): string {
  return events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
}

async function mockChatRoute(route: Route, events: object[]) {
  await new Promise((r) => setTimeout(r, 50));
  await route.fulfill({
    status: 200,
    headers: { "Content-Type": "text/event-stream; charset=utf-8" },
    body: buildSseResponse(events),
  });
}

test.describe("Faza 14 — Operativni mode + dynamic welcome", () => {
  test("3 moda vidljiva, default biznis", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await expect(page.locator('[data-test="mode-biznis"]')).toBeVisible();
    await expect(page.locator('[data-test="mode-app"]')).toBeVisible();
    await expect(page.locator('[data-test="mode-operativni"]')).toBeVisible();
    await expect(page.locator('[data-test="mode-biznis"]')).toHaveAttribute(
      "data-active",
      "true",
    );
  });

  test("welcome poruka se mijenja po mode-u", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();

    const welcome = page.locator('[data-test="welcome-message"]');
    await expect(welcome).toContainText("proizvodima, cijenama");

    await page.locator('[data-test="mode-app"]').click();
    await expect(welcome).toContainText("ekrani, statusi");

    await page.locator('[data-test="mode-operativni"]').click();
    await expect(welcome).toContainText("alate");
  });

  test("operativni mode šalje scope: 'operativni' u API", async ({ page }) => {
    let capturedBody: string | null = null;
    await page.route("**/api/chat", async (route) => {
      capturedBody = route.request().postData();
      await mockChatRoute(route, [
        { type: "delta", content: "OK" },
        { type: "done" },
      ]);
    });

    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await page.locator('[data-test="mode-operativni"]').click();
    await page.locator('[data-test="quick-question"]').first().click();
    await expect(
      page.locator('[data-test="chat-message"][data-role="assistant"]').last(),
    ).toContainText("OK");
    expect(capturedBody).toBeTruthy();
    expect(JSON.parse(capturedBody!).scope).toBe("operativni");
  });

  test("quick questions se mijenjaju po mode-u", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();

    const firstQ = page.locator('[data-test="quick-question"]').first();
    await expect(firstQ).toContainText("MOQ");

    await page.locator('[data-test="mode-app"]').click();
    await expect(firstQ).toContainText("kreiram novu pošiljku");

    await page.locator('[data-test="mode-operativni"]').click();
    await expect(firstQ).toContainText("Imamo li 500kg vrganja");
  });
});
