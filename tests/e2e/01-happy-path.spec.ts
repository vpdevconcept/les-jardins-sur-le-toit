import { test, expect } from "../../playwright-fixture";
import { loginAsAdmin } from "./helpers/admin-auth";
import { createTestOrder, e2eGuestId, getOrder } from "./helpers/orders";

/**
 * Happy path : commande créée par le client → admin la fait progresser
 * jusqu'à l'encaissement, en passant par tous les états.
 */
test("happy path — commande client → admin → encaissement", async ({ page }) => {
  const tableNumber = Number(process.env.E2E_TABLE_NUMBER!);
  const guestId = e2eGuestId(`happy-${Date.now()}`);

  // 1. Client crée une commande
  const order = await createTestOrder(guestId, tableNumber, [
    { name: "Cocktail Pivoine", price: 12, qty: 2, stand: "jardins" },
    { name: "Panuozzo Margherita", price: 14, qty: 1, stand: "pazzo" },
  ]);
  expect(order.total).toBe(38);

  // 2. Login admin
  await loginAsAdmin(page);
  await expect(page).toHaveURL(/\/admin/);

  // 3. Onglet Commandes — la commande doit apparaître avec table 99
  await page.getByRole("button", { name: /commandes/i }).first().click();
  const orderCard = page.locator(`[data-order-id="${order.id}"], :text("Table ${tableNumber}")`).first();
  await expect(orderCard).toBeVisible({ timeout: 10_000 });

  // 4. Faire avancer la commande nouveau → en_preparation → pret → recupere
  // Selon l'UI, le bouton change : "Préparer" → "Prêt" → "Récupéré"
  for (const expectedNext of ["en_preparation", "pret", "recupere"] as const) {
    const card = page.locator(`text=Table ${tableNumber}`).first().locator("xpath=ancestor::*[self::div or self::article][1]");
    const actionBtn = card.getByRole("button").filter({ hasText: /préparer|prêt|récupéré/i }).first();
    await actionBtn.click();
    // Wait for DB to reflect change
    await expect.poll(async () => (await getOrder(order.id))?.status, { timeout: 5_000 })
      .toBe(expectedNext);
  }

  // 5. Aller sur Encaisser — bouton doit être actif (tout est récupéré)
  await page.getByRole("button", { name: /encaisser/i }).first().click();

  // Saisir manuellement le guest_id pour charger la note
  await page.getByPlaceholder(/guest|saisir/i).fill(guestId);
  await page.getByRole("button", { name: /charger|valider/i }).first().click();

  // Attendre l'affichage du total
  await expect(page.locator("text=38")).toBeVisible({ timeout: 5_000 });

  // 6. Clôturer la note → status devient encaisse
  const closeBtn = page.getByRole("button", { name: /payé.*clôturer|encaisser/i }).first();
  await expect(closeBtn).toBeEnabled();
  await closeBtn.click();

  await expect.poll(async () => (await getOrder(order.id))?.status, { timeout: 5_000 })
    .toBe("encaisse");
});
