import { ShoppingBag, BellRing, KeyRound, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { features } from "@/config/features";
import { motion, useScroll, useSpring } from "framer-motion";
import { getTableNumber, getTableName } from "@/lib/guestSession";
import { useSessionAccess } from "@/hooks/useSessionAccess";
import { toast } from "sonner";

interface HeaderProps {
  onCartOpen: () => void;
}

const Header = ({ onCartOpen }: HeaderProps) => {
  const { totalItems } = useCart();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  const tableNumber = getTableNumber();
  const tableName = getTableName();
  const tableChip = tableName ?? (tableNumber != null ? `T${tableNumber}` : null);
  const { hasAccess, loading: accessLoading } = useSessionAccess();

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      {/* Scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-secondary z-[60] origin-left neon-glow-pink"
        style={{ scaleX }}
      />

      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/30 border-b border-white/5">
        <div className="container mx-auto flex items-center justify-between h-12 md:h-14 px-4 md:px-6">
          {/* Left — Logo flottant compact */}
          <motion.button
            onClick={scrollToTop}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex items-center transition-transform hover:scale-105"
            aria-label="Les Jardins Sur Le Toit — Accueil"
          >
            <img
              src="/les-jardins-logo-circle.png"
              alt="Les Jardins Sur Le Toit"
              className="w-9 h-9 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
            />
          </motion.button>

          {/* Right — Accès / Ma commande + Cart */}
          <div className="flex items-center gap-2">
            {!accessLoading && !hasAccess ? (
              <button
                onClick={() =>
                  toast.info("Demandez votre accès à l'accueil 🔑", {
                    description: "Le staff vous remettra un QR Code physique pour activer la commande.",
                    duration: 5000,
                  })
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-foreground/90 border border-white/10 backdrop-blur-md transition-colors"
                aria-label="Demander mon accès"
                title="Demander mon accès à l'accueil"
              >
                <KeyRound size={14} />
                <span className="text-[11px] font-medium tracking-wide hidden sm:inline">
                  Demander mon accès
                </span>
              </button>
            ) : (
              <Link
                to="/mes-commandes"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-colors"
                aria-label="Ma commande"
                title="Ma commande"
              >
                <BellRing size={14} className="text-foreground/90" />
                <span className="text-[11px] font-medium tracking-wide text-foreground/90 hidden sm:inline">
                  Ma commande
                </span>
                {tableChip && (
                  <span className="text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full max-w-[90px] truncate">
                    {tableChip}
                  </span>
                )}
              </Link>
            )}

            <Link
              to="/login"
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-colors"
              aria-label="Espace administrateur"
              title="Espace administrateur"
            >
              <Shield size={14} className="text-foreground/70" />
            </Link>

            {hasAccess && features.cartIcon && (
              <motion.button
                onClick={onCartOpen}
                className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
                key={totalItems}
                animate={totalItems > 0 ? { scale: [1, 1.25, 0.95, 1.1, 1] } : {}}
                transition={{ duration: 0.4, ease: "easeOut" }}
                aria-label={`Panier (${totalItems} articles)`}
              >
                <ShoppingBag size={18} className="text-foreground/90" />
                {totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 bg-secondary text-secondary-foreground text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
