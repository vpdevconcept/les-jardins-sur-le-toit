import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { MenuItem, MenuOptionChoice } from "@/data/menu";
import { toast } from "sonner";
import { features } from "@/config/features";
import { supabase } from "@/integrations/supabase/client";
import { getGuestId, getTableToken } from "@/lib/guestSession";

export interface CartItem {
  item: MenuItem;
  quantity: number;
  selectedOptions?: MenuOptionChoice[];
  cartKey: string;
}

const buildCartKey = (item: MenuItem, options?: MenuOptionChoice[]): string => {
  const optIds = (options || []).map((o) => o.id).sort().join(",");
  return optIds ? `${item.id}::${optIds}` : item.id;
};

const STORAGE_KEY = "greenshake_cart";

const loadCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return parsed.map((ci) => ({
      ...ci,
      item: { ...ci.item, price: Number(ci.item.price) },
      selectedOptions: (ci.selectedOptions || []).map((o) => ({
        ...o,
        priceExtra: Number(o.priceExtra),
      })),
    }));
  } catch {
    return [];
  }
};

const saveCart = (items: CartItem[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
};

interface SubmitResult {
  ok: boolean;
  orderId?: string;
  error?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem, selectedOptions?: MenuOptionChoice[], allItems?: MenuItem[]) => void;
  removeItem: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
  submitOrder: (tableNumber?: number | null) => Promise<SubmitResult>;
  totalItems: number;
  totalPrice: number;
  totalDrinks: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => { saveCart(items); }, [items]);

  const addItem = useCallback((item: MenuItem, selectedOptions?: MenuOptionChoice[], allItems?: MenuItem[]) => {
    const safeItem = { ...item, price: Number(item.price) };
    const safeOptions = (selectedOptions || []).map((o) => ({ ...o, priceExtra: Number(o.priceExtra) }));
    const key = buildCartKey(safeItem, safeOptions.length > 0 ? safeOptions : undefined);

    setItems((prev) => {
      const existing = prev.find((ci) => ci.cartKey === key);
      if (existing) return prev.map((ci) => ci.cartKey === key ? { ...ci, quantity: ci.quantity + 1 } : ci);
      return [...prev, { item: safeItem, quantity: 1, selectedOptions: safeOptions.length > 0 ? safeOptions : undefined, cartKey: key }];
    });

    if (features.cart) {
      toast.success(`${safeItem.name} ajouté ! 🌿`, { duration: 1500 });
    }
    if (features.upselling && (safeItem.category === "burgers" || safeItem.category === "bowls") && safeItem.upsellIds?.length && allItems) {
      const upsellId = safeItem.upsellIds[Math.floor(Math.random() * safeItem.upsellIds.length)];
      const upsellItem = allItems.find((m) => m.id === upsellId);
      if (upsellItem) {
        setTimeout(() => {
          toast(`On y ajoute un ${upsellItem.name} pour ${Number(upsellItem.price).toFixed(2).replace(".", ",")}€ ? 🥤`, {
            action: {
              label: "Ajouter",
              onClick: () => {
                const uKey = buildCartKey(upsellItem);
                setItems((prev) => {
                  const ex = prev.find((ci) => ci.cartKey === uKey);
                  if (ex) return prev.map((ci) => ci.cartKey === uKey ? { ...ci, quantity: ci.quantity + 1 } : ci);
                  return [...prev, { item: { ...upsellItem, price: Number(upsellItem.price) }, quantity: 1, cartKey: uKey }];
                });
                toast.success(`${upsellItem.name} ajouté ! 🎉`);
              },
            },
            duration: 6000,
          });
        }, 600);
      }
    }
  }, []);

  const removeItem = useCallback((cartKey: string) => {
    setItems((prev) => prev.filter((ci) => ci.cartKey !== cartKey));
  }, []);

  const updateQuantity = useCallback((cartKey: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((ci) => ci.cartKey !== cartKey));
    } else {
      setItems((prev) => prev.map((ci) => ci.cartKey === cartKey ? { ...ci, quantity } : ci));
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const totalItems = items.reduce((sum, ci) => sum + ci.quantity, 0);
  const totalPrice = items.reduce((sum, ci) => {
    const optExtra = (ci.selectedOptions || []).reduce((s, o) => s + Number(o.priceExtra), 0);
    return sum + (Number(ci.item.price) + optExtra) * ci.quantity;
  }, 0);
  const totalDrinks = items
    .filter((ci) => ci.item.category === "boissons")
    .reduce((sum, ci) => sum + ci.quantity, 0);

  const submitOrder = useCallback(async (tableNumber?: number | null): Promise<SubmitResult> => {
    if (items.length === 0) return { ok: false, error: "Panier vide." };

    const guestId = getGuestId();
    const tableToken = getTableToken();

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: null,
        guest_id: guestId,
        table_token: tableToken,
        table_number: tableNumber ?? null,
        status: "nouveau",
        total: totalPrice,
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      const msg = orderErr?.message || "";
      if (msg.includes("commande est déjà en cours")) {
        return { ok: false, error: "Une commande est déjà en cours pour cet appareil. Patientez qu'elle soit récupérée avant d'en passer une nouvelle." };
      }
      if (msg.includes("non assignée") || msg.includes("Session invalide")) {
        return { ok: false, error: "Votre session n'est pas activée. Demandez votre QR Code à l'accueil pour pouvoir commander 🔑" };
      }
      return { ok: false, error: msg || "Erreur création commande." };
    }

    const rows = items.map((ci) => {
      const optExtra = (ci.selectedOptions || []).reduce((s, o) => s + Number(o.priceExtra), 0);
      return {
        order_id: order.id,
        menu_item_id: ci.item.id,
        name: ci.item.name,
        stand: ci.item.category,
        quantity: ci.quantity,
        unit_price: Number(ci.item.price) + optExtra,
        options: ci.selectedOptions
          ? { choices: ci.selectedOptions.map((o) => ({ id: o.id, label: o.label })) }
          : {},
      };
    });

    const { error: itemsErr } = await supabase.from("order_items").insert(rows);
    if (itemsErr) return { ok: false, error: itemsErr.message };

    clearCart();
    return { ok: true, orderId: order.id };
  }, [items, totalPrice, clearCart]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, submitOrder, totalItems, totalPrice, totalDrinks }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return {
      items: [], addItem: () => {}, removeItem: () => {}, updateQuantity: () => {},
      clearCart: () => {}, submitOrder: async () => ({ ok: false, error: "Cart unavailable" }),
      totalItems: 0, totalPrice: 0, totalDrinks: 0,
    } as CartContextType;
  }
  return ctx;
};
