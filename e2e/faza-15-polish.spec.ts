import { test, expect, type Route } from "@playwright/test";

function buildSseResponse(events: object[]): string {
  return events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
}

async function mockChatRoute(route: Route, events: object[]) {
  await new Promise((r) => setTimeout(r, 30));
  await route.fulfill({
    status: 200,
    headers: { "Content-Type": "text/event-stream; charset=utf-8" },
    body: buildSseResponse(events),
  });
}

test.describe("Faza 15 — Polish + final walkthrough", () => {
  test("ARIA: chat panel ima role i aria-label", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    const panel = page.locator('[data-test="chat-panel"]');
    await expect(panel).toHaveAttribute("role", "dialog");
    await expect(panel).toHaveAttribute("aria-label", "Smrčak AI asistent");
  });

  test("messages area ima aria-live polite", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    const messages = page.locator('[data-test="chat-messages"]');
    await expect(messages).toHaveAttribute("role", "log");
    await expect(messages).toHaveAttribute("aria-live", "polite");
  });

  test("Esc zatvara panel", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await expect(page.locator('[data-test="chat-panel"]')).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-test="chat-panel"]')).toBeHidden();
  });

  test("agent walkthrough: tools + indikatori + perzistencija + sources", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error" && !msg.text().includes("favicon")) {
        errors.push(msg.text());
      }
    });
    page.on("pageerror", (err) => errors.push(err.message));

    await page.route("**/api/chat", async (route) => {
      await mockChatRoute(route, [
        {
          type: "tool_call_start",
          id: "t1",
          name: "provjeri_lot_zalihe",
          input: { proizvod: "Sušeni vrganji klasa A", trazena_kolicina_kg: 500 },
        },
        {
          type: "tool_call_end",
          id: "t1",
          name: "provjeri_lot_zalihe",
          result: { uspjeh: true, ukupno_dostupno_kg: 630 },
          durationMs: 145,
        },
        {
          type: "tool_call_start",
          id: "t2",
          name: "izracunaj_dostavu",
          input: { destinacija: "München", kilogrami: 500 },
        },
        {
          type: "tool_call_end",
          id: "t2",
          name: "izracunaj_dostavu",
          result: { uspjeh: true, ukupno_eur: 90 },
          durationMs: 12,
        },
        {
          type: "sources",
          sources: [
            {
              source: "katalog_proizvoda.md",
              score: 0.85,
              chunkIndex: 1,
              preview: "...",
            },
          ],
        },
        {
          type: "delta",
          content: "Imamo 630kg vrganja. DAP do Münchena za 500kg = 90 EUR.",
        },
        { type: "done" },
      ]);
    });

    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await page.locator('[data-test="mode-operativni"]').click();
    await page.locator('[data-test="quick-question"]').first().click();

    const toolRows = page.locator('[data-test="tool-call-row"]');
    await expect(toolRows).toHaveCount(2);
    await expect(toolRows.first()).toHaveAttribute("data-tool-status", "done");

    await expect(page.locator('[data-test="sources-popover"]')).toBeVisible();

    await page.reload();
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await expect(
      page.locator('[data-test="chat-message"][data-role="assistant"]').last(),
    ).toContainText("630kg");

    expect(errors, "Console errors").toEqual([]);
  });
});
