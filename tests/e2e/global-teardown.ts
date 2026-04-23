import { cleanup } from "./helpers/seed";

export default async function globalTeardown() {
  await cleanup();
  console.log("✓ E2E cleanup done");
}
