import { seed, cleanup } from "./helpers/seed";

export default async function globalSetup() {
  await cleanup();
  const result = await seed();
  // Expose to tests via env
  process.env.E2E_TABLE_TOKEN = result.qrToken;
  process.env.E2E_TABLE_NUMBER = String(result.tableNumber);
  process.env.E2E_ADMIN_USER_ID = result.adminUserId;
  console.log(`✓ E2E seed ready — table #${result.tableNumber} token=${result.qrToken.slice(0, 6)}…`);
}
