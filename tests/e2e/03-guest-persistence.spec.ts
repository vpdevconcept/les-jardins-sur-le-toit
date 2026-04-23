import { test, expect } from "../../playwright-fixture";
import { setGuestIdForTest, expireGuestSession } from "./helpers/browser-state";
import { createTestOrder, e2eGuestId } from "./helpers/orders";

/**
 * Persistance & robustesse :
 * - guest_id survit à un reload (12h sliding TTL)
 * - guest_id purgé après expiration TTL
 * - bandeau offline visible quand connexion coupée
 */
test("session guest persiste après reload", async ({ page }) => {
  const tableNumber = Number(process.env.E2E_TABLE_NUMBER!);
  const guestId = e2eGuestId(`persist-${Date.now()}`);

  await setGuestIdForTest(page, guestId, tableNumber);
  await page.goto("/");
  await page.reload();

  const persisted = await page.evaluate(() => localStorage.getItem("ljst_guest_id"));
  expect(persisted).toBe(guestId);
});

test("session guest expirée est régénérée après 12h", async ({ page }) => {
  const guestId = e2eGuestId(`expire-${Date.now()}`);
  await setGuestIdForTest(page, guestId);
  await page.goto("/");
  await expireGuestSession(page);
  await page.reload();
  // Touch guest session (any page that calls getGuestId() works — Index does via providers)
  const newGuest = await page.evaluate(() => localStorage.getItem("ljst_guest_id"));
  expect(newGuest).not.toBe(guestId);
  expect(newGuest).toBeTruthy();
});

test("bandeau offline s'affiche quand la connexion tombe", async ({ page, context }) => {
  await page.goto("/");
  await context.setOffline(true);
  // Trigger offline event
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect(page.locator("text=/connexion perdue|reconnexion/i")).toBeVisible({ timeout: 3_000 });
  await context.setOffline(false);
});
