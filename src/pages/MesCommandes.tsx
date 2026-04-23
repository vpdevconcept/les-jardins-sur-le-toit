import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, BellRing, Wallet } from "lucide-react";
import { toast } from "sonner";
import { getGuestId, getTableNumber, getTableName, formatTableLabel } from "@/lib/guestSession";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  stand: string;
  status: "nouveau" | "en_preparation" | "pret";
}
interface Order {
  id: string;
  status: "nouveau" | "en_preparation" | "pret" | "recupere";
  total: number;
  table_number: number | null;
  created_at: string;
  order_items: OrderItem[];
}

const STATUS_LABEL: Record<Order["status"], { label: string; className: string }> = {
  nouveau: { label: "Reçue", className: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  en_preparation: { label: "En préparation", className: "bg-sky-500/15 text-sky-600 border-sky-500/30" },
  pret: { label: "🛎️ Prête !", className: "bg-emerald-500/20 text-emerald-700 border-emerald-500/40 animate-pulse" },
  recupere: { label: "Récupérée", className: "bg-muted text-muted-foreground" },
};

const STAND_LABEL: Record<string, string> = {
  jardins: "🍹 Les Jardins",
  pazzo: "🍕 Pazzo Pazzo",
  cantina: "🍔 The Butcher / Cantina",
  saigon: "🌶️ Ô Little Saigon",
};

// --- MODIFICATION VPDEV : UTILISATION DU SON MP3 ---
const playNotificationSound = () => {
  if (typeof (window as any).playNotification === 'function') {
    (window as any).playNotification();
  }
};

const MesCommandes = () => {
  const guestId = getGuestId();
  const tableNumber = getTableNumber();
  const tableName = getTableName();
  const tableLabel = tableNumber != null ? formatTableLabel(tableNumber, tableName) : null;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const previousStatuses = useRef<Map<string, Order["status"]>>(new Map());

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, status, total, table_number, created_at, order_items(id, name, quantity, unit_price, stand, status)")
      .eq("guest_id", guestId)
      .order("created_at", { ascending: false });
    if (data) {
      (data as Order[]).forEach((o) => {
        const prev = previousStatuses.current.get(o.id);
        // Si la commande passe à "pret", on déclenche l'alerte
        if (prev && prev !== "pret" && o.status === "pret") {
          playNotificationSound(); // Appel du MP3 + Vibration
          toast.success("🛎️ Votre commande est prête !", {
            description: "Présentez-vous aux stands pour la récupérer.",
            duration: 10000,
          });
        }
        previousStatuses.current.set(o.id, o.status);
      });
      setOrders(data as Order[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel("my_orders_" + guestId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `guest_id=eq.${guestId}` },
        () => fetchOrders(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [guestId]);

  const totalSession = orders.reduce((s, o) => s + Number(o.total), 0);
  const hasOrders = orders.length > 0;

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
        <Link to="/" className="text-muted-foreground hover:text-foreground"><ArrowLeft size={18} /></Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold font-playfair text-foreground">Ma commande</h1>
          <p className="text-xs text-muted-foreground">
            Biper digital · alerte temps réel{tableLabel ? ` · ${tableLabel}` : ""}
          </p>
        </div>
        {hasOrders && (
          <Link to="/mon-solde">
            <Button size="sm" className="rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-1.5">
              <Wallet size={14} />
              Mon solde
            </Button>
          </Link>
        )}
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {!hasOrders ? (
          <div className="text-center py-16 text-muted-foreground">
            <BellRing className="mx-auto h-10 w-10 mb-3 opacity-40" />
            <p>Aucune commande pour le moment.</p>
            <Button asChild className="mt-4"><Link to="/">Découvrir le menu</Link></Button>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/60 backdrop-blur-xl border border-border rounded-3xl p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Total session</p>
                <p className="font-display text-2xl font-bold text-secondary">
                  {totalSession.toFixed(2).replace(".", ",")}€
                </p>
              </div>
              <Link to="/mon-solde">
                <Button variant="outline" className="rounded-full gap-1.5">
                  <Wallet size={16} />
                  Régler
                </Button>
              </Link>
            </motion.div>

            <AnimatePresence initial={false}>
              {orders.map((order) => {
                const meta = STATUS_LABEL[order.status];
                return (
                  <motion.article
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-card/70 backdrop-blur-xl border border-border rounded-3xl p-4 space-y-3 shadow-sm"
                  >
                    <header className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Commande #{order.id.slice(0, 8)} · {new Date(order.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          {order.table_number ? ` · ${formatTableLabel(order.table_number, tableName)}` : ""}
                        </p>
                        <p className="font-display text-xl font-bold text-secondary">
                          {Number(order.total).toFixed(2).replace(".", ",")}€
                        </p>
                      </div>
                      <motion.div
                        key={order.status}
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 18 }}
                      >
                        <Badge className={`border ${meta.className}`} variant="outline">{meta.label}</Badge>
                      </motion.div>
                    </header>
                    <ul className="space-y-1 text-sm">
                      {order.order_items.map((it) => (
                        <li key={it.id} className="flex justify-between">
                          <span>
                            <span className="text-muted-foreground mr-1">{STAND_LABEL[it.stand] ?? it.stand}</span>
                            {it.quantity}× {it.name}
                          </span>
                          <span className="text-muted-foreground">{(Number(it.unit_price) * it.quantity).toFixed(2).replace(".", ",")}€</span>
                        </li>
                      ))}
                    </ul>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  );
};

export default MesCommandes;