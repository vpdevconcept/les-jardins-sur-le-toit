import { Page } from "@playwright/test";
import { TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } from "./seed";

export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(TEST_ADMIN_EMAIL);
  await page.getByLabel(/mot de passe|password/i).fill(TEST_ADMIN_PASSWORD);
  await page.getByRole("button", { name: /connexion|se connecter|sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 10_000 });
}
