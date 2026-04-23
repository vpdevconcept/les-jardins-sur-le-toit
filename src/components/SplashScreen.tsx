import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * SplashScreen — "Premium Transition"
 *
 * - Affiché 1× par session (sessionStorage)
 * - Fond Vert Forêt (#2D5016)
 * - Logo /les-jardins-logo-circle.png — scale 0.9 → 1 + fade in
 * - Cercle de chargement Or fin sous le logo
 * - Sortie fluide en slide-up révélant la Hero
 * - Synchronisé sur la promesse de chargement (min 1.4s, max 4s)
 */

type Phase = "show" | "exit" | "done";

const SESSION_KEY = "ljst_splash_seen";

interface SplashScreenProps {
  onComplete: () => void;
  onStartAudio?: () => void;
  /** Indique que les données critiques sont prêtes — le splash peut se retirer dès min atteint */
  ready?: boolean;
}

const MIN_DURATION = 1400;
const MAX_DURATION = 4000;

const SplashScreen = ({ onComplete, ready = true }: SplashScreenProps) => {
  const [phase, setPhase] = useState<Phase>(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return "done";
    } catch {}
    return "show";
  });
  const startedAt = useRef<number>(Date.now());

  // Marque le splash comme vu pour la session
  useEffect(() => {
    if (phase === "show") {
      try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
    }
  }, [phase]);

  // Fenêtre de sortie : min 1.4s, max 4s, prioritise `ready`
  useEffect(() => {
    if (phase !== "show") return;
    const elapsed = Date.now() - startedAt.current;

    if (ready && elapsed >= MIN_DURATION) {
      setPhase("exit");
      return;
    }
    const remaining = ready
      ? Math.max(0, MIN_DURATION - elapsed)
      : Math.max(0, MAX_DURATION - elapsed);
    const t = setTimeout(() => setPhase("exit"), remaining);
    return () => clearTimeout(t);
  }, [phase, ready]);

  const handleExited = useCallback(() => {
    setPhase("done");
    onComplete();
  }, [onComplete]);

  if (phase === "done") return null;

  return (
    <AnimatePresence onExitComplete={handleExited}>
      {phase === "show" && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[10000] flex flex-col items-center justify-center overflow-hidden"
          style={{ minHeight: "100dvh", backgroundColor: "#2D5016" }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ y: "-100%", opacity: 0.95 }}
          transition={{
            y: { duration: 0.85, ease: [0.76, 0, 0.24, 1] },
            opacity: { duration: 0.85 },
          }}
        >
          {/* Halo doré subtil au centre */}
          <div
            className="absolute top-1/2 left-1/2 w-[520px] h-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(212,175,90,0.22) 0%, transparent 65%)",
            }}
          />
          {/* Texture feuilles tropicales très discrète */}
          <div
            className="absolute inset-0 opacity-[0.10] mix-blend-screen pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><g fill='none' stroke='%23E8D9A8' stroke-width='0.8'><path d='M30 180 Q40 100 60 30 M60 30 Q35 50 20 80 M60 30 Q85 55 100 90'/><path d='M150 200 Q160 130 175 60 M175 60 Q155 80 140 110'/></g></svg>\")",
              backgroundSize: "260px 260px",
              backgroundRepeat: "repeat",
            }}
          />

          {/* Logo + nom */}
          <motion.div
            className="relative z-10 flex flex-col items-center px-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              src="/les-jardins-logo-circle.png"
              alt="Les Jardins Sur Le Toit"
              className="w-36 h-36 md:w-44 md:h-44 rounded-full object-cover shadow-2xl ring-2"
              style={{ boxShadow: "0 0 60px rgba(212,175,90,0.45)", borderColor: "rgba(232,217,168,0.6)" }}
            />

            <motion.h1
              className="font-display text-2xl md:text-3xl font-bold mt-7 tracking-wide text-center"
              style={{ color: "#F5EBD3" }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              Les Jardins
              <span className="block italic mt-1" style={{ color: "#D4AF5A" }}>
                Sur Le Toit
              </span>
            </motion.h1>

            {/* Cercle de chargement doré */}
            <div className="mt-10 flex items-center justify-center">
              <svg width="42" height="42" viewBox="0 0 42 42" className="animate-spin" style={{ animationDuration: "1.2s" }}>
                <circle
                  cx="21"
                  cy="21"
                  r="18"
                  fill="none"
                  stroke="rgba(232,217,168,0.18)"
                  strokeWidth="2"
                />
                <circle
                  cx="21"
                  cy="21"
                  r="18"
                  fill="none"
                  stroke="#D4AF5A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="113"
                  strokeDashoffset="78"
                />
              </svg>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
