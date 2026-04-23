import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for seeding");
}

export const TEST_ADMIN_EMAIL = "e2e-admin@jardins-test.local";
export const TEST_ADMIN_PASSWORD = "E2E-Admin-Test-2026!";
export const TEST_TABLE_NUMBER = 99;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export interface SeedResult {
  adminUserId: string;
  tableId: string;
  tableNumber: number;
  qrToken: string;
}

/** Idempotent: creates (or fetches) admin user + e2e test table. */
export async function seed(): Promise<SeedResult> {
  // 1. Admin user
  let adminUserId: string;
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list?.users.find((u) => u.email === TEST_ADMIN_EMAIL);

  if (existing) {
    adminUserId = existing.id;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: TEST_ADMIN_EMAIL,
      password: TEST_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "E2E Admin" },
    });
    if (error || !data.user) throw new Error(`createUser: ${error?.message}`);
    adminUserId = data.user.id;
  }

  // 2. Ensure admin role (handle_new_user inserts 'client' by default)
  await admin
    .from("user_roles")
    .upsert({ user_id: adminUserId, role: "admin" }, { onConflict: "user_id,role" });

  // 3. Test table 99
  const { data: existingTable } = await admin
    .from("tables")
    .select("id, qr_token, number")
    .eq("number", TEST_TABLE_NUMBER)
    .maybeSingle();

  let tableId: string;
  let qrToken: string;

  if (existingTable) {
    tableId = existingTable.id;
    qrToken = existingTable.qr_token;
    await admin.from("tables").update({ is_active: true }).eq("id", tableId);
  } else {
    const { data, error } = await admin
      .from("tables")
      .insert({ number: TEST_TABLE_NUMBER, is_active: true })
      .select("id, qr_token")
      .single();
    if (error || !data) throw new Error(`createTable: ${error?.message}`);
    tableId = data.id;
    qrToken = data.qr_token;
  }

  return { adminUserId, tableId, tableNumber: TEST_TABLE_NUMBER, qrToken };
}

/** Removes all orders/items linked to test table + guest sessions starting with `e2e-`. */
export async function cleanup() {
  const { data: table } = await admin
    .from("tables")
    .select("id")
    .eq("number", TEST_TABLE_NUMBER)
    .maybeSingle();

  // Delete orders for test table OR test guest sessions
  const filter = table
    ? `table_id.eq.${table.id},guest_id.like.e2e-%`
    : `guest_id.like.e2e-%`;

  const { data: orders } = await admin
    .from("orders")
    .select("id")
    .or(filter);

  if (orders && orders.length > 0) {
    const orderIds = orders.map((o) => o.id);
    await admin.from("order_items").delete().in("order_id", orderIds);
    await admin.from("orders").delete().in("id", orderIds);
  }
}
