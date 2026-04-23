/**
 * Menu dynamique branché sur Supabase + realtime.
 * Fallback sur les données mock si la requête échoue (mode hors-ligne).
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  menuItems as mockItems,
  categories as mockCategories,
  type MenuItem,
} from "@/data/menu";

export interface CategoryRow {
  id: string;
  label: string;
  icon: string;
  description: string | null;
  sort_order: number;
}

interface MenuRow {
  id: string;
  category_id: string;
  name: string;
  price: number | string;
  description: string;
  volume: string | null;
  subcategory: string | null;
  image_url: string | null;
  badges: string[] | null;
  is_available: boolean;
  sort_order: number;
}

const rowToMenuItem = (row: MenuRow): MenuItem => {
  // Conserve les options mock par produit (non stockées en BDD pour la démo)
  const mock = mockItems.find((m) => m.id === row.id);
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    description: row.description ?? "",
    category: row.category_id,
    subcategory: row.subcategory ?? undefined,
    volume: row.volume ?? undefined,
    image: row.image_url ?? mock?.image,
    badges: row.badges ?? [],
    nutrition: mock?.nutrition ?? { allergens: [], energy: [] },
    options: mock?.options,
    isVegan: mock?.isVegan,
    isGlutenFree: mock?.isGlutenFree,
    isPei: mock?.isPei,
    upsellIds: mock?.upsellIds,
    sortOrder: row.sort_order,
  };
};

export function useMenuItems() {
  const [items, setItems] = useState<MenuItem[]>(mockItems);
  const [categories, setCategories] = useState<CategoryRow[]>(
    mockCategories.map((c, i) => ({
      id: c.id,
      label: c.label,
      icon: "",
      description: c.description ?? null,
      sort_order: i,
    })),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    const [{ data: catData, error: catErr }, { data: itemData, error: itemErr }] =
      await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase
          .from("menu_items")
          .select("*")
          .eq("is_available", true)
          .order("sort_order"),
      ]);

    if (catErr || itemErr) {
      setError(catErr?.message || itemErr?.message || "Erreur chargement menu");
    } else {
      if (catData) setCategories(catData as CategoryRow[]);
      if (itemData) setItems((itemData as MenuRow[]).map(rowToMenuItem));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel("menu_items_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu_items" },
        () => fetchAll(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { items, categories, loading, error };
}
