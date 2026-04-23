import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const ANON = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const anonClient = () =>
  createClient(SUPABASE_URL, ANON, { auth: { persistSession: false } });

export const serviceClient = () =>
  createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const E2E_GUEST_PREFIX = "e2e-";

export const e2eGuestId = (suffix: string = Date.now().toString()) =>
  `${E2E_GUEST_PREFIX}${suffix}`;

export interface CreatedOrder {
  id: string;
  guestId: string;
  total: number;
}

/** Create an order via anon client (mimics what client does). */
export async function createTestOrder(
  guestId: string,
  tableNumber: number,
  items: Array<{ name: string; price: number; qty: number; stand: string; menu_item_id?: string | null }>
): Promise<CreatedOrder> {
  const sb = anonClient();
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  const { data: order, error } = await sb
    .from("orders")
    .insert({ guest_id: guestId, table_number: tableNumber, total, status: "nouveau" })
    .select("id")
    .single();
  if (error || !order) throw new Error(`createTestOrder: ${error?.message}`);

  const itemRows = items.map((i) => ({
    order_id: order.id,
    name: i.name,
    unit_price: i.price,
    quantity: i.qty,
    stand: i.stand,
    menu_item_id: i.menu_item_id ?? null,
  }));
  const { error: e2 } = await sb.from("order_items").insert(itemRows);
  if (e2) throw new Error(`insert items: ${e2.message}`);

  return { id: order.id, guestId, total };
}

/** Fetch order with items (service role bypasses RLS). */
export async function getOrder(id: string) {
  const { data } = await serviceClient()
    .from("orders")
    .select("id, status, total, order_items(id, status, name, quantity)")
    .eq("id", id)
    .maybeSingle();
  return data;
}

/** Force-set order status (service role) — bypass workflow for setup helpers. */
export async function setOrderStatus(id: string, status: string) {
  await serviceClient().from("orders").update({ status }).eq("id", id);
}
