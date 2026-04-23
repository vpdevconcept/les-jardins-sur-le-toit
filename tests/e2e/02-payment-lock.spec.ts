import { test, expect } from "../../playwright-fixture";
import { loginAsAdmin } from "./helpers/admin-auth";
import { createTestOrder, e2eGuestId, setOrderStatus } from "./helpers/orders";
import { setGuestIdForTest } from "./helpers/browser-state";

/**
 * Verrou de paiement :
 * - Côté admin : bouton clôturer désactivé si commandes pas toutes "recupere"
 * - Côté client : QR de paiement masqué tant que pas tout récupéré
 */
test("admin — encaissement bloqué tant que tout n'est pas récupéré", async ({ page }) => {
  const tableNumber = Number(process.env.E2E_TABLE_NUMBER!);
  const guestId = e2eGuestId(`lock-${Date.now()}`);

  // Commande à statut "pret" (pas encore récupéré)
  const order = await createTestOrder(guestId, tableNumber, [
    { name: "Mojito", price: 11, qty: 1, stand: "jardins" },
  ]);
  await setOrderStatus(order.id, "pret");

  await loginAsAdmin(page);
  await page.getByRole("button", { name: /encaisser/i }).first().click();
  await page.getByPlaceholder(/guest|saisir/i).fill(guestId);
  await page.getByRole("button", { name: /charger|valider/i }).first().click();

  // Bandeau d'avertissement attendu
  await expect(page.locator("text=/récupéré.*avant.*règlement|attention/i")).toBeVisible({ timeout: 5_000 });

  // Bouton de clôture désactivé
  const closeBtn = page.getByRole("button", { name: /payé.*clôturer|encaisser.*clôt/i }).first();
  await expect(closeBtn).toBeDisabled();
});

test("client — QR paiement masqué tant que pas tout récupéré", async ({ page }) => {
  const tableNumber = Number(process.env.E2E_TABLE_NUMBER!);
  const guestId = e2eGuestId(`client-lock-${Date.now()}`);

  // Inject guest session before navigation
  await setGuestIdForTest(page, guestId, tableNumber);

  // Commande prête mais pas récupérée
  const order = await createTestOrder(guestId, tableNumber, [
    { name: "Burger", price: 16, qty: 1, stand: "cantina" },
  ]);
  await setOrderStatus(order.id, "pret");

  await page.goto("/mon-solde");
  // Message "Dégustez vos produits" doit apparaître
  await expect(page.locator("text=/dégustez|récupérer.*aux stands/i")).toBeVisible({ timeout: 5_000 });

  // Mark as recupere → after refresh, QR appears
  await setOrderStatus(order.id, "recupere");
  await page.reload();

  // SVG QR rendered (qrcode.react)
  await expect(page.locator("svg[height][width]").first()).toBeVisible({ timeout: 5_000 });
});
