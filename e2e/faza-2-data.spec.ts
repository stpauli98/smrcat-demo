import { test, expect } from "@playwright/test";

test.describe("Faza 2 — Mock data + Zustand store", () => {
  test("store hydrates with all data from JSON", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const counts = await page.evaluate(() => {
      const w = window as unknown as { __APP_STORE__?: { getState(): Record<string, unknown> } };
      if (!w.__APP_STORE__) return null;
      const state = w.__APP_STORE__.getState();
      return {
        kupci: (state.kupci as unknown[]).length,
        posiljke: (state.posiljke as unknown[]).length,
        kooperanti: (state.kooperanti as unknown[]).length,
        lotovi: (state.lotovi as unknown[]).length,
        emailovi: (state.emailovi as unknown[]).length,
      };
    });

    expect(counts).not.toBeNull();
    expect(counts).toEqual({
      kupci: 12,
      posiljke: 10,
      kooperanti: 8,
      lotovi: 15,
      emailovi: 30,
    });
  });

  test("store has expected key shipments and customers", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const checks = await page.evaluate(() => {
      const w = window as unknown as {
        __APP_STORE__: { getState(): { posiljke: { id: string; status: string }[]; kupci: { id: string }[] } };
      };
      const state = w.__APP_STORE__.getState();
      const findPosiljka = (id: string) => state.posiljke.find((p) => p.id === id);
      return {
        has0143: !!findPosiljka("2026-0143"),
        status0143: findPosiljka("2026-0143")?.status,
        has0156: !!findPosiljka("2026-0156"),
        status0156: findPosiljka("2026-0156")?.status,
        has0142: !!findPosiljka("2026-0142"),
        status0142: findPosiljka("2026-0142")?.status,
        has2025_0089: !!findPosiljka("2025-0089"),
        hasBioNaturkost: !!state.kupci.find((k) => k.id === "bio-naturkost"),
        hasMuenchenBio: !!state.kupci.find((k) => k.id === "muenchen-bio"),
      };
    });

    expect(checks.has0143).toBe(true);
    expect(checks.status0143).toBe("Spremno za otpremu");
    expect(checks.has0156).toBe(true);
    expect(checks.status0156).toBe("U tranzitu");
    expect(checks.has0142).toBe(true);
    expect(checks.status0142).toBe("Reklamacija");
    expect(checks.has2025_0089).toBe(true);
    expect(checks.hasBioNaturkost).toBe(true);
    expect(checks.hasMuenchenBio).toBe(true);
  });

  test("inbox emails include 12 originals + 18 generated", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const stats = await page.evaluate(() => {
      const w = window as unknown as {
        __APP_STORE__: { getState(): { emailovi: { kategorija: string }[] } };
      };
      const emails = w.__APP_STORE__.getState().emailovi;
      const byCat: Record<string, number> = {};
      for (const e of emails) byCat[e.kategorija] = (byCat[e.kategorija] ?? 0) + 1;
      return { total: emails.length, byCat };
    });

    expect(stats.total).toBe(30);
    // We need at least one of each category for demo
    expect(stats.byCat.NARUDZBA).toBeGreaterThanOrEqual(3);
    expect(stats.byCat.UPIT).toBeGreaterThanOrEqual(2);
    expect(stats.byCat.REKLAMACIJA).toBeGreaterThanOrEqual(2);
    expect(stats.byCat.DOKUMENTACIJA).toBeGreaterThanOrEqual(2);
    expect(stats.byCat.LOGISTIKA).toBeGreaterThanOrEqual(2);
    expect(stats.byCat.SPAM).toBeGreaterThanOrEqual(1);
  });

  test("Zustand actions modify state correctly", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const result = await page.evaluate(() => {
      const w = window as unknown as {
        __APP_STORE__: {
          getState(): {
            setSelectedEmail: (id: number) => void;
            selectedEmailId: number | null;
            setDocumentStatus: (docId: string, s: string) => void;
            documentStatusOverrides: Record<string, string>;
          };
        };
      };
      const store = w.__APP_STORE__;
      store.getState().setSelectedEmail(8);
      const after1 = store.getState().selectedEmailId;
      store.getState().setDocumentStatus("2026-0143-komercijalna-faktura-de", "Odobreno");
      const after2 = store.getState().documentStatusOverrides["2026-0143-komercijalna-faktura-de"];
      return { after1, after2 };
    });

    expect(result.after1).toBe(8);
    expect(result.after2).toBe("Odobreno");
  });
});
