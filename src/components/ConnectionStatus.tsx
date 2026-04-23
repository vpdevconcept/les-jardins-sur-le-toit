/**
 * Bandeau discret affiché quand la connexion réseau est perdue.
 * Détecte navigator.onLine + écoute les events online/offline.
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WifiOff, Loader2 } from "lucide-react";

const ConnectionStatus = () => {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="status"
          aria-live="polite"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
        >
          <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-foreground/90 text-background backdrop-blur-md px-4 py-2 text-xs font-medium shadow-lg">
            <WifiOff size={13} />
            <span>Connexion perdue…</span>
            <Loader2 size={12} className="animate-spin" />
            <span className="opacity-75">Reconnexion en cours 🔄</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectionStatus;
