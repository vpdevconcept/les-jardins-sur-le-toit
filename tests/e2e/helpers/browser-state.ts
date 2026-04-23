import { Page } from "@playwright/test";

/**
 * Inject guestSession state into localStorage before client pages load.
 * Mirrors keys used in src/lib/guestSession.ts.
 */
export async function setGuestIdForTest(page: Page, guestId: string, tableNumber?: number) {
  await page.addInitScript(
    ({ guestId, tableNumber }: { guestId: string; tableNumber?: number }) => {
      const now = Date.now();
      localStorage.setItem("ljst_guest_id", guestId);
      localStorage.setItem("ljst_guest_ts", String(now));
      if (tableNumber !== undefined) {
        localStorage.setItem("ljst_table_number", String(tableNumber));
      }
    },
    { guestId, tableNumber }
  );
}

/** Fast-forward the guest session timestamp to simulate near-expiry. */
export async function expireGuestSession(page: Page) {
  await page.evaluate(() => {
    const past = Date.now() - 13 * 60 * 60 * 1000; // 13h ago > TTL
    localStorage.setItem("ljst_guest_ts", String(past));
  });
}
