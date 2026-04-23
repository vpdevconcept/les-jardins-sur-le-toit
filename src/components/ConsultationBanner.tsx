/**
 * Bandeau "Mode Consultation" — visible tant que la session n'a pas été
 * activée par le staff via un QR Code physique. Discret, fixé sous le header.
 */
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound } from "lucide-react";
import { useSessionAccess } from "@/hooks/useSessionAccess";

const ConsultationBanner = () => {
  const { loading, hasAccess } = useSessionAccess();
  if (loading || hasAccess) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-16 z-40 bg-secondary/15 backdrop-blur-md border-b border-secondary/30"
        role="status"
        aria-live="polite"
      >
        <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2 text-center">
          <KeyRound size={14} className="text-secondary shrink-0" />
          <p className="text-[12px] sm:text-xs text-foreground/85 leading-tight">
            <span className="font-bold text-secondary">Mode Consultation.</span>{" "}
            Pour commander, demandez votre accès à l'accueil 🔑
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConsultationBanner;
