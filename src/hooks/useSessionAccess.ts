/**
 * useSessionAccess
 * ---------------------------------------------------------------------------
 * Hook unique source de vérité : "ce client a-t-il le droit de commander ?"
 *
 * Une session est VALIDE si et seulement si :
 *  - le navigateur a un guest_id en localStorage
 *  - une table en base a `assigned_at IS NOT NULL`
 *  - cette même table a `assigned_guest_id == guest_id`
 *
 * Sinon → mode "Consultation" : le menu reste consultable, mais l'ajout
 * au panier et la commande sont bloqués côté UI (et côté serveur via le
 * trigger `check_order_table_assignment`).
 *
 * Le hook s'abonne aux changements de la table `tables` pour réagir en
 * temps réel à une libération / nouvelle assignation par le staff.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const GUEST_ID_KEY = "ljst_guest_id";

interface SessionAccessState {
  loading: boolean;
  hasAccess: boolean;
  guestId: string | null;
  tableNumber: number | null;
}

const readGuestId = (): string | null => {
  try { return localStorage.getItem(GUEST_ID_KEY); } catch { return null; }
};

export const useSessionAccess = (): SessionAccessState & { refresh: () => void } => {
  const [state, setState] = useState<SessionAccessState>({
    loading: true,
    hasAccess: false,
    guestId: readGuestId(),
    tableNumber: null,
  });

  const check = useCallback(async () => {
    const guestId = readGuestId();
    if (!guestId) {
      setState({ loading: false, hasAccess: false, guestId: null, tableNumber: null });
      return;
    }

    const { data, error } = await supabase
      .from("tables")
      .select("number, assigned_at, assigned_guest_id")
      .eq("assigned_guest_id", guestId)
      .not("assigned_at", "is", null)
      .maybeSingle();

    if (error || !data) {
      setState({ loading: false, hasAccess: false, guestId, tableNumber: null });
      return;
    }

    setState({
      loading: false,
      hasAccess: true,
      guestId,
      tableNumber: data.number,
    });
  }, []);

  useEffect(() => {
    check();

    // Realtime : si le staff libère ou (ré)assigne la table, on revérifie.
    // Nom de canal unique par instance pour éviter les collisions entre
    // composants qui utilisent ce hook simultanément (Header, ProductCard, …).
    const channelName = `session_access_${crypto.randomUUID()}`;
    const ch = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tables" },
        () => { check(); },
      )
      .subscribe();

    // Re-check quand l'onglet revient au premier plan
    const onVisible = () => { if (!document.hidden) check(); };
    document.addEventListener("visibilitychange", onVisible);

    // Re-check si un autre onglet modifie le guest_id
    const onStorage = (e: StorageEvent) => {
      if (e.key === GUEST_ID_KEY) check();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      supabase.removeChannel(ch);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("storage", onStorage);
    };
  }, [check]);

  return { ...state, refresh: check };
};
