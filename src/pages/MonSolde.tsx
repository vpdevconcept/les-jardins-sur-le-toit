/**
 * Mon Solde — Checkout de fin de session.
 * Le QR de paiement est masqué tant que toutes les commandes ne sont pas RÉCUPÉRÉES.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Wallet, ReceiptText, Utensils, MapPin } from "lucide-react";
import { getGuestId, getTableNumber } from "@/lib/guestSession";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  stand: string;
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

const STAND_LABEL: Record<string, string> = {
  jardins: "🍹 Les Jardins",
  pazzo: "🍕 Pazzo Pazzo",
  cantina: "🍔 The Butcher / Cantina",
  saigon: "🌶️ Ô Little Saigon",
};

const STATUS_BADGE: Record<OrderStatus, { label: string; cls: string }> = {
  nouveau: { label: "🆕 Reçue", cls: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  en_preparation: { label: "👨‍🍳 En préparation", cls: "bg-sky-500/15 text-sky-700 border-sky-500/30" },
  pret: { label: "✅ Prêt à récupérer", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  recupere: { label: "📦 Récupéré", cls: "bg-muted text-muted-foreground border-border" },
  encaisse: { label: "💶 Réglé", cls: "bg-muted text-muted-foreground border-border" },
};

const MonSolde = () => {
  const guestId = getGuestId();
  const tableNumber = getTableNumber();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, status, total, table_number, created_at, order_items(id, name, quantity, unit_price, stand)")
      .eq("guest_id", guestId)
      .neq("status", "encaisse")
      .order("created_at", { ascending: true });
    if (data) setOrders(data as Order[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    // Realtime sur les changements de statut
    const orderChannel = supabase
      .channel(`solde_orders_${guestId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `guest_id=eq.${guestId}` }, () => fetchOrders())
      .subscribe();

    // Écoute la clôture par l'admin → libère la table & réinitialise la session
    const channel = supabase
      .channel(`guest_${guestId}`)
      .on("broadcast", { event: "session_closed" }, () => {
        try {
          localStorage.removeItem("ljst_guest_id");
          localStorage.removeItem("ljst_table_number");
          localStorage.removeItem("ljst_table_token");
        } catch {}
        setTimeout(() => { window.location.href = "/"; }, 1500);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestId]);

  const total = useMemo(
    () => orders.reduce((s, o) => s + Number(o.total), 0),
    [orders],
  );

  const allPickedUp = orders.length > 0 && orders.every((o) => o.status === "recupere");
  const pendingStands = useMemo(() => {
    const set = new Set<string>();
    orders.filter((o) => o.status !== "recupere").forEach((o) => {
      o.order_items.forEach((it) => set.add(it.stand));
    });
    return Array.from(set);
  }, [orders]);

  // Payload QR code paiement
  const payload = JSON.stringify({
    type: "ljst_payment",
    guest_id: guestId,
    table: tableNumber,
    total: Number(total.toFixed(2)),
    orders: orders.map((o) => o.id),
    ts: Date.now(),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/70 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
        <Link to="/mes-commandes" className="text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-lg font-bold font-playfair text-foreground">Mon solde</h1>
          <p className="text-xs text-muted-foreground">
            {allPickedUp
              ? `Prêt à régler${tableNumber ? ` · Table ${tableNumber}` : ""}`
              : `Dégustez tranquille${tableNumber ? ` · Table ${tableNumber}` : ""}`}
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-5">
        {orders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Wallet className="mx-auto h-10 w-10 mb-3 opacity-40" />
            <p>Aucune commande à solder.</p>
            <Button asChild className="mt-4"><Link to="/">Voir la carte</Link></Button>
          </div>
        ) : (
          <>
            {/* Bloc QR / Verrou */}
            <AnimatePresence mode="wait">
              {allPickedUp ? (
                <motion.div
                  key="qr-ready"
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-card/70 backdrop-blur-xl border border-border rounded-3xl p-6 flex flex-col items-center text-center shadow-lg"
                >
                  <Badge className="mb-3 bg-emerald-500/15 text-emerald-700 border-emerald-500/30 border">
                    ✨ Prêt à régler
                  </Badge>
                  <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground mb-1">Total à régler</p>
                  <p className="font-display text-5xl font-bold text-secondary mb-5">
                    {total.toFixed(2).replace(".", ",")}€
                  </p>
                  <motion.div
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.5 }}
                    className="bg-white p-4 rounded-2xl shadow-inner"
                  >
                    <QRCodeSVG
                      value={payload}
                      size={208}
                      level="M"
                      includeMargin={false}
                      fgColor="#1a1a1a"
                    />
                  </motion.div>
                  <p className="text-sm text-foreground/80 mt-5 max-w-sm">
                    Présentez ce QR Code à la caisse en partant. Notre équipe scannera votre note pour la solder en quelques secondes.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="qr-locked"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="relative bg-card/70 backdrop-blur-xl border border-border rounded-3xl p-6 flex flex-col items-center text-center shadow-lg overflow-hidden"
                >
                  {/* QR flouté en arrière-plan */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-20 blur-md pointer-events-none">
                    <div className="bg-white p-4 rounded-2xl">
                      <QRCodeSVG value="locked" size={208} level="M" />
                    </div>
                  </div>
                  <div className="relative z-10 max-w-sm">
                    <Utensils className="mx-auto h-10 w-10 text-secondary mb-3" />
                    <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                      Dégustez vos produits 🍽️
                    </h2>
                    <p className="text-sm text-foreground/80 mb-4">
                      Vous pourrez régler une fois <span className="font-bold">toutes vos commandes récupérées</span> aux stands.
                    </p>
                    <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground mb-1">Total en cours</p>
                    <p className="font-display text-3xl font-bold text-secondary mb-4">
                      {total.toFixed(2).replace(".", ",")}€
                    </p>
                    {pendingStands.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          <MapPin size={12} /> À récupérer aux stands :
                        </p>
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {pendingStands.map((s) => (
                            <Badge key={s} className="bg-amber-500/15 text-amber-700 border-amber-500/30 border">
                              {STAND_LABEL[s] ?? s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Récap commandes */}
            <section className="bg-card/60 backdrop-blur-xl border border-border rounded-3xl overflow-hidden">
              <header className="px-5 py-3 border-b border-border flex items-center gap-2">
                <ReceiptText size={16} className="text-primary" />
                <h2 className="font-display font-bold text-foreground">Récapitulatif</h2>
              </header>
              <ul className="divide-y divide-border">
                {orders.map((o) => {
                  const sb = STATUS_BADGE[o.status];
                  return (
                    <li key={o.id} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <p className="text-xs text-muted-foreground">
                          #{o.id.slice(0, 6)} · {new Date(o.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <Badge className={`${sb.cls} border text-[10px]`}>{sb.label}</Badge>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-display font-bold text-secondary">
                          {Number(o.total).toFixed(2).replace(".", ",")}€
                        </p>
                      </div>
                      <ul className="space-y-0.5 text-sm">
                        {o.order_items.map((it) => (
                          <li key={it.id} className="flex justify-between text-muted-foreground">
                            <span>
                              <span className="mr-1">{STAND_LABEL[it.stand] ?? it.stand}</span>
                              {it.quantity}× {it.name}
                            </span>
                            <span>{(Number(it.unit_price) * it.quantity).toFixed(2).replace(".", ",")}€</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>
              <footer className="px-5 py-4 border-t border-border bg-muted/30 flex items-center justify-between">
                <span className="font-display font-bold text-foreground">Total</span>
                <span className="font-display text-2xl font-bold text-secondary">
                  {total.toFixed(2).replace(".", ",")}€
                </span>
              </footer>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default MonSolde;
