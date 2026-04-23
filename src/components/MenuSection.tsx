import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Info, X, AlertTriangle, Zap, Check } from "lucide-react";
import { MenuItem, MenuOption, MenuOptionChoice, getDerivedBadges, hasNutritionData } from "@/data/menu";
import { useCart } from "@/contexts/CartContext";
import { useLocation } from "@/contexts/LocationContext";
import { useMenuItems } from "@/hooks/useMenuItems";
import { Button } from "@/components/ui/button";
import { features } from "@/config/features";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import OptionsDrawer from "@/components/OptionsDrawer";
import ProductGrid from "@/components/ProductGrid";

type FilterTag = "isSignature" | "isShareable" | "isMustTry";

const filterOptions: { key: FilterTag; label: string }[] = [
  { key: "isSignature", label: "Signature 🍹" },
  { key: "isShareable", label: "À Partager 🍕" },
  { key: "isMustTry", label: "Incontournable 🔥" },
];

const badgeColor = (badge: string) => {
  switch (badge) {
    case "Signature 🍹": return "bg-secondary/90 text-secondary-foreground";
    case "À Partager 🍕": return "bg-primary/30 text-foreground";
    case "Incontournable 🔥": return "bg-amber-500/20 text-amber-700 border border-amber-500/30";
    case "100% Péi": return "bg-secondary/20 text-foreground";
    case "Fermenté": return "bg-primary/20 text-primary-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

/* ── Nutrition Modal ── */
const NutritionModal = ({ item, onClose }: { item: MenuItem; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="glass-card bg-card rounded-3xl p-6 w-full max-w-sm shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-display text-xl font-bold text-foreground">{item.name}</h3>
          <p className="text-muted-foreground text-sm">{item.price.toFixed(2).replace(".", ",")}€</p>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-accent rounded-full transition-colors">
          <X size={18} className="text-muted-foreground" />
        </button>
      </div>
      {item.nutrition.kcal && (
        <div className="mb-4 text-center">
          <span className="text-2xl font-display font-bold text-secondary">{item.nutrition.kcal}</span>
          <span className="text-muted-foreground text-sm ml-1">kcal</span>
        </div>
      )}
      {item.nutrition.allergens.length > 0 && (
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertTriangle size={12} />Allergènes
          </h4>
          <div className="flex flex-wrap gap-2">
            {item.nutrition.allergens.map((a) => (
              <span key={a} className="text-xs font-medium bg-destructive/10 text-destructive px-3 py-1 rounded-full">{a}</span>
            ))}
          </div>
        </div>
      )}
      {item.nutrition.allergens.length === 0 && (
        <div className="mb-5"><p className="text-sm text-primary">Aucun allergène connu 🌿</p></div>
      )}
      {item.nutrition.energy.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Zap size={12} />Énergie
          </h4>
          <div className="space-y-3">
            {item.nutrition.energy.map((e) => (
              <div key={e.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-foreground font-medium">{e.label}</span>
                  <span className="text-muted-foreground">{e.value}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${e.value}%` }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)))` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  </motion.div>
);

/* ── Menu Card ── */
const MenuCard = ({ item, index, allItems }: { item: MenuItem; index: number; allItems: MenuItem[] }) => {
  const { addItem } = useCart();
  const [showNutrition, setShowNutrition] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const badges = getDerivedBadges(item);

  const handleAdd = () => {
    if (item.options && item.options.length > 0) {
      setShowOptions(true);
    } else {
      addItem(item, undefined, allItems);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 600);
    }
  };

  const handleOptionsConfirm = (selectedChoices: MenuOptionChoice[]) => {
    addItem(item, selectedChoices, allItems);
    setShowOptions(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 600);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, delay: index * 0.08 }} className="group glass-card rounded-2xl p-5 hover:shadow-lg transition-all">
        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="flex-1">
            <h3 className="font-display text-lg font-bold text-foreground">{item.name}</h3>
            <p className="text-muted-foreground text-sm mt-1 leading-relaxed">{item.description}</p>
          </div>
          <span className="font-display text-xl font-bold text-secondary whitespace-nowrap">{Number(item.price).toFixed(2).replace(".", ",")}€</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex flex-wrap gap-1.5 items-center">
            {badges.map((badge) => (
              <span key={badge} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColor(badge)}`}>{badge}</span>
            ))}
            {hasNutritionData(item) && (
              <button onClick={() => setShowNutrition(true)} className="text-muted-foreground hover:text-primary transition-colors p-0.5" title="Infos nutritionnelles">
                <Info size={14} />
              </button>
            )}
          </div>
          {/* Bouton "Ajouter au panier" — Pack Premium uniquement.
              En Pack Croissance, on n'affiche que le prix (déjà visible en haut). */}
          {features.cart && (
            <motion.div whileTap={{ scale: 0.85 }} animate={justAdded ? { scale: [1, 1.3, 1] } : {}}>
              <Button size="sm" onClick={handleAdd}
                className={`rounded-full h-11 w-11 p-0 transition-all ${
                  justAdded
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-primary hover:bg-primary/80 text-primary-foreground opacity-70 group-hover:opacity-100"
                }`}>
                {justAdded ? <Check size={18} /> : <Plus size={18} />}
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>
      <AnimatePresence>
        {showNutrition && <NutritionModal item={item} onClose={() => setShowNutrition(false)} />}
      </AnimatePresence>
      <OptionsDrawer
        item={item}
        open={showOptions}
        onConfirm={handleOptionsConfirm}
        onClose={() => setShowOptions(false)}
      />
    </>
  );
};

/* ── Loading Skeleton ── */
const MenuSkeleton = () => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="glass-card rounded-2xl p-5 space-y-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

/* ── Menu Section ── */
const MenuSection = () => {
  const { locationId } = useLocation();
  const { items: menuItems, categories, loading } = useMenuItems();
  const [activeFilters, setActiveFilters] = useState<FilterTag[]>([]);

  const toggleFilter = (key: FilterTag) => {
    setActiveFilters((prev) => prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]);
  };

  const availableItems = menuItems
    .filter((item) => !item.availableAt || item.availableAt.length === 0 || item.availableAt.includes(locationId))
    .filter((item) => activeFilters.length === 0 || activeFilters.every((f) => !!item[f]))
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));

  return (
    <section id="menu" className="py-20 px-4">
      <div className="container mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-8">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-3">La Carte</h2>
          <p className="text-muted-foreground text-lg">Cocktails, Panuozzos & Street Food.</p>
        </motion.div>

        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {filterOptions.map((f) => (
            <button key={f.key} onClick={() => toggleFilter(f.key)}
              className={`text-xs font-semibold px-4 py-2 min-h-[44px] rounded-full border transition-all ${
                activeFilters.includes(f.key) ? "border-primary bg-primary/20 text-foreground" : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}>{f.label}</button>
          ))}
          {activeFilters.length > 0 && (
            <button onClick={() => setActiveFilters([])}
              className="text-xs font-semibold px-4 py-2 min-h-[44px] rounded-full border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all">
              ✕ Réinitialiser
            </button>
          )}
        </div>

        {loading ? <MenuSkeleton /> : (
          <Tabs defaultValue={categories[0]?.id ?? "jardins"} className="w-full">
            <div className="sticky top-16 z-30 -mx-4 px-4 mb-10 backdrop-blur-md bg-background/80 border-b border-foreground/10">
              <TabsList className="w-full h-auto bg-transparent p-0 rounded-none flex justify-start sm:justify-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="relative rounded-none bg-transparent px-3 sm:px-4 py-3 min-h-[48px] text-xs sm:text-sm font-medium whitespace-nowrap text-muted-foreground hover:text-foreground transition-colors data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-secondary data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-2 data-[state=active]:after:right-2 data-[state=active]:after:h-[2px] data-[state=active]:after:bg-secondary data-[state=active]:after:rounded-full data-[state=active]:after:shadow-[0_0_8px_hsl(var(--secondary))]"
                  >
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {categories.map((cat) => {
              const catItems = availableItems.filter((item) => item.category === cat.id);
              // Le stand boissons garde l'accent rose, les stands food utilisent le vert primary
              const accent: "secondary" | "primary" = cat.id === "jardins" ? "secondary" : "primary";
              return (
                <TabsContent key={cat.id} value={cat.id}>
                  {cat.description && <p className="text-center text-sm text-muted-foreground mb-8 italic">{cat.description}</p>}
                  {catItems.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucun produit ne correspond aux filtres sélectionnés.</p>
                  ) : (
                    <ProductGrid items={catItems} allItems={menuItems} groupBySubcategory accent={accent} />
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
    </section>
  );
};

export default MenuSection;
