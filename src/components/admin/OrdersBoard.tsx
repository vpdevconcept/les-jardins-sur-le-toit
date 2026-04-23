import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BellRing } from "lucide-react";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  stand: string;
  status: "nouveau" | "en_preparation" | "pret";
}
type OrderStatus = "nouveau" | "en_preparation" | "pret" | "recupere" | "encaisse";
interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  table_number: number | null;
  created_at: string;
  order_items: OrderItem[];
}

const STAND_TABS = [
  { id: "all", label: "Tous" },
  { id: "jardins", label: "🍹 Jardins" },
  { id: "pazzo", label: "🍕 Pazzo" },
  { id: "cantina", label: "🍔 The Butcher / Cantina" },
  { id: "saigon", label: "🌶️ Saigon" },
];

const STATUS_META: Record<OrderStatus, { label: string; cls: string }> = {
  nouveau: { label: "🆕 Nouveau", cls: "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse" },
  en_preparation: { label: "👨‍🍳 En préparation", cls: "bg-sky-500/20 text-sky-300 border-sky-500/40" },
  pret: { label: "✅ Prêt", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  recupere: { label: "📦 Récupéré · attente d'encaissement", cls: "bg-slate-700 text-slate-300 border-slate-600" },
  encaisse: { label: "💶 Encaissé", cls: "bg-slate-800 text-slate-500 border-slate-700" },
};

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  nouveau: "en_preparation",
  en_preparation: "pret",
  pret: "recupere",
  recupere: null, // L'encaissement se fait depuis l'onglet "Encaisser"
  encaisse: null,
};

const playPing = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 1100;
    g.gain.setValueAtTime(0.15, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    o.start(); o.stop(ctx.currentTime + 0.4);
  } catch {}
};

const OrdersBoard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stand, setStand] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, status, total, table_number, created_at, order_items(id, name, quantity, unit_price, stand, status)")
      .in("status", ["nouveau", "en_preparation", "pret"])
      .order("created_at", { ascending: true });
    if (data) setOrders(data as Order[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel("admin_orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => fetchOrders())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const advance = async (order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdatingId(order.id);
    const { error } = await supabase.from("orders").update({ status: next }).eq("id", order.id);
    setUpdatingId(null);
    if (error) {
      toast.error("Erreur : " + error.message);
    } else if (next === "pret") {
      playPing();
      toast.success("🛎️ Le client a été notifié !");
    } else {
      toast.success(`Statut → ${STATUS_META[next].label}`);
    }
  };

  const filtered = orders
    .map((o) => ({
      ...o,
      order_items: stand === "all" ? o.order_items : o.order_items.filter((i) => i.stand === stand),
    }))
    .filter((o) => o.order_items.length > 0);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <Tabs value={stand} onValueChange={setStand}>
        <TabsList className="bg-slate-900 border border-slate-800">
          {STAND_TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="data-[state=active]:bg-slate-700">{t.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <BellRing className="mx-auto mb-3 opacity-30" />
          Aucune commande en cours.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((order) => {
            const meta = STATUS_META[order.status];
            const next = NEXT_STATUS[order.status];
            return (
              <article key={order.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                {order.table_number ? (
                  <div className="-mx-4 -mt-4 mb-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-xl flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[11px] font-bold text-white/90 uppercase tracking-widest">Table</span>
                      <span className="text-5xl font-black text-white leading-none drop-shadow">{order.table_number}</span>
                    </div>
                    <Badge variant="outline" className={`border ${meta.cls} bg-white/10 backdrop-blur`}>{meta.label}</Badge>
                  </div>
                ) : (
                  <div className="-mx-4 -mt-4 mb-1 px-4 py-3 bg-slate-800 rounded-t-xl flex items-center justify-between">
                    <span className="text-lg font-black text-slate-300 uppercase tracking-wide">À emporter</span>
                    <Badge variant="outline" className={`border ${meta.cls}`}>{meta.label}</Badge>
                  </div>
                )}
                <header className="flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">
                    #{order.id.slice(0, 6)} · {new Date(order.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-emerald-400 font-bold">{Number(order.total).toFixed(2).replace(".", ",")}€</p>
                </header>
                <ul className="text-sm space-y-1 text-slate-200">
                  {order.order_items.map((it) => (
                    <li key={it.id} className="flex justify-between">
                      <span>{it.quantity}× {it.name}</span>
                      <span className="text-slate-500">{it.stand}</span>
                    </li>
                  ))}
                </ul>
                {next ? (() => {
                  const btnCls =
                    next === "en_preparation"
                      ? "bg-sky-600 hover:bg-sky-500 text-white"
                      : next === "pret"
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-slate-600 hover:bg-slate-500 text-white";
                  const ctaLabel =
                    next === "en_preparation"
                      ? "👨‍🍳 Démarrer la préparation"
                      : next === "pret"
                      ? "✅ Marquer comme Prêt (notifie le client)"
                      : "📦 Marquer comme Récupéré";
                  const isLoading = updatingId === order.id;
                  return (
                    <Button
                      size="sm"
                      onClick={() => advance(order)}
                      disabled={isLoading}
                      className={`w-full ${btnCls} disabled:opacity-70`}
                    >
                      {isLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="animate-spin" size={14} />
                          Mise à jour…
                        </span>
                      ) : (
                        ctaLabel
                      )}
                    </Button>
                  );
                })() : (
                  <div className="w-full text-center text-[11px] text-slate-500 italic py-2 border border-dashed border-slate-800 rounded-md">
                    En attente d'encaissement → onglet « Encaisser »
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrdersBoard;
