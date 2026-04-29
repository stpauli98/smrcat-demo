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

test.describe("Faza 11 — Agent backend SSE compatibility", () => {
  test("backward compat: postojeći SSE shape (sources + delta + done) i dalje radi", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await mockChatRoute(route, [
        {
          type: "sources",
          sources: [
            { source: "test.md", score: 0.9, chunkIndex: 0, preview: "x" },
          ],
        },
        { type: "delta", content: "OK" },
        { type: "done" },
      ]);
    });

    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await page.locator('[data-test="chat-input"]').fill("test");
    await page.locator('[data-test="chat-send"]').click();

    const aiMsg = page.locator('[data-test="chat-message"][data-role="assistant"]').last();
    await expect(aiMsg).toContainText("OK");
  });

  test("novi tool_call_start/end eventovi ne lome UI (silently ignored prije Faze 12)", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await mockChatRoute(route, [
        {
          type: "tool_call_start",
          id: "t1",
          name: "pretrazi_dokumente",
          input: { upit: "x" },
        },
        {
          type: "tool_call_end",
          id: "t1",
          name: "pretrazi_dokumente",
          result: { uspjeh: true },
          durationMs: 100,
        },
        { type: "delta", content: "Tool ok." },
        { type: "done" },
      ]);
    });

    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await page.locator('[data-test="chat-input"]').fill("test");
    await page.locator('[data-test="chat-send"]').click();

    const aiMsg = page.locator('[data-test="chat-message"][data-role="assistant"]').last();
    await expect(aiMsg).toContainText("Tool ok.");
  });
});
