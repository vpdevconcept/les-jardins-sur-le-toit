import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Plus, Check, Wine } from "lucide-react";
import { MenuItem, getDerivedBadges } from "@/data/menu";
import { useCart } from "@/contexts/CartContext";
import { features } from "@/config/features";
import ProductCard from "./ProductCard";
import { cn } from "@/lib/utils";

interface ProductGridProps {
  items: MenuItem[];
  /** Liste complète (utilisée par le upselling du CartContext). */
  allItems: MenuItem[];
  /** Si true, regroupe par item.subcategory avec un titre par section. */
  groupBySubcategory?: boolean;
  /** Couleur d'accent : "secondary" (rose néon, boissons) ou "primary" (vert, food). */
  accent?: "secondary" | "primary";
}

/* ── Modale détail produit ── */
const ProductModal = ({
  item,
  allItems,
  onClose,
  accent = "secondary",
}: {
  item: MenuItem;
  allItems: MenuItem[];
  onClose: () => void;
  accent?: "secondary" | "primary";
}) => {
  const isPrimary = accent === "primary";
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const badges = getDerivedBadges(item);

  // Découpe la description en ingrédients (séparés par virgules)
  const ingredients = item.description
    .replace(/\.$/, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const handleAdd = () => {
    addItem(item, undefined, allItems);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 700);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/70 backdrop-blur-sm"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 60, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.96 }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="relative w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl ring-1 ring-foreground/10"
      >
        {/* Image hero */}
        <div className="relative aspect-square w-full bg-muted/40">
          {item.image ? (
            <img src={item.image} alt={item.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-card to-secondary/15">
              <Wine size={64} className="text-foreground/30" strokeWidth={1.1} />
            </div>
          )}
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-md text-foreground hover:bg-background transition-colors"
          >
            <X size={18} />
          </button>
          {item.volume && (
            <span className="absolute bottom-3 left-3 text-xs font-medium px-3 py-1 rounded-full bg-background/80 backdrop-blur-md text-foreground">
              {item.volume}
            </span>
          )}
        </div>

        {/* Contenu */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground leading-tight">
                {item.name}
              </h2>
              {item.subcategory && (
                <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                  {item.subcategory}
                </p>
              )}
            </div>
            <span className="font-display text-2xl font-bold text-accent whitespace-nowrap tabular-nums">
              {Number(item.price).toFixed(item.price % 1 === 0 ? 0 : 2).replace(".", ",")}€
            </span>
          </div>

          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <span
                  key={b}
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full",
                    isPrimary ? "bg-primary/20 text-primary" : "bg-secondary/15 text-secondary",
                  )}
                >
                  {b}
                </span>
              ))}
            </div>
          )}

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Composition
            </h3>
            {ingredients.length > 1 ? (
              <ul className="flex flex-wrap gap-1.5">
                {ingredients.map((ing) => (
                  <li
                    key={ing}
                    className="text-sm bg-foreground/5 text-foreground px-3 py-1.5 rounded-full"
                  >
                    {ing}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-foreground/80 leading-relaxed">{item.description}</p>
            )}
          </div>

          {features.cart && (
            <button
              onClick={handleAdd}
              className={cn(
                "w-full h-12 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all",
                added
                  ? "bg-accent text-accent-foreground"
                  : isPrimary
                    ? "bg-primary text-primary-foreground hover:scale-[1.01] shadow-lg shadow-primary/30"
                    : "bg-secondary text-secondary-foreground neon-glow-pink hover:scale-[1.01]",
              )}
            >
              {added ? (
                <>
                  <Check size={18} /> Ajouté !
                </>
              ) : (
                <>
                  <Plus size={18} /> Ajouter au panier
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── Grille principale ── */
const ProductGrid = ({ items, allItems, groupBySubcategory = true, accent = "secondary" }: ProductGridProps) => {
  const [selected, setSelected] = useState<MenuItem | null>(null);

  const groups = useMemo(() => {
    if (!groupBySubcategory) {
      return [{ subcategory: "", items }];
    }
    const map = new Map<string, MenuItem[]>();
    for (const it of items) {
      const key = it.subcategory ?? "Autres";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return Array.from(map.entries()).map(([subcategory, items]) => ({
      subcategory,
      items: items.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)),
    }));
  }, [items, groupBySubcategory]);

  const titleClass = accent === "primary"
    ? "font-display text-2xl sm:text-3xl font-bold text-primary"
    : "font-display text-2xl sm:text-3xl font-bold text-secondary neon-text-pink";
  const lineClass = accent === "primary"
    ? "flex-1 h-px bg-gradient-to-r from-primary/40 to-transparent"
    : "flex-1 h-px bg-gradient-to-r from-secondary/40 to-transparent";

  return (
    <>
      <div className="space-y-12">
        {groups.map(({ subcategory, items: groupItems }) => (
          <section key={subcategory || "all"}>
            {subcategory && (
              <div className="flex items-center gap-3 mb-5">
                <h3 className={titleClass}>{subcategory}</h3>
                <div className={lineClass} />
                <span className="text-xs text-muted-foreground tabular-nums">
                  {groupItems.length}
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {groupItems.map((item, i) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  index={i}
                  onOpen={setSelected}
                  allItems={allItems}
                  accent={accent}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <ProductModal
            item={selected}
            allItems={allItems}
            onClose={() => setSelected(null)}
            accent={accent}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ProductGrid;
