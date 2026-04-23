/**
 * Page de scan QR Code Table.
 * Capture le n° de table + token, adopte le `assigned_guest_id` pré-créé
 * par le staff (s'il existe), puis affiche un message de bienvenue avant
 * de rediriger vers la carte.
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { setTableNumber, setTableToken, setTableName, formatTableLabel } from "@/lib/guestSession";
import { Loader2, KeyRound, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const GUEST_ID_KEY = "ljst_guest_id";
const GUEST_TS_KEY = "ljst_guest_ts";

const QRTable = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [tableNumber, setLocalTable] = useState<number | null>(null);
  const [tableNameLocal, setLocalName] = useState<string | null>(null);
  const [error, setError] = useState<null | "invalid" | "not_activated">(null);

  useEffect(() => {
    const resolve = async () => {
      if (!token) { navigate("/", { replace: true }); return; }
      setTableToken(token);

      const { data: table } = await supabase
        .from("tables")
        .select("number, name, assigned_at, assigned_guest_id")
        .eq("qr_token", token)
        .maybeSingle();

      if (!table?.number) {
        setError("invalid");
        setTimeout(() => navigate("/", { replace: true }), 2200);
        return;
      }

      // Sécurité : QR existant mais non activé par le staff → on bloque.
      if (!table.assigned_at || !table.assigned_guest_id) {
        setError("not_activated");
        return; // pas de redirection auto, le client doit lire le message
      }

      // Adoption du guest_id pré-créé par le staff (continuité de session)
      let existingId: string | null = null;
      try { existingId = localStorage.getItem(GUEST_ID_KEY); } catch {}

      if (!existingId) {
        try {
          localStorage.setItem(GUEST_ID_KEY, table.assigned_guest_id);
          localStorage.setItem(GUEST_TS_KEY, String(Date.now()));
        } catch {}
      } else if (existingId !== table.assigned_guest_id) {
        const { data: pending } = await supabase
          .from("orders")
          .select("id")
          .eq("guest_id", existingId)
          .not("status", "in", "(recupere,encaisse)")
          .limit(1);

        if (!pending || pending.length === 0) {
          try {
            localStorage.setItem(GUEST_ID_KEY, table.assigned_guest_id);
            localStorage.setItem(GUEST_TS_KEY, String(Date.now()));
          } catch {}
        } else {
          toast.warning("Vous avez déjà une commande en cours sur cet appareil — on la conserve.");
        }
      }

      setTableNumber(table.number);
      setTableName(table.name ?? null);
      setLocalTable(table.number);
      setLocalName(table.name ?? null);

      // Notifie l'admin en temps réel : la table passe en "Client connecté"
      try {
        await supabase.rpc("touch_table_scan", {
          _qr_token: token,
          _guest_id: table.assigned_guest_id,
        });
      } catch {
        // silencieux : ne bloque pas l'expérience client
      }

      setTimeout(() => navigate("/", { replace: true }), 2400);
    };
    resolve();
  }, [token, navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center overflow-hidden relative px-6"
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, hsl(145 40% 22%) 0%, hsl(var(--background)) 60%, hsl(145 50% 8%) 100%)",
      }}
    >
      <AnimatePresence mode="wait">
        {tableNumber === null && !error && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-foreground/60 text-sm tracking-wider uppercase">Connexion à votre table…</p>
          </motion.div>
        )}

        {tableNumber !== null && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col items-center text-center max-w-md"
          >
            <img
              src="/les-jardins-logo-circle.png"
              alt="Les Jardins Sur Le Toit"
              className="w-24 h-24 rounded-full ring-2 ring-secondary/60 neon-glow-pink mb-6"
            />
            <p className="text-foreground/70 uppercase text-xs tracking-[0.32em] mb-3">
              Bienvenue aux Jardins
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
              Bienvenue à la
              <br />
              <span className="neon-text-pink italic">{formatTableLabel(tableNumber, tableNameLocal)} 🌴</span>
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-foreground/60 text-sm"
            >
              Préparation de votre carte digitale…
            </motion.p>
          </motion.div>
        )}

        {error === "invalid" && (
          <motion.div
            key="error-invalid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center max-w-sm"
          >
            <AlertTriangle className="text-destructive mx-auto mb-3" size={36} />
            <p className="text-destructive font-semibold">QR Code invalide.</p>
            <p className="text-foreground/60 text-xs mt-1">Redirection…</p>
          </motion.div>
        )}

        {error === "not_activated" && (
          <motion.div
            key="error-not-activated"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex flex-col items-center text-center max-w-md"
          >
            <div className="w-20 h-20 rounded-full bg-secondary/15 ring-2 ring-secondary/40 flex items-center justify-center mb-5 neon-glow-pink">
              <KeyRound className="text-secondary" size={32} />
            </div>
            <p className="text-foreground/70 uppercase text-[11px] tracking-[0.32em] mb-3">
              QR non activé
            </p>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-tight mb-3">
              ⚠️ Ce QR Code n'est pas encore activé.
            </h1>
            <p className="text-foreground/70 text-sm mb-6 leading-relaxed">
              Veuillez vous présenter à <span className="text-secondary font-semibold">l'accueil</span> pour récupérer votre accès personnel et commencer votre commande.
            </p>
            <Button
              onClick={() => navigate("/", { replace: true })}
              variant="outline"
              className="rounded-full border-secondary/50 text-foreground hover:bg-secondary/10"
            >
              Consulter le menu en attendant
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QRTable;
