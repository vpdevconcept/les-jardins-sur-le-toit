/**
 * Feature Flags — Les Jardins Sur Le Toit (Mode Maquette)
 *
 * En mode "Commande au stand", on active le panier et le tunnel
 * de validation, mais pas WhatsApp ni la fidélité.
 */
export const isPremium = true;

export const features = {
  cart: true,            // Panier + bouton "Ajouter"
  cartIcon: true,        // Icône panier dans le Header
  loyalty: false,        // Pas de programme fidélité dans la maquette
  upselling: false,      // Pas de toasts de suggestion auto
  whatsappOrder: false,  // Validation au stand (toast), pas WhatsApp
  greenTracker: false,
} as const;
