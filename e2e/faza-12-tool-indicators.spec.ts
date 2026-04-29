import { test, expect, type Route } from "@playwright/test";

function buildSseResponse(events: object[]): string {
  return events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
}

async function mockChatRoute(route: Route, events: object[], delayMs = 50) {
  await new Promise((r) => setTimeout(r, delayMs));
  await route.fulfill({
    status: 200,
    headers: { "Content-Type": "text/event-stream; charset=utf-8" },
    body: buildSseResponse(events),
  });
}

test.describe("Faza 12 — Tool indicators u UI", () => {
  test("done indikator se pojavljuje za tool_call_end", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await mockChatRoute(route, [
        {
          type: "tool_call_start",
          id: "t1",
          name: "provjeri_lot_zalihe",
          input: { proizvod: "Sušeni vrganji klasa A" },
        },
        {
          type: "tool_call_end",
          id: "t1",
          name: "provjeri_lot_zalihe",
          result: { uspjeh: true, ukupno_dostupno_kg: 630 },
          durationMs: 145,
        },
        { type: "delta", content: "Imamo 630kg." },
        { type: "done" },
      ]);
    });

    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await page.locator('[data-test="chat-input"]').fill("Imamo li vrganje?");
    await page.locator('[data-test="chat-send"]').click();

    const indicator = page.locator(
      '[data-test="tool-call-row"][data-tool-name="provjeri_lot_zalihe"]',
    );
    await expect(indicator).toBeVisible();
    await expect(indicator).toHaveAttribute("data-tool-status", "done");
    await expect(indicator).toContainText("Provjeravam zalihe");
  });

  test("error status se prikaže za tool_call_error", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await mockChatRoute(route, [
        {
          type: "tool_call_start",
          id: "t2",
          name: "nadji_kupca",
          input: { upit: "Bagdad" },
        },
        {
          type: "tool_call_error",
          id: "t2",
          name: "nadji_kupca",
          error: "Network error",
        },
        { type: "delta", content: "Greška." },
        { type: "done" },
      ]);
    });

    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await page.locator('[data-test="chat-input"]').fill("test");
    await page.locator('[data-test="chat-send"]').click();

    const errorIndicator = page.locator(
      '[data-test="tool-call-row"][data-tool-name="nadji_kupca"]',
    );
    await expect(errorIndicator).toHaveAttribute("data-tool-status", "error");
  });

  test("multiple tools se pojavljuju u redu", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await mockChatRoute(route, [
        { type: "tool_call_start", id: "t1", name: "provjeri_lot_zalihe", input: {} },
        { type: "tool_call_start", id: "t2", name: "izracunaj_dostavu", input: {} },
        {
          type: "tool_call_end",
          id: "t1",
          name: "provjeri_lot_zalihe",
          result: {},
          durationMs: 100,
        },
        {
          type: "tool_call_end",
          id: "t2",
          name: "izracunaj_dostavu",
          result: {},
          durationMs: 80,
        },
        { type: "delta", content: "OK" },
        { type: "done" },
      ]);
    });

    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await page.locator('[data-test="chat-input"]').fill("kombo");
    await page.locator('[data-test="chat-send"]').click();

    const rows = page.locator('[data-test="tool-call-row"]');
    await expect(rows).toHaveCount(2);
  });
});
