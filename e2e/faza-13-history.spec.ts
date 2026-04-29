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

test.describe("Faza 13 — Conversation history persistence", () => {
  test("messages se zapamte i vrate nakon reload-a", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await mockChatRoute(route, [
        { type: "delta", content: "Odgovor 1" },
        { type: "done" },
      ]);
    });

    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await page.locator('[data-test="chat-input"]').fill("Pitanje 1");
    await page.locator('[data-test="chat-send"]').click();
    await expect(page.locator('[data-test="chat-message"]')).toHaveCount(2);
    await expect(
      page.locator('[data-test="chat-message"][data-role="assistant"]').last(),
    ).toContainText("Odgovor 1");

    await page.reload();
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await expect(page.locator('[data-test="chat-message"]')).toHaveCount(2);
    await expect(page.locator('[data-test="chat-message"]').first()).toContainText(
      "Pitanje 1",
    );
    await expect(page.locator('[data-test="chat-message"]').last()).toContainText(
      "Odgovor 1",
    );
  });

  test("clear razgovora briše localStorage i empty state se vrati", async ({
    page,
  }) => {
    await page.route("**/api/chat", async (route) => {
      await mockChatRoute(route, [
        { type: "delta", content: "Odgovor" },
        { type: "done" },
      ]);
    });

    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await page.locator('[data-test="chat-input"]').fill("Pitanje");
    await page.locator('[data-test="chat-send"]').click();
    await expect(page.locator('[data-test="chat-message"]')).toHaveCount(2);

    await page.locator('[data-test="chat-clear"]').click();
    await expect(page.locator('[data-test="chat-message"]')).toHaveCount(0);
    await expect(page.locator('[data-test="chat-empty-state"]')).toBeVisible();

    const stored = await page.evaluate(() =>
      window.localStorage.getItem("smrcak-chatbot-history"),
    );
    expect(stored).toBeNull();

    await page.reload();
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await expect(page.locator('[data-test="chat-empty-state"]')).toBeVisible();
  });

  test("pending poruke se NE perzistiraju (samo done/error filtri)", async ({
    page,
  }) => {
    await page.route("**/api/chat", async () => {
      await new Promise(() => {});
    });

    await page.goto("/");
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    await page.locator('[data-test="chat-input"]').fill("Hangs");
    await page.locator('[data-test="chat-send"]').click();
    await expect(page.locator('[data-test="chat-message"]')).toHaveCount(2);

    await page.reload();
    await page.locator('[data-test="floating-chatbot-toggle"]').click();
    const messages = page.locator('[data-test="chat-message"]');
    const count = await messages.count();
    expect(count).toBeLessThanOrEqual(1);
  });
});
