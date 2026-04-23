/**
 * Encaissement — Vue FinTech opérationnelle.
 * 1) Liste auto des tables prêtes à payer (toutes commandes au statut "recupere").
 * 2) Détail addition par table : produits, sous-totaux par stand, total général.
 * 3) Recherche rapide + scan QR client conservé.
 * 4) Clôture sécurisée + libération instantanée de la table.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2, ScanLine, X, CheckCircle2, Wallet, AlertTriangle, IdCard,
  Search, ArrowLeft, Receipt, Banknote, CreditCard, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface OrderItem { id: string; name: string; quantity: number; unit_price: number; stand: string; }
type OrderStatus = "nouveau" | "en_preparation" | "pret" | "recupere" | "encaisse";
interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  table_number: number | null;
  guest_id: string | null;
  created_at: string;
  order_items: OrderItem[];
}

interface ScanPayload { type: string; guest_id: string; table?: number | null; total?: number; }

const STATUS_LABEL: Record<OrderStatus, string> = {
  nouveau: "🆕 Nouveau",
  en_preparation: "👨‍🍳 En préparation",
  pret: "✅ Prêt",
  recupere: "📦 Récupéré",
  encaisse: "💶 Encaissé",
};

interface Props {
  initialGuestId?: string | null;
  onClosed?: () => void;
}

// --- Group helpers ---------------------------------------------------------
interface TableBucket {
  tableNumber: number;
  guestId: string | null;
  orders: Order[];
  readyOrders: Order[];   // statut "recupere" → prêt à régler
  pendingOrders: Order[]; // encore en cuisine (nouveau / en_preparation / pret)
  total: number;          // cumul de TOUTES les commandes non encaissées
  readyTotal: number;     // sous-total des commandes récupérées
  pendingTotal: number;   // sous-total bloquant
  allPickedUp: boolean;   // true si rien en attente (encaissement autorisé)
  hasReady: boolean;      // au moins une commande récupérée
}

const groupByTable = (orders: Order[]): TableBucket[] => {
  const map = new Map<string, TableBucket>();
  for (const o of orders) {
    if (o.table_number == null) continue;
    const key = `${o.table_number}__${o.guest_id ?? "anon"}`;
    let b = map.get(key);
    if (!b) {
      b = {
        tableNumber: o.table_number,
        guestId: o.guest_id,
        orders: [],
        readyOrders: [],
        pendingOrders: [],
        total: 0,
        readyTotal: 0,
        pendingTotal: 0,
        allPickedUp: true,
        hasReady: false,
      };
      map.set(key, b);
    }
    b.orders.push(o);
    b.total += Number(o.total);
    if (o.status === "recupere") {
      b.readyOrders.push(o);
      b.readyTotal += Number(o.total);
      b.hasReady = true;
    } else {
      b.pendingOrders.push(o);
      b.pendingTotal += Number(o.total);
      b.allPickedUp = false;
    }
  }
  return [...map.values()].sort((a, b) => a.tableNumber - b.tableNumber);
};

const fmtEuro = (n: number) => `${n.toFixed(2).replace(".", ",")}€`;

// --- Component -------------------------------------------------------------
const Encaissement = ({ initialGuestId = null, onClosed }: Props) => {
  // Liste globale
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");
  // staff_note par n° de table (pour rappel pièce d'identité)
  const [tableMeta, setTableMeta] = useState<Record<number, string | null>>({});

  // Sélection / addition
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  // Modale de confirmation pré-encaissement (rappel pièce d'identité)
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Scanner
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "ljst-admin-scanner";

  // ---- Fetch + realtime ---------------------------------------------------
  const fetchOrders = useCallback(async () => {
    const [ordersRes, tablesRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id, status, total, table_number, guest_id, created_at, order_items(id, name, quantity, unit_price, stand)")
        .neq("status", "encaisse")
        .order("created_at", { ascending: true }),
      supabase.from("tables").select("number, staff_note"),
    ]);
    if (ordersRes.error) {
      toast.error("Erreur de chargement : " + ordersRes.error.message);
    } else if (ordersRes.data) {
      setActiveOrders(ordersRes.data as Order[]);
    }
    if (tablesRes.data) {
      const map: Record<number, string | null> = {};
      for (const t of tablesRes.data as { number: number; staff_note: string | null }[]) {
        map[t.number] = t.staff_note;
      }
      setTableMeta(map);
    }
    setLoadingList(false);
  }, []);

  useEffect(() => {
    fetchOrders();
    const ch = supabase
      .channel("encaissement-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchOrders)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, fetchOrders)
      .on("postgres_changes", { event: "*", schema: "public", table: "tables" }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchOrders]);

  // ---- Auto-select sur initialGuestId (depuis Plan de salle) -------------
  useEffect(() => {
    if (!initialGuestId || activeOrders.length === 0) return;
    const match = activeOrders.find((o) => o.guest_id === initialGuestId);
    if (match && match.table_number != null) {
      setSelectedKey(`${match.table_number}__${initialGuestId}`);
    }
  }, [initialGuestId, activeOrders]);

  // ---- Buckets : sessions de table -------------------------------------
  // Une session apparaît dès qu'elle a au moins une commande récupérée.
  // Si une nouvelle commande arrive en cuisine, le total s'incrémente
  // mais l'encaissement est bloqué jusqu'à ce qu'elle soit aussi récupérée.
  const allBuckets = useMemo(() => groupByTable(activeOrders), [activeOrders]);
  const sessionBuckets = useMemo(() => allBuckets.filter((b) => b.hasReady), [allBuckets]);
  const filteredSessions = useMemo(() => {
    const q = search.trim();
    if (!q) return sessionBuckets;
    return sessionBuckets.filter((b) => String(b.tableNumber).includes(q));
  }, [sessionBuckets, search]);

  const selectedBucket = useMemo(
    () => allBuckets.find((b) => `${b.tableNumber}__${b.guestId ?? "anon"}` === selectedKey) ?? null,
    [allBuckets, selectedKey],
  );

  // ---- Scanner ------------------------------------------------------------
  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); await scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handlePayload = (raw: string) => {
    try {
      const data: ScanPayload = JSON.parse(raw);
      if (data.type !== "ljst_payment" || !data.guest_id) throw new Error("QR invalide");
      stopScanner();
      // Cherche la table correspondante dans la liste active
      const match = activeOrders.find((o) => o.guest_id === data.guest_id);
      if (match && match.table_number != null) {
        setSelectedKey(`${match.table_number}__${data.guest_id}`);
        toast.success(`Note chargée · Table ${match.table_number}`);
      } else {
        toast.warning("Aucune commande active trouvée pour ce client.");
      }
    } catch {
      toast.error("QR Code non reconnu");
    }
  };

  const startScanner = async () => {
    setScanning(true);
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => handlePayload(decoded),
          () => {},
        );
      } catch (e: any) {
        toast.error("Caméra inaccessible : " + (e?.message ?? ""));
        setScanning(false);
      }
    }, 100);
  };

  useEffect(() => () => { stopScanner(); }, []);

  // ---- Clôture ------------------------------------------------------------
  const requestClose = () => {
    if (!selectedBucket) return;
    if (!selectedBucket.allPickedUp) {
      toast.error("Toutes les commandes doivent être récupérées avant le règlement.");
      return;
    }
    setConfirmOpen(true);
  };

  const closeBill = async () => {
    if (!selectedBucket) return;
    setClosing(true);
    const ids = selectedBucket.orders.map((o) => o.id);
    const { error } = await supabase.from("orders").update({ status: "encaisse" }).in("id", ids);
    if (error) {
      toast.error("Erreur : " + error.message);
      setClosing(false);
      return;
    }
    // Libération de la table : remise à zéro de la session staff
    await supabase
      .from("tables")
      .update({ assigned_at: null, assigned_guest_id: null, staff_note: null })
      .eq("number", selectedBucket.tableNumber);

    if (selectedBucket.guestId) {
      await supabase.channel(`guest_${selectedBucket.guestId}`).send({
        type: "broadcast",
        event: "session_closed",
        payload: { guest_id: selectedBucket.guestId, ts: Date.now() },
      });
    }
    toast.success(
      `Table ${selectedBucket.tableNumber} libérée. Bonne journée 🌴`,
      { duration: 4000 },
    );
    setClosing(false);
    setConfirmOpen(false);
    setSelectedKey(null);
    onClosed?.();
    fetchOrders();
  };

  // ---- Sous-totaux par stand ---------------------------------------------
  const standSubtotals = useMemo(() => {
    if (!selectedBucket) return [] as { stand: string; total: number; count: number }[];
    const map = new Map<string, { total: number; count: number }>();
    for (const o of selectedBucket.orders) {
      for (const it of o.order_items) {
        const cur = map.get(it.stand) ?? { total: 0, count: 0 };
        cur.total += Number(it.unit_price) * it.quantity;
        cur.count += it.quantity;
        map.set(it.stand, cur);
      }
    }
    return [...map.entries()].map(([stand, v]) => ({ stand, ...v }));
  }, [selectedBucket]);

  // ============= RENDER : DÉTAIL ADDITION =============
  if (selectedBucket) {
    const b = selectedBucket;
    return (
      <div className="space-y-5 max-w-3xl">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setSelectedKey(null)}
            className="text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft size={16} className="mr-1" /> Retour à la liste
          </Button>
          <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
            <Receipt size={12} className="mr-1" /> Addition
          </Badge>
        </div>

        {/* Header table */}
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 shadow-lg">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/90">Table</p>
            <p className="text-6xl font-black text-white leading-none mt-1">{b.tableNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-white/80">Total session</p>
            <p className="text-4xl font-black text-white">{fmtEuro(b.total)}</p>
            <p className="text-[11px] text-white/80 mt-1">{b.orders.length} commande{b.orders.length > 1 ? "s" : ""}</p>
          </div>
        </div>

        {!b.allPickedUp && (
          <div className="bg-red-950/50 border border-red-800/60 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-red-200">
              <p className="font-bold mb-1">Règlement bloqué</p>
              <p className="text-red-300/90">
                Cette table a {b.pendingOrders.length} commande{b.pendingOrders.length > 1 ? "s" : ""} encore en cuisine
                ({fmtEuro(b.pendingTotal)}). Attendez le passage en <span className="font-bold">📦 RÉCUPÉRÉ</span> avant d'encaisser.
              </p>
            </div>
          </div>
        )}

        {/* ✅ Prêt à régler */}
        {b.readyOrders.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> Prêt à régler
              </h3>
              <span className="text-xs text-emerald-300 font-semibold">{fmtEuro(b.readyTotal)}</span>
            </div>
            <div className="bg-slate-900 border border-emerald-500/30 rounded-xl divide-y divide-slate-800">
              {b.readyOrders.map((o) => (
                <div key={o.id} className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-slate-500">
                      #{o.id.slice(0, 6)} · {new Date(o.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 bg-emerald-500/10">
                      {STATUS_LABEL[o.status]}
                    </Badge>
                  </div>
                  <ul className="text-sm space-y-1 text-slate-200">
                    {o.order_items.map((it) => (
                      <li key={it.id} className="flex justify-between">
                        <span>
                          <span className="text-slate-400 mr-1">{it.quantity}×</span>
                          {it.name}
                          <span className="text-[10px] text-slate-500 ml-2">[{it.stand}]</span>
                        </span>
                        <span className="text-slate-300 font-medium">
                          {fmtEuro(Number(it.unit_price) * it.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between mt-2 pt-2 border-t border-slate-800 text-xs">
                    <span className="text-slate-500">Sous-total commande</span>
                    <span className="text-slate-200 font-semibold">{fmtEuro(Number(o.total))}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ⏳ En attente (bloque l'encaissement) */}
        {b.pendingOrders.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
                ⏳ En attente · bloque l'encaissement
              </h3>
              <span className="text-xs text-amber-300 font-semibold">{fmtEuro(b.pendingTotal)}</span>
            </div>
            <div className="bg-slate-900/60 border border-amber-500/30 rounded-xl divide-y divide-slate-800">
              {b.pendingOrders.map((o) => (
                <div key={o.id} className="p-4 opacity-90">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs text-slate-500">
                      #{o.id.slice(0, 6)} · {new Date(o.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <Badge variant="outline" className="border-amber-500/40 text-amber-300 bg-amber-500/10">
                      {STATUS_LABEL[o.status]}
                    </Badge>
                  </div>
                  <ul className="text-sm space-y-1 text-slate-200">
                    {o.order_items.map((it) => (
                      <li key={it.id} className="flex justify-between">
                        <span>
                          <span className="text-slate-400 mr-1">{it.quantity}×</span>
                          {it.name}
                          <span className="text-[10px] text-slate-500 ml-2">[{it.stand}]</span>
                        </span>
                        <span className="text-slate-400 font-medium">
                          {fmtEuro(Number(it.unit_price) * it.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-between mt-2 pt-2 border-t border-slate-800 text-xs">
                    <span className="text-slate-500">Sous-total commande</span>
                    <span className="text-slate-300 font-semibold">{fmtEuro(Number(o.total))}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sous-totaux par stand */}
        {standSubtotals.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Sous-totaux par stand</p>
            <ul className="space-y-1 text-sm">
              {standSubtotals.map((s) => (
                <li key={s.stand} className="flex justify-between text-slate-300">
                  <span className="capitalize">{s.stand} <span className="text-slate-500">({s.count} article{s.count > 1 ? "s" : ""})</span></span>
                  <span className="font-medium">{fmtEuro(s.total)}</span>
                </li>
              ))}
              <li className="flex justify-between pt-2 mt-2 border-t border-slate-800 text-emerald-300 font-bold text-base">
                <span>TOTAL GÉNÉRAL</span>
                <span>{fmtEuro(b.total)}</span>
              </li>
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={requestClose}
            disabled={closing || !b.allPickedUp}
            className="h-16 text-base bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-slate-700 disabled:text-slate-400"
          >
            <Banknote className="mr-2" size={20} />
            <CreditCard className="mr-2" size={20} />
            Paiement Espèces / CB
          </Button>
          <Button
            onClick={() => setSelectedKey(null)}
            variant="outline"
            className="h-16 text-base border-slate-700 text-slate-200 hover:bg-slate-800"
          >
            <X size={18} className="mr-2" /> Annuler / Retour
          </Button>
        </div>

        <p className="text-[11px] text-slate-500 flex items-center gap-1">
          <Wallet size={11} /> La table sera libérée instantanément du plan de salle après règlement.
        </p>

        {/* AlertDialog : rappel pièce d'identité avant libération */}
        <AlertDialog open={confirmOpen} onOpenChange={(o) => !closing && setConfirmOpen(o)}>
          <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-100">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-black flex items-center gap-2 text-amber-400">
                <AlertTriangle size={24} /> Avant de libérer la table
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-300 text-base pt-2 space-y-3">
                <span className="block">
                  Pensez à <span className="text-amber-300 font-bold uppercase">restituer la pièce d'identité</span> au client.
                </span>
                {tableMeta[b.tableNumber] ? (
                  <span className="flex items-start gap-2 bg-fuchsia-950/40 border border-fuchsia-800/50 rounded-lg p-3 text-sm text-fuchsia-200">
                    <IdCard size={18} className="shrink-0 mt-0.5 text-fuchsia-400" />
                    <span>
                      <span className="block text-[10px] uppercase tracking-widest text-fuchsia-400 font-bold mb-0.5">Note staff</span>
                      {tableMeta[b.tableNumber]}
                    </span>
                  </span>
                ) : (
                  <span className="block text-xs text-slate-500 italic">
                    Aucune note staff enregistrée pour cette table.
                  </span>
                )}
                <span className="block text-xs text-slate-500">
                  Total à encaisser : <span className="text-emerald-400 font-bold">{fmtEuro(b.total)}</span> · Table {b.tableNumber}
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel
                disabled={closing}
                className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
              >
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={closing}
                onClick={(e) => { e.preventDefault(); closeBill(); }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                {closing ? (
                  <><Loader2 className="animate-spin mr-2" size={16} /> Clôture…</>
                ) : (
                  <><CheckCircle2 className="mr-2" size={16} /> Pièce rendue, encaisser</>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ============= RENDER : LISTE PRINCIPALE =============
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Encaisser</h2>
          <p className="text-xs text-slate-500">Tables prêtes à régler · mises à jour en temps réel</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchOrders}
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-200 hover:bg-slate-800"
          >
            <RefreshCw size={14} className="mr-1" /> Rafraîchir
          </Button>
          {!scanning ? (
            <Button onClick={startScanner} size="sm" className="bg-emerald-600 hover:bg-emerald-500">
              <ScanLine size={14} className="mr-1" /> Scanner le QR Client
            </Button>
          ) : (
            <Button onClick={stopScanner} variant="outline" size="sm" className="border-slate-700 text-slate-200">
              <X size={14} className="mr-1" /> Fermer scanner
            </Button>
          )}
        </div>
      </div>

      {scanning && (
        <div className="space-y-2">
          <div id={containerId} className="rounded-xl overflow-hidden bg-black w-full max-w-md aspect-square mx-auto" />
          <p className="text-xs text-slate-500 text-center">Présentez le QR « Mon Solde » du client</p>
        </div>
      )}

      {/* Recherche */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un n° de table…"
          inputMode="numeric"
          className="pl-9 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500"
        />
      </div>

      {/* Stats compact */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Sessions à régler</p>
          <p className="text-2xl font-bold text-emerald-400">{sessionBuckets.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">CA en attente</p>
          <p className="text-2xl font-bold text-amber-400">
            {fmtEuro(sessionBuckets.reduce((s, b) => s + b.total, 0))}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 col-span-2 sm:col-span-1">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Tables en service</p>
          <p className="text-2xl font-bold text-slate-200">{allBuckets.length}</p>
        </div>
      </div>

      {/* Liste */}
      {loadingList ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-emerald-500" />
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-slate-900 border border-dashed border-slate-800 rounded-xl p-8 text-center">
          <Receipt className="mx-auto text-slate-600 mb-2" size={32} />
          <p className="text-slate-400 font-medium">
            {search ? "Aucune table ne correspond à votre recherche" : "Aucune session prête à régler pour l'instant"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Une session apparaît ici dès qu'au moins une commande est marquée « Récupéré ».
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredSessions.map((b) => {
            const key = `${b.tableNumber}__${b.guestId ?? "anon"}`;
            const blocked = !b.allPickedUp;
            return (
              <li
                key={key}
                className={`bg-slate-900 border rounded-xl p-4 flex items-center justify-between gap-3 transition-colors ${
                  blocked ? "border-amber-500/40" : "border-slate-800 hover:border-emerald-500/50"
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl w-14 h-14 flex items-center justify-center shrink-0">
                    <span className="text-2xl font-black text-white">{b.tableNumber}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100">Table {b.tableNumber}</p>
                    <p className="text-xs text-slate-500">
                      {b.orders.length} cmd ·{" "}
                      <span className="text-emerald-400 font-bold text-base">{fmtEuro(b.total)}</span>
                    </p>
                    {blocked ? (
                      <Badge className="mt-1 bg-amber-500/15 text-amber-300 border border-amber-500/40 text-[10px]">
                        ⏳ {fmtEuro(b.pendingTotal)} en cuisine
                      </Badge>
                    ) : (
                      <Badge className="mt-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 text-[10px]">
                        <CheckCircle2 size={10} className="mr-1" /> Prête à payer
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => setSelectedKey(key)}
                  className={blocked ? "bg-amber-600 hover:bg-amber-500 shrink-0" : "bg-emerald-600 hover:bg-emerald-500 shrink-0"}
                >
                  <Receipt size={14} className="mr-1" /> {blocked ? "Voir détail" : "Encaisser"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Tables en cours mais sans aucune commande récupérée */}
      {allBuckets.length > sessionBuckets.length && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">En cours de service (rien à régler encore)</p>
          <div className="flex flex-wrap gap-2">
            {allBuckets.filter((b) => !b.hasReady).map((b) => (
              <Badge
                key={`${b.tableNumber}__${b.guestId ?? "anon"}`}
                variant="outline"
                className="border-slate-700 text-slate-400"
              >
                Table {b.tableNumber} · {fmtEuro(b.total)}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Encaissement;
