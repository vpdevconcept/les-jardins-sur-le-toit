import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, BellRing, Loader2, KeyRound } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getTableNumber, setTableNumber } from "@/lib/guestSession";
import { useSessionAccess } from "@/hooks/useSessionAccess";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

const STAND_LABELS: Record<string, string> = {
  jardins: "🍹 Les Jardins",
  pazzo: "🍕 Pazzo Pazzo",
  cantina: "🍔 The Butcher / Cantina",
  saigon: "🌶️ Ô Little Saigon",
};

const CartDrawer = ({ open, onClose }: CartDrawerProps) => {
  const { items, updateQuantity, removeItem, clearCart, totalPrice, submitOrder } = useCart();
  const { hasAccess, loading: accessLoading, tableNumber: assignedTable } = useSessionAccess();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [tableInput, setTableInput] = useState<string>(() => {
    const n = getTableNumber();
    return n ? String(n) : "";
  });

  /* Regroupement par stand pour clarifier "où récupérer quoi" */
  const itemsByStand = useMemo(() => {
    const map = new Map<string, typeof items>();
    items.forEach((ci) => {
      const cat = ci.item.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(ci);
    });
    return Array.from(map.entries());
  }, [items]);

  const handleValidate = async () => {
    if (!hasAccess) {
      toast.error("Session non activée", {
        description: "Demandez votre QR Code à l'accueil pour pouvoir commander 🔑",
        duration: 5000,
      });
      return;
    }
    // Si la session est assignée, on utilise prioritairement la table de l'assignation
    let tableNumber = assignedTable ?? getTableNumber();
    if (!tableNumber) {
      const parsed = parseInt(tableInput, 10);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        toast.error("Indiquez votre numéro de table pour commander.");
        return;
      }
      tableNumber = parsed;
      setTableNumber(parsed);
    }
    setSubmitting(true);
    const res = await submitOrder(tableNumber);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error || "Erreur lors de l'envoi");
      return;
    }
    toast.success("Commande envoyée ! 🌿", {
      description:
        "Votre commande circule entre nos 4 stands. Suivez-la dans « Ma commande ».",
      duration: 6000,
      action: { label: "Suivre", onClick: () => navigate("/mes-commandes") },
    });
    onClose();
    navigate("/mes-commandes");
  };

  const tableKnown = !!(assignedTable ?? getTableNumber());

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex flex-col glass-card border-l border-border">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl text-primary">
            Votre commande
          </SheetTitle>
          <SheetDescription className="text-xs">
            Les Jardins Sur Le Toit · Éperon Rooftop
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm gap-2">
            <span className="text-4xl">🌿</span>
            <p>Votre panier est vide</p>
            <p className="text-xs">Composez votre commande depuis les 4 stands.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-5 mt-4 pr-1">
              {itemsByStand.map(([standId, standItems]) => (
                <div key={standId}>
                  <h3 className="font-display text-sm font-bold text-primary mb-2 px-1">
                    {STAND_LABELS[standId] ?? standId}
                  </h3>
                  <div className="space-y-2">
                    {standItems.map((ci) => {
                      const optExtra = (ci.selectedOptions || []).reduce(
                        (s, o) => s + o.priceExtra,
                        0,
                      );
                      const unitPrice = ci.item.price + optExtra;
                      return (
                        <motion.div
                          layout
                          key={ci.cartKey}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="bg-card border border-border rounded-xl p-3"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-display font-bold text-sm text-foreground">
                                {ci.item.name}
                              </h4>
                              {ci.selectedOptions && ci.selectedOptions.length > 0 && (
                                <p className="text-xs text-primary mt-0.5">
                                  {ci.selectedOptions.map((o) => o.label).join(", ")}
                                </p>
                              )}
                              <p className="text-muted-foreground text-xs">
                                {unitPrice.toFixed(2).replace(".", ",")}€
                              </p>
                            </div>
                            <button
                              onClick={() => removeItem(ci.cartKey)}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1"
                              aria-label="Retirer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(ci.cartKey, ci.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-accent flex items-center justify-center hover:bg-primary/20 transition-colors"
                              aria-label="Moins"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-sm font-medium w-6 text-center">
                              {ci.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(ci.cartKey, ci.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-accent flex items-center justify-center hover:bg-primary/20 transition-colors"
                              aria-label="Plus"
                            >
                              <Plus size={12} />
                            </button>
                            <span className="ml-auto font-display font-bold text-sm text-secondary">
                              {(unitPrice * ci.quantity).toFixed(2).replace(".", ",")}€
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 mt-4 space-y-3">
              {!tableKnown && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    🪑 Numéro de votre table
                  </label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={tableInput}
                    onChange={(e) => setTableInput(e.target.value)}
                    placeholder="Ex : 12"
                    className="h-11"
                  />
                </div>
              )}
              {tableKnown && (
                <p className="text-xs text-center text-primary font-medium">
                  🪑 Table N° {assignedTable ?? getTableNumber()}
                </p>
              )}

              {!accessLoading && !hasAccess && (
                <div className="flex items-start gap-2 bg-secondary/10 border border-secondary/30 rounded-xl p-3">
                  <KeyRound size={16} className="text-secondary shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/85 leading-snug">
                    <span className="font-bold text-secondary">Session non activée.</span>{" "}
                    Présentez-vous à l'accueil avec une pièce d'identité pour recevoir votre QR Code et valider votre commande.
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="font-display font-bold text-lg text-foreground">
                  Total
                </span>
                <span className="font-display font-bold text-2xl text-secondary">
                  {totalPrice.toFixed(2).replace(".", ",")}€
                </span>
              </div>

              <Button
                onClick={handleValidate}
                disabled={submitting || !hasAccess || accessLoading}
                className="w-full rounded-full min-h-[52px] bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg text-base font-bold disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : !hasAccess ? (
                  <KeyRound size={18} />
                ) : (
                  <BellRing size={18} />
                )}
                {!hasAccess ? "Demander mon accès à l'accueil" : "Valider ma commande aux stands"}
              </Button>
              <p className="text-[11px] text-center text-muted-foreground -mt-1">
                {hasAccess
                  ? "Une seule validation · Vos plats circulent entre 4 stands · Alerte temps réel"
                  : "Le staff active votre session après dépôt de la pièce d'identité 🔑"}
              </p>

              <button
                onClick={clearCart}
                className="w-full text-center text-xs text-muted-foreground hover:text-destructive transition-colors mt-1"
              >
                Vider le panier
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
