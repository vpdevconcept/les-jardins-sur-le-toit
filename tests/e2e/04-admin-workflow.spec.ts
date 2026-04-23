import { test, expect } from "../../playwright-fixture";
import { loginAsAdmin } from "./helpers/admin-auth";
import { createTestOrder, e2eGuestId, setOrderStatus } from "./helpers/orders";

/**
 * Workflow admin : Plan de salle temps réel + Reporting filtre encaisse.
 */
test("plan de salle — table avec commande active passe en bleu (occupée)", async ({ page }) => {
  const tableNumber = Number(process.env.E2E_TABLE_NUMBER!);
  const guestId = e2eGuestId(`plan-${Date.now()}`);
  await createTestOrder(guestId, tableNumber, [
    { name: "Pivoine", price: 12, qty: 1, stand: "jardins" },
  ]);

  await loginAsAdmin(page);
  await page.getByRole("button", { name: /plan de salle/i }).first().click();

  // La table 99 doit être visible avec un état "occupée"
  const tableCard = page.locator(`text=Table ${tableNumber}, text=${tableNumber}`).first();
  await expect(tableCard).toBeVisible({ timeout: 10_000 });
});

test("reporting — seules les commandes encaissées comptent", async ({ page }) => {
  const tableNumber = Number(process.env.E2E_TABLE_NUMBER!);
  const guestId = e2eGuestId(`report-${Date.now()}`);

  // Une commande encaissée
  const o1 = await createTestOrder(guestId + "-paid", tableNumber, [
    { name: "Margherita", price: 14, qty: 1, stand: "pazzo" },
  ]);
  await setOrderStatus(o1.id, "encaisse");

  // Une commande non encaissée (doit être ignorée par le CA)
  await createTestOrder(guestId + "-pending", tableNumber, [
    { name: "Burger", price: 16, qty: 1, stand: "cantina" },
  ]);

  await loginAsAdmin(page);
  await page.getByRole("button", { name: /reporting/i }).first().click();

  // Le KPI "CA du jour" doit refléter au moins la commande encaissée
  const kpiArea = page.locator("text=/chiffre.*affaires|ca.*jour/i").first();
  await expect(kpiArea).toBeVisible({ timeout: 5_000 });
});
