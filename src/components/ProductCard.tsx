import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Check, Wine, KeyRound } from "lucide-react";
import { MenuItem, getDerivedBadges } from "@/data/menu";
import { useCart } from "@/contexts/CartContext";
import { features } from "@/config/features";
import { cn } from "@/lib/utils";
import { useSessionAccess } from "@/hooks/useSessionAccess";
import { toast } from "sonner";

const badgeColor = (badge: string) => {
  switch (badge) {
    case "Best-Seller":
    case "Signature":
      return "bg-secondary/90 text-secondary-foreground neon-glow-pink";
    case "Premium":
      return "bg-accent text-accent-foreground";
    case "Sans Alcool":
    case "BIO":
    case "Maison":
      return "bg-primary/30 text-foreground";
    case "100% Péi":
      return "bg-primary/40 text-primary-foreground";
    case "À partager":
      return "bg-foreground/10 text-foreground border border-foreground/20";
    default:
      return "bg-foreground/10 text-foreground/80";
  }
};

interface ProductCardProps {
  item: MenuItem;
  index: number;
  onOpen: (item: MenuItem) => void;
  allItems: MenuItem[];
  /** "secondary" = rose néon (boissons), "primary" = vert (food). */
  accent?: "secondary" | "primary";
}

const ProductCard = ({ item, index, onOpen, allItems, accent = "secondary" }: ProductCardProps) => {
  const isPrimary = accent === "primary";
  const { addItem } = useCart();
  const { hasAccess, loading: accessLoading } = useSessionAccess();
  const [justAdded, setJustAdded] = useState(false);
  const badges = getDerivedBadges(item);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasAccess) {
      toast.info("Demandez votre accès à l'accueil 🔑", {
        description: "Le staff vous remettra un QR Code pour activer la commande.",
        duration: 4000,
      });
      return;
    }
    if (item.options && item.options.length > 0) {
      onOpen(item);
      return;
    }
    addItem(item, undefined, allItems);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 600);
  };

  return (
    <motion.button
      type="button"
      onClick={() => onOpen(item)}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.4) }}
      whileHover={{ y: -4 }}
      className={cn(
        "group text-left flex flex-col gap-3 focus:outline-none focus-visible:ring-2 rounded-3xl",
        isPrimary ? "focus-visible:ring-primary" : "focus-visible:ring-secondary",
      )}
      aria-label={`Voir ${item.name}`}
    >
      {/* Image carrée 1:1 rounded-3xl */}
      <div className={cn(
        "relative aspect-square w-full overflow-hidden rounded-3xl bg-muted/40 ring-1 ring-foreground/10 transition-all",
        isPrimary ? "group-hover:ring-primary/40" : "group-hover:ring-secondary/40",
      )}>
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-card to-secondary/15">
            <Wine size={42} className="text-foreground/30" strokeWidth={1.2} />
          </div>
        )}

        {/* Badges en overlay */}
        {badges.length > 0 && (
          <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1">
            {badges.slice(0, 2).map((b) => (
              <span
                key={b}
                className={cn(
                  "text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full backdrop-blur-sm",
                  badgeColor(b),
                )}
              >
                {b}
              </span>
            ))}
          </div>
        )}

        {/* Volume en bas à gauche */}
        {item.volume && (
          <span className="absolute bottom-2 left-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-background/70 backdrop-blur-md text-foreground/90">
            {item.volume}
          </span>
        )}

        {/* Bouton + flottant — ou clé si la session n'est pas activée */}
        {features.cart && !accessLoading && (
          <motion.div
            whileTap={{ scale: 0.85 }}
            animate={justAdded ? { scale: [1, 1.25, 1] } : {}}
            className="absolute bottom-2 right-2"
          >
            <button
              onClick={handleAdd}
              aria-label={hasAccess ? `Ajouter ${item.name} au panier` : "Demander l'accès à l'accueil"}
              title={hasAccess ? "Ajouter au panier" : "Demandez votre accès à l'accueil"}
              className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center shadow-lg transition-all",
                !hasAccess
                  ? "bg-foreground/15 text-foreground/70 backdrop-blur-md hover:bg-foreground/25"
                  : justAdded
                    ? "bg-accent text-accent-foreground"
                    : isPrimary
                      ? "bg-primary text-primary-foreground hover:scale-105 shadow-primary/40"
                      : "bg-secondary text-secondary-foreground neon-glow-pink hover:scale-105",
              )}
            >
              {!hasAccess ? <KeyRound size={16} /> : justAdded ? <Check size={18} /> : <Plus size={18} />}
            </button>
          </motion.div>
        )}
      </div>

      {/* Texte */}
      <div className="flex items-start justify-between gap-2 px-1">
        <h3 className={cn(
          "font-display text-base sm:text-[17px] font-bold text-foreground leading-tight line-clamp-2 transition-colors",
          isPrimary ? "group-hover:text-primary" : "group-hover:text-secondary",
        )}>
          {item.name}
        </h3>
        <span className="font-display text-base sm:text-lg font-bold text-accent whitespace-nowrap tabular-nums">
          {Number(item.price).toFixed(item.price % 1 === 0 ? 0 : 2).replace(".", ",")}€
        </span>
      </div>
    </motion.button>
  );
};

export default ProductCard;
