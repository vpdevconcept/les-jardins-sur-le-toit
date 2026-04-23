/**
 * Plan de salle · Temps réel
 * Vue d'ensemble façon plan de salle pro avec statut couleur par table,
 * récap dynamique des commandes, raccourci vers l'encaissement,
 * et flux d'assignation manuelle (staff remet un QR physique au client).
 */
import { useEffect, useMemo, useState, memo } from "react";
import { QRCodeSVG } from "qrcode.react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2, Printer, Plus, Wallet, Eye, UserPlus, IdCard, Trash2, X, Pencil, Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, TouchSensor,
  useSensor, useSensors, closestCenter,
} from "@dnd-kit/core";
import { restrictToWindowEdges, restrictToParentElement } from "@dnd-kit/modifiers";
import {
  SortableContext, arrayMove, rectSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TableRow {
  id: string;
  number: number;
  name: string | null;
  qr_token: string;
  is_active: boolean;
  assigned_at: string | null;
  assigned_guest_id: string | null;
  staff_note: string | null;
  last_scan_at: string | null;
  display_order: number;
}
type OrderStatus = "nouveau" | "en_preparation" | "pret" | "recupere" | "encaisse";
interface OrderItem { id: string; name: string; quantity: number; unit_price: number; stand: string; status: string; }
interface Order {
  id: string;
  status: OrderStatus;
  total: number;
  table_number: number | null;
  guest_id: string | null;
  created_at: string;
  order_items: OrderItem[];
}

type TableState = "libre" | "assignee" | "connecte" | "occupee" | "prete" | "encaisser";

const STATE_META: Record<TableState, { label: string; ring: string; badge: string; pulse?: boolean }> = {
  libre:     { label: "Libre",            ring: "border-slate-700",    badge: "bg-slate-700 text-slate-300" },
  assignee:  { label: "Assignée",         ring: "border-fuchsia-500",  badge: "bg-fuchsia-500 text-white", pulse: true },
  connecte:  { label: "Client connecté",  ring: "border-blue-500",     badge: "bg-blue-500 text-white", pulse: true },
  occupee:   { label: "En préparation",   ring: "border-sky-500",      badge: "bg-sky-500 text-white", pulse: true },
  prete:     { label: "Prête à servir",   ring: "border-emerald-500",  badge: "bg-emerald-500 text-white" },
  encaisser: { label: "À encaisser",      ring: "border-amber-500",    badge: "bg-amber-500 text-white" },
};

interface Props {
  onManageBill?: (guestId: string) => void;
}

// petit uuid v4 (pour pré-générer le guest_id côté staff)
const uuidv4 = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const sinceMin = (iso: string | null): string => {
  if (!iso) return "";
  const m = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return "à l'instant";
  if (m < 60) return `depuis ${m} min`;
  const h = Math.floor(m / 60);
  return `depuis ${h}h${String(m % 60).padStart(2, "0")}`;
};

/**
 * Wrapper Sortable pour une carte de table.
 * - Le drag n'est ACTIF qu'en mode édition (sinon listeners non transmis).
 * - Toute la card devient la poignée → long press 150ms (TouchSensor) sur mobile.
 * - Pendant le drag : scale-105, opacity-80, shadow-2xl, ring primary, blur léger.
 */
const SortableCard = memo(function SortableCard({
  id,
  editMode,
  children,
}: {
  id: string;
  editMode: boolean;
  children: React.ReactNode;
}) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id, disabled: !editMode });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Pendant le drag : on masque l'original, le DragOverlay rend la version "soulevée"
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 50 : "auto",
    touchAction: editMode ? "none" : "auto", // évite conflit scroll mobile
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(editMode ? attributes : {})}
      {...(editMode ? listeners : {})}
      className={editMode ? "cursor-grab active:cursor-grabbing" : ""}
    >
      {children}
    </div>
  );
});

const TablesQR = ({ onManageBill }: Props) => {
  const [tables, setTables] = useState<TableRow[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [detailsTable, setDetailsTable] = useState<TableRow | null>(null);

  // Modale d'assignation
  const [assignTarget, setAssignTarget] = useState<TableRow | null>(null);
  const [staffNote, setStaffNote] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Modale de libération
  const [releaseTarget, setReleaseTarget] = useState<TableRow | null>(null);
  const [releasing, setReleasing] = useState(false);

  // Modale de suppression définitive
  const [deleteTarget, setDeleteTarget] = useState<TableRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Mode édition (style iPhone : croix de suppression + drag & drop)
  const [editMode, setEditMode] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Sensors @dnd-kit : long press 150ms (mobile, évite conflit scroll)
  // + activation 5px au pointeur (souris/stylet) pour réactivité desktop.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  // Modale création de table avec choix du numéro + nom optionnel
  const [createOpen, setCreateOpen] = useState(false);
  const [createNumber, setCreateNumber] = useState<string>("");
  const [createName, setCreateName] = useState<string>("");

  // Modale renommage rapide d'une table existante
  const [renameTarget, setRenameTarget] = useState<TableRow | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");
  const [renaming, setRenaming] = useState(false);

  const fetchTables = async () => {
    const { data } = await supabase
      .from("tables")
      .select("*")
      .order("display_order", { ascending: true })
      .order("number", { ascending: true });
    if (data) setTables(data as TableRow[]);
  };

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, status, total, table_number, guest_id, created_at, order_items(id, name, quantity, unit_price, stand, status)")
      .neq("status", "encaisse")
      .order("created_at", { ascending: true });
    if (data) setOrders(data as Order[]);
  };

  useEffect(() => {
    (async () => {
      await Promise.all([fetchTables(), fetchOrders()]);
      setLoading(false);
    })();

    const ch = supabase
      .channel("plan_de_salle")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => fetchOrders())
      .on("postgres_changes", { event: "*", schema: "public", table: "tables" }, () => fetchTables())
      .subscribe();

    // Polling supprimé : Realtime suffit. Évite les rerenders inutiles (fluidité 60 FPS).
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Ouvre la modale d'ajout en pré-remplissant le prochain numéro libre
  const openCreateModal = () => {
    const used = new Set(tables.map((t) => t.number));
    let suggestion = 1;
    while (used.has(suggestion)) suggestion += 1;
    setCreateNumber(String(suggestion));
    setCreateName("");
    setCreateOpen(true);
  };

  const confirmCreate = async () => {
    const n = parseInt(createNumber, 10);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Numéro invalide.");
      return;
    }
    if (tables.some((t) => t.number === n)) {
      toast.error(`La table ${n} existe déjà.`);
      return;
    }
    setAdding(true);
    const cleanName = createName.trim() || null;
    const nextOrder = tables.length === 0
      ? 0
      : Math.max(...tables.map((x) => x.display_order ?? 0)) + 1;
    const { data, error } = await supabase
      .from("tables")
      .insert({ number: n, name: cleanName, display_order: nextOrder })
      .select()
      .maybeSingle();
    setAdding(false);
    if (error) { toast.error(error.message); return; }
    if (data) {
      setTables((prev) => [...prev, data as TableRow]);
    }
    toast.success(cleanName ? `« ${cleanName} » créée` : `Table ${n} créée`);
    setCreateOpen(false);
  };

  // Renommage rapide d'une table existante (tap sur le titre dans le plan)
  const openRename = (t: TableRow) => {
    setRenameTarget(t);
    setRenameValue(t.name ?? "");
  };

  const confirmRename = async () => {
    if (!renameTarget) return;
    const cleanName = renameValue.trim() || null;
    setRenaming(true);
    // Update optimiste
    setTables((prev) => prev.map((x) => x.id === renameTarget.id ? { ...x, name: cleanName } : x));
    const { error } = await supabase
      .from("tables")
      .update({ name: cleanName })
      .eq("id", renameTarget.id);
    setRenaming(false);
    if (error) {
      toast.error("Renommage impossible : " + error.message);
      fetchTables();
      return;
    }
    toast.success(cleanName ? `Renommée en « ${cleanName} »` : `Nom personnalisé retiré`);
    setRenameTarget(null);
  };

  // Regroupement des commandes par numéro de table
  const ordersByTable = useMemo(() => {
    const m = new Map<number, Order[]>();
    orders.forEach((o) => {
      if (o.table_number == null) return;
      const arr = m.get(o.table_number) ?? [];
      arr.push(o);
      m.set(o.table_number, arr);
    });
    return m;
  }, [orders]);

  const computeState = (t: TableRow, tOrders: Order[]): TableState => {
    if (tOrders.length === 0) {
      if (!t.assigned_at) return "libre";
      // Le client a scanné le QR → état "connecté" (bleu, pulsation)
      if (t.last_scan_at && new Date(t.last_scan_at) >= new Date(t.assigned_at)) return "connecte";
      return "assignee";
    }
    if (tOrders.some((o) => o.status === "nouveau" || o.status === "en_preparation")) return "occupee";
    if (tOrders.some((o) => o.status === "pret")) return "prete";
    if (tOrders.every((o) => o.status === "recupere")) return "encaisser";
    return "occupee";
  };

  // ---- Premium printable QR ------------------------------------------------
  const printQR = async (t: TableRow) => {
    const url = `${window.location.origin}/qr/${t.qr_token}`;

    // Génération QR via librairie npm standard (qrcode), 100% local — niveau H
    // (30% de redondance Reed-Solomon) pour autoriser le logo central sans
    // casser la lecture. Aucun CDN externe → projet exportable tel quel.
    let qrDataUrl = "";
    try {
      qrDataUrl = await QRCode.toDataURL(url, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 512,
        color: { dark: "#2D5016", light: "#FFFFFF" },
      });
    } catch (e) {
      toast.error("Impossible de générer le QR Code.");
      return;
    }

    const w = window.open("", "_blank", "width=480,height=680");
    if (!w) { toast.error("Pop-up bloquée — autorisez les fenêtres pour imprimer."); return; }

    const logo = `${window.location.origin}/les-jardins-logo-circle.png`;

    w.document.write(`<!doctype html><html lang="fr"><head>
<meta charset="utf-8" />
<title>${t.name ? t.name : `Table ${t.number}`} · QR Premium</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet">
<style>
  @page { size: A6; margin: 8mm; }
  * { box-sizing: border-box; }
  html, body { margin:0; padding:0; background: #FBF7F0; color:#2D5016; font-family:'Inter', system-ui, sans-serif; }
  .card {
    width: 100%; max-width: 360px; margin: 0 auto; padding: 22px 18px 20px;
    background: linear-gradient(180deg, #FBF7F0 0%, #F4EDDF 100%);
    border: 1.5px solid rgba(45,80,22,0.12);
    border-radius: 18px; text-align:center;
    box-shadow: 0 6px 22px rgba(45,80,22,0.08);
  }
  .brand-row { display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:6px; }
  .brand-logo { width:42px; height:42px; border-radius:50%; object-fit:cover;
    box-shadow: 0 2px 6px rgba(45,80,22,0.18); }
  .brand-name { font-family:'Playfair Display', serif; font-weight:900;
    font-size:16px; letter-spacing:0.04em; color:#2D5016; line-height:1; }
  .brand-sub { font-size:9.5px; letter-spacing:0.32em; text-transform:uppercase;
    color:#E89B5A; margin-top:2px; font-weight:600; }
  .qr-wrap { position:relative; width:230px; height:230px; margin: 14px auto 8px;
    background:#fff; padding:10px; border-radius:14px;
    box-shadow: inset 0 0 0 1px rgba(45,80,22,0.08); }
  .qr-wrap img.qr { width:100%; height:100%; display:block; }
  .qr-logo {
    position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
    width:42px; height:42px; border-radius:50%;
    background:#fff; padding:4px; box-shadow:0 0 0 3px #fff, 0 2px 6px rgba(0,0,0,0.18);
    object-fit:cover;
  }
  .table-label { font-size:10px; letter-spacing:0.42em; text-transform:uppercase;
    color:#2D5016; opacity:0.65; margin-top:10px; font-weight:700; }
  .table-number { font-family:'Playfair Display', serif; font-weight:900;
    font-size:78px; line-height:0.95; color:#2D5016; margin: 2px 0 8px; }
  .quote { font-family:'Playfair Display', serif; font-style:italic;
    font-size:12.5px; color:#2D5016; opacity:0.85; line-height:1.45;
    padding: 0 14px; margin: 4px 0 8px; }
  .footer { font-size:9.5px; letter-spacing:0.18em; text-transform:uppercase;
    color:#E89B5A; font-weight:600; margin-top:6px; }
  .divider { width:36px; height:2px; background:#E89B5A; border-radius:2px;
    margin: 6px auto 0; opacity:0.7; }
  @media print {
    body { background:#FBF7F0; }
    .card { box-shadow:none; border-color: rgba(45,80,22,0.18); }
  }
</style>
</head><body>
  <div class="card">
    <div class="brand-row">
      <img class="brand-logo" src="${logo}" alt="Logo" />
      <div>
        <div class="brand-name">LES JARDINS SUR LE TOIT</div>
        <div class="brand-sub">Food court · Rooftop</div>
      </div>
    </div>
    <div class="qr-wrap">
      <img class="qr" src="${qrDataUrl}" alt="QR Code Table ${t.number}" />
      <img class="qr-logo" src="${logo}" alt="" />
    </div>
    <div class="table-label">${t.name ? `Table ${t.number}` : "Votre table"}</div>
    <div class="table-name" style="font-family:'Playfair Display', serif; font-weight:900; color:#2D5016; line-height:0.95; margin: 2px 0 8px; font-size: ${t.name ? (t.name.length > 14 ? "32px" : t.name.length > 8 ? "44px" : "58px") : "78px"};">${t.name ? t.name : String(t.number).padStart(2, "0")}</div>
    <div class="divider"></div>
    <p class="quote">« Votre accès privilégié au Rooftop.<br/>Gardez-le avec vous 🍹 »</p>
    <div class="footer">lesjardinssurletoit.re</div>
  </div>

  <script>
    (function(){
      function ready() {
        var imgs = Array.from(document.images);
        var pending = imgs.filter(function(i){ return !i.complete; });
        if (pending.length === 0) return Promise.resolve();
        return Promise.all(pending.map(function(i){
          return new Promise(function(res){ i.onload = i.onerror = res; });
        }));
      }
      Promise.all([ready(), document.fonts ? document.fonts.ready : Promise.resolve()])
        .then(function(){ setTimeout(function(){ window.print(); }, 250); });
    })();
  </script>
</body></html>`);
    w.document.close();
  };

  // ---- Assigner & imprimer -------------------------------------------------
  const openAssign = (t: TableRow) => {
    setAssignTarget(t);
    setStaffNote("");
  };

  const confirmAssign = async () => {
    if (!assignTarget) return;
    setAssigning(true);
    const newToken = (typeof crypto !== "undefined" && "randomUUID" in crypto)
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 16)
      : Math.random().toString(36).slice(2, 18);
    const newGuestId = uuidv4();

    const { data, error } = await supabase
      .from("tables")
      .update({
        qr_token: newToken,
        assigned_at: new Date().toISOString(),
        assigned_guest_id: newGuestId,
        staff_note: staffNote.trim() || null,
      })
      .eq("id", assignTarget.id)
      .select()
      .maybeSingle();

    setAssigning(false);
    if (error || !data) {
      toast.error("Erreur d'assignation : " + (error?.message ?? "inconnue"));
      return;
    }

    toast.success(`Table ${assignTarget.number} assignée. QR prêt à l'impression.`);
    const updated = data as TableRow;
    setAssignTarget(null);
    // petite tempo pour laisser le toast respirer puis impression
    setTimeout(() => printQR(updated), 200);
    fetchTables();
  };

  // ---- Libérer une table (annule la session + commandes en cours) ----------
  const confirmRelease = async () => {
    if (!releaseTarget) return;
    setReleasing(true);
    const tableNumber = releaseTarget.number;

    // 1) Récupère les commandes actives (non encaissées) liées à la table
    const { data: activeOrders, error: fetchErr } = await supabase
      .from("orders")
      .select("id")
      .eq("table_number", tableNumber)
      .neq("status", "encaisse");

    if (fetchErr) {
      setReleasing(false);
      toast.error("Erreur : " + fetchErr.message);
      return;
    }

    // 2) Marque ces commandes comme encaissées (archivage : on conserve l'historique)
    if (activeOrders && activeOrders.length > 0) {
      const ids = activeOrders.map((o) => o.id);
      const { error: updErr } = await supabase
        .from("orders")
        .update({ status: "encaisse" })
        .in("id", ids);
      if (updErr) {
        setReleasing(false);
        toast.error("Impossible d'archiver les commandes : " + updErr.message);
        return;
      }
    }

    // 3) Réinitialise la table (rotation du token pour invalider l'ancien QR)
    const newToken = (typeof crypto !== "undefined" && "randomUUID" in crypto)
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 16)
      : Math.random().toString(36).slice(2, 18);

    const { error: tblErr } = await supabase
      .from("tables")
      .update({
        assigned_at: null,
        assigned_guest_id: null,
        staff_note: null,
        qr_token: newToken,
      })
      .eq("id", releaseTarget.id);

    setReleasing(false);
    if (tblErr) {
      toast.error("Erreur libération : " + tblErr.message);
      return;
    }

    toast.success(`Table ${tableNumber} libérée 🌴`);
    setReleaseTarget(null);
    fetchTables();
    fetchOrders();
  };
  // ---- Suppression définitive d'une table ---------------------------------
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const tableNumber = deleteTarget.number;

    // Refus si commandes actives sur cette table
    const { data: activeOrders } = await supabase
      .from("orders")
      .select("id")
      .eq("table_number", tableNumber)
      .neq("status", "encaisse");

    if (activeOrders && activeOrders.length > 0) {
      setDeleting(false);
      toast.error(`Table ${tableNumber} : ${activeOrders.length} commande(s) en cours. Libérez la table avant suppression.`);
      return;
    }

    const { error } = await supabase.from("tables").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast.error("Suppression impossible : " + error.message);
      return;
    }
    toast.success(`Table ${tableNumber} supprimée`);
    setDeleteTarget(null);
    fetchTables();
  };

  // ---- Drag & Drop : réorganisation persistante ----------------------------
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tables.findIndex((x) => x.id === active.id);
    const newIndex = tables.findIndex((x) => x.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    // Optimistic UI
    const reordered = arrayMove(tables, oldIndex, newIndex).map((t, idx) => ({
      ...t,
      display_order: idx,
    }));
    const previous = tables;
    setTables(reordered);

    // Persistence batch (upsert avec id pour mettre à jour display_order)
    const payload = reordered.map((t) => ({
      id: t.id,
      number: t.number,
      qr_token: t.qr_token,
      display_order: t.display_order,
    }));
    const { error } = await supabase.from("tables").upsert(payload, { onConflict: "id" });
    if (error) {
      toast.error("Sauvegarde du nouvel ordre impossible");
      setTables(previous);
    }
  };

  const activeDragTable = activeDragId ? tables.find((t) => t.id === activeDragId) ?? null : null;

  const detailsOrders = detailsTable ? (ordersByTable.get(detailsTable.number) ?? []) : [];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100">Plan de salle</h2>
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live
            </span>
            {editMode && (
              <span className="text-[10px] uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-0.5">
                Mode édition
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Synchronisation temps réel · {tables.length} tables
            {editMode && " · touchez ✕ pour supprimer"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setEditMode((e) => !e)}
            variant={editMode ? "default" : "outline"}
            className={editMode
              ? "bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-full"
              : "border-slate-700 text-slate-200 hover:bg-slate-800 rounded-full"}
          >
            {editMode ? <><Check size={14} className="mr-1" /> OK</> : <><Pencil size={14} className="mr-1" /> Éditer</>}
          </Button>
        </div>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-2 text-[11px]">
        {(["libre", "assignee", "connecte", "occupee", "prete", "encaisser"] as TableState[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-full px-2.5 py-1">
            <span className={`h-2 w-2 rounded-full ${STATE_META[s].badge.split(" ")[0]}`} />
            <span className="text-slate-300">{STATE_META[s].label}</span>
          </span>
        ))}
      </div>

      {/* Grille tables — Drag & Drop actif uniquement en mode édition */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToWindowEdges, restrictToParentElement]}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDragId(null)}
      >
        <SortableContext items={tables.map((t) => t.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {tables.map((t) => {
              const tOrders = ordersByTable.get(t.number) ?? [];
              const state = computeState(t, tOrders);
              const meta = STATE_META[state];
              const totalItems = tOrders.reduce((s, o) => s + o.order_items.reduce((a, i) => a + i.quantity, 0), 0);
              const pickedItems = tOrders.filter((o) => o.status === "recupere").reduce((s, o) => s + o.order_items.reduce((a, i) => a + i.quantity, 0), 0);
              const sessionTotal = tOrders.reduce((s, o) => s + Number(o.total), 0);
              const guestId = tOrders[0]?.guest_id ?? t.assigned_guest_id ?? null;
              const url = `${window.location.origin}/qr/${t.qr_token}`;
              const isLibre = state === "libre";
              const isAssignee = state === "assignee";
              const isConnecte = state === "connecte";

              return (
                <SortableCard key={t.id} id={t.id} editMode={editMode}>
                  <div
                    className={`relative bg-slate-900 border-2 ${meta.ring} rounded-2xl p-3 space-y-2 shadow-sm shadow-black/20 transition-all hover:shadow-md hover:shadow-black/30 ${meta.pulse && !editMode ? "animate-[pulse_2.5s_ease-in-out_infinite]" : ""} ${editMode ? "ring-1 ring-amber-400/30 ring-dashed" : ""}`}
                  >
                    {/* Croix de suppression iPhone-style en mode édition */}
                    {editMode && (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTables((prev) => prev.filter((x) => x.id !== t.id));
                          supabase.from("tables").delete().eq("id", t.id).then(({ error }) => {
                            if (error) {
                              toast.error("Suppression impossible : " + error.message);
                              fetchTables();
                            } else {
                              toast.success(`Table ${t.number} supprimée`);
                            }
                          });
                        }}
                        aria-label={`Supprimer la table ${t.number}`}
                        className="absolute -top-2 -right-2 z-20 w-7 h-7 rounded-full bg-red-500 hover:bg-red-400 text-white shadow-lg flex items-center justify-center border-2 border-slate-900 transition-transform active:scale-90"
                      >
                        <X size={14} strokeWidth={3} />
                      </button>
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); openRename(t); }}
                        className="text-left flex-1 min-w-0 group transition-transform active:scale-95"
                        title={t.name ? `Renommer (actuellement : ${t.name})` : "Donner un nom personnalisé"}
                      >
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 group-hover:text-slate-400">
                          {t.name ? `Table ${t.number}` : "Table"}
                        </p>
                        <p
                          className={`font-black text-slate-100 leading-none truncate group-hover:text-emerald-300 ${
                            t.name
                              ? t.name.length > 12 ? "text-base" : t.name.length > 7 ? "text-lg" : "text-xl"
                              : "text-3xl"
                          }`}
                        >
                          {t.name ?? t.number}
                        </p>
                      </button>
                      <Badge className={`${meta.badge} border-0 text-[10px] font-bold shrink-0`}>{meta.label}</Badge>
                    </div>

                    {isLibre ? (
                      <div className="bg-white rounded-md p-1.5 inline-block mx-auto opacity-80">
                        <QRCodeSVG value={url} size={70} />
                      </div>
                    ) : isAssignee ? (
                      <div className="space-y-1 text-[11px] bg-fuchsia-950/30 border border-fuchsia-800/40 rounded-md p-2">
                        <div className="flex items-center gap-1 text-fuchsia-300 font-semibold">
                          <IdCard size={12} /> {sinceMin(t.assigned_at)}
                        </div>
                        {t.staff_note && (
                          <p className="text-fuchsia-200/90 truncate" title={t.staff_note}>
                            📋 {t.staff_note}
                          </p>
                        )}
                        <p className="text-fuchsia-300/70 text-[10px]">En attente du scan client…</p>
                      </div>
                    ) : isConnecte ? (
                      <div className="space-y-1 text-[11px] bg-blue-950/30 border border-blue-700/50 rounded-md p-2">
                        <div className="flex items-center gap-1 text-blue-300 font-semibold">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                          </span>
                          Client connecté · {sinceMin(t.last_scan_at)}
                        </div>
                        {t.staff_note && (
                          <p className="text-blue-200/90 truncate" title={t.staff_note}>
                            📋 {t.staff_note}
                          </p>
                        )}
                        <p className="text-blue-300/70 text-[10px]">Consultation du menu en cours…</p>
                      </div>
                    ) : (
                      <div className="space-y-1 text-[11px]">
                        {t.staff_note && (
                          <p className="text-fuchsia-300/90 text-[10px] truncate" title={t.staff_note}>
                            📋 {t.staff_note}
                          </p>
                        )}
                        <div className="flex justify-between text-slate-300">
                          <span>Articles</span>
                          <span className="font-bold">{pickedItems} / {totalItems} servis</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Total</span>
                          <span className="font-bold text-emerald-400">{sessionTotal.toFixed(2).replace(".", ",")}€</span>
                        </div>
                      </div>
                    )}

                    {isLibre ? (
                      <Button
                        size="sm"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); openAssign(t); }}
                        className="w-full h-9 text-[11px] bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold rounded-xl"
                      >
                        <UserPlus size={12} className="mr-1" />
                        Assigner QR
                      </Button>
                    ) : (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); setDetailsTable(t); }}
                            className="flex-1 h-8 text-[10px] border-slate-700 text-slate-200 hover:bg-slate-800 px-2 rounded-lg"
                          >
                            <Eye size={11} className="mr-0.5" /> Détails
                          </Button>
                          <Button
                            size="sm"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); guestId && onManageBill?.(guestId); }}
                            disabled={!guestId || isAssignee || isConnecte}
                            className="flex-1 h-8 text-[10px] bg-amber-600 hover:bg-amber-500 text-white disabled:bg-slate-800 disabled:text-slate-600 px-2 rounded-lg"
                          >
                            <Wallet size={11} className="mr-0.5" /> Addition
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => { e.stopPropagation(); setReleaseTarget(t); }}
                          className="w-full h-8 text-[10px] border-red-900/60 text-red-300 hover:bg-red-950/40 hover:text-red-200 px-2 rounded-lg"
                          title="Libérer la table"
                        >
                          <Trash2 size={11} className="mr-1" /> Libérer
                        </Button>
                      </div>
                    )}
                  </div>
                </SortableCard>
              );
            })}
          </div>
        </SortableContext>

        {/* Overlay : version "soulevée" iOS-style (scale, blur, shadow profonde) */}
        <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
          {activeDragTable && (
            <div className="bg-slate-900/90 border-2 border-emerald-400 rounded-2xl p-3 shadow-2xl shadow-black/60 backdrop-blur-md scale-105 ring-4 ring-emerald-400/30 cursor-grabbing select-none">
              <p className="text-[10px] uppercase tracking-widest text-slate-400">
                {activeDragTable.name ? `Table ${activeDragTable.number}` : "Table"}
              </p>
              <p className={`font-black text-emerald-300 leading-none truncate ${
                activeDragTable.name
                  ? activeDragTable.name.length > 12 ? "text-base" : activeDragTable.name.length > 7 ? "text-lg" : "text-xl"
                  : "text-3xl"
              }`}>
                {activeDragTable.name ?? activeDragTable.number}
              </p>
              <p className="text-[10px] text-emerald-400/80 mt-2">📍 Déplacement en cours…</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* FAB '+' fixe en bas à droite, façon app native */}
      <button
        onClick={openCreateModal}
        disabled={adding}
        aria-label="Ajouter une table"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-900/40 flex items-center justify-center transition-transform active:scale-90 disabled:opacity-60"
      >
        {adding ? <Loader2 className="animate-spin" size={22} /> : <Plus size={26} strokeWidth={2.5} />}
      </button>

      {/* Modale Création de table avec choix du numéro */}
      <Dialog open={createOpen} onOpenChange={(o) => !adding && setCreateOpen(o)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-[80vw] max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Plus size={20} className="text-emerald-400" /> Nouvelle table
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Choisissez le numéro de la table à ajouter au plan de salle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-table-number" className="text-slate-300 text-sm">Numéro de table</Label>
              <Input
                id="new-table-number"
                autoFocus
                type="number"
                min={1}
                value={createNumber}
                onChange={(e) => setCreateNumber(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !adding) confirmCreate(); }}
                className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600 text-lg font-bold"
              />
              <p className="text-[11px] text-slate-500">Le prochain numéro libre est pré-rempli automatiquement.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-table-name" className="text-slate-300 text-sm">
                Nom de la table <span className="text-slate-500 font-normal">(optionnel)</span>
              </Label>
              <Input
                id="new-table-name"
                type="text"
                maxLength={40}
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !adding) confirmCreate(); }}
                placeholder="ex : Vue Cocotier, VIP, Terrasse 1…"
                className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600"
              />
              <p className="text-[11px] text-slate-500">Si vide, la table affichera « Table {createNumber || "N"} ».</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={adding}
              className="border-slate-700 text-slate-200 hover:bg-slate-800">
              Annuler
            </Button>
            <Button onClick={confirmCreate} disabled={adding}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
              {adding ? <><Loader2 className="animate-spin mr-2" size={14} /> Création…</>
                : <><Plus size={14} className="mr-2" /> Créer la table</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale Renommage rapide d'une table */}
      <Dialog open={!!renameTarget} onOpenChange={(o) => !o && !renaming && setRenameTarget(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-[80vw] max-w-sm rounded-2xl">
          {renameTarget && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-black flex items-center gap-2">
                  <Pencil size={18} className="text-emerald-400" /> Renommer la Table {renameTarget.number}
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Donnez un nom personnalisé à cette table (ex : « Vue Cocotier »).
                  Laissez vide pour revenir à « Table {renameTarget.number} ».
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5 py-2">
                <Label htmlFor="rename-table-name" className="text-slate-300 text-sm">Nom de la table</Label>
                <Input
                  id="rename-table-name"
                  autoFocus
                  type="text"
                  maxLength={40}
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !renaming) confirmRename(); }}
                  placeholder="ex : Vue Cocotier"
                  className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600 text-lg font-bold"
                />
              </div>
              <DialogFooter className="gap-2 sm:gap-2">
                <Button variant="outline" onClick={() => setRenameTarget(null)} disabled={renaming}
                  className="border-slate-700 text-slate-200 hover:bg-slate-800">
                  Annuler
                </Button>
                <Button onClick={confirmRename} disabled={renaming}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                  {renaming ? <><Loader2 className="animate-spin mr-2" size={14} /> Sauvegarde…</>
                    : <><Check size={14} className="mr-2" /> Enregistrer</>}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modale Détails — fixed center, mobile-safe (80vw, scrollable) */}
      <Dialog open={!!detailsTable} onOpenChange={(o) => !o && setDetailsTable(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-[80vw] max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">

          <button
            onClick={() => setDetailsTable(null)}
            aria-label="Fermer"
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/95 hover:bg-white shadow-lg flex items-center justify-center text-neutral-800 border border-neutral-200 transition-all hover:scale-105 z-50"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
          {detailsTable && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Table {detailsTable.number}</DialogTitle>
                <DialogDescription className="text-slate-400">
                  {detailsOrders.length === 0
                    ? (detailsTable.assigned_at
                        ? `Assignée ${sinceMin(detailsTable.assigned_at)} · en attente du client.`
                        : "Aucune commande active sur cette table.")
                    : `${detailsOrders.length} commande(s) en cours`}
                </DialogDescription>
                {detailsTable.staff_note && (
                  <p className="text-fuchsia-300 text-sm mt-1">📋 Note staff : {detailsTable.staff_note}</p>
                )}
              </DialogHeader>

              {detailsOrders.length > 0 && (
                <ul className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                  {detailsOrders.map((o) => (
                    <li key={o.id} className="bg-slate-950/50 border border-slate-800 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500">#{o.id.slice(0, 6)}</span>
                        <Badge className="bg-slate-700 text-slate-200 border-0 text-[10px]">{o.status}</Badge>
                      </div>
                      <ul className="text-sm space-y-0.5 text-slate-200">
                        {o.order_items.map((it) => (
                          <li key={it.id} className="flex justify-between">
                            <span>{it.quantity}× {it.name} <span className="text-slate-500">· {it.stand}</span></span>
                            <span className="text-slate-400">{(Number(it.unit_price) * it.quantity).toFixed(2)}€</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex justify-between mt-2 pt-2 border-t border-slate-800 text-sm">
                        <span className="text-slate-400">Sous-total</span>
                        <span className="font-bold text-emerald-400">{Number(o.total).toFixed(2).replace(".", ",")}€</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2 pt-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => printQR(detailsTable)}
                  className="flex-1 border-slate-700 text-slate-200 hover:bg-slate-800"
                >
                  <Printer size={14} className="mr-1" /> Réimprimer QR
                </Button>
                {detailsOrders[0]?.guest_id && (
                  <Button
                    onClick={() => { onManageBill?.(detailsOrders[0].guest_id!); setDetailsTable(null); }}
                    className="flex-1 bg-amber-600 hover:bg-amber-500 text-white"
                  >
                    <Wallet size={14} className="mr-1" /> Gérer l'addition
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => setDetailsTable(null)}
                  className="w-full sm:w-auto text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <X size={14} className="mr-1" /> Fermer
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modale Assignation — fixed center mobile-safe */}
      <Dialog open={!!assignTarget} onOpenChange={(o) => !o && !assigning && setAssignTarget(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-[80vw] max-w-md max-h-[85vh] overflow-y-auto rounded-2xl">
          {assignTarget && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-black flex items-center gap-2">
                  <UserPlus size={20} className="text-fuchsia-400" />
                  Assigner la Table {assignTarget.number}
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  La table sera <span className="text-fuchsia-300 font-semibold">verrouillée immédiatement</span> et
                  un QR Code physique sera prêt à imprimer pour le client.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2 py-2">
                <Label htmlFor="staff-note" className="text-slate-300 text-sm">
                  Note staff <span className="text-slate-500 font-normal">(optionnel)</span>
                </Label>
                <Input
                  id="staff-note"
                  autoFocus
                  value={staffNote}
                  onChange={(e) => setStaffNote(e.target.value)}
                  placeholder="ex : M. Dupont — CNI verte"
                  maxLength={120}
                  className="bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600"
                  onKeyDown={(e) => { if (e.key === "Enter" && !assigning) confirmAssign(); }}
                />
                <p className="text-[11px] text-slate-500">
                  Indiquez ce qui vous permet de retrouver le client (nom, type de pièce d'identité…).
                </p>
              </div>

              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAssignTarget(null)}
                  disabled={assigning}
                  className="border-slate-700 text-slate-200 hover:bg-slate-800"
                >
                  Annuler
                </Button>
                <Button
                  onClick={confirmAssign}
                  disabled={assigning}
                  className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold"
                >
                  {assigning ? (
                    <><Loader2 className="animate-spin mr-2" size={14} /> Assignation…</>
                  ) : (
                    <><Printer size={14} className="mr-2" /> Confirmer & Imprimer</>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation libération de table */}
      <AlertDialog open={!!releaseTarget} onOpenChange={(o) => !o && !releasing && setReleaseTarget(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100 flex items-center gap-2">
              <Trash2 className="text-red-400" size={20} />
              Libérer la Table {releaseTarget?.number} ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Êtes-vous sûr de vouloir libérer la Table {releaseTarget?.number} ?
              Cela annulera la session en cours et archivera toutes les commandes
              non encaissées. La table redeviendra disponible.
              {releaseTarget?.staff_note && (
                <span className="block mt-3 p-2 bg-fuchsia-950/40 border border-fuchsia-800/40 rounded text-fuchsia-200 text-sm">
                  📋 Note staff : {releaseTarget.staff_note}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={releasing}
              className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-slate-100"
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmRelease(); }}
              disabled={releasing}
              className="bg-red-600 hover:bg-red-500 text-white font-bold"
            >
              {releasing ? (
                <><Loader2 className="animate-spin mr-2" size={14} /> Libération…</>
              ) : (
                <><Trash2 size={14} className="mr-2" /> Oui, libérer</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation suppression définitive de table */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100 flex items-center gap-2">
              <Trash2 className="text-red-400" size={20} />
              Supprimer définitivement la Table {deleteTarget?.number} ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Cette action est <span className="text-red-300 font-semibold">irréversible</span>.
              La table sera retirée du plan de salle. Les commandes encaissées
              restent dans l'historique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-slate-100"
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-500 text-white font-bold"
            >
              {deleting ? (
                <><Loader2 className="animate-spin mr-2" size={14} /> Suppression…</>
              ) : (
                <><Trash2 size={14} className="mr-2" /> Oui, supprimer</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TablesQR;
